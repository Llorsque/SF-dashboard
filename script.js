
/* Sport Fryslân – Verenigingen Monitor
 * Data in CSV (./data/clubs.csv en ./data/memberships.csv)
 * Huisstijl: Archivo, #212945, #52E8E8
 */
const state = {
  clubs: [],
  memberships: [],
  filters: {
    municipality: "",
    sport: "",
    flags: {},
    impactFlags: {}
  },
  charts: {},
  targets: { vog:90, smoke:80, canteen:50 },
  map: null,
  mapLayer: null
};

const els = {
  kpiClubs: document.getElementById('kpiClubs'),
  kpiContrib: document.getElementById('kpiContrib'),
  kpiVog: document.getElementById('kpiVog'),
  kpiSmoke: document.getElementById('kpiSmoke'),
  kpiCanteen: document.getElementById('kpiCanteen'),
  filterMunicipality: document.getElementById('filterMunicipality'),
  filterSport: document.getElementById('filterSport'),
  checkboxes: document.querySelectorAll('.checklist input[type=checkbox]'),
  resetFilters: document.getElementById('resetFilters'),
  search: document.getElementById('search'),
  tableBody: document.querySelector('#clubsTable tbody'),
  exportCsv: document.getElementById('exportCsv'),
  fileClubs: document.getElementById('fileClubs'),
  fileMembers: document.getElementById('fileMembers'),
  targetVog: document.getElementById('targetVog'),
  targetSmoke: document.getElementById('targetSmoke'),
  targetCanteen: document.getElementById('targetCanteen'),
  metricSelect: document.getElementById('metricSelect')
};

document.getElementById('year').textContent = new Date().getFullYear();

// ------------------ Utilities ------------------
// Municipality coordinates (approx) for circle map
const muniCoords = {
  "Opsterland": [53.055, 6.06],
  "Weststellingwerf": [52.88, 6.00],
  "Waadhoeke": [53.22, 5.62]
};

function parseYesNo(v){
  if (v == null) return false;
  const s = String(v).toLowerCase().trim();
  return s === 'ja' || s === 'yes' || s === 'true' || s === '1';
}
function number(v){ const n = Number(v); return isNaN(n) ? 0 : n; }

function loadCsvText(text){
  return Papa.parse(text, { header:true, skipEmptyLines:true }).data;
}

async function loadDefault(){
  const [clubsText, membersText] = await Promise.all([
    fetch('data/clubs.csv').then(r=>r.text()),
    fetch('data/memberships.csv').then(r=>r.text())
  ]);
  state.clubs = loadCsvText(clubsText);
  state.memberships = loadCsvText(membersText);
  initAfterData();
}

function initAfterData(){
  hydrateBooleans();
  populateFilters();
  restoreFilters();
  renderAll();
}

function hydrateBooleans(){
  const boolFields = [
    'own_canteen','has_professional','newsletter','active_club','ynbeweging','rabo_clubsupport','vcper','vog_mandatory','safe_sport_env','smoke_free','healthy_canteen','catering_license','ch_heldere_communicatie','ch_samen_verenigen','ch_club_voor_iedereen','ch_vitaliteit','ch_samenwerken_omgeving','ch_opgeleid_kader','ch_veilig_sportklimaat','ch_basis_op_orde','impact_aangepast_sporten','impact_0_4','impact_4_12','impact_12_18','impact_55_plus','oldstars','clubscan_done','duurzaamheidsmaatregelen'
  ];
  state.clubs = state.clubs.map(c => {
    const copy = { ...c };
    boolFields.forEach(f => copy[f] = parseYesNo(copy[f]));
    copy.members = number(copy.members);
    copy.volunteers = number(copy.volunteers);
    copy.contribution_senior = number(copy.contribution_senior);
    return copy;
  });
  state.memberships = state.memberships.map(m => ({
    club_id: m.club_id,
    year: Number(m.year),
    total_members: number(m.total_members),
    youth_members: number(m.youth_members),
    volunteers_count: number(m.volunteers_count)
  }));
}

function uniqueOptions(items, field){
  const set = new Set(items.map(i => (i[field] || '').trim()).filter(Boolean));
  return Array.from(set).sort();
}

