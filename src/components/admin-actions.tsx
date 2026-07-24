"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function useRefresh() {
  const router = useRouter();
  return () => router.refresh();
}

export function CustomerDecision({ id }: { id: string }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  async function decide(decision: "APPROVE" | "REJECT") {
    setBusy(true);
    await fetch(`/api/admin/customers/${id}/decision`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision }),
    });
    setBusy(false); refresh();
  }
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button className="btn sm out" style={{ borderColor: "var(--sold)", color: "var(--sold)" }} disabled={busy} onClick={() => decide("REJECT")}>Reject</button>
      <button className="btn sm pri" style={{ background: "var(--ok)" }} disabled={busy} onClick={() => decide("APPROVE")}>Approve</button>
    </div>
  );
}

export function RequestDecision({ id }: { id: string }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  async function decide(decision: "APPROVE" | "DECLINE") {
    setBusy(true);
    await fetch(`/api/admin/requests/${id}/decision`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision }),
    });
    setBusy(false); refresh();
  }
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button className="btn sm out" style={{ borderColor: "var(--sold)", color: "var(--sold)" }} disabled={busy} onClick={() => decide("DECLINE")}>Decline</button>
      <button className="btn sm pri" style={{ background: "var(--ok)" }} disabled={busy} onClick={() => decide("APPROVE")}>Approve</button>
    </div>
  );
}

export function AssignOrder({ id, sales }: { id: string; sales: { id: string; name: string }[] }) {
  const refresh = useRefresh();
  const [who, setWho] = useState("");
  const [busy, setBusy] = useState(false);
  async function assign() {
    if (!who) return;
    setBusy(true);
    await fetch(`/api/admin/orders/${id}/assign`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ salespersonId: who }),
    });
    setBusy(false); refresh();
  }
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <select value={who} onChange={(e) => setWho(e.target.value)}
        style={{ border: "1px solid var(--bd)", borderRadius: 8, padding: "8px 10px", fontSize: 12, background: "#f6f4f2" }}>
        <option value="">Assign to…</option>
        {sales.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <button className="btn sm pri" disabled={busy || !who} onClick={assign}>Assign</button>
    </div>
  );
}

type Analysis = { columns: string[]; fields: string[]; suggestedMapping: Record<string, string>; rowCount: number };

export function ExcelUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function analyze() {
    if (!file) return;
    setBusy(true); setResult(null);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/admin/inventory/analyze", { method: "POST", body: fd });
    const d = await res.json(); setBusy(false);
    if (res.ok) { setAnalysis(d); setMapping(d.suggestedMapping || {}); }
    else setResult(d.error || "Analyze failed");
  }
  async function publish() {
    if (!file) return;
    setBusy(true); setResult(null);
    const fd = new FormData(); fd.append("file", file); fd.append("mapping", JSON.stringify(mapping));
    const res = await fetch("/api/admin/inventory/publish", { method: "POST", body: fd });
    const d = await res.json(); setBusy(false);
    setResult(res.ok ? `Imported ${d.imported} stones · ${d.alreadyInStock} already in stock · ${d.skippedInvalid} skipped.` : d.error || "Publish failed");
  }

  return (
    <>
      <div className="card">
        <div className="chd"><h3>1 · Upload file</h3></div>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <div style={{ marginTop: 12 }}><button className="btn pri" onClick={analyze} disabled={!file || busy}>Analyze columns →</button></div>
      </div>

      {analysis && (
        <div className="card">
          <div className="chd"><h3>2 · Map columns</h3><span className="note">{analysis.rowCount} rows · {analysis.columns.length} columns</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {analysis.fields.map((field) => (
              <div key={field} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 120, fontSize: 12, fontWeight: 600, color: "var(--i6)" }}>{field}</span>
                <select value={mapping[field] || ""} onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                  style={{ flex: 1, border: "1px solid var(--bd)", borderRadius: 8, padding: "8px 10px", fontSize: 12, background: "#f6f4f2" }}>
                  <option value="">—</option>
                  {analysis.columns.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}><button className="btn pri" onClick={publish} disabled={busy}>Validate &amp; Publish</button></div>
        </div>
      )}

      {result && <div className={`msg ${result.startsWith("Imported") ? "ok" : "err"}`}>{result}</div>}
    </>
  );
}
