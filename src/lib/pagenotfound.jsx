import { useEffect } from "react";
import { auth } from "@/lib/firebase";

export default function PageNotFound() {
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) window.location.href = "/";
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0d0e17",
        color: "#f0ede8",
        fontFamily: "Inter,sans-serif",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 64 }}>◈</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Page Not Found</div>
      <div style={{ fontSize: 13, color: "#555" }}>
        This route doesn't exist in LifeOS1.
      </div>
      <a href="/" style={{ color: "#4ab3f4", fontSize: 13 }}>
        ← Back to Dashboard
      </a>
    </div>
  );
}