function populateFilters(){
  // Municipality
  const optsMuni = uniqueOptions(state.clubs, 'municipality');
  for(const o of optsMuni){
    const opt = document.createElement('option');
    opt.value = o; opt.textContent = o;
    els.filterMunicipality.appendChild(opt);
  }
  // Sport
  const optsSport = uniqueOptions(state.clubs, 'sport');
  for(const s of optsSport){
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    els.filterSport.appendChild(opt);
  }

  els.filterMunicipality.addEventListener('change', () => { state.filters.municipality = els.filterMunicipality.value; persistFilters(); renderAll(); });
  els.filterSport.addEventListener('change', () => { state.filters.sport = els.filterSport.value; persistFilters(); renderAll(); });

  els.checkboxes.forEach(cb=>{
    cb.addEventListener('change', () => {
      const flag = cb.dataset.flag;
      const checked = cb.checked;
      if(flag.startsWith('impact_')){
        state.filters.impactFlags[flag] = checked;
      }else{
        state.filters.flags[flag] = checked;
      }
      persistFilters(); renderAll();
    });
  });

  // Targets init & events
  restoreTargets();
  ['targetVog','targetSmoke','targetCanteen'].forEach(id => {
    els[id].addEventListener('change', () => {
      state.targets.vog = Number(els.targetVog.value)||0;
      state.targets.smoke = Number(els.targetSmoke.value)||0;
      state.targets.canteen = Number(els.targetCanteen.value)||0;
      persistTargets();
      renderKpis();
    });
  });

  // Metric select
  if(els.metricSelect){
    els.metricSelect.addEventListener('change', renderCharts);
  }

  els.resetFilters.addEventListener('click', () => {
    els.filterMunicipality.value = '';
    els.filterSport.value = '';
    els.checkboxes.forEach(cb => cb.checked = false);
    state.filters = { municipality:'', sport:'', flags:{}, impactFlags:{} };
    persistFilters();
    renderAll();
  });

  els.search.addEventListener('input', () => renderTable());

  // Export
  els.exportCsv.addEventListener('click', exportFilteredCsv);

  // File inputs
  els.fileClubs.addEventListener('change', handleLoadCustomCsv.bind(null, 'clubs'));
  els.fileMembers.addEventListener('change', handleLoadCustomCsv.bind(null, 'memberships'));
}

function persistFilters(){
  try { localStorage.setItem('sf_filters', JSON.stringify(state.filters)); } catch {}
}

function persistTargets(){
  try { localStorage.setItem('sf_targets', JSON.stringify(state.targets)); } catch {}
}
function restoreTargets(){
  try {
    const raw = localStorage.getItem('sf_targets');
    if(raw){
      state.targets = JSON.parse(raw);
    }
  } catch {}
  els.targetVog.value = state.targets.vog;
  els.targetSmoke.value = state.targets.smoke;
  els.targetCanteen.value = state.targets.canteen;
}

function restoreFilters(){
  try {
    const raw = localStorage.getItem('sf_filters');
    if(!raw) return;
    const saved = JSON.parse(raw);
    state.filters = saved;
    els.filterMunicipality.value = saved.municipality || '';
    els.filterSport.value = saved.sport || '';
    els.checkboxes.forEach(cb => {
      const flag = cb.dataset.flag;
      cb.checked = !!(saved.flags && saved.flags[flag]) || !!(saved.impactFlags && saved.impactFlags[flag]);
    });
  } catch {}
}

