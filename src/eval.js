/* ---------- cards & evaluation ---------- */
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const RCH = '23456789TJQKA';
const RN = ['Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Jack','Queen','King','Ace'];
const RP = ['Twos','Threes','Fours','Fives','Sixes','Sevens','Eights','Nines','Tens','Jacks','Queens','Kings','Aces'];
const SUITS = ['♠','♥','♦','♣'];
const cardTxt = c => RCH[c>>2] + 'shdc'[c&3];
const cardShort = c => RANKS[c>>2] + SUITS[c&3];
function straightHigh(m){
  const x = (m << 1) | ((m >> 12) & 1);
  for (let hi = 13; hi >= 4; hi--) if (((x >> (hi-4)) & 31) === 31) return hi - 1;
  return -1;
}
function mk(cat, vals){ let s = cat; for (let i = 0; i < 5; i++) s = s*14 + ((vals[i] ?? -1) + 1); return { score:s, cat, vals }; }
function evaluate(cards){
  const cnt = new Array(13).fill(0), sm = [0,0,0,0], sc = [0,0,0,0];
  let mask = 0;
  for (const c of cards){ const r = c>>2, s = c&3; cnt[r]++; sm[s] |= 1<<r; sc[s]++; mask |= 1<<r; }
  let fs = -1; for (let s = 0; s < 4; s++) if (sc[s] >= 5) fs = s;
  if (fs >= 0){ const st = straightHigh(sm[fs]); if (st >= 0) return mk(8,[st]); }
  const quads=[], trips=[], pairs=[], singles=[];
  for (let r = 12; r >= 0; r--){
    if (cnt[r]===4) quads.push(r); else if (cnt[r]===3) trips.push(r);
    else if (cnt[r]===2) pairs.push(r); else if (cnt[r]===1) singles.push(r);
  }
  const kick = (n, ex) => { const k=[]; for (let r=12; r>=0 && k.length<n; r--) if (cnt[r] && !ex.includes(r)) k.push(r); return k; };
  if (quads.length) return mk(7,[quads[0], ...kick(1,[quads[0]])]);
  if (trips.length && (trips.length>1 || pairs.length)) return mk(6,[trips[0], Math.max(trips[1] ?? -1, pairs[0] ?? -1)]);
  if (fs >= 0){ const v=[]; for (let r=12; r>=0 && v.length<5; r--) if ((sm[fs]>>r)&1) v.push(r); return mk(5,v); }
  const st = straightHigh(mask); if (st >= 0) return mk(4,[st]);
  if (trips.length) return mk(3,[trips[0], ...kick(2,[trips[0]])]);
  if (pairs.length >= 2) return mk(2,[pairs[0], pairs[1], ...kick(1,[pairs[0],pairs[1]])]);
  if (pairs.length) return mk(1,[pairs[0], ...kick(3,[pairs[0]])]);
  return mk(0, singles.slice(0,5));
}
function handName(h){
  const [a,b] = h.vals;
  switch (h.cat){
    case 8: return a===12 ? 'Royal Flush' : `Straight Flush, ${RN[a]}-high`;
    case 7: return `Four ${RP[a]}`;
    case 6: return `Full House, ${RP[a]} full of ${RP[b]}`;
    case 5: return `Flush, ${RN[a]}-high`;
    case 4: return `Straight, ${RN[a]}-high`;
    case 3: return `Three ${RP[a]}`;
    case 2: return `Two Pair, ${RP[a]} and ${RP[b]}`;
    case 1: return `Pair of ${RP[a]}`;
    default: return `${RN[a]}-high`;
  }
}
const SHORT = ['High card','Pair','Two pair','Trips','Straight','Flush','Full house','Quads','Straight flush'];
function bestUsed(seven, h){
  const straightRanks = top => { const w = []; for (let k = 0; k < 5; k++) w.push(top - k < 0 ? 12 : top - k); return w; };
  if (h.cat === 5 || h.cat === 8){
    const sc = [0,0,0,0]; seven.forEach(c => sc[c&3]++);
    const fs = sc.findIndex(n => n >= 5);
    const want = h.cat === 5 ? h.vals : straightRanks(h.vals[0]);
    return new Set(seven.filter(c => (c&3) === fs && want.includes(c>>2)));
  }
  if (h.cat === 4){
    const want = straightRanks(h.vals[0]), used = new Set(), seen = new Set();
    seven.forEach(c => { const r = c>>2; if (want.includes(r) && !seen.has(r)){ seen.add(r); used.add(c); } });
    return used;
  }
  const n = {7:1,6:2,3:1,2:2,1:1,0:0}[h.cat];
  const ranks = new Set(h.vals.slice(0, n));
  return new Set(seven.filter(c => ranks.has(c>>2)));
}

/* ---------- provably fair shuffle ---------- */
const enc = new TextEncoder();
const toHex = buf => [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2,'0')).join('');
const randomHex = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return toHex(a); };
async function sha256Hex(str){ return toHex(await crypto.subtle.digest('SHA-256', enc.encode(str))); }
async function shuffleDeck(serverSeed, clientSeed, nonce){
  const key = await crypto.subtle.importKey('raw', enc.encode(serverSeed), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const words = [];
  for (let i = 0; words.length < 51; i++){
    const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${clientSeed}:${nonce}:${i}`));
    const dv = new DataView(mac);
    for (let j = 0; j < 8; j++) words.push(dv.getUint32(j*4));
  }
  const deck = [...Array(52).keys()];
  for (let i = 51, w = 0; i > 0; i--, w++){
    const j = Math.floor(words[w] / 4294967296 * (i+1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
const SEED_WORDS = ['river','felt','kicker','gutshot','button','muck','nuts','rail','ante','blind','turn','flop','cooler','check','shove'];
const newClientSeed = () => SEED_WORDS[Math.floor(Math.random()*SEED_WORDS.length)] + '-' + randomHex(4);

/* ---------- COM decision making ---------- */
const STYLES = {
  tight:  { vpip:.36, pfr:.15, loose:-0.02, aggr:0.45, bluff:0.04, label:'tight' },
  loose:  { vpip:.64, pfr:.18, loose: 0.08, aggr:0.40, bluff:0.08, label:'loose' },
  aggro:  { vpip:.52, pfr:.3, loose: 0.04, aggr:0.80, bluff:0.13, label:'aggressive' },
  steady: { vpip:.46, pfr:.2, loose: 0.02, aggr:0.55, bluff:0.06, label:'steady' }
};
const DIFF = {
  relaxed:  { sims:160, noise:0.12, hint:'Simulates 160 run-outs per decision with heavy noise. Makes readable mistakes.' },
  standard: { sims:360, noise:0.05, hint:'Simulates 360 run-outs per decision with light noise.' },
  sharp:    { sims:700, noise:0.015, hint:'Simulates 700 run-outs per decision with almost no noise.' }
};
// Preflop strength: Chen score ranked over all 1326 starting combos → percentile (0 = best).
function chen(a, b){
  const hi = Math.max(a>>2, b>>2) + 2, lo = Math.min(a>>2, b>>2) + 2;
  const base = v => v === 14 ? 10 : v === 13 ? 8 : v === 12 ? 7 : v === 11 ? 6 : v/2;
  let s = base(hi);
  if (hi === lo) return Math.max(5, s*2);
  if ((a & 3) === (b & 3)) s += 2;
  const gap = hi - lo - 1;
  s -= gap === 0 ? 0 : gap === 1 ? 1 : gap === 2 ? 2 : gap === 3 ? 4 : 5;
  if (gap <= 1 && hi < 12) s += 1;
  return s;
}
const PRE_PCT = (() => {
  const list = [];
  for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) list.push({ k:a*52 + b, s:chen(a, b) });
  list.sort((x, y) => y.s - x.s);
  const m = new Map(); let i = 0;
  while (i < list.length){
    let j = i; while (j < list.length && list[j].s === list[i].s) j++;
    const pct = (i + j)/2/list.length;
    for (let q = i; q < j; q++) m.set(list[q].k, pct);
    i = j;
  }
  return m;
})();
const prePct = h => PRE_PCT.get(Math.min(h[0], h[1])*52 + Math.max(h[0], h[1]));
function equity(hole, board, opp, sims){
  const used = new Uint8Array(52); hole.forEach(c => used[c]=1); board.forEach(c => used[c]=1);
  const rest = []; for (let c = 0; c < 52; c++) if (!used[c]) rest.push(c);
  const need = 5 - board.length + opp*2;
  let total = 0;
  for (let s = 0; s < sims; s++){
    for (let k = 0; k < need; k++){ const j = k + Math.floor(Math.random()*(rest.length-k)); const t = rest[k]; rest[k] = rest[j]; rest[j] = t; }
    let p = 0; const full = board.slice(); while (full.length < 5) full.push(rest[p++]);
    const mine = evaluate([...hole, ...full]).score;
    let ties = 0, lost = false;
    for (let o = 0; o < opp; o++){
      const sc = evaluate([rest[p++], rest[p++], ...full]).score;
      if (sc > mine){ lost = true; break; }
      if (sc === mine) ties++;
    }
    if (!lost) total += 1/(ties+1);
  }
  return total / sims;
}
function preflopDecide(p, st, d){
  const bb = G.cfg.bb, toCall = Math.min(H.currentBet - p.bet, p.chips);
  const seated = G.players.filter(q => q.inHand).length;
  const widen = clamp(1 + (6 - seated)*.17, 1, 2.3);
  const pct = clamp(prePct(p.hole) + (Math.random()*2 - 1)*d.noise*.4, 0, 1);
  const maxTo = p.bet + p.chips, minTo = Math.min(H.currentBet + H.minRaise, maxTo), canR = canRaise(p);
  const pot = potAll();
  const raiseTo = mult => Math.min(maxTo, Math.max(minTo, Math.round(mult)));
  const lvl = H.currentBet / bb;                         // 1 = unraised
  const r = Math.random();
  if (lvl <= 1){
    if (canR && pct < st.pfr*widen && r < .85) return { type:'raise', to:raiseTo(bb*(2.5 + Math.random()*1.2) + (pot - bb*1.5)*.5) };
    if (toCall <= 0) return (canR && pct < st.vpip*widen*.6 && r < st.aggr*.35) ? { type:'raise', to:raiseTo(bb*3) } : { type:'check' };
    const sb = p.bet > 0;                                 // small blind completing
    if (pct < st.vpip*widen*(sb ? 1.35 : 1)) return { type:'call' };
    return { type:'fold' };
  }
  // facing a raise: the bigger it is relative to the blind and my stack, the narrower I continue
  const press = Math.pow(lvl/3, .85), stackFrac = toCall/(p.chips + p.bet);
  let cont = st.vpip*widen/press*(1 - Math.min(.7, stackFrac*.8));
  const odds = toCall/(pot + toCall);
  if (odds < .25) cont *= 1.25;                          // cheap to see a flop
  if (canR && pct < Math.min(cont, st.pfr*widen)*.35 && r < .7 + st.aggr*.3){
    return { type:'raise', to:raiseTo(H.currentBet*(2.6 + Math.random()*.8)) };
  }
  if (pct < cont) return { type:'call' };
  if (pct < .03) return { type:'call' };
  return { type:'fold' };
}
function comDecide(p){
  const d = DIFF[G.cfg.diff], st = STYLES[p.style];
  if (H.street === 0) return preflopDecide(p, st, d);
  const opp = G.players.filter(q => q !== p && live(q)).length;
  // Input is only this seat's hole cards and the public board.
  const eq = Math.max(0, Math.min(1, equity(p.hole, H.board, opp, d.sims) + (Math.random()*2-1)*d.noise));
  const toCall = Math.min(H.currentBet - p.bet, p.chips);
  const pot = potAll();
  const potOdds = toCall / (pot + toCall || 1);
  const rel = eq * (opp + 1);
  const maxTo = p.bet + p.chips, minTo = Math.min(H.currentBet + H.minRaise, maxTo);
  const canR = canRaise(p);
  const r = Math.random();
  const sizeTo = f => Math.min(maxTo, Math.max(minTo, H.currentBet + Math.round(f * (pot + toCall))));
  if (canR && rel > 1.75 && r < 0.35 + st.aggr*0.6){
    const f = (rel > 2.6 && Math.random() < 0.3) ? 1.1 : 0.45 + Math.random()*0.45;
    return { type:'raise', to:sizeTo(f) };
  }
  if (toCall <= 0){
    if (canR && rel > 1.2 && r < st.aggr*0.7) return { type:'raise', to:sizeTo(0.4 + Math.random()*0.3) };
    if (canR && r < st.bluff*1.6) return { type:'raise', to:sizeTo(0.45 + Math.random()*0.25) };
    return { type:'check' };
  }
  const committed = toCall >= p.chips * 0.45;
  const implied = H.street === 1 ? .78 : H.street === 2 ? .88 : 1;   // more cards to come → room to improve
  const need = potOdds*implied + (committed ? 0.06 : 0) - st.loose;
  if (eq >= need){
    if (canR && rel > 1.45 && r < st.aggr*0.25) return { type:'raise', to:sizeTo(0.7) };
    return { type:'call' };
  }
  if (canR && !committed && H.street < 3 && r < st.bluff*0.6) return { type:'raise', to:sizeTo(0.6) };
  return { type:'fold' };
}
