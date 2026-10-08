// builds manifest.json: everything each Studio voice must record, with its emotion
global.store={get:()=>null,set(){}}; global.clamp=(v,a,b)=>Math.max(a,Math.min(b,v)); global.G=null; global.H=null;
global.document={addEventListener(){}}; global.$=()=>null; global.window={}; global.setInterval=()=>0;
const fs=require('fs'), P='/tmp/claude-0/parts/';
const NAMES = ['Hank','Mack','Rocco','Silas','Cyrus','Wyatt','Eli','Jeb'];
const src = ['voice.js','voice2.js','voice3.js','voice4.js','voice5.js'].map(f=>fs.readFileSync(P+f,'utf8')).join('\n');
eval(src + `
const DEALER_SETS = new Set(['shuffle','dealt','flop','turn','river','showdown','win','winHand','split','allinD','bigBet','yourTurn','youWin','dealerChat','chide']);
let seed = 7;
const rnd = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000)/100000; }; };
const shuffle = (arr, key) => { const r = rnd(key), a = arr.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(r()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const V = {}; const add = (who, text, emo) => { text = text.trim(); if (!text || /^[.,!?\\s]+$/.test(text)) return; V[who].clips[text] = V[who].clips[text] || emo; };
const frag = (who, tpl, emo) => tpl.split(/(\\{[a-z]\\})/).forEach(p => { if (!/^\\{[a-z]\\}$/.test(p)) add(who, p, emo); });
['D', ...${JSON.stringify(NAMES)}].forEach(w => V[w] = { clips:{}, templates:{} });
const NAMES_ = ${JSON.stringify(NAMES)};
for (const [set, lines] of Object.entries(LINES)){
  const emo = CAT_EMO[set] || 'friendly';
  if (DEALER_SETS.has(set)){
    V.D.templates[set] = lines.slice();
    lines.forEach(t => frag('D', t, emo));
  } else {
    for (const w of NAMES_){
      const pick = lines.length <= 10 ? lines.slice() : shuffle(lines, w + set).slice(0, Math.max(10, Math.ceil(lines.length*.7)));
      V[w].templates[set] = pick;
      pick.forEach(t => frag(w, t, emo));
    }
  }
}
// names that get dropped into lines
for (const w of NAMES_){ NAMES_.forEach(n => add(w, n, 'neutral')); NICKS.concat(NICKS_SALOON).forEach(n => add(w, n, 'neutral')); }
NAMES_.forEach(n => add('D', n, 'neutral')); add('D', 'friend', 'neutral'); HCAT.forEach(h => add('D', h, 'neutral'));
// basic mode and system lines
for (const [set, [t]] of Object.entries(BASIC)){
  if (DEALER_SETS.has(set)) frag('D', t, CAT_EMO[set] || 'neutral');
  else NAMES_.forEach(w => frag(w, t, CAT_EMO[set] || 'neutral'));
}
['Voices on.', 'Basic.', 'Chatty table.', 'Retro voices.', 'Modern voices. How do I sound?', 'Studio voices. Much better.'].forEach(t => add('D', t, 'friendly'));
// scenes: each one gets a fixed cast so only those voices record it
const casts = {};
const scenes = CONVOS.concat(...Object.values(CONVOS_THEME));
scenes.forEach((sc, i) => {
  const roles = [...new Set(sc.map(([r]) => r).filter(r => r !== 'D'))];
  const who = shuffle(NAMES_, 'scene' + i + sc[0][1]);
  const cast = {}; roles.forEach((r, j) => cast[r] = who[j]);
  casts[sc[0][1]] = cast;
  sc.forEach(([r, t]) => frag(r === 'D' ? 'D' : cast[r], t, emoOf('convo', t)));
});
let chars = 0, n = 0;
for (const w of Object.keys(V)){ for (const t of Object.keys(V[w].clips)){ chars += t.length; n++; } }
fs.writeFileSync('/tmp/claude-0/studio/manifest.json', JSON.stringify({ version:1, voices:V, casts }, null, 0));
console.log('clips', n, 'chars', chars);
for (const w of Object.keys(V)) console.log(w, Object.keys(V[w].clips).length);
`);
