"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [tab, setTab] = useState<"signin" | "request">("signin");
  return (
    <div className="login">
      <div className="brandside">
        <img className="hero-emb" src="/emblem.png" alt="Seyaa Solitaire" />
        <div className="script wm">Seyaa Solitaire</div>
        <p>The trade desk for IGI-certified lab-grown diamonds. Search live inventory and Buy, take on Memo, or Hold — direct, no middlemen.</p>
      </div>
      <div className="formside">
        <div className="login-card">
          <div className="seg">
            <button className={tab === "signin" ? "on" : ""} onClick={() => setTab("signin")}>Sign In</button>
            <button className={tab === "request" ? "on" : ""} onClick={() => setTab("request")}>Request Access</button>
          </div>
          {tab === "signin" ? <SignIn onSwitch={() => setTab("request")} /> : <RequestAccess />}
        </div>
      </div>
    </div>
  );
}

function SignIn({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) { router.push(data.user?.role === "ADMIN" || data.user?.role === "SALES" ? "/admin" : "/search"); router.refresh(); }
    else setErr(data.error || "Sign in failed");
  }

  return (
    <>
      <div><div style={{ fontSize: 23, fontWeight: 700 }}>Welcome back</div>
        <div style={{ fontSize: 13, color: "var(--i6)", marginTop: 3 }}>Sign in to your Seyaa Solitaire trade account.</div></div>
      {err && <div className="msg err">{err}</div>}
      <div className="lfield"><label>Work email</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>
      <div className="lfield"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
      <button className="btn pri" onClick={submit} disabled={busy}>{busy ? "Signing in…" : "Sign In"}</button>
      <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--i6)" }}>
        New to Seyaa Solitaire? <button className="linka" onClick={onSwitch}>Apply for a trade account</button>
      </div>
    </>
  );
}

function RequestAccess() {
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", mobile: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [aadhaarUrl, setAadhaarUrl] = useState<string | null>(null);
  const [gstUrl, setGstUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function upload(file: File, folder: string, cb: (u: string) => void) {
    const fd = new FormData(); fd.append("file", file); fd.append("folder", folder);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) cb(data.url); else setMsg({ t: "err", m: data.error || "Upload failed" });
  }
  async function sendOtp() {
    if (!f.email) return setMsg({ t: "err", m: "Enter your email first" });
    const res = await fetch("/api/auth/otp/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: f.email, purpose: "SIGNUP" }) });
    const d = await res.json();
    if (res.ok) { setOtpSent(true); setMsg({ t: "ok", m: d.devOtp ? `Dev OTP: ${d.devOtp}` : "OTP sent to your email." }); }
  }
  async function verify() {
    const res = await fetch("/api/auth/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: f.email, purpose: "SIGNUP", code: otp }) });
    if (res.ok) { setVerified(true); setMsg({ t: "ok", m: "Email verified." }); } else setMsg({ t: "err", m: "Invalid or expired code." });
  }
  async function submit() {
    if (!verified) return setMsg({ t: "err", m: "Verify your email first." });
    if (!aadhaarUrl) return setMsg({ t: "err", m: "Aadhaar upload is required for KYC." });
    setBusy(true);
    const res = await fetch("/api/auth/request-access", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...f, aadhaarUrl, gstUrl: gstUrl || undefined }),
    });
    const d = await res.json();
    setBusy(false);
    setMsg({ t: res.ok ? "ok" : "err", m: res.ok ? "Application submitted — access is granted once KYC is approved." : d.error || "Submission failed" });
  }

  return (
    <>
      <div><div style={{ fontSize: 23, fontWeight: 700 }}>Apply for trade access</div>
        <div style={{ fontSize: 13, color: "var(--i6)", marginTop: 3 }}>Verified accounts only. KYC is required.</div></div>
      {msg && <div className={`msg ${msg.t}`}>{msg.m}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="lfield"><label>First name</label><input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} /></div>
        <div className="lfield"><label>Last name</label><input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} /></div>
      </div>
      <div className="lfield"><label>Email address</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ flex: 1 }} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" />
          <button className="btn" onClick={sendOtp} type="button">{otpSent ? "Resend" : "Send OTP"}</button>
        </div>
      </div>
      {otpSent && !verified && (
        <div className="lfield"><label>Enter OTP</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ flex: 1 }} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
            <button className="btn out" onClick={verify} type="button">Verify</button>
          </div>
        </div>
      )}
      {verified && <div className="msg ok">✓ Email verified</div>}
      <div className="lfield"><label>Mobile number</label><input value={f.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="+91 98 76 54 32 10" /></div>
      <div className="lfield"><label>Aadhaar card (required · KYC)</label>
        <input type="file" accept="application/pdf,image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "kyc", setAadhaarUrl)} />
        {aadhaarUrl && <div className="msg ok" style={{ marginTop: 6 }}>Aadhaar uploaded ✓</div>}
      </div>
      <div className="lfield"><label>GST certificate (optional)</label>
        <input type="file" accept="application/pdf,image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "kyc", setGstUrl)} />
        {gstUrl && <div className="msg ok" style={{ marginTop: 6 }}>GST uploaded ✓</div>}
      </div>
      <button className="btn pri" onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit Application"}</button>
    </>
  );
}
