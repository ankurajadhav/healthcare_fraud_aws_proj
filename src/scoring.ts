export function ringRisk(g: any): number {
  if (!g?.ring_detected) return 0;
  const sccSize = parseInt(g.scc_size ?? 3, 10);
  const val = 95 + Math.max(0, sccSize - 3) * 2;
  return Math.round(Math.min(100, val) * 100) / 100;
}

export function networkRisk(g: any): number {
  const pr = Math.min(100, parseFloat(g?.pagerank ?? 0) * 550);
  const deg = Math.min(100, (parseInt(g?.in_degree ?? 0, 10) + parseInt(g?.out_degree ?? 0, 10)) * 9);
  return Math.round((0.6 * pr + 0.4 * deg) * 100) / 100;
}

export function behaviorRisk(s: any): number {
  const claimPart = 0.55 * Math.min(100, (s.claim_count || 0) * 2.5);
  const billPart = 0.45 * Math.min(100, ((s.total_billing || 0) / 250000) * 100);
  return Math.round((claimPart + billPart) * 100) / 100;
}

export function finalScore(stat: number, ring: number, net: number, beh: number): number {
  const score = 0.4 * stat + 0.3 * ring + 0.2 * net + 0.1 * beh;
  return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100;
}

export function level(score: number): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

export function reasons(s: any, g: any): string[] {
  const r: string[] = [];
  if (Math.abs(parseFloat(s.specialty_z_score || 0)) >= 2) {
    r.push("Claim amount is a statistical outlier for the specialty.");
  }
  if (g?.ring_detected) {
    r.push("Provider belongs to a closed referral cycle detected by SCC analysis.");
  }
  if (parseFloat(g?.pagerank ?? 0) >= 0.08) {
    r.push("Provider has elevated network centrality (PageRank).");
  }
  if (r.length === 0) {
    r.push("No major fraud indicators detected.");
  }
  return r;
}
