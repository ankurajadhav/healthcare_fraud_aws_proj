import express from "express";
import path from "path";
import { runPipeline } from "./src/fraud_engine";

const app = express();
const PORT = 3000;

app.use(express.json());

let RESULTS: any;
try {
  RESULTS = runPipeline();
} catch (e) {
  console.error("Error running pipeline:", e);
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/summary", (req, res) => {
  res.json(RESULTS?.summary ?? {});
});

app.get("/api/providers", (req, res) => {
  const risk = req.query.risk as string | undefined;
  const providers = RESULTS?.providers ?? [];
  if (risk) {
    const filtered = providers.filter(
      (x: any) => (x.risk_level || "").toLowerCase() === risk.toLowerCase()
    );
    res.json(filtered);
  } else {
    res.json(providers);
  }
});

app.get("/api/providers/:pid", (req, res) => {
  const pid = req.params.pid;
  const p = (RESULTS?.providers ?? []).find((x: any) => x.provider_id === pid);
  if (p) {
    res.json(p);
  } else {
    res.status(404).json({ error: "Provider not found" });
  }
});

app.get("/api/fraud/rings", (req, res) => {
  res.json(RESULTS?.rings ?? []);
});

// Serve frontend static assets
const frontendDir = path.join(process.cwd(), "frontend");
app.use(express.static(frontendDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Healthcare Fraud Intelligence server running on http://0.0.0.0:${PORT}`);
});
