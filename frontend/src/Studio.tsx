import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import Glass from "./Glass";
import { approve, rejectStoryboard, sendTopic } from "./api";

type Phase = "input" | "sending" | "storyboard" | "generating" | "video";

export default function Studio() {
  const box = useRef<HTMLDivElement>(null);
  const prev = useRef<{ w: number; h: number } | null>(null);
  const [phase, setPhase] = useState<Phase>("input");
  const [topic, setTopic] = useState("");
  const [storyboard, setStoryboard] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState(false);

  // Smoothly morph the box from its previous size to the size of the new content.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, { clearProps: "width,height" });
    const next = { w: el.offsetWidth, h: el.offsetHeight };
    const from = prev.current;
    prev.current = next;
    if (!from || (from.w === next.w && from.h === next.h)) return;
    gsap.fromTo(el, { width: from.w, height: from.h },
      { width: next.w, height: next.h, duration: 0.9, ease: "power3.inOut",
        onComplete: () => gsap.set(el, { clearProps: "width,height" }) });
    gsap.fromTo(el.querySelectorAll(".reveal"), { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.45, stagger: 0.08, ease: "power2.out" });
  }, [phase]);

  async function generate() {
    if (!topic.trim()) return;
    setError(""); setPhase("sending");
    try { setStoryboard(await sendTopic(topic.trim())); setPhase("storyboard"); }
    catch (e) { setError((e as Error).message); setPhase("input"); }
  }

  async function decide(approved: boolean) {
    if (deciding) return;
    setError("");
    setDeciding(true);
    try {
      if (!approved) {
        // Re-roll the storyboard on the same thread instead of starting over.
        setStoryboard(await rejectStoryboard());
        return;
      }
      setPhase("generating");
      setVideoUrl(await approve(true));
      setPhase("video");
    } catch (e) {
      setError((e as Error).message);
      setPhase("storyboard");
    } finally {
      setDeciding(false);
    }
  }

  function reset() { setTopic(""); setStoryboard(""); setVideoUrl(""); setPhase("input"); }

  return (
    <main className="center">
      <Glass ref={box} className={`studio studio-${phase === "sending" ? "input" : phase}`}>
        {(phase === "input" || phase === "sending") && (
          <>
            <h1 className="reveal">Enter your topic here</h1>
            <div className="prompt reveal">
              <input value={topic} placeholder="A day in the life of a lighthouse keeper"
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()} disabled={phase === "sending"} />
              <button className="btn primary" onClick={generate} disabled={phase === "sending"}>
                {phase === "sending" ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}

        {phase === "storyboard" && (
          <>
            <h1 className="reveal">Please check and approve the storyboard for your topic</h1>
            <pre className="storyboard reveal">{storyboard}</pre>
            <div className="actions reveal">
              <button className="btn primary" onClick={() => decide(true)} disabled={deciding}>
                {deciding ? "Working…" : "Approve"}
              </button>
              <button className="btn" onClick={() => decide(false)} disabled={deciding}>
                {deciding ? "Working…" : "Regenerate"}
              </button>
            </div>
          </>
        )}

        {phase === "generating" && (
          <div className="loader reveal" role="status">
            <span className="spinner" /> Generating video…
          </div>
        )}

        {phase === "video" && (
          <>
            <video className="reveal" src={videoUrl} controls autoPlay playsInline />
            <div className="actions reveal">
              <a className="btn primary" href={videoUrl} download="storyboard-video.mp4">Download video</a>
              <button className="btn" onClick={reset}>New topic</button>
            </div>
          </>
        )}

        {error && <p className="error" role="alert">{error}</p>}
      </Glass>
    </main>
  );
}
