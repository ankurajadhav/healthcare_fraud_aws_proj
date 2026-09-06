const get = (u) => fetch(u).then((r) => r.json());

async function init() {
  const [s, p, r] = await Promise.all([
    get("/api/summary"),
    get("/api/providers"),
    get("/api/fraud/rings"),
  ]);
  metrics(s);
  renderProviders(p);
  renderRings(r);
  selectProviders(p);
  show(p[0]);

  document.querySelector("#filter").onchange = async (e) =>
    renderProviders(
      e.target.value
        ? await get("/api/providers?risk=" + e.target.value)
        : await get("/api/providers")
    );

  document.querySelector("#providerSelect").onchange = async (e) =>
    show(await get("/api/providers/" + e.target.value));
}

function metrics(s) {
  const x = [
    ["Claims", s.claims_processed],
    ["Providers", s.providers_analyzed],
    ["Edges", s.referral_edges],
    ["Rings", s.rings_detected],
    ["Critical", s.critical_providers],
  ];
  document.querySelector("#metrics").innerHTML = x
    .map(
      (a) =>
        `<div class="metric"><div class="label">${a[0]}</div><strong>${a[1]}</strong></div>`
    )
    .join("");
}

function renderProviders(a) {
  document.querySelector("#providers").innerHTML = a
    .slice(0, 15)
    .map(
      (p) =>
        `<tr style="cursor:pointer" onclick="document.querySelector('#providerSelect').value='${p.provider_id}';document.querySelector('#providerSelect').dispatchEvent(new Event('change'))"><td><b>${p.provider_id}</b><br><span>${p.specialty}</span></td><td>${p.risk_score}</td><td><span class="badge ${p.risk_level}">${p.risk_level}</span></td><td>${p.ring_detected ? "YES" : "NO"}</td><td>${Number(p.pagerank).toFixed(4)}</td><td>${Number(p.specialty_z_score).toFixed(2)}</td></tr>`
    )
    .join("");
}

function renderRings(r) {
  document.querySelector("#rings").innerHTML = r
    .map(
      (x) =>
        `<div class="ring"><b>SCC #${x.scc_id} • ${x.size} providers</b><br>${x.providers.join(" → ")} → ${x.providers[0]}</div>`
    )
    .join("");
}

function selectProviders(a) {
  document.querySelector("#providerSelect").innerHTML = a
    .map((p) => `<option value="${p.provider_id}">${p.provider_id} — ${p.risk_level}</option>`)
    .join("");
}

function show(p) {
  if (!p) return;
  document.querySelector("#detail").innerHTML = `
    <div class="box"><small>Risk Score</small><b>${p.risk_score}</b></div>
    <div class="box"><small>Statistical Risk</small><b>${p.statistical_risk}</b></div>
    <div class="box"><small>Ring Risk</small><b>${p.referral_ring_risk}</b></div>
    <div class="box"><small>PageRank</small><b>${p.pagerank}</b></div>
    <div class="reasons"><b>Why flagged</b><ul>${p.explanation.map((x) => `<li>${x}</li>`).join("")}</ul></div>
  `;
}

init().catch(console.error);

