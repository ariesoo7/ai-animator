const BASE = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, "");

export const auth = {
  get token() { return localStorage.getItem("token"); },
  set token(v: string | null) { v ? localStorage.setItem("token", v) : localStorage.removeItem("token"); },
  get loggedIn() { return localStorage.getItem("loggedIn") === "1"; },
  set loggedIn(v: boolean) { v ? localStorage.setItem("loggedIn", "1") : localStorage.removeItem("loggedIn"); },
};

/** Clears the session and forgets which thread was in play. */
export function signout() {
  auth.token = null;
  auth.loggedIn = false;
  currentThreadId = null;
}

async function post(path: string, body: unknown): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: "POST", headers, body: JSON.stringify(body), credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 401) {
      // The session is gone (cookie missing or expired): drop it so the app
      // stops firing requests that would go out without a cookie.
      auth.token = null;
      auth.loggedIn = false;
    }
    let msg = `Request failed (${res.status})`;
    try { const j = await res.clone().json(); msg = j.message || j.error || msg; } catch { /* not json */ }
    throw new Error(msg);
  }
  return res;
}

export async function signin(email: string, password: string) {
  const data = await (await post("/users/signin", { email, password })).json().catch(() => ({}));
  const token = data.token ?? data.accessToken ?? null;
  if (!token) {
    // The server only sets the cookie on a real, verified login. Without a token
    // there is no session, so never mark the user as logged in.
    auth.loggedIn = false;
    throw new Error(data.message || "Sign in failed. Please try again.");
  }
  auth.token = token;
  auth.loggedIn = true;
}

export async function signup(username: string, email: string, password: string) {
  await post("/users/signup", { username, email, password });
}

/** Pulls the storyboard out of a response, whatever shape it arrived in. */
function readStoryboard(data: any): string {
  if (data == null) return "";
  const sb = data.storyBoard ?? data.storyboard ?? data.message ?? data.data ?? data;
  return typeof sb === "string" ? sb : JSON.stringify(sb, null, 2);
}

/** Thread the backend is currently working on; echoed back on later calls. */
let currentThreadId: string | null = null;

/** Sends the topic; returns the storyboard as text (string or JSON pretty-printed). */
export async function sendTopic(message: string): Promise<string> {
  const res = await post("/generate/chat", { topic: message });
  const data = await res.json().catch(() => null);
  if (data?.threadId) currentThreadId = String(data.threadId);
  return readStoryboard(data);
}

/**
 * Rejects the storyboard. The graph rolls a new one on the same thread and
 * asks again, so this returns the replacement storyboard as text.
 */
export async function rejectStoryboard(): Promise<string> {
  const res = await post("/generate/approve_storyboard", {
    approved: false,
    threadId: currentThreadId,
  });
  return readStoryboard(await res.json().catch(() => null));
}

/** Approves the storyboard; returns a playable video URL (blob or remote). */
export async function approve(approved: boolean): Promise<string> {
  const res = await post("/generate/approve_storyboard", {
    approved,
    threadId: currentThreadId,
  });
  const type = res.headers.get("content-type") ?? "";
  if (type.startsWith("video/") || type.includes("octet-stream")) {
    return URL.createObjectURL(await res.blob());
  }
  const data = await res.json();
  const url: string | undefined = data.video_url ?? data.videoUrl ?? data.url ?? data.video;
  if (!url) throw new Error("The server did not return a video.");
  return url.startsWith("http") ? url : `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}
