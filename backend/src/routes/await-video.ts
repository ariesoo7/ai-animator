import { stat } from "node:fs/promises";
import path from "node:path";
import { renderQueue } from "../queues/render.queue.js";

/*
 * The graph offloads rendering to the worker and then pauses at
 * waitForRenderResult's interrupt(). The worker writes the finished video to
 * temp/<userId>/video.mp4 and then resumes the graph.
 *
 * These helpers let a request hold its response open until that file lands,
 * so the video can be handed back to the user in the same response. The graph
 * itself is untouched.
 */

/** Mirrors TEMP_DIR in the render processor. */
const TEMP_DIR = path.join(process.cwd(), "temp");

const POLL_INTERVAL_MS = 500;

/** How long a render may take before we give up and report a timeout. */
const RENDER_TIMEOUT_MS = Number(
    process.env.RENDER_TIMEOUT_MS || 5 * 60 * 1000
);

/**
 * Consecutive polls with no queued/running job and no video before we
 * conclude the render is not going to produce anything. This is a grace
 * period, not a hard limit: the graph can briefly have no live job in
 * between a failed render and the retry it enqueues.
 */
const IDLE_GRACE_POLLS = 40;

export function renderedVideoPath(userId: string): string {
    return path.join(
        TEMP_DIR,
        String(userId),
        "video.mp4"
    );
}

async function sizeOf(filePath: string): Promise<number> {
    try {
        const stats = await stat(filePath);
        return stats.size;
    } catch {
        return -1;
    }
}

/** Newest render job for this user, across every queue state. */
async function latestJobFor(
    userId: string
) {
    const jobs = await renderQueue.getJobs(
        [
            "waiting",
            "active",
            "delayed",
            "completed",
            "failed",
        ],
        0,
        50
    );

    return jobs
        .filter(
            (job) =>
                String(job.data?.userId) === String(userId)
        )
        .sort(
            (a, b) => b.timestamp - a.timestamp
        )[0];
}

/**
 * Resolves with the path to the finished video once the worker has written
 * it, or rejects if the render times out or gives up.
 */
export async function awaitRenderedVideo(
    userId: string,
    timeoutMs: number = RENDER_TIMEOUT_MS
): Promise<string> {
    const videoPath = renderedVideoPath(userId);
    const deadline = Date.now() + timeoutMs;

    let idlePolls = 0;
    let lastSize = -1;

    for (;;) {
        const size = await sizeOf(videoPath);

        /*
         * Manim writes the finished file with a rename, so a file that is
         * present and already holding a size is complete. Requiring two
         * matching reads guards against catching a partial write.
         */
        if (size > 0 && size === lastSize) {
            console.log(
                `Render finished for user ${userId}: ${videoPath}`
            );
            return videoPath;
        }

        lastSize = size > 0 ? size : -1;

        if (Date.now() > deadline) {
            throw new Error(
                "The render took too long and was stopped. Please try again."
            );
        }

        /*
         * The queue lookup only sharpens the failure heuristic. If Redis is
         * unreachable we keep waiting rather than abort a render that may
         * still finish and write the file.
         */
        let inFlight = true;

        try {
            const job = await latestJobFor(userId);
            const state = job ? await job.getState() : null;

            inFlight =
                state === "waiting" ||
                state === "active" ||
                state === "delayed" ||
                state === "waiting-children";
        } catch (err) {
            console.log(
                "Could not read render queue status:",
                err
            );
            inFlight = true;
        }

        if (!inFlight && size <= 0) {
            idlePolls += 1;
            if (idlePolls >= IDLE_GRACE_POLLS) {
                throw new Error(
                    "The render failed and did not produce a video."
                );
            }
        } else {
            idlePolls = 0;
        }

        await new Promise((resolve) =>
            setTimeout(resolve, POLL_INTERVAL_MS)
        );
    }
}
