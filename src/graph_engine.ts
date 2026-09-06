export function buildGraph(providers: any[], referrals: any[]): Record<string, string[]> {
  const g: Record<string, string[]> = {};
  for (const p of providers) {
    g[p.provider_id] = [];
  }
  for (const r of referrals) {
    if (g[r.from_provider] && g[r.to_provider]) {
      g[r.from_provider].push(r.to_provider);
    }
  }
  return g;
}

export function tarjanScc(graph: Record<string, string[]>): string[][] {
  let index = 0;
  const stack: string[] = [];
  const indices: Record<string, number> = {};
  const low: Record<string, number> = {};
  const onStack = new Set<string>();
  const comps: string[][] = [];

  function visit(v: string) {
    indices[v] = low[v] = index;
    index += 1;
    stack.push(v);
    onStack.add(v);

    for (const w of graph[v] || []) {
      if (indices[w] === undefined) {
        visit(w);
        low[v] = Math.min(low[v], low[w]);
      } else if (onStack.has(w)) {
        low[v] = Math.min(low[v], indices[w]);
      }
    }

    if (low[v] === indices[v]) {
      const comp: string[] = [];
      while (true) {
        const w = stack.pop()!;
        onStack.delete(w);
        comp.push(w);
        if (w === v) break;
      }
      comp.sort();
      comps.push(comp);
    }
  }

  for (const v of Object.keys(graph)) {
    if (indices[v] === undefined) {
      visit(v);
    }
  }

  // Sort components by descending length, then lexicographically
  return comps.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return a.join(",").localeCompare(b.join(","));
  });
}

export function pagerank(graph: Record<string, string[]>, damping = 0.85, iterations = 50): Record<string, number> {
  const nodes = Object.keys(graph);
  const n = nodes.length;
  if (!n) return {};

  let r: Record<string, number> = {};
  for (const v of nodes) {
    r[v] = 1 / n;
  }

  const incoming: Record<string, string[]> = {};
  const out: Record<string, number> = {};
  for (const v of nodes) {
    incoming[v] = [];
    out[v] = (graph[v] || []).length;
  }

  for (const [a, targets] of Object.entries(graph)) {
    for (const b of targets) {
      if (incoming[b]) {
        incoming[b].push(a);
      }
    }
  }

  for (let iter = 0; iter < iterations; iter++) {
    const dangling = nodes.reduce((sum, v) => (out[v] === 0 ? sum + r[v] : sum), 0);
    const nr: Record<string, number> = {};
    for (const v of nodes) {
      let x = (1 - damping) / n + (damping * dangling) / n;
      for (const u of incoming[v] || []) {
        if (out[u]) {
          x += (damping * r[u]) / out[u];
        }
      }
      nr[v] = x;
    }
    r = nr;
  }

  const total = Object.values(r).reduce((a, b) => a + b, 0) || 1;
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(r)) {
    result[k] = Math.round((v / total) * 1000000) / 1000000;
  }
  return result;
}

export function graphSignals(graph: Record<string, string[]>) {
  const allSccs = tarjanScc(graph);
  const rings = allSccs.filter((c) => c.length >= 3).sort((a, b) => a[0].localeCompare(b[0]));
  const singles = allSccs.filter((c) => c.length < 3).sort((a, b) => a[0].localeCompare(b[0]));
  const sccs = [...rings, ...singles];
  const ranks = pagerank(graph);
  const membership: Record<string, any> = {};

  sccs.forEach((c, i) => {
    const sccId = i + 1;
    for (const node of c) {
      membership[node] = {
        scc_id: sccId,
        scc_size: c.length,
        ring_detected: c.length >= 3,
      };
    }
  });

  const out: Record<string, any> = {};
  for (const node of Object.keys(graph)) {
    const mem = membership[node] || { scc_id: null, scc_size: 1, ring_detected: false };
    const inDegree = Object.values(graph).reduce((sum, targets) => sum + (targets.includes(node) ? 1 : 0), 0);
    const outDegree = (graph[node] || []).length;

    out[node] = {
      ...mem,
      pagerank: ranks[node] || 0,
      in_degree: inDegree,
      out_degree: outDegree,
    };
  }

  return { signals: out, sccs };
}
