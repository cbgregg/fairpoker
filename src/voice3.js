/* =====================================================================
   VOICE PACKS
   retro  : SAM (1982) robot voices, built in
   modern : the device's own text-to-speech voices (Edge "Natural" voices in Edge,
            Siri-style voices on iPhone and Mac), with emotion via pitch, speed and volume
   studio : pre-recorded Azure neural voices with real acted emotion (voices/index.json)
   ===================================================================== */
// defaults changed (first person, Regular table, Modern voices): apply them once to returning players too
if (store.get('prefsv') !== '4'){
  ['view_regular', 'view_saloon', 'view_atari', 'skin', 'vpack'].forEach(k => { try { localStorage.removeItem('fp_' + k); } catch(e){} });
  store.set('prefsv', '4');
}
let VOICE_PACK = store.get('vpack') || 'neural';
// every line category carries an emotion; Modern turns it into prosody, Studio recorded it acted
const CAT_EMO = {
  check:'calm', call:'neutral', bet:'cocky', raise:'cocky', allin:'shout', fold:'sad', thinking:'whisper',
  tough:'unfriendly', toughAt:'unfriendly', retort:'angry', comWin:'excited', comLose:'angry', loseTo:'angry',
  gloat:'cocky', bust:'sad', praise:'friendly', salty:'unfriendly', nudge:'unfriendly', atYouBet:'unfriendly',
  atYouAllin:'excited', atYouFold:'cocky', needle:'excited', quitWhining:'unfriendly', chatter:'friendly',
  saloon:'friendly', atari:'friendly',
  shuffle:'neutral', dealt:'neutral', flop:'neutral', turn:'neutral', river:'neutral', showdown:'excited',
  win:'neutral', winHand:'neutral', split:'neutral', allinD:'excited', bigBet:'excited', yourTurn:'neutral',
  youWin:'friendly', dealerChat:'calm', chide:'unfriendly'
};
function emoOf(set, text){
  if (CAT_EMO[set]) return CAT_EMO[set];
  if (/!/.test(text)) return 'excited';
  if (BAD.test(text)) return 'angry';
  return 'friendly';
}
// prosody per emotion: rate, pitch, volume (Web Speech ranges: rate .1–10, pitch 0–2, volume 0–1)
const EMO_PROS = {
  neutral:[1, 1, .9], calm:[.94, .96, .82], friendly:[1.03, 1.05, .9], cocky:[.9, 1.06, .95], excited:[1.16, 1.15, 1],
  shout:[1.12, 1.2, 1], angry:[1.1, .88, 1], sad:[.86, .86, .72], unfriendly:[.97, .9, .95], whisper:[.9, .95, .62]
};
const FEMALE_NAMES = new Set();          // everyone at this table is a man
const FEMALE_VOICE = /samantha|ava|allison|susan|victoria|karen|moira|tessa|zira|aria|jenny|sara|nancy|jane|michelle|emma|libby|sonia|natasha|serena|fiona|zoe|nicky|joelle|ana|clara|jessa|ashley|amber|cora|elizabeth|monica|kate|stephanie|female|siri.*(voice 1|voice 2)/i;
const MALE_VOICE = /alex|daniel|fred|tom\b|aaron|arthur|gordon|rishi|guy|davis|tony|jason|christopher|eric|roger|ryan|thomas|andrew|brian|steffan|oliver|evan|nathan|reed|rocko|ralph|albert|bruce|junior|william|liam|brandon|jacob|male|siri.*(voice 3|voice 4)/i;

