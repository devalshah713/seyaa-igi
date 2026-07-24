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

const FIELD_LABELS: Record<string, string> = {
  ref: "Stock / Ref no.", shape: "Shape", carat: "Carat", color: "Colour", clarity: "Clarity",
  cut: "Cut", polish: "Polish", symmetry: "Symmetry", fluorescence: "Fluorescence",
  reportNo: "Certificate no.", growthType: "Growth (CVD/HPHT)", treatment: "Treatment",
  location: "Location", measurements: "Measurements", depthPct: "Depth %", tablePct: "Table %",
  ratio: "Ratio", costPrice: "Cost", pricePerCt: "Price / ct", totalPrice: "Total price",
  status: "Status", mediaPhotoUrl: "Image URL", mediaVideoUrl: "Video URL",
};

export function ExcelUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showMap, setShowMap] = useState(false);

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

  const requiredOk = !!(mapping.ref && mapping.shape && mapping.carat);
  const matched = analysis ? analysis.fields.filter((f) => mapping[f]).length : 0;

  return (
    <>
      <div className="card">
        <div className="chd"><h3>1 · Upload your stock file</h3></div>
        <input type="file" accept=".xlsx,.xls,.csv"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setAnalysis(null); setResult(null); }} />
        <div style={{ marginTop: 12 }}>
          <button className="btn pri" onClick={analyze} disabled={!file || busy}>
            {busy && !analysis ? "Reading…" : "Analyze columns →"}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="card">
          <div className="chd"><h3>2 · Ready to import</h3><span className="note">{analysis.rowCount.toLocaleString()} rows detected</span></div>

          {requiredOk
            ? <div className="msg ok">✓ We matched your columns automatically ({matched} fields). Just click Import.</div>
            : <div className="msg err">Couldn&apos;t find Stock no., Shape or Carat — open &ldquo;Adjust column mapping&rdquo; and pick them.</div>}

          <div style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn pri" onClick={publish} disabled={busy || !requiredOk}>
              {busy ? "Importing… (may take a few seconds)" : `Import ${analysis.rowCount.toLocaleString()} stones`}
            </button>
            <button className="linka" type="button" onClick={() => setShowMap((s) => !s)}>
              {showMap ? "Hide column mapping" : "Adjust column mapping (optional)"}
            </button>
          </div>

          {showMap && (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {analysis.fields.map((field) => (
                <div key={field} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 130, fontSize: 12, fontWeight: 600, color: "var(--i6)" }}>{FIELD_LABELS[field] ?? field}</span>
                  <select value={mapping[field] || ""} onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                    style={{ flex: 1, border: "1px solid var(--bd)", borderRadius: 8, padding: "8px 10px", fontSize: 12, background: "#f6f4f2" }}>
                    <option value="">— none —</option>
                    {analysis.columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result && <div className={`msg ${result.startsWith("Imported") ? "ok" : "err"}`}>{result}</div>}
    </>
  );
}
