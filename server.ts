import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runPipeline } from "./src/fraud_engine";
import { embeddedHtml, embeddedCss, embeddedJs } from "./src/static_bundle";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Resolve frontend static assets safely
const candidateDirs = [
  path.join(process.cwd(), "frontend"),
  path.join(process.cwd(), "public"),
  path.join(__dirname, "frontend"),
  path.join(__dirname, "../frontend"),
  path.join(__dirname, "public"),
  path.join(__dirname, "../public"),
];
const frontendDir = candidateDirs.find((d) => fs.existsSync(d)) || path.join(process.cwd(), "frontend");
app.use(express.static(frontendDir));

// Fallback static assets if running in zero-filesystem serverless environment
app.get("/style.css", (req, res) => {
  const filePath = path.join(frontendDir, "style.css");
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.setHeader("Content-Type", "text/css");
  res.send(embeddedCss);
});

app.get("/app.js", (req, res) => {
  const filePath = path.join(frontendDir, "app.js");
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.setHeader("Content-Type", "application/javascript");
  res.send(embeddedJs);
});

app.get("*", (req, res) => {
  const indexPath = path.join(frontendDir, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(embeddedHtml);
});

const isDirectRun = Boolean(
  process.argv[1] &&
    (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.js"))
);

if (isDirectRun && !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Healthcare Fraud Intelligence server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
