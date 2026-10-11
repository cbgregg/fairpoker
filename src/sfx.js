/* ---------- sound (synthesized, no files) ---------- */
const sfx = (() => {
  let ac = null, master = null, on = store.get('sound') !== '0', noiseBuf = null;
  let unlockEl = null;
  function init(){
    // iPhone: let web audio play with the ring/silent switch on silent
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch(e){}
    if (!unlockEl){
      try {
        // a silent looping <audio> moves iOS into the "playback" audio session (older iOS without audioSession)
        unlockEl = document.createElement('audio');
        unlockEl.setAttribute('playsinline', ''); unlockEl.loop = true; unlockEl.volume = 0.01;
        unlockEl.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
        unlockEl.play().catch(() => {});
      } catch(e){}
    }
    if (ac){ if (ac.state !== 'running') ac.resume().catch(() => {}); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = .7;
      const tame = ac.createBiquadFilter(); tame.type = 'lowpass'; tame.frequency.value = 7500; tame.Q.value = .5;
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = .003; comp.release.value = .15;
      master.connect(tame); tame.connect(comp); comp.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * .5, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1;
      // play one silent sample inside the gesture so Safari unlocks output
      const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0);
      if (ac.state !== 'running') ac.resume().catch(() => {});
    } catch(e){ ac = null; }
  }
  // iOS can leave web audio 'interrupted' after a call, Siri or device speech: wake it on the next sound or touch
  const ok = () => {
    if (!on || !ac || (typeof TH !== 'undefined' && TH && TH.key === 'cli')) return false;
    if (ac.state !== 'running'){ ac.resume().catch(() => {}); return false; }
    return true;
  };
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, () => { if (on && ac && ac.state !== 'running') ac.resume().catch(() => {}); }, { passive:true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && on && ac && ac.state !== 'running') ac.resume().catch(() => {}); });
  // filtered noise burst: plain high/low-pass shaping, no resonant peaks, no pitch sweeps
  function hiss(t, dur, { hp = 200, lp = 6000, vol = .3, attack = .002 } = {}){
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const h = ac.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = hp; h.Q.value = .5;
    const l = ac.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = lp; l.Q.value = .5;
    const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(h); h.connect(l); l.connect(g); g.connect(master);
    src.start(t, Math.random()*.4, dur + .03);
  }
  function noise(t, dur, f, q, vol, type = 'bandpass'){ hiss(t, dur, type === 'lowpass' ? { hp:40, lp:f, vol } : type === 'highpass' ? { hp:f, lp:7000, vol } : { hp:f*.6, lp:f*1.6, vol }); }
  function tone(t, f, dur, vol, type = 'sine', f2){
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
  }
  const saloon = () => TH.key === 'saloon';
  const chip = () => TH.key === 'atari';
  const vp = () => TH.key === 'vpoker';
  const bell = (t, f, vol = .07) => { tone(t, f, .22, vol, 'sine'); tone(t, f*2.01, .14, vol*.4, 'sine'); };
  const blip = (t, f, dur, vol, f2) => tone(t, f, dur, vol, 'square', f2);
  return {
    init, get on(){ return on; }, set on(v){ on = v; store.set('sound', v ? '1' : '0'); if (v) init(); }, get live(){ return ok(); }, get ctx(){ return ac; }, get out(){ return master; },
    // a card skimming the felt: soft papery swish with a tiny landing tap
    card(){ if (!ok()) return; const t = ac.currentTime; if (vp()){ tone(t, 1250, .05, .06, 'square'); tone(t + .05, 1650, .04, .04, 'square'); return; } if (chip()){ blip(t, 880, .05, .05, 440); return; }
      hiss(t, .07, { hp:900, lp:4200, vol:.16, attack:.012 }); hiss(t + .06, .03, { hp:120, lp:900, vol:.12 }); },
    // turning a card over: short air flick
    flip(){ if (!ok()) return; const t = ac.currentTime; if (vp()){ tone(t, 1900, .05, .05, 'square'); return; } if (chip()){ blip(t, 660, .04, .05); blip(t + .04, 990, .05, .05); return; } hiss(t, .05, { hp:700, lp:3500, vol:.14, attack:.008 }); hiss(t + .045, .025, { hp:150, lp:1200, vol:.1 }); },
    // clay chips: dull clacks with a little body, no ringing
    chips(n = 3){ if (!ok()) return; const t = ac.currentTime, k = clamp(n, 1, 7); if (vp()){ for (let i = 0; i < k; i++) bell(t + i*.06, 1568 + (i % 2)*523, .05); return; } if (chip()){ for (let i = 0; i < k; i++) blip(t + i*.045, 1320 + (i % 2)*220, .03, .04); return; }
      for (let i = 0; i < k; i++){
        const tt = t + i*(.035 + Math.random()*.03);
        hiss(tt, .028, { hp:1400, lp:5200, vol:.22 + Math.random()*.08 });
        hiss(tt, .05, { hp:350, lp:1600, vol:.12 });
      } },
    // knuckles on padded wood
    knock(){ if (!ok()) return; const t = ac.currentTime; if (vp()){ tone(t, 600, .05, .07, 'square'); return; } if (chip()){ blip(t, 120, .06, .08, 60); return; } tone(t, saloon() ? 120 : 140, .09, .38, 'sine', 80); hiss(t, .04, { hp:60, lp:700, vol:.25 }); },
    turn(){ if (!ok()) return; const t = ac.currentTime; tone(t, 660, .35, .06, 'sine'); tone(t + .1, 990, .45, .05, 'sine'); },
    win(big){ if (!ok()) return; const t = ac.currentTime; if (vp()){ const n = big ? 22 : 12; for (let i = 0; i < n; i++) bell(t + i*.075, i % 2 ? 2093 : 1568, .06); return; } if (chip()){ [523, 659, 784, 1047, 784, 1047].forEach((f, i) => blip(t + i*.07, f, .09, big ? .07 : .05)); return; }
      const notes = saloon() ? [392, 494, 587, 784] : [523, 659, 784, 1047];
      notes.forEach((f, i) => { tone(t + i*.09, f, .6, big ? .12 : .08, 'triangle'); }); },
    // riffle shuffle: a fast run of soft paper ticks
    riffle(){ if (!ok()) return; const t = ac.currentTime; if (vp()){ [523, 659, 784, 1047].forEach((f2, i) => tone(t + i*.07, f2, .09, .05, 'square')); return; } if (chip()){ for (let i = 0; i < 12; i++) blip(t + i*.035, 400 + i*60, .02, .03); return; } for (let i = 0; i < 26; i++) hiss(t + i*.02 + Math.random()*.005, .018, { hp:1200, lp:5000, vol:.07 + Math.sin(i/26*Math.PI)*.06 }); },
    // chips pushed across felt: low, breathy
    slide(){ if (!ok()) return; const t = ac.currentTime; if (vp()){ for (let i = 0; i < 4; i++) bell(t + i*.05, 1760, .04); return; } if (chip()){ blip(t, 300, .2, .04, 150); return; } hiss(t, .32, { hp:150, lp:900, vol:.1, attack:.06 }); },
    lose(){ if (!ok()) return; const t = ac.currentTime; tone(t, 330, .3, .08, 'sine', 220); },
    boom(){ if (!ok()) return; const t = ac.currentTime; tone(t, 70, 1.1, .5, 'sine', 38); hiss(t, .5, { hp:30, lp:220, vol:.3, attack:.01 }); },
    drumroll(dur = .9){ if (!ok()) return; const t = ac.currentTime, n = Math.round(dur/.032);
      for (let i = 0; i < n; i++){ const e = i/n; hiss(t + i*.032 + Math.random()*.004, .06, { hp:70, lp:420, vol:.08 + e*.22 }); } },
    sting(lvl = 1){ if (!ok()) return; const t = ac.currentTime;
      tone(t, 55, .9, .4, 'sine', 40); hiss(t, .2, { hp:60, lp:500, vol:.2 });
      const base = saloon() ? [196, 247, 294] : [262, 330, 392];
      base.forEach((f, i) => tone(t + .02*i, f*(lvl > 1 ? 1.5 : 1), 1, .05 + lvl*.025, 'triangle')); },
    heart(){ if (!ok()) return; const t = ac.currentTime; tone(t, 60, .16, .45, 'sine', 40); tone(t + .2, 55, .2, .35, 'sine', 38); }
  };
})();

