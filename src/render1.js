/* =====================================================================
   RENDERER — canvas, one frame per requestAnimationFrame
   ===================================================================== */
const CAMERA = { W:100, H:132, tilt:36, pf:1.8, squash:.5, rail:7, cardsIn:11, stackIn:11, betIn:18, boardY:.38, potY:.535, pillY:.625, msgY:.565, cardW:10.8, wScale:1.14, bottomPad:12 };
// one camera, one layout, one set of hands; the skins only change materials
const THEMES = {
  regular:{ ...CAMERA, key:'regular', cardStyle:'modern' },
  saloon: { ...CAMERA, key:'saloon',  cardStyle:'vintage' },
  // first person: camera low at your seat, strong perspective; rendered at low resolution in an Atari 8-bit palette
  atari:  { ...CAMERA, key:'atari', cardStyle:'pixel' }
};
const FPPORT = { w:1.04, tilt:63, pf:.78, cardW:12 };          // phone held upright: step back and look down a bit so every seat fits
const FPCAM = { view:'first', cardW:8.4, tilt:71, pf:.78, wScale:.62, bottomPad:0, nearCut:20 };
const themeFor = (key, view) => ({ ...THEMES[key], ...(key === 'atari' && !PIXEL_DECK ? { cardStyle:'modern' } : {}), ...(view === 'first' ? FPCAM : { view:'above' }) });
const FP = () => TH.view === 'first';
let TH = themeFor('regular', 'above');
const cv = $('#cv'), cx = cv.getContext('2d');
let CW = 0, CH = 0, DPR = 1, U = 4, P = 400, SIN = 0, COS = 1, CX0 = 0, CY0 = 0;
let staticCv = document.createElement('canvas'), ovCv = document.createElement('canvas'), staticDirty = true;
let L = [];               // per-seat layout in plane units; L.D is the dealer
const HS = {};            // hand state per seat key (0..n-1, 'D') → { L, R }
const tweens = new Set(), sprites = new Set();
let showFps = false, fpsT = 0, fpsN = 0, fpsVal = 0;

function proj(pt){
  const xc = (pt.x - TH.W/2) * U, yc = (pt.y - TH.H/2) * U;
  const s = P / (P - yc * SIN);
  return { x:CX0 + xc*s, y:CY0 + yc*COS*s, s };
}
function projAt(pt, u, cx0, cy0){
  const p = TH.pf * TH.H * u;
  const xc = (pt.x - TH.W/2) * u, yc = (pt.y - TH.H/2) * u;
  const s = p / (p - yc * SIN);
  return { x:cx0 + xc*s, y:cy0 + yc*COS*s, s };
}

/* ---- table shapes (plane units) ---- */
function stadiumPoly(d){
  const W = TH.W, Hh = TH.H, r = W/2 - d, c1 = W/2, c2 = Hh - W/2, pts = [];
  for (let k = 0; k <= 36; k++){ const a = Math.PI + k/36*Math.PI; pts.push({ x:W/2 + r*Math.cos(a), y:c1 + r*Math.sin(a) }); }
  for (let k = 0; k <= 36; k++){ const a = k/36*Math.PI; pts.push({ x:W/2 + r*Math.cos(a), y:c2 + r*Math.sin(a) }); }
  return pts;
}
function octPoly(d){
  const W = TH.W, Hh = TH.H, c = 24 - d*0.414;
  const x0 = d, x1 = W - d, y0 = d, y1 = Hh - d;
  return [{x:x0+c,y:y0},{x:x1-c,y:y0},{x:x1,y:y0+c},{x:x1,y:y1-c},{x:x1-c,y:y1},{x:x0+c,y:y1},{x:x0,y:y1-c},{x:x0,y:y0+c}];
}
const tablePoly = d => TH.key === 'saloon' ? octPoly(d) : stadiumPoly(d);
function trackPoly(){
  if (TH.key === 'regular') return stadiumPoly(19);
  const r = 25, cxp = TH.W/2, y1 = 22 + r, y2 = TH.H - 22 - r, pts = [];
  for (let k = 0; k <= 30; k++){ const a = Math.PI + k/30*Math.PI; pts.push({ x:cxp + r*Math.cos(a), y:y1 + r*Math.sin(a) }); }
  for (let k = 0; k <= 30; k++){ const a = k/30*Math.PI; pts.push({ x:cxp + r*Math.cos(a), y:y2 + r*Math.sin(a) }); }
  return pts;
}
function rayHit(poly, c, ang){
  const dx = Math.cos(ang), dy = Math.sin(ang);
  let best = Infinity;
  for (let i = 0; i < poly.length; i++){
    const a = poly[i], b = poly[(i+1) % poly.length];
    const ex = b.x - a.x, ey = b.y - a.y;
    const den = dx*ey - dy*ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a.x - c.x)*ey - (a.y - c.y)*ex) / den;
    const u = ((a.x - c.x)*dy - (a.y - c.y)*dx) / den;
    if (t > 0 && u >= -1e-6 && u <= 1 + 1e-6 && t < best) best = t;
  }
  return { x:c.x + dx*best, y:c.y + dy*best };
}
function tracePoly(ctx, poly){
  poly.forEach((pt, i) => { const q = proj(pt); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
  ctx.closePath();
}
const add = (a, b, k = 1) => ({ x:a.x + b.x*k, y:a.y + b.y*k });
const boardPt = k => ({ x:TH.W/2 + (k - 2)*(TH.cardW + 1.1), y:TH.H*TH.boardY });
const potPt = () => ({ x:TH.W/2, y:TH.H*TH.potY });

function keepOut(){
  const step = TH.cardW + 1.1, half = 2*step + TH.cardW/2, by = TH.H*TH.boardY, ch = TH.cardW*.71/Math.cos(TH.tilt*Math.PI/180);
  return [
    { x0:TH.W/2 - half - 4, x1:TH.W/2 + half + 4, y0:by - ch - 3, y1:by + ch + 8 },
    { x0:TH.W/2 - 17, x1:TH.W/2 + 17, y0:TH.H*TH.potY - 6, y1:TH.H*TH.pillY + 6 },
    { x0:TH.W/2 - 22, x1:TH.W/2 + 22, y0:-10, y1:22 }          // dealer's working area
  ];
}
function clearOf(rail, d, lat, dist, latOff){
  const rects = keepOut();
  let pt;
  for (let k = dist; k >= 6; k -= .5){
    pt = add(add(rail, d, k), lat, latOff);
    if (!rects.some(r => pt.x > r.x0 && pt.x < r.x1 && pt.y > r.y0 && pt.y < r.y1)) return pt;
  }
  return pt;
}
function seatAngles(n){
  const k = n - 1, out = [90];
  if (k <= 0) return out;
  if (k === 1) return [90, 210];
  const left = Math.ceil(k/2), right = k - left, b = k >= 6 ? 47 : 50, gt = 40, span = 180 - b - gt;
  for (let j = 1; j <= left; j++) out.push(90 + b + (left === 1 ? span/2 : span*(j - 1)/(left - 1)));
  const rs = [];
  for (let j = 1; j <= right; j++) rs.push(450 - b - (right === 1 ? span/2 : span*(j - 1)/(right - 1)));
  return out.concat(rs.sort((a, c) => a - c));
}
const mkHand = p => ({ pos:{ ...p }, lift:0, curl:0, tok:0, obj:null, fxLift:0, fxBack:0, pose:null, poseUntil:0 });
function computeLayout(){
  if (!G) return;
  const n = G.players.length, W = TH.W, Hh = TH.H, sal = TH.key === 'saloon';
  const c = { x:W/2, y:Hh/2 };
  const railPoly = tablePoly(TH.rail/2);
  const A = seatAngles(n);
  L = [];
  for (let i = 0; i < n; i++){
    const ang = A[i]*Math.PI/180;
    const rail = rayHit(railPoly, c, ang);
    const tgt = { x:W/2, y:clamp(rail.y, Hh*.36, Hh*.64) };
    let dx = tgt.x - rail.x, dy = tgt.y - rail.y; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const d = { x:dx, y:dy }, lat = { x:-dy, y:dx };
    const o = { rail, d, lat };
    o.stack = clearOf(rail, d, lat, TH.stackIn, -10);
    o.cards = clearOf(rail, d, lat, TH.cardsIn, 6.5);
    o.bet = clearOf(rail, d, lat, 19, -2);
    o.button = clearOf(rail, d, lat, 19.5, 9.5);
    o.plate = add(rail, d, -12);
    o.rest = { L:add(add(o.stack, d, -6.5), lat, -.5), R:add(add(o.cards, d, -7), lat, 1.2) };
    const so = 12, sl = 8.5;
    o.shoulder = { L:add(add(rail, d, -so), lat, -sl), R:add(add(rail, d, -so), lat, sl) };
    o.restStyle = REST_STYLES[(i*5 + 3) % REST_STYLES.length];
    L.push(o);
  }
  Object.assign(L[0], {
    d:{ x:0, y:-1 }, lat:{ x:1, y:0 },
    stack:{ x:W/2 - 7, y:Hh - 27 }, bet:{ x:W/2 + 3, y:Hh - 39 }, button:{ x:W/2 + 18, y:Hh - 31 },
    rest:{ L:{ x:W/2 - 26, y:Hh + 30 }, R:{ x:W/2 + 26, y:Hh + 30 } },
    shoulder:{ L:{ x:W/2 - 14, y:Hh + 26 }, R:{ x:W/2 + 27, y:Hh + 24 } }
  });
  const dr = rayHit(railPoly, c, Math.PI*1.5);
  const D = { rail:dr, d:{ x:0, y:1 }, lat:{ x:-1, y:0 } };
  // deck sits by the dealer's pitching hand (screen-left); discards go to the middle, toward the right
  D.deck = add(add(dr, D.d, 10), D.lat, 7);
  D.burn = add(add(dr, D.d, 9), D.lat, 15);
  D.muck = add(add(dr, D.d, 20), D.lat, -9);
  D.rest = { R:add(add(D.deck, D.d, -5.5), D.lat, 2), L:add(add(dr, D.d, 5), D.lat, -11) };
  L.D = D;
  for (const k of [...G.players.keys(), 'D']){
    const lay = k === 'D' ? D : L[k];
    HS[k] = { L:mkHand(restOf(k, 'L')), R:mkHand(restOf(k, 'R')) };
  }
  for (const k of Object.keys(HS)) if (k !== 'D' && +k >= n) delete HS[k];
}
const layOf = k => k === 'D' ? L.D : L[k];
const wristFor = (k, pt) => add(pt, layOf(k).d, -5.5);
// natural resting poses at the table (wrist positions in plane units)
const REST_STYLES = ['rail', 'clasp', 'guard', 'lap', 'rail', 'guard', 'clasp', 'lap'];
function restPos(k, side){
  const lay = L[k], st = lay.restStyle || 'rail', r = lay.rail, d = lay.d, lat = lay.lat, sx = side === 'L' ? -1 : 1;
  const at = (dd, ll) => add(add(r, d, dd), lat, ll);
  switch (st){
    case 'clasp': return at(-1, sx*2.2);                                          // hands together just over the rail
    case 'guard': return side === 'R' ? add(lay.cards, d, -5.2) : at(-3, -5);     // one hand covering the cards
    case 'lap':   return side === 'L' ? at(-13, -5) : at(-3, 9);                  // one hand back in the lap, under the body
    default:      return side === 'L' ? at(-3, -5) : at(-3, 9);                   // wrists on the rail, fingers short of chips and cards
  }
}
const restOf = (k, side) => k === 'D' ? L.D.rest[side] : (k === 0 ? L[0].rest[side] : restPos(k, side));
const dHand = pt => pt.x < TH.W/2 ? 'R' : 'L';          // dealer uses the hand on that side
const reachable = pt => ({ x:pt.x, y:Math.min(pt.y, TH.H*.6) });
function dealerShoulder(side){
  const t = proj({ x:TH.W/2, y:.5 }), k = U*t.s;
  return FP() ? { x:t.x + (side === 'R' ? -14.5 : 14.5)*k, y:t.y - 9*k } : { x:t.x + (side === 'R' ? -11.5 : 11.5)*k, y:t.y - 7.5*k };
}

function fit(){
  if (!G || $('#game').hidden) return;
  const r = $('#scene').getBoundingClientRect();
  if (!r.width || !r.height) return;
  CW = r.width; CH = r.height; PIX = CW < 600 ? 2 : 3; DPR = TH.key === 'atari' ? Math.max(1, Math.round(Math.min(window.devicePixelRatio || 1, 3))) : Math.min(window.devicePixelRatio || 1, 2);     // 16-bit: full device resolution, whole-number scale, so every game pixel is a hard-edged square and labels stay razor sharp
  cv.width = Math.round(CW*DPR); cv.height = Math.round(CH*DPR);
  if (FP()){ const port = CW < CH*.9; TH.wScale = port ? FPPORT.w : FPCAM.wScale; TH.tilt = port ? FPPORT.tilt : FPCAM.tilt; TH.pf = port ? FPPORT.pf : FPCAM.pf; TH.cardW = port ? FPPORT.cardW : FPCAM.cardW; }
  SIN = Math.sin(TH.tilt*Math.PI/180); COS = Math.cos(TH.tilt*Math.PI/180);
  const pts = tablePoly(0).map(p => projAt(p, 1, 0, 0));
  const t0 = projAt({ x:TH.W/2, y:0 }, 1, 0, 0);
  const minY = t0.y - (FP() || TH.key === 'atari' ? 54 : 30)*t0.s;
  const maxY = projAt({ x:TH.W/2, y:TH.H - (TH.nearCut || 0) }, 1, 0, 0).y + TH.bottomPad;
  const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
  U = FP() ? Math.min(CH*.62/(maxY - minY), CW*.92/((maxX - minX)*TH.wScale)) : Math.min(CW / ((maxX - minX)*TH.wScale), CH / (maxY - minY));
  P = TH.pf * TH.H * U;
  CX0 = CW/2;
  CY0 = FP() ? CH*(CW < CH*.9 ? .23 : .13) - minY*U : (CH - (maxY - minY)*U) - minY*U;          // spare height goes above the dealer
  staticDirty = true;
  drawFrame(performance.now());
}