/* ---------- Modern: device voices ---------- */
let MV_LIST = [], MV_PICK = {}; const MV_KEEP = [];
function mvRefresh(){
  if (!('speechSynthesis' in window)) return;
  const score = v => (/natural|neural|premium|enhanced|online/i.test(v.name) ? 6 : 0) + (/en[-_]US/i.test(v.lang) ? 2 : /en[-_](GB|AU|IE|CA)/i.test(v.lang) ? 1 : 0) + (v.localService === false ? 1 : 0)
    - (/novelty|bad news|bells|boing|bubbles|cellos|whisper|zarvox|trinoids|organ|hysterical|jester|superstar|wobble|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley|albert|bahh/i.test(v.name) ? 20 : 0);
  MV_LIST = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)).sort((a, b) => score(b) - score(a));
  MV_PICK = {};
}
if ('speechSynthesis' in window){ mvRefresh(); speechSynthesis.onvoiceschanged = mvRefresh; }
// each speaker keeps one voice for the session; women get women's voices where the device has them
function mvFor(k){
  const who = k === 'D' ? 'D' : (G.players[k] ? G.players[k].name : '?');
  if (MV_PICK[who] !== undefined) return MV_PICK[who];
  if (!MV_LIST.length) mvRefresh();
  const fem = who !== 'D' && FEMALE_NAMES.has(who);
  const taken = new Set(Object.values(MV_PICK).filter(Boolean).map(v => v.voiceURI));
  const fits = v => fem ? FEMALE_VOICE.test(v.name) || !MALE_VOICE.test(v.name) : MALE_VOICE.test(v.name) || !FEMALE_VOICE.test(v.name);
  const v = MV_LIST.find(v => fits(v) && !taken.has(v.voiceURI)) || MV_LIST.find(fits) || MV_LIST[0] || null;
  // two players on the same voice still sound different: a per-player pitch offset
  const seed = [...who].reduce((a, c) => a + c.charCodeAt(0), 0);
  if (!v) return null;                      // voices not loaded yet: ask again next line
  MV_PICK[who] = v ? { voice:v, voiceURI:v.voiceURI, pitch:who === 'D' ? .92 : .9 + (seed % 7)*.035, rate:1 + ((seed >> 2) % 5 - 2)*.03 } : null;
  return MV_PICK[who];
}
function modernSpeak(it){
  if (!('speechSynthesis' in window) || !sfx.on) return null;
  const pick_ = mvFor(it.k); if (!pick_) return null;
  const [r, p, v] = EMO_PROS[it.emo] || EMO_PROS.neutral, quick = paceF() < .8 ? 1.18 : 1;
  const u = new SpeechSynthesisUtterance(it.text);
  u.voice = pick_.voice; u.lang = pick_.voice.lang;
  u.rate = clamp(r*pick_.rate*quick, .5, 2); u.pitch = clamp(p*pick_.pitch, .1, 2); u.volume = clamp(v*.95, 0, 1);
  const k = it.k, text = it.text;
  const est = (380 + text.length*62)/u.rate;
  u.onend = u.onerror = () => {
    if (sfx.ctx && sfx.ctx.state !== 'running') sfx.ctx.resume().catch(() => {});     // iOS pauses web audio while device speech talks
    const t = performance.now(), s = talking[k];
    if (s && s.text === text){ s.end = t; s.until = t + 700; }
    if (lastK === k) lastEnd = Math.min(lastEnd, t);
  };
  u.onstart = () => {           // the clock starts when the voice actually starts
    const t = performance.now(), s = talking[k];
    if (s && s.text === text){ s.t0 = t; s.end = t + est*1.6; s.until = s.end + 900; }
    if (lastK === k) lastEnd = Math.max(lastEnd, t + est);
  };
  MV_KEEP.push(u); if (MV_KEEP.length > 8) MV_KEEP.shift();      // iOS drops events of utterances it garbage-collects
  if (speechSynthesis.paused) speechSynthesis.resume();
  speechSynthesis.speak(u);
  curSrc = { stop(){ try { speechSynthesis.cancel(); } catch(e){} } };
  return { dur:est, wave:null };
}
// iOS only lets a page speak after a tap: prime the engine on the first touch
let mvPrimed = false;
['pointerdown', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, () => {
  if (mvPrimed || !('speechSynthesis' in window) || VOICE_PACK !== 'modern') return;     // touching device speech on iOS can silence web audio
  mvPrimed = true;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance('.'); u.volume = .01; u.rate = 2; speechSynthesis.speak(u); mvRefresh(); } catch(e){}
}, { passive:true }));

/* ---------- Studio: pre-recorded clips ---------- */
const HCAT = ['high card', 'a pair', 'two pair', 'three of a kind', 'a straight', 'a flush', 'a full house', 'four of a kind', 'a straight flush', 'a royal flush'];
let STUDIO = null, studioTried = false;
const studioBufs = new Map(), studioLoading = new Map();
async function studioLoad(){
  if (studioTried) return STUDIO; studioTried = true;
  try {
    const r = await fetch('voices/index.json', { cache:'force-cache' });
    if (!r.ok) throw new Error(r.status);
    STUDIO = await r.json();
  } catch(e){ STUDIO = false; }
  const b = $('#seg-vpack button[data-v=studio]');
  if (b){ b.disabled = !STUDIO; b.title = STUDIO ? '' : 'Studio voices are not installed in this copy of the game'; }
  if (!STUDIO && VOICE_PACK === 'studio') setVoicePack('modern');
  return STUDIO;
}
const studioVoiceOf = k => STUDIO && STUDIO.voices[k === 'D' ? 'D' : (G.players[k] ? G.players[k].name : '')];
// the recorded pieces a line is made of: fixed text between the names, and each name on its own
function studioKeys(it){
  const V = studioVoiceOf(it.k); if (!V) return null;
  const tpl = it.tpl ? it.tpl.t : it.text, vars = (it.tpl && it.tpl.v) || {};
  const out = [];
  for (const part of tpl.split(/(\{[a-z]\})/)){
    if (!part) continue;
    let key = part;
    if (/^\{[a-z]\}$/.test(part)){
      const c = part[1];
      key = c === 'y' ? nick(it.k) : c === 'h' ? (vars.hc || '') : (vars[c] || '');
    }
    key = key.trim();
    if (!key || /^[.,!?\s]+$/.test(key)) continue;
    if (!V.clips[key]) return null;
    out.push(V.clips[key]);
  }
  return out.length ? { V, clips:out } : null;
}
function studioChunk(V, ci){
  const url = 'voices/' + V.chunks[ci];
  if (studioBufs.has(url)) return studioBufs.get(url);
  if (!studioLoading.has(url) && sfx.ctx){
    studioLoading.set(url, fetch(url).then(r => r.arrayBuffer()).then(a => new Promise((res, rej) => sfx.ctx.decodeAudioData(a, res, rej)))
      .then(buf => { studioBufs.set(url, buf); if (studioBufs.size > 12) studioBufs.delete(studioBufs.keys().next().value); })
      .catch(e => { window.__vdbg && window.__vdbg('loadfail', url, e && e.message); }).finally(() => studioLoading.delete(url)));
  }
  return null;
}
// a line waits briefly for its recording to finish loading before falling back to the Modern voice
function studioReady(it){
  if (!STUDIO || !sfx.ctx) return true;
  const s = studioKeys(it); if (!s) return true;
  return s.clips.every(c => studioChunk(s.V, c[0]));
}
function studioPrefetch(it){ const s = studioKeys(it); if (s) s.clips.forEach(c => studioChunk(s.V, c[0])); }
function studioSpeak(it){
  const ac = sfx.ctx, out = sfx.out, dbg = window.__vdbg;
  if (!STUDIO || !ac || !out || ac.state !== 'running' || !sfx.on){ dbg && dbg('off', !!STUDIO, ac && ac.state, sfx.on); return null; }
  const s = studioKeys(it); if (!s){ dbg && dbg('nokeys', it.text, it.tpl && it.tpl.t); return null; }
  const bufs = s.clips.map(c => studioChunk(s.V, c[0]));
  if (bufs.some(b => !b)){ dbg && dbg('notready', it.text); return null; }                 // not loaded yet: this line goes to the Modern voice
  const quick = paceF() < .8 ? 1.12 : 1, nodes = [];
  let t = ac.currentTime + .02, total = 0;
  s.clips.forEach((c, i) => {
    const src = ac.createBufferSource(), gn = ac.createGain();
    src.buffer = bufs[i]; src.playbackRate.value = quick; gn.gain.value = .95;
    src.connect(gn); gn.connect(out);
    const d = c[2]/1000;
    src.start(t, c[1]/1000, d);
    nodes.push(src);
    t += d/quick + .03; total += d/quick + .03;
  });
  curSrc = { stop(){ nodes.forEach(n => { try { n.stop(); } catch(e){} }); } };
  return { dur:total*1000, wave:null };
}
// the line pool a Studio voice can actually say (it recorded a share of each category)
function studioPool(k, set, pool){
  const V = studioVoiceOf(k);
  if (!V || !V.templates || !V.templates[set]) return pool;
  const have = new Set(V.templates[set]);
  const p = pool.filter(t => have.has(t));
  return p.length ? p : pool;
}
function setVoicePack(v){
  VOICE_PACK = v; store.set('vpack', v);
  try { speechSynthesis.cancel(); } catch(e){}
  setSeg('#seg-vpack', v);
  const h = $('#vpackHint'); if (h) h.textContent = VPACK_HINT[v];
  if (v === 'studio') studioLoad();
  if (v === 'neural') neuralInit();
  neuralStatus();
}
const VPACK_HINT = {
  retro:'1982 robot voices. Works everywhere.',
  neural:'Open-source neural voices (Kokoro) running on this device. One-time download of about 90 MB, then offline.',
  modern:'Your device\'s own voices. In Edge you get Microsoft\'s Natural voices, on iPhone and Mac the Siri-style ones. Emotion comes from pitch, speed and volume.',
  studio:'Pre-recorded neural voices with real acted emotion. Lines that were not recorded use the Modern voice.'
};