function filteredClubs(){
  return state.clubs.filter(c => {
    if(state.filters.municipality && c.municipality !== state.filters.municipality) return false;
    if(state.filters.sport && c.sport !== state.filters.sport) return false;
    for(const [flag, on] of Object.entries(state.filters.flags)){
      if(on && !parseYesNo(c[flag])) return false;
    }
    for(const [flag, on] of Object.entries(state.filters.impactFlags)){
      if(on && !parseYesNo(c[flag])) return false;
    }
    const q = els.search.value.trim().toLowerCase();
    if(q){
      const hay = [c.club_name, c.sport, c.city, c.municipality].join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderAll(){
  renderKpis();
  renderCharts();
  renderTable();
}

function pct(part, total){
  if(total <= 0) return 0;
  return Math.round((part/total)*100);
}

function renderKpis(){
  const rows = filteredClubs();
  els.kpiClubs.textContent = rows.length.toString();
  const contribs = rows.map(r => r.contribution_senior).filter(n => n>0);
  const avg = contribs.length ? Math.round(contribs.reduce((a,b)=>a+b,0)/contribs.length) : 0;
  els.kpiContrib.textContent = avg ? `€ ${avg}` : '—';

  const vogTrue = rows.filter(r => r.vog_mandatory).length;
  const vogPct = rows.length ? pct(vogTrue, rows.length) : null;
  els.kpiVog.textContent = vogPct!=null ? `${vogPct}%` : '—';
  const smokeTrue = rows.filter(r => r.smoke_free).length;
  const smokePct = rows.length ? pct(smokeTrue, rows.length) : null;
  els.kpiSmoke.textContent = smokePct!=null ? `${smokePct}%` : '—';
  const healthyTrue = rows.filter(r => r.healthy_canteen).length;
  const canteenPct = rows.length ? pct(healthyTrue, rows.length) : null;
  els.kpiCanteen.textContent = canteenPct!=null ? `${canteenPct}%` : '—';

  // Color status
  setKpiStatus(els.kpiVog.parentElement, vogPct, state.targets.vog);
  setKpiStatus(els.kpiSmoke.parentElement, smokePct, state.targets.smoke);
  setKpiStatus(els.kpiCanteen.parentElement, canteenPct, state.targets.canteen);

}

function groupCount(items, field){
  const map = new Map();
  for(const it of items){
    const key = it[field] || '—';
    map.set(key, (map.get(key)||0)+1);
  }
  const labels = Array.from(map.keys());
  const values = labels.map(l => map.get(l));
  return { labels, values };
}

function renderCharts(){
  // Bar chart by municipality
  const rows = filteredClubs();
  const byMuni = groupCount(rows, 'municipality');
  drawBar('chartByMunicipality', byMuni.labels, byMuni.values, 'Verenigingen');

  // Policy adoption chart
  const flags = ['vcper','vog_mandatory','smoke_free','healthy_canteen','ynbeweging'];
  const labels = ['VCP','VOG','Rookvrij','Gezonde kantine','Ynbeweging'];
  const values = flags.map(f => rows.filter(r => r[f]).length);
  drawBar('chartPolicy', labels, values, 'Aantal met kenmerk');

  // Members time series by selected metric
  const metric = els.metricSelect ? els.metricSelect.value : 'total_members';
  const clubIds = new Set(rows.map(r => r.id));
  const byYear = {};
  for(const row of state.memberships){
    if(!clubIds.has(row.club_id)) continue;
    byYear[row.year] = (byYear[row.year] || 0) + (row[metric] || 0);
  }
  const years = Object.keys(byYear).map(y=>Number(y)).sort((a,b)=>a-b);
  const totals = years.map(y => byYear[y]);
  const labelMap = { total_members:'Leden totaal', youth_members:'Jeugdleden', volunteers_count:'Vrijwilligers' };
  drawLine('chartMembers', years, totals, labelMap[metric] || 'Leden');

  // Map & sport distribution
  renderMap();
  renderSports();
  renderQuality();
}

function drawBar(canvasId, labels, data, label){
  const ctx = document.getElementById(canvasId);
  const prev = state.charts[canvasId];
  if(prev){ prev.destroy(); }
  state.charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data
      }]
    },
    options: {
      responsive:true,
      maintainAspectRatio:false,
      scales: { y: { beginAtZero:true, ticks:{ precision:0 } } },
      plugins: { legend: { display:false } }
    }
  });
}

function drawLine(canvasId, labels, data, label){
  const ctx = document.getElementById(canvasId);
  const prev = state.charts[canvasId];
  if(prev){ prev.destroy(); }
  state.charts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        tension: .25
      }]
    },
    options: {
      responsive:true,
      maintainAspectRatio:false,
      plugins: { legend: { display:false } },
      scales: { y: { beginAtZero:true } }
    }
  });
}

function renderTable(){
  const rows = filteredClubs();
  const tbody = els.tableBody;
  tbody.innerHTML = '';
  for(const r of rows){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><a href="${r.website}" target="_blank" rel="noopener">${r.club_name}</a></td>
      <td>${r.sport}</td>
      <td>${r.municipality}</td>
      <td>${r.members}</td>
      <td>${r.volunteers}</td>
      <td>${r.vcper ? 'ja':'nee'}</td>
      <td>${r.vog_mandatory ? 'ja':'nee'}</td>
      <td>${r.smoke_free ? 'ja':'nee'}</td>
      <td>${r.healthy_canteen ? 'ja':'nee'}</td>
      <td>€ ${r.contribution_senior}</td>
    `;
    tbody.appendChild(tr);
  }
}

function exportFilteredCsv(){
  const rows = filteredClubs();
  if(!rows.length){ alert('Geen rijen om te exporteren.'); return; }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')].concat(
    rows.map(r => headers.map(h => String(r[h]).replaceAll('"','""')).map(v=>/[,\n"]/.test(v)?`"${v}"`:v).join(','))
  ).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'verenigingen-filter.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function handleLoadCustomCsv(kind, ev){
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const data = loadCsvText(text);
    if(kind === 'clubs'){
      state.clubs = data;
      hydrateBooleans();
    }else{
      state.memberships = data.map(m => ({ ...m, year:Number(m.year), total_members:Number(m.total_members), youth_members:Number(m.youth_members), volunteers_count:Number(m.volunteers_count) }));
    }
    renderAll();
  };
  reader.readAsText(file, 'utf-8');
}


function setKpiStatus(kpiEl, value, target){
  kpiEl.classList.remove('ok','warn','bad');
  if(value==null){ return; }
  if(value >= target) kpiEl.classList.add('ok');
  else if(value >= Math.max(0, target-10)) kpiEl.classList.add('warn');
  else kpiEl.classList.add('bad');
}

function ensureMap(){
  if(!document.getElementById('map')) return;
  if(state.map) return;
  state.map = L.map('map', { scrollWheelZoom:false }).setView([53.1, 5.9], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(state.map);
}

function renderMap(){
  if(!document.getElementById('map')) return;
  ensureMap();
  if(state.mapLayer){
    state.map.removeLayer(state.mapLayer);
    state.mapLayer = null;
  }
  const rows = filteredClubs();
  const counts = {};
  rows.forEach(r => { counts[r.municipality] = (counts[r.municipality]||0)+1; });
  const layer = L.layerGroup();
  Object.entries(counts).forEach(([muni,count]) => {
    const coord = muniCoords[muni];
    if(!coord) return;
    const radius = 10000 + count * 1500;
    const circle = L.circle(coord, { radius });
    circle.bindTooltip(`${muni}: ${count}`);
    layer.addLayer(circle);
  });
  layer.addTo(state.map);
  state.mapLayer = layer;
}

function renderSports(){
  const rows = filteredClubs();
  const bySport = groupCount(rows, 'sport');
  drawDoughnut('chartSports', bySport.labels, bySport.values, 'Clubs');
}

function drawDoughnut(canvasId, labels, data, label){
  const ctx = document.getElementById(canvasId);
  if(!ctx) return;
  const prev = state.charts[canvasId];
  if(prev){ prev.destroy(); }
  state.charts[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ label, data }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }
  });
}

function renderQuality(){
  const ul = document.getElementById('qualityList');
  if(!ul) return;
  const rows = filteredClubs();
  const issues = [];
  rows.forEach(r => {
    if(r.members < r.volunteers){
      issues.push({ type:'DATA', msg:`${r.club_name}: meer vrijwilligers (${r.volunteers}) dan leden (${r.members}).`});
    }
    if(r.vog_mandatory && r.volunteers < 5){
      issues.push({ type:'RISICO', msg:`${r.club_name}: VOG verplicht maar weinig vrijwilligers (${r.volunteers}).`});
    }
    if(!r.vcper && !r.safe_sport_env){
      issues.push({ type:'VEILIGHEID', msg:`${r.club_name}: geen VCP en geen veilig sportklimaat gemarkeerd.`});
    }
    if(r.contribution_senior && r.contribution_senior < 50){
      issues.push({ type:'CHECK', msg:`${r.club_name}: zeer lage contributie (€ ${r.contribution_senior}).`});
    }
  });
  ul.innerHTML = '';
  issues.slice(0, 12).forEach(it => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="tag">${it.type}</span>${it.msg}`;
    ul.appendChild(li);
  });
  if(issues.length === 0){
    ul.innerHTML = '<li><span class="tag">OK</span>Geen opvallende issues in de gefilterde selectie.</li>';
  }
}

// Start
loadDefault();
