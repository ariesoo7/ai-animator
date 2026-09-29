import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Glass from "./Glass";
import { signin, signup } from "./api";

export default function Auth({ mode }: { mode: "login" | "signup" }) {
  const nav = useNavigate();
  const isLogin = mode === "login";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      if (isLogin) { await signin(email, password); nav("/"); }
      else { await signup(username, email, password); nav("/login"); }
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <main className="center">
      <Glass className="auth-box">
        <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
        <form onSubmit={submit}>
          {!isLogin && (
            <label>Username
              <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
            </label>
          )}
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              autoComplete={isLogin ? "current-password" : "new-password"} />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn primary" disabled={busy}>
            {busy ? "Please wait…" : isLogin ? "Sign in" : "Sign up"}
          </button>
        </form>
        <p className="alt">
          {isLogin ? <>Don't have an account? <Link to="/signup">Sign up</Link></>
                   : <>Already registered? <Link to="/login">Sign in</Link></>}
        </p>
      </Glass>
    </main>
  );
}
