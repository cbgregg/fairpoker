/* ---------- drawer ---------- */
const wide = () => window.matchMedia('(min-width:1180px)').matches;
function showTab(t){
  $$('.tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false'));
  $('#p-log').hidden = t !== 'log'; $('#p-fair').hidden = t !== 'fair'; $('#p-set').hidden = t !== 'set';
  if (t === 'log'){ const pl = $('#p-log'); pl.scrollTop = pl.scrollHeight; }
}
function openDrawer(t){ showTab(t); if (!wide()){ $('#drawer').classList.add('open'); $('#scrim').hidden = false; } }
function closeDrawer(){ $('#drawer').classList.remove('open'); $('#scrim').hidden = true; }
$('#topR').onclick = e => { const b = e.target.closest('[data-open]'); if (b) openDrawer(b.dataset.open); };
$$('.tabs [data-tab]').forEach(b => b.onclick = () => showTab(b.dataset.tab));
$('#drawerClose').onclick = closeDrawer;
$('#scrim').onclick = closeDrawer;

