import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import {
    mkdir,
    writeFile,
    readdir,
    rename,
    rm,
} from "node:fs/promises";
import path from "node:path";
import prisma from "../config/db.js";
import graph from "../graph/graph.js";
import { Command } from "@langchain/langgraph";



const execFileAsync = promisify(execFile);

const BACKEND_DIR = process.cwd();

const VENV_DIR = path.join(BACKEND_DIR, ".venv");
const TEMP_DIR = path.join(BACKEND_DIR, "temp");

const PYTHON = "python3";
const PIP = path.join(VENV_DIR, "bin", "pip");
const MANIM = path.join(VENV_DIR, "bin", "manim");

// Your backend API
const BACKEND_URL =
    process.env.BACKEND_URL || "http://localhost:3000";


/* ------------------------------------------------ */
/* SAVE CODE                                        */
/* ------------------------------------------------ */

async function saveCode(
    filePath: string,
    code: string
): Promise<void> {

    await mkdir(path.dirname(filePath), {
        recursive: true,
    });

    await writeFile(
        filePath,
        code,
        "utf-8"
    );

    console.log(`Python code saved: ${filePath}`);
}


/* ------------------------------------------------ */
/* PYTHON ENVIRONMENT                               */
/* ------------------------------------------------ */

async function ensurePythonEnvironment(): Promise<void> {

    if (existsSync(VENV_DIR)) {
        console.log(
            "Python virtual environment already exists."
        );

        return;
    }

    console.log(
        "Creating Python virtual environment..."
    );

    await execFileAsync(
        PYTHON,
        [
            "-m",
            "venv",
            VENV_DIR,
        ]
    );

    console.log(
        "Installing Manim and dependencies..."
    );

    await execFileAsync(
        PIP,
        [
            "install",
            "manim",
            "numpy",
        ]
    );

    console.log(
        "Python environment is ready."
    );
}


/* ------------------------------------------------ */
/* FIND VIDEO                                       */
/* ------------------------------------------------ */

async function findVideo(
    directory: string
): Promise<string> {

    const entries = await readdir(
        directory,
        {
            withFileTypes: true,
        }
    );

    for (const entry of entries) {

        const fullPath = path.join(
            directory,
            entry.name
        );

        if (
            entry.isFile() &&
            entry.name.endsWith(".mp4")
        ) {
            return fullPath;
        }

        if (entry.isDirectory()) {

            try {

                return await findVideo(
                    fullPath
                );

            } catch {
                continue;
            }
        }
    }

    throw new Error(
        "Rendered video was not found."
    );
}



/* ------------------------------------------------ */
/* RENDER SCENE                                     */
/* ------------------------------------------------ */

async function renderScene(
    pythonFile: string,
    userDir: string
){

    console.log(
        `Starting Manim render: ${pythonFile}`
    );

    const mediaDir = path.join(
        userDir,
        "manim-output"
    );

    await mkdir(
        mediaDir,
        {
            recursive: true,
        }
    );

    const args = [
        pythonFile,
        "-ql",
        "--media_dir",
        mediaDir,
    ];

    try {

        const {
            stdout,
            stderr,
        } = await execFileAsync(
            MANIM,
            args,
            {
                maxBuffer: 10 * 1024 * 1024,
            }
        );

        if (stdout) {
            console.log(stdout);
        }

        if (stderr) {
            console.log(stderr);
        }

    } catch (error: any) {

        /*
         * Manim exited with an error.
         *
         * execFile gives us:
         *
         * error.stdout
         * error.stderr
         * error.code
         */

        const stdout =
            error?.stdout || "";

        const stderr =
            error?.stderr || "";

        console.error(
            "========== MANIM ERROR =========="
        );

        console.error(
            stderr || stdout || error.message
        );

        console.error(
            "================================="
        );

        // Throw a clean error upward.
        throw new Error(
            stderr ||
            stdout ||
            error.message ||
            "Manim rendering failed."
        );
    }

    /*
     * If we reach here, Manim exited successfully.
     */

    const generatedVideo =
        await findVideo(mediaDir);

    const finalVideo =
        path.join(
            userDir,
            "video.mp4"
        );

    if (existsSync(finalVideo)) {

        await rm(
            finalVideo
        );
    }

    await rename(
        generatedVideo,
        finalVideo
    );

    await rm(
        mediaDir,
        {
            recursive: true,
            force: true,
        }
    );

    console.log(
        `Final video: ${finalVideo}`
    );

    return finalVideo;
}


/* ------------------------------------------------ */
/* MAIN WORKER                                      */
/* ------------------------------------------------ */

export async function processManim(
    job: any
){

    console.log("inside manim processor")

    const {
        userId,
        code,
      
    } = job.data;

    if (!userId) {
        throw new Error(
            "userId is required."
        );
    }

    if (!code) {
        throw new Error(
            "Manim Python code is required."
        );
    }

    const userDir = path.join(
        TEMP_DIR,
        String(userId)
    );

    await mkdir(
        userDir,
        {
            recursive: true,
        }
    );

    const pythonFile = path.join(
        userDir,
        "code.py"
    );

    try {

        /*
         * 1. Save generated code
         */

        await saveCode(
            pythonFile,
            code
        );


        /*
         * 2. Make sure Manim exists
         */

        await ensurePythonEnvironment();


        /*
         * 3. Render
         */

        const videoPath =
            await renderScene(
                pythonFile,
                userDir
            );

            const result = await graph.invoke(
                new Command({
                   update:{
                    hasError:false,
                   }
                }),
                  {
    configurable: {
      thread_id: "123456789",
    },
  }
            )

        return {


            videoPath,
        };

    } catch (error: any) {


/* const data  = await prisma.thread.findFirst({
    where: {
        userId: userId
    }
});
 const threadId = data?.threadId; */

 console.log("this is the error got from catch"+error)

const result = await graph.invoke(
  new Command({
    goto: "solveError",
    update: {
        error:error.message,
        hasError:true,
    }
  }),
  {
    configurable: {
      thread_id: "123456789",
    },
  }
);


        return {
            error 
        }
    }
}