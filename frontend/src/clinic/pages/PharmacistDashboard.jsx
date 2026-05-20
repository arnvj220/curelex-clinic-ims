/**
 * PharmacistDashboard.jsx  (frontend/src/clinic/pages/PharmacistDashboard.jsx)
 *
 * FIX: 
 *  - Agar session mein password stored hai (new login) → silently auto-login, no prompt
 *  - Agar session mein password nahi hai (old/existing session) → password form dikhao
 *  - Ims_token already hai → direct redirect
 */

import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { loginPharmacistIntoIMS } from "../utils/imsAuthBridge";

export default function PharmacistDashboard() {
  const { session, logout } = useApp();

  // status: "checking" | "auto_logging_in" | "need_password" | "logging_in" | "error"
  const [status, setStatus]     = useState("checking");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  useEffect(() => {
    autoConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function autoConnect() {
    // Step 1: IMS token already hai? Direct redirect
    const existingToken = localStorage.getItem("ims_token");
    if (existingToken) {
      window.location.replace("/ims");
      return;
    }

    // Step 2: Session mein password stored hai? Silent auto-login
    const email    = session?.email;
    const pwd      = session?.password;

    if (email && pwd) {
      setStatus("auto_logging_in");
      const ok = await loginPharmacistIntoIMS({ email, password: pwd });
      if (ok) {
        window.location.replace("/ims");
      } else {
        // IMS unreachable — password form dikhao manual retry ke liye
        setStatus("need_password");
        setError("Auto-connect failed. Please enter your password manually.");
      }
      return;
    }

    // Step 3: Password session mein nahi (old session) → password form dikhao
    setStatus("need_password");
  }

  async function handleManualLogin(e) {
    e.preventDefault();
    if (!password) return;
    setStatus("logging_in");
    setError("");

    const ok = await loginPharmacistIntoIMS({ email: session?.email, password });
    if (ok) {
      window.location.replace("/ims");
    } else {
      setStatus("need_password");
      setError("Could not connect to Inventory System. Check your password and try again.");
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const wrap = {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #0a3d62 0%, #1565a8 60%, #00b894 100%)",
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", padding: 20,
  };
  const card = {
    background: "#fff", borderRadius: 20, padding: "40px 36px",
    maxWidth: 400, width: "100%", boxShadow: "0 24px 80px rgba(10,61,98,0.28)",
    position: "relative", overflow: "hidden",
  };
  const accent = {
    position: "absolute", top: 0, left: 0, right: 0, height: 4,
    background: "linear-gradient(90deg, #0a3d62, #1565a8, #00b894)",
  };

  // ── Auto-connecting spinner ───────────────────────────────────────────────
  if (status === "checking" || status === "auto_logging_in") {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={accent} />
          <div style={{ fontSize: 52, marginBottom: 16 }}>💊</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: "#0a3d62", marginBottom: 8 }}>
            {status === "checking" ? "⏳ Checking session…" : "🔗 Opening Inventory System…"}
          </div>
          <div style={{ color: "#8fa8bc", fontSize: 13, marginBottom: 24 }}>
            {status === "checking" ? "Please wait" : `Connecting as ${session?.email || "pharmacist"}…`}
          </div>
          <div style={{
            width: 36, height: 36, margin: "0 auto",
            border: "4px solid #e4eaf1", borderTop: "4px solid #1565a8",
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Logging in spinner ────────────────────────────────────────────────────
  if (status === "logging_in") {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={accent} />
          <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#0a3d62", marginBottom: 8 }}>
            Connecting to Inventory System…
          </div>
          <div style={{ color: "#8fa8bc", fontSize: 13 }}>Please wait</div>
        </div>
      </div>
    );
  }

  // ── Password form (fallback for old sessions or retry) ────────────────────
  return (
    <div style={wrap}>
      <div style={card}>
        <div style={accent} />
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>💊</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#0a3d62", marginBottom: 6 }}>
            Welcome, {session?.name || "Pharmacist"}
          </div>
          <div style={{ color: "#6b8299", fontSize: 13, lineHeight: 1.6 }}>
            Enter your password to open the<br />
            <strong style={{ color: "#1565a8" }}>Inventory Management System</strong>
          </div>
        </div>

        <form onSubmit={handleManualLogin} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#8fa8bc", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>Email</label>
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "#f4f8fc", border: "1.5px solid #e4eaf1", fontSize: 13, color: "#4a6278", fontWeight: 600 }}>
              {session?.email || "—"}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#4a6278", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>Password *</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" autoFocus required
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #d0dce8", fontSize: 14, fontFamily: "inherit", outline: "none", color: "#0a3d62", boxSizing: "border-box" }}
              onFocus={(e) => (e.target.style.borderColor = "#1565a8")}
              onBlur={(e)  => (e.target.style.borderColor = "#d0dce8")}
            />
          </div>

          {error && (
            <div style={{ background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.25)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#e74c3c", fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={!password}
            style={{ padding: "13px 20px", borderRadius: 11, border: "none", background: password ? "linear-gradient(135deg, #0a3d62, #1565a8)" : "#d0dce8", color: "#fff", fontSize: 15, fontWeight: 700, cursor: password ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            📦 Open Inventory System →
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button onClick={logout} style={{ background: "none", border: "none", color: "#8fa8bc", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}