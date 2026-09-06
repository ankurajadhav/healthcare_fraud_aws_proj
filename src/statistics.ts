export function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0.0;
}

export function populationStd(values: number[]): number {
  if (!values.length) return 0.0;
  const m = mean(values);
  const variance = values.reduce((acc, x) => acc + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function zScore(value: number, values: number[]): number {
  const sd = populationStd(values);
  return sd === 0 ? 0.0 : (value - mean(values)) / sd;
}

export function computeProviderStatistics(claims: any[], providers: any[]): Record<string, any> {
  const byProvider = new Map<string, any[]>();
  const bySpecialty = new Map<string, number[]>();

  for (const c of claims) {
    const pid = c.provider_id;
    if (!byProvider.has(pid)) byProvider.set(pid, []);
    byProvider.get(pid)!.push(c);

    const spec = c.specialty;
    if (!bySpecialty.has(spec)) bySpecialty.set(spec, []);
    bySpecialty.get(spec)!.push(parseFloat(c.claim_amount));
  }

  const out: Record<string, any> = {};
  for (const p of providers) {
    const pid = p.provider_id;
    const cs = byProvider.get(pid) || [];
    const amounts = cs.map((c) => parseFloat(c.claim_amount));
    const dates = new Set(cs.map((c) => c.claim_date));
    const baseline = bySpecialty.get(p.specialty) || [];
    const avg = mean(amounts);
    const specAvg = mean(baseline);
    const z = zScore(avg, baseline);
    const total = amounts.reduce((a, b) => a + b, 0);

    out[pid] = {
      claim_count: cs.length,
      total_billing: Math.round(total * 100) / 100,
      average_claim: Math.round(avg * 100) / 100,
      specialty_average_claim: Math.round(specAvg * 100) / 100,
      specialty_z_score: Math.round(z * 10000) / 10000,
      billing_velocity: Math.round((cs.length / Math.max(1, dates.size)) * 10000) / 10000,
    };
  }
  return out;
}

export function statisticalRisk(s: any): number {
  const z = Math.abs(parseFloat(s.specialty_z_score || 0));
  const ratio = s.specialty_average_claim ? s.average_claim / s.specialty_average_claim : 1;
  const val = 0.6 * Math.min(100, z * 28) + 0.4 * Math.min(100, Math.max(0, (ratio - 1) * 80));
  return Math.round(Math.min(100, Math.max(0, val)) * 100) / 100;
}
