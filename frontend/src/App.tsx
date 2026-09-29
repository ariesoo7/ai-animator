import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Background from "./Background";
import { GlassDefs } from "./Glass";
import Auth from "./Auth";
import Studio from "./Studio";
import { auth, signout } from "./api";

function Protected({ children }: { children: JSX.Element }) {
  return auth.loggedIn ? children : <Navigate to="/login" replace />;
}

function TopBar() {
  const nav = useNavigate();
  return (
    <header className="topbar">
      <span className="brand">Manim Studio</span>
      <button className="btn" onClick={() => { signout(); nav("/login", { replace: true }); }}>
        Sign out
      </button>
    </header>
  );
}

export default function App() {
  return (
    <>
      <Background />
      <GlassDefs />
      {auth.loggedIn && <TopBar />}
      <Routes>
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route path="/" element={<Protected><Studio /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
