function shortHand(h){
  const [a] = h.vals;
  switch (h.cat){
    case 8: return a === 12 ? 'Royal flush' : 'Straight flush';
    case 7: return `Four ${RP[a]}`;
    case 6: return 'Full house';
    case 5: return 'Flush';
    case 4: return 'Straight';
    case 3: return `Three ${RP[a]}`;
    case 2: return 'Two pair';
    case 1: return `Pair of ${RP[a]}`;
    default: return `${RN[a]} high`;
  }
}

/* ---------- lobby wiring ---------- */
function setSeg(id, v){ $$(id + ' button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === v ? 'true' : 'false')); }
function segWire(id, keyName, after){
  $(id).onclick = e => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    setSeg(id, b.dataset.v);
    cfg[keyName] = b.dataset.v; after && after(b.dataset.v);
  };
}
segWire('#seg-diff', 'diff', () => { $('#diffHint').textContent = DIFF[cfg.diff].hint; });
segWire('#seg-speed', 'speed', v => store.set('pace', v));
segWire('#seg-speed2', 'speed', v => { if (G) G.cfg.speed = v; setSeg('#seg-speed', v); store.set('pace', v); });
segWire('#seg-skin', 'skin', v => { applySkin(v); store.set('skin', v); });
segWire('#seg-skin2', 'skin', v => { applySkin(v); store.set('skin', v); dockKey = ''; renderUI(); });
segWire('#seg-view', 'view', v => applyView(v));
segWire('#seg-view2', 'view', v => { applyView(v); dockKey = ''; renderUI(); });
let stackTouched = false;
const bbOf = () => +$('#f-blinds').value.split('/')[1];
function updateBB(){ const bb = bbOf(), s = +$('#f-stack').value || 0; $('#bbHint').textContent = `${Math.floor(s / bb)} big blinds`; }
$('#f-blinds').onchange = () => { if (!stackTouched) $('#f-stack').value = bbOf() * 100; updateBB(); };
$('#f-stack').oninput = () => { stackTouched = true; updateBB(); };
$('#f-opp').onchange = () => { $('#startHint').textContent = `${+$('#f-opp').value + 1} seats plus the house dealer`; };
$('#reseed').onclick = () => { $('#f-seed').value = newClientSeed(); };
$('#f-name').value = store.get('name') || 'Player';
$('#f-seed').value = store.get('seed') || newClientSeed();
const savedPace = store.get('pace');
if (savedPace && PACE[savedPace]){ cfg.speed = savedPace; setSeg('#seg-speed', savedPace); }
applySkin(THEMES[store.get('skin')] ? store.get('skin') : 'regular');

$('#setup').onsubmit = e => {
  e.preventDefault();
  const [sb, bb] = $('#f-blinds').value.split('/').map(Number);
  const name = ($('#f-name').value.trim() || 'Player').slice(0, 12);
  let stack = Math.round(+$('#f-stack').value);
  if (!Number.isFinite(stack) || stack < bb * 10){ stack = bb * 10; $('#f-stack').value = stack; updateBB(); }
  const seed = $('#f-seed').value.trim() || newClientSeed();
  store.set('name', name); store.set('seed', seed);
  newGame({ name, opp:+$('#f-opp').value, sb, bb, stack, diff:cfg.diff, speed:cfg.speed, skin:cfg.skin, seed, auto:store.get('auto') !== '0', showCom:false });
  sfx.init(); keepAwake(); renderStats();
  $('#lobby').hidden = true; $('#game').hidden = false; $('#drawer').hidden = false;
  showTab('log');
  dockKey = '';
  computeLayout();
  fit();
  renderUI();
  startHand();
};

/* ---------- in-game settings ---------- */
$('#t-auto').onchange = () => { if (!G) return; G.cfg.auto = $('#t-auto').checked; store.set('auto', G.cfg.auto ? '1' : '0'); if (!G.cfg.auto) clearTimeout(autoTimer); dockKey = ''; renderDock(); };
$('#t-show').onchange = () => { if (!G) return; G.cfg.showCom = $('#t-show').checked; if (G.cfg.showCom) logLine('Practice view on: COM cards are visible to you.', 'st'); };
$('#t-fps').onchange = () => { showFps = $('#t-fps').checked; };
$('#t-sound').checked = sfx.on;
setSeg('#seg-vpack', VOICE_PACK); $('#vpackHint').textContent = VPACK_HINT[VOICE_PACK]; studioLoad(); if (VOICE_PACK === 'neural') neuralInit();
$('#vTest').onclick = () => { sfx.init(); if (VOICE_PACK === 'modern') mvTest(); else if (TALK) say('D', 'Testing. Can you hear the table?', 2, { basic:true }); };
$('#seg-vpack').onclick = e => {
  const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return;
  if (b.dataset.v === 'modern') mvPrime(true);                  // the tap that picks Modern also unlocks device speech
  setVoicePack(b.dataset.v); sfx.init();
  if (TALK) setTimeout(() => say('D', b.dataset.v === 'retro' ? 'Retro voices.' : b.dataset.v === 'neural' ? 'Neural voices. Give me a second to warm up.' : b.dataset.v === 'modern' ? 'Modern voices. How do I sound?' : 'Studio voices. Much better.', 2, { basic:true }), 150);
};
setSeg('#seg-talk', TALK_MODE); $('#talkHint').textContent = TALK_HINT[TALK_MODE];
$('#t-curse').checked = CURSE;
$('#t-odds').checked = ODDS;
$('#t-odds').onchange = () => { ODDS = $('#t-odds').checked; store.set('odds', ODDS ? '1' : '0'); dockKey = ''; renderDock(); };
$('#t-curse').onchange = () => { CURSE = $('#t-curse').checked; store.set('curse', CURSE ? '1' : '0'); };
$('#t-pxdeck').checked = PIXEL_DECK;
$('#t-pxdeck').onchange = () => { PIXEL_DECK = $('#t-pxdeck').checked; store.set('pxdeck', PIXEL_DECK ? '1' : '0'); applySkin(cfg.skin); };
$('#seg-talk').onclick = e => {
  const b = e.target.closest('button[data-v]'); if (!b) return;
  setTalkMode(b.dataset.v); setSeg('#seg-talk', TALK_MODE); $('#talkHint').textContent = TALK_HINT[TALK_MODE];
  if (TALK){ sfx.init(); say('D', TALK_MODE === 'basic' ? 'Basic.' : TALK_MODE === 'chatty' ? 'Chatty table.' : 'Voices on.', 2, { basic:true }); }
};
$('#t-sound').onchange = () => { sfx.on = $('#t-sound').checked; if (sfx.on){ sfx.init(); setTimeout(() => sfx.chips(4), 60); } renderSnd(); };
$('#t-hands').checked = HANDS;
$('#t-hands').onchange = () => {
  HANDS = $('#t-hands').checked; store.set('hands', HANDS ? '1' : '0');
  for (const k of Object.keys(HS)){ HS[k].L.obj = null; HS[k].R.obj = null; }
  if (G) computeLayout();
};
$('#g-seed').onchange = () => { const v = $('#g-seed').value.trim(); if (G && v){ G.clientSeed = v; store.set('seed', v); logLine(`Client seed set to ${v} from the next hand.`, 'st'); } };
$('#g-reseed').onclick = () => { $('#g-seed').value = newClientSeed(); $('#g-seed').onchange(); };
$('#hist').onclick = e => { const b = e.target.closest('button'); if (b) openVerify(G.history[+b.dataset.i]); };
$('#openTool').onclick = () => openVerify(null);
$('#vRun').onclick = runVerify;
$('#mClose').onclick = () => { $('#modal').hidden = true; };
$('#modal').onclick = e => { if (e.target.id === 'modal') $('#modal').hidden = true; };

cv.addEventListener('pointerup', e => {
  const h = H, p = G && me();
  if (!h || !p || h.done || p.folded || p.hole.length !== 2 || (h.heroFlip || 0) < 1 || (h.youFold || 0) > 0) return;
  const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  const { w, pts } = youCardPts();
  const x0 = pts[0].x - w*.7, x1 = pts[1].x + w*.9, y0 = Math.min(pts[0].y, pts[1].y) - w*.8, y1 = Math.max(pts[0].y, pts[1].y) + w*.9;
  if (x < x0 || x > x1 || y < y0 || y > y1) return;
  h.tuckTouched = true; sfx.card(); setTuck(h, !h.tucked);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ if (!$('#modal').hidden){ $('#modal').hidden = true; return; } closeDrawer(); if (raiseOpen){ raiseOpen = false; dockKey = ''; renderDock(); } return; }
  if (!G || !H || e.metaKey || e.ctrlKey || e.altKey) return;
  const ae = document.activeElement;
  if (/INPUT|SELECT|TEXTAREA/.test(ae.tagName) && ae.type !== 'range' && ae.type !== 'checkbox'){
    if (e.key === 'Enter' && ae.id === 'rAmt'){ ae.onchange && ae.onchange(); $('#aRaise').click(); }
    return;
  }
  if (e.key === ' ' && !e.repeat && H && !H.done && (H.heroFlip || 0) >= 1){ e.preventDefault(); H.tuckTouched = true; setTuck(H, !H.tucked); return; }
  const map = { f:'#aFold', c:'#aCall', r:'#aRaise', a:'#aAll', n:'#nextHand' };
  const sel = map[e.key.toLowerCase()]; if (!sel) return;
  const b = $(sel); if (b && !b.disabled){ e.preventDefault(); b.click(); }
});

let wakeLock = null;
function keepAwake(){
  try { if (navigator.wakeLock && document.visibilityState === 'visible') navigator.wakeLock.request('screen').then(l => { wakeLock = l; }).catch(() => {}); } catch(e){}
}
document.addEventListener('visibilitychange', () => { if (G && document.visibilityState === 'visible'){ keepAwake(); sfx.init(); } });
['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => sfx.init(), { passive:true, capture:true }));
let fitRaf = 0;
new ResizeObserver(() => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fit); }).observe($('#scene'));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { cardCache.clear(); staticDirty = true; });
updateBB();
renderTop();
requestAnimationFrame(frame);
})();
</script>
