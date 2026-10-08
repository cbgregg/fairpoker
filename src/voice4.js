/* =====================================================================
   NEURAL VOICES — Kokoro-82M (Apache 2.0), an open-source text-to-speech model
   that runs entirely on your device in a background worker. One-time download of
   about 90 MB (cached by the browser), then it works offline.
   ===================================================================== */
const KOKORO_URL = window.KOKORO_URL || 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js';
// who sounds like whom: Kokoro's best-rated American and British voices
const NEURAL_VOICE = { D:'bm_george', Hank:'am_onyx', Mack:'am_echo', Rocco:'bm_daniel', Silas:'am_michael', Cyrus:'am_fenrir', Wyatt:'am_puck', Eli:'bm_fable', Jeb:'bm_lewis' };
const NEURAL_FALLBACK = ['am_michael', 'am_eric', 'am_liam', 'am_adam', 'bm_george', 'am_fenrir'];
// emotion → speaking speed (Kokoro's only expressive control)
const NEURAL_SPEED = { neutral:1, calm:.94, friendly:1.03, cocky:.93, excited:1.14, shout:1.12, angry:1.1, sad:.86, unfriendly:.97, whisper:.9 };
const NN = { state:'idle', pct:0, err:'', worker:null, seq:0, pending:new Map(), cache:new Map(), queue:[], busy:false };
const neuralVoiceOf = k => {
  if (k === 'D') return NEURAL_VOICE.D;
  const n = G && G.players[k] ? G.players[k].name : '';
  return NEURAL_VOICE[n] || NEURAL_FALLBACK[(G && G.players[k] ? G.players[k].id : 0) % NEURAL_FALLBACK.length];
};
function neuralStatus(){
  const h = $('#vpackHint'); if (!h || VOICE_PACK !== 'neural') return;
  h.textContent = NN.state === 'ready' ? 'Neural voices ready. Running on this device.'
    : NN.state === 'loading' ? `Downloading neural voices… ${NN.pct}% (one time, about 90 MB)`
    : NN.state === 'error' ? `Neural voices could not start here (${NN.err}). Using Retro until they can.`
    : VPACK_HINT.neural;
}
function neuralInit(){
  if (NN.state === 'loading' || NN.state === 'ready') return;
  NN.state = 'loading'; NN.pct = 0; neuralStatus();
  const src = `
    import { KokoroTTS } from '${KOKORO_URL}';
    let tts = null;
    const files = {};
    self.onmessage = async e => {
      const m = e.data;
      if (m.type === 'init'){
        try {
          tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype:'q8', device:'wasm',
            progress_callback: p => { if (p && p.file && p.total){ files[p.file] = [p.loaded || 0, p.total]; let a = 0, b = 0; for (const k in files){ a += files[k][0]; b += files[k][1]; } self.postMessage({ type:'progress', pct:Math.round(a/b*100) }); } } });
          self.postMessage({ type:'ready' });
        } catch(err){ self.postMessage({ type:'error', err:String(err && err.message || err).slice(0, 120) }); }
        return;
      }
      if (m.type === 'say'){
        try {
          const out = await tts.generate(m.text, { voice:m.voice, speed:m.speed });
          const a = out.audio instanceof Float32Array ? out.audio : new Float32Array(out.audio);
          self.postMessage({ type:'audio', id:m.id, audio:a, rate:out.sampling_rate || 24000 }, [a.buffer]);
        } catch(err){ self.postMessage({ type:'audio', id:m.id, err:String(err && err.message || err) }); }
      }
    };`;
  let w;
  try { w = new Worker(URL.createObjectURL(new Blob([src], { type:'text/javascript' })), { type:'module' }); }
  catch(e){ NN.state = 'error'; NN.err = 'workers blocked'; neuralStatus(); return; }
  NN.worker = w;
  w.onerror = e => { NN.state = 'error'; NN.err = (e && e.message) || 'worker failed'; neuralStatus(); };
  w.onmessage = e => {
    const m = e.data;
    if (m.type === 'progress'){ NN.pct = m.pct; neuralStatus(); }
    else if (m.type === 'ready'){ NN.state = 'ready'; neuralStatus(); neuralWarm(); neuralPump(); }
    else if (m.type === 'error'){ NN.state = 'error'; NN.err = m.err; neuralStatus(); }
    else if (m.type === 'audio'){
      const job = NN.pending.get(m.id); NN.pending.delete(m.id); NN.busy = false;
      if (job && m.audio && sfx.ctx){
        const buf = sfx.ctx.createBuffer(1, m.audio.length, m.rate); buf.getChannelData(0).set(m.audio);
        buf._wave = m.audio; buf._rate = m.rate;
        NN.cache.set(job.key, buf); if (NN.cache.size > 260) NN.cache.delete(NN.cache.keys().next().value);
      }
      neuralPump();
    }
  };
  w.postMessage({ type:'init' });
}
// one line at a time through the model; whatever is about to be spoken goes first
function neuralRequest(voice, text, speed, urgent){
  const key = voice + '|' + speed.toFixed(2) + '|' + text;
  if (NN.cache.has(key) || NN.queue.some(q => q.key === key) || [...NN.pending.values()].some(q => q.key === key)) return key;
  const job = { key, voice, text, speed };
  if (urgent) NN.queue.unshift(job); else NN.queue.push(job);
  if (NN.queue.length > 40) NN.queue.length = 40;
  neuralPump();
  return key;
}
function neuralPump(){
  if (NN.state !== 'ready' || NN.busy || !NN.queue.length) return;
  const job = NN.queue.shift(), id = ++NN.seq;
  NN.pending.set(id, job); NN.busy = true;
  NN.worker.postMessage({ type:'say', id, text:job.text, voice:job.voice, speed:job.speed });
}
// the plain action words are rendered for everyone up front, so a voice never has to wait to say "Call."
function neuralWarm(){
  if (!G) return;
  const who = ['D', ...G.players.map((p, i) => i).filter(i => i)];
  for (const k of who){
    const v = neuralVoiceOf(k), sets = k === 'D' ? ['flop', 'turn', 'river', 'showdown', 'split'] : ['check', 'call', 'bet', 'raise', 'allin', 'fold'];
    sets.forEach(s => neuralRequest(v, BASIC[s][0], NEURAL_SPEED[CAT_EMO[s]] || 1, false));
  }
}
const neuralKey = it => { const v = neuralVoiceOf(it.k), sp = (NEURAL_SPEED[it.emo] || 1)*(paceF() < .8 ? 1.12 : 1); return { v, sp, key:v + '|' + sp.toFixed(2) + '|' + it.text }; };
function neuralPrefetch(it){ if (NN.state === 'ready'){ const n = neuralKey(it); neuralRequest(n.v, it.text, n.sp, true); } }
function neuralReady(it){ return NN.state !== 'ready' || NN.cache.has(neuralKey(it).key); }
function neuralSpeak(it){
  const ac = sfx.ctx, out = sfx.out;
  if (NN.state !== 'ready' || !ac || !out || ac.state !== 'running' || !sfx.on) return null;
  const n = neuralKey(it);
  let buf = NN.cache.get(n.key);
  if (!buf && it.set && BASIC[it.set]){                     // the full line isn't ready: say the plain word in the same voice
    const b = BASIC[it.set][0], sp = NEURAL_SPEED[CAT_EMO[it.set]] || 1;
    buf = NN.cache.get(n.v + '|' + sp.toFixed(2) + '|' + b);
    if (buf) it.text = b;
  }
  if (!buf) return null;
  const src = ac.createBufferSource(), gn = ac.createGain();
  src.buffer = buf; gn.gain.value = it.emo === 'whisper' ? .6 : it.emo === 'shout' ? 1 : .85;
  src.connect(gn); gn.connect(out); src.start();
  curSrc = src; curPrio = it.prio;
  return { dur:buf.duration*1000, wave:buf._wave, rate:buf._rate };
}
