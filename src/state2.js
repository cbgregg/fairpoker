/* ---------- game state ---------- */
const NAMES = ['Hattie','Silas','Mae','Cyrus','Wyatt','Rosa','Eli','Jeb'];
const SKINS_T = ['#e2ad87','#c68e67','#a8714f','#8a5a3c','#d9a27a','#b8805c','#9c6a48','#e6b896'];
const SLEEVES = ['#2b2a2e','#43302a','#24303f','#3d3b33','#2f3a2b','#4d3626','#1f2328','#3b2f2a'];
const SLEEVES_MOD = ['#1d2a44','#3a3f47','#4a5a3a','#5a2430','#1a1c20','#2f4f6f','#6b5a44','#3d2f55'];
const DEALER = { id:99, name:'Dealer', skin:'#d6a07a' };
let HANDS = store.get('hands') !== '0';
const handsOn = () => HANDS;
function sleeveOf(p){
  if (p === DEALER) return '#e9e6de';
  return TH.key === 'saloon' ? SLEEVES[p.id % SLEEVES.length] : SLEEVES_MOD[p.id % SLEEVES_MOD.length];
}
function cuffOf(p){
  return p === DEALER ? 'garter' : 'shirt';
}
const PHASES = ['Pre-flop','Flop','Turn','River'];
const PACE = { slow:1.6, normal:1, fast:0.55 };
let G = null, H = null, autoTimer = null, dockKey = '', raiseOpen = false, humanResolve = null, preAct = null, dealing = false;
const TS = { deckHidden:false, burnN:0, muckN:0, btnHidden:false };
const cfg = { diff:'standard', speed:'normal', skin:'regular' };
const T = ms => ms * PACE[(G && G.cfg.speed) || cfg.speed];
const wait = ms => sleep(T(ms));
const alive = h => !!(G && H === h && !h.abort);

const live = p => p.inHand && !p.folded;
const needsAction = p => live(p) && !p.allIn && (!p.acted || p.bet < H.currentBet);
const canRaise = p => (!p.acted || p.actedSeq < H.raiseSeq) && p.chips + p.bet > H.currentBet;
const potAll = () => G.players.reduce((a,p) => a + p.contrib, 0);
const potCenter = () => G.players.reduce((a,p) => a + p.contrib - p.bet, 0);
const me = () => G.players[0];
const who = p => p.isCom ? `COM ${p.name}` : p.name;
const idxOf = p => G.players.indexOf(p);
function nextIdx(i, pred){
  const n = G.players.length;
  for (let k = 1; k <= n; k++){ const j = (i + k + n) % n; if (pred(G.players[j])) return j; }
  return -1;
}

