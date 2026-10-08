/* =====================================================================
   HANDS — painted once per pose into a sprite, stamped every frame.
   Soft shading uses the off-canvas shadow trick (works on iOS Safari,
   which ignores ctx.filter). Shading is applied with 'source-atop' so it
   only lands on skin.
   Local space: wrist at origin, fingers +x, thumb on +y.
   Unmirrored sprite = left hand, palm down. Mirrored = right hand.
   ===================================================================== */
const HAND_PX = 115;
const HAND_BOX = { x0:-.12, x1:1.04, y0:-.32, y1:.44 };
const handCache = new Map();

function splinePath(pts, closed, path = new Path2D()){
  const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  path.moveTo(pts[0].x, pts[0].y);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++){
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    path.bezierCurveTo(p1.x + (p2.x - p0.x)/6, p1.y + (p2.y - p0.y)/6, p2.x - (p3.x - p1.x)/6, p2.y - (p3.y - p1.y)/6, p2.x, p2.y);
  }
  if (closed) path.closePath();
  return path;
}
// blurred fill/stroke on every browser: draw far off-canvas and keep only the shadow
function soft(g, blurPx, color, fn){
  const m = g.getTransform(), OFF = 8000;
  g.save();
  g.setTransform(1, 0, 0, 1, -OFF, 0); g.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  g.shadowColor = color; g.shadowBlur = blurPx; g.shadowOffsetX = OFF; g.shadowOffsetY = 0;
  g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineCap = 'round'; g.lineJoin = 'round';
  fn(g);
  g.restore();
}
const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = s => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
};

/* a tapered limb (finger / thumb) through joint points; returns { body, sides, mid } */
function limbPaths(pts, widths){
  const L = [], R = [], N = [];
  for (let i = 0; i < pts.length; i++){
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b.x - a.x, dy = b.y - a.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    N.push({ x:-dy, y:dx, dx, dy });
    L.push({ x:pts[i].x - dy*widths[i]/2, y:pts[i].y + dx*widths[i]/2 });
    R.push({ x:pts[i].x + dy*widths[i]/2, y:pts[i].y - dx*widths[i]/2 });
  }
  const tip = pts[pts.length - 1], tn = N[N.length - 1], tw = widths[widths.length - 1]/2;
  const cap = [];
  for (let k = 1; k < 6; k++){
    const a = Math.PI/2 - k/6*Math.PI;                 // sweep from left side over the tip to the right
    cap.push({ x:tip.x + tn.dx*Math.cos(a)*tw*1.05 + (-tn.dy)*Math.sin(a)*tw, y:tip.y + tn.dy*Math.cos(a)*tw*1.05 + tn.dx*Math.sin(a)*tw });
  }
  const ring = [...L, ...cap, ...R.slice().reverse()];
  const body = splinePath(ring, true);
  const sides = splinePath([...L.slice(1), ...cap, ...R.slice(1).reverse()], false);
  return { body, sides, L, R, N };
}

const FING = [   // knuckle, length, width, splay
  { kx:.468, ky:-.163, L:.265, w:.12,  a:-.1 },   // little
  { kx:.528, ky:-.058, L:.33,  w:.132, a:-.035 }, // ring
  { kx:.552, ky:.05,   L:.36,  w:.138, a:.01 },   // middle
  { kx:.527, ky:.156,  L:.33,  w:.134, a:.055 }   // index
];
// finger order: little, ring, middle, index. c = curl per finger, t = thumb tuck, s = splay
const POSES = {
  fist:   { c:[1, 1, 1, .95], t:.9, s:.6 },
  knock:  { c:[1, 1, .95, .9], t:.8, s:.6 },
  point:  { c:[1, 1, .95, 0], t:.7, s:.8 },
  spread: { c:[0, 0, 0, 0], t:0, s:3.2 },
  claw:   { c:[.55, .5, .5, .45], t:.4, s:1.5 },
  d0:     { c:[.12, .1, .1, .7], t:.1, s:1 },
  d1:     { c:[.12, .1, .7, .1], t:.1, s:1 },
  d2:     { c:[.12, .7, .1, .1], t:.1, s:1 },
  d3:     { c:[.7, .1, .1, .1], t:.1, s:1 }
};
for (let q = 0; q <= 5; q++) POSES['u' + q] = { c:[q/5, q/5, q/5, q/5], t:q/10, s:1 };
function fingerJoints(f, curl, splay = 1){
  const seg = [.47, .29, .24], bend = [1.3, 1.65, 1.65];
  const ax = Math.cos(f.a*splay), ay = Math.sin(f.a*splay);
  const pts = [{ x:f.kx - ax*.09, y:f.ky - ay*.09 }, { x:f.kx, y:f.ky }];
  let x = f.kx, y = f.ky;
  seg.forEach((s, i) => { const l = f.L*s*Math.max(.06, Math.cos(curl*bend[i])); x += ax*l; y += ay*l; pts.push({ x, y }); });
  return pts;
}

function handSprite(skin, poseKey){
  const key = skin + '|' + poseKey + '|' + DPR;
  let c = handCache.get(key); if (c) return c;
  if (handCache.size > 320) handCache.clear();
  const k = HAND_PX * Math.min(DPR, 2);
  c = document.createElement('canvas');
  c.width = Math.ceil((HAND_BOX.x1 - HAND_BOX.x0)*k); c.height = Math.ceil((HAND_BOX.y1 - HAND_BOX.y0)*k);
  const g = c.getContext('2d');
  g.setTransform(k, 0, 0, k, -HAND_BOX.x0*k, -HAND_BOX.y0*k);
  const pose = POSES[poseKey] || (poseKey[0] === 'c' ? { c:[...poseKey.slice(1)].map(d => +d/9), t:.1, s:1 } : POSES.u0);
  paintHand(g, skin, pose, k);
  // bake a soft contact shadow underneath the hand into the same sprite
  const sh = document.createElement('canvas'); sh.width = c.width; sh.height = c.height;
  const sg = sh.getContext('2d'), OFF = 8000;
  sg.shadowColor = 'rgba(0,0,0,.55)'; sg.shadowBlur = .045*k; sg.shadowOffsetX = OFF; sg.shadowOffsetY = .03*k;
  sg.drawImage(c, -OFF, 0);
  sg.drawImage(c, 0, 0);
  c = sh;
  c._k = k;
  handCache.set(key, c);
  return c;
}
function paintHand(g, skin, pose, k){
  const curl = (pose.c[0] + pose.c[1] + pose.c[2] + pose.c[3])/4;
  const base = skin, dark = shade(skin, -55), deep = shade(skin, -85), lite = shade(skin, 34);
  const blush = 'rgba(196,84,72,';
  // ---- geometry
  const fingers = FING.map((f, i) => {
    const pts = fingerJoints(f, pose.c[i], pose.s);
    const w = [f.w*1.12, f.w*1.02, f.w*.98, f.w*.92, f.w*.84];
    return { f, pts, ...limbPaths(pts, w), w };
  });
  const tc = pose.t;
  const tPts = [{ x:.05, y:.12 }, { x:.17, y:.215 }, { x:.31 - tc*.04, y:.28 - tc*.05 }, { x:.43 - tc*.06, y:.305 - tc*.09 }];
  const thumb = limbPaths(tPts, [.17, .14, .125, .108]);
  const palmPts = [
    { x:-.04, y:-.145 }, { x:.12, y:-.18 }, { x:.3, y:-.2 }, { x:.43, y:-.205 }, { x:.51, y:-.12 },
    { x:.56, y:-.01 }, { x:.57, y:.1 }, { x:.545, y:.19 }, { x:.45, y:.215 }, { x:.33, y:.215 },
    { x:.18, y:.2 }, { x:.05, y:.17 }, { x:-.05, y:.13 }, { x:-.075, y:0 }
  ];
  const palm = splinePath(palmPts, true);
  const ulnar = splinePath(palmPts.slice(0, 4), false);
  const radial = splinePath(palmPts.slice(8, 14), false);

  // ---- base silhouette
  g.fillStyle = base;
  g.fill(thumb.body); g.fill(palm); fingers.forEach(F => g.fill(F.body));
  g.globalCompositeOperation = 'source-atop';

  // overall form: lighter across the back of the hand, warmer toward the fingertips
  const fg = g.createRadialGradient(.24, .0, .02, .26, 0, .55);
  fg.addColorStop(0, 'rgba(255,240,226,.32)'); fg.addColorStop(.55, 'rgba(255,240,226,.08)'); fg.addColorStop(1, 'rgba(255,240,226,0)');
  g.fillStyle = fg; g.fillRect(-.2, -.4, 1.4, .9);
  const tg = g.createLinearGradient(.5, 0, 1.02, 0);
  tg.addColorStop(0, blush + '0)'); tg.addColorStop(1, blush + '.2)');
  g.fillStyle = tg; g.fillRect(.45, -.4, .7, .9);
  const wg = g.createLinearGradient(-.08, 0, .1, 0);
  wg.addColorStop(0, 'rgba(40,18,8,.28)'); wg.addColorStop(1, 'rgba(40,18,8,0)');
  g.fillStyle = wg; g.fillRect(-.2, -.4, .3, .9);

  // tendons fanning to each knuckle, with grooves between
  FING.forEach(f => {
    soft(g, .016*k, 'rgba(255,238,222,.22)', s => { s.lineWidth = .02; s.beginPath(); s.moveTo(.03, f.ky*.25); s.quadraticCurveTo(.26, f.ky*.7, f.kx - .05, f.ky); s.stroke(); });
    soft(g, .02*k, 'rgba(70,30,14,.12)', s => { s.lineWidth = .018; s.beginPath(); s.moveTo(.06, f.ky*.25 + .03); s.quadraticCurveTo(.28, f.ky*.7 + .03, f.kx - .07, f.ky + .045); s.stroke(); });
  });
  // a couple of veins
  soft(g, .012*k, 'rgba(70,86,130,.13)', s => {
    s.lineWidth = .016;
    s.beginPath(); s.moveTo(-.02, -.06); s.bezierCurveTo(.1, -.1, .18, .0, .33, -.04); s.stroke();
    s.beginPath(); s.moveTo(.0, .07); s.bezierCurveTo(.12, .04, .2, .11, .31, .08); s.stroke();
  });

  // palm outer edges fall away from the light
  soft(g, .05*k, 'rgba(50,20,8,.55)', s => { s.lineWidth = .05; s.stroke(ulnar); });
  soft(g, .04*k, 'rgba(50,20,8,.38)', s => { s.lineWidth = .04; s.stroke(radial); });

  // thumb: rounded form, crease, nail seen from the side
  soft(g, .035*k, 'rgba(50,20,8,.55)', s => { s.lineWidth = .035; s.stroke(thumb.sides); });
  soft(g, .02*k, 'rgba(255,240,226,.35)', s => { s.lineWidth = .025; s.beginPath(); s.moveTo(tPts[1].x, tPts[1].y - .02); s.lineTo(tPts[2].x, tPts[2].y - .022); s.lineTo(tPts[3].x - .02, tPts[3].y - .024); s.stroke(); });
  {
    const a = tPts[2], b = tPts[3], ang = Math.atan2(b.y - a.y, b.x - a.x);
    g.save(); g.translate(lerp(a.x, b.x, .62), lerp(a.y, b.y, .62) + .018); g.rotate(ang);
    paintNail(g, .07, .05, skin, k);
    g.restore();
    soft(g, 2, 'rgba(80,36,20,.35)', s => { s.lineWidth = .006; s.beginPath(); s.moveTo(a.x - .01, a.y - .05); s.quadraticCurveTo(a.x + .012, a.y, a.x - .01, a.y + .05); s.stroke(); });
  }

  // fingers
  fingers.forEach(F => {
    const p = F.pts;
    // cylinder: dark sides, lit ridge down the middle
    soft(g, .032*k, 'rgba(48,18,6,.62)', s => { s.lineWidth = .036; s.stroke(F.sides); });
    soft(g, .018*k, 'rgba(255,242,230,.32)', s => {
      s.lineWidth = F.f.w*.28; s.beginPath(); s.moveTo(p[1].x, p[1].y - F.f.w*.12);
      for (let i = 2; i < p.length; i++) s.lineTo(p[i].x - (i === p.length - 1 ? .02 : 0), p[i].y - F.f.w*.12);
      s.stroke();
    });
    // knuckle: lit bump + warm skin over it
    soft(g, .028*k, 'rgba(255,244,232,.45)', s => { s.beginPath(); s.ellipse(p[1].x - .012, p[1].y - .008, .032, .028, 0, 0, Math.PI*2); s.fill(); });
    soft(g, .03*k, blush + '.16)', s => { s.beginPath(); s.ellipse(p[1].x + .02, p[1].y, .03, .035, 0, 0, Math.PI*2); s.fill(); });
    // joint creases over the middle and end joints
    [2, 3].forEach((j, jj) => {
      const q = p[j], n = F.N[j], hw = F.w[j]*.34;
      soft(g, .02*k, blush + '.14)', s => { s.beginPath(); s.ellipse(q.x, q.y, .026, F.w[j]*.36, Math.atan2(n.dy, n.dx), 0, Math.PI*2); s.fill(); });
      soft(g, 1.4, 'rgba(84,38,22,.5)', s => {
        s.lineWidth = .0055;
        for (let r = -1; r <= (jj ? 0 : 1); r++){
          const o = r*.011;
          s.beginPath();
          s.moveTo(q.x + n.x*hw + n.dx*o, q.y + n.y*hw + n.dy*o);
          s.quadraticCurveTo(q.x + n.dx*(o + .014), q.y + n.dy*(o + .014), q.x - n.x*hw + n.dx*o, q.y - n.y*hw + n.dy*o);
          s.stroke();
        }
      });
    });
    // fingertip warmth
    const tip = p[p.length - 1];
    soft(g, .03*k, blush + '.2)', s => { s.beginPath(); s.arc(tip.x, tip.y, F.f.w*.38, 0, Math.PI*2); s.fill(); });
    // nail on the last segment
    const a = p[p.length - 2], b = tip, nl = Math.hypot(b.x - a.x, b.y - a.y);
    if (nl > .035){
      g.save(); g.translate(lerp(a.x, b.x, .6), lerp(a.y, b.y, .6)); g.rotate(Math.atan2(b.y - a.y, b.x - a.x));
      paintNail(g, Math.min(nl*.66, .078), F.f.w*.64, skin, k);
      g.restore();
    }
  });
  // where neighbouring fingers press together
  for (let i = 0; i < 3; i++){
    const A = fingers[i], B = fingers[i + 1];
    soft(g, .012*k, 'rgba(40,14,4,.55)', s => {
      s.lineWidth = .012; s.beginPath();
      s.moveTo(lerp(A.pts[1].x, B.pts[1].x, .5) - .02, lerp(A.pts[1].y, B.pts[1].y, .5));
      s.lineTo(lerp(A.pts[2].x, B.pts[2].x, .5), lerp(A.pts[2].y, B.pts[2].y, .5));
      s.stroke();
    });
  }
  // skin grain
  const rnd = rng(skin.length*131 + Math.round(curl*10));
  for (let n = 0; n < 220; n++){
    g.fillStyle = `rgba(${rnd() > .5 ? '255,240,228' : '96,44,24'},${.025 + rnd()*.04})`;
    g.beginPath(); g.arc(-.05 + rnd()*1.0, -.25 + rnd()*.6, .002 + rnd()*.004, 0, Math.PI*2); g.fill();
  }
  // crisp but faint outline so the hand reads against busy felt
  g.strokeStyle = 'rgba(52,22,10,.55)'; g.lineWidth = 1.4/k*2;
  fingers.forEach(F => g.stroke(F.sides)); g.stroke(thumb.sides); g.stroke(ulnar); g.stroke(radial);
  g.globalCompositeOperation = 'source-over';
}

function paintNail(g, len, wid, skin, k){
  const ng = g.createLinearGradient(-len/2, 0, len/2, 0);
  ng.addColorStop(0, mix(skin, '#d99c90', .45)); ng.addColorStop(.7, mix(skin, '#ecc4b8', .55)); ng.addColorStop(1, mix(skin, '#f4e2d6', .65));
  g.fillStyle = ng; rr(g, -len/2, -wid/2, len, wid, wid*.46); g.fill();
  g.strokeStyle = 'rgba(110,52,36,.3)'; g.lineWidth = 1/k*2; rr(g, -len/2, -wid/2, len, wid, wid*.46); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.32)'; g.beginPath(); g.ellipse(-len*.05, -wid*.2, len*.26, wid*.09, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = 'rgba(255,250,244,.4)'; g.beginPath(); g.ellipse(len*.44, 0, len*.07, wid*.4, 0, 0, Math.PI*2); g.fill();
}

/* stamp a hand: (x,y) = wrist on screen, ang = finger direction, flat = vertical squash from the camera tilt */
function drawHand(g, x, y, ang, size, skin, o = {}){
  const spr = handSprite(skin, o.pose || ('u' + Math.round(clamp(o.curl ?? 0, 0, 1)*5)));
  const flat = o.flat ?? .8, mirror = o.mirror ? -1 : 1;
  const sc = size/spr._k;
  g.save();
  g.translate(x, y); g.scale(1, flat); g.rotate(ang); g.scale(sc, sc*mirror);
  g.drawImage(spr, HAND_BOX.x0*spr._k, HAND_BOX.y0*spr._k);
  g.restore();
}

/* =====================================================================
   The player's card hand: right hand, palm toward you, cards resting on
   the palm and fingers, thumb pressing the front card.
   Local space: unit = card width, origin = centre of the front card.
   ===================================================================== */
const HOLD_BOX = { x0:-.9, x1:3.0, y0:-1.0, y1:3.4 }, HOLD_PX = 150;
const holdCache = new Map();
function holdSprites(skin, sleeve){
  const key = skin + sleeve + DPR;
  let s = holdCache.get(key); if (s) return s;
  if (holdCache.size > 8) holdCache.clear();
  const k = HOLD_PX*Math.min(DPR, 2);
  const mk = () => { const c = document.createElement('canvas'); c.width = Math.ceil((HOLD_BOX.x1 - HOLD_BOX.x0)*k); c.height = Math.ceil((HOLD_BOX.y1 - HOLD_BOX.y0)*k); const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, -HOLD_BOX.x0*k, -HOLD_BOX.y0*k); return [c, g]; };
  const [back, gb] = mk(), [front, gf] = mk();
  paintHoldBack(gb, skin, sleeve, k); paintHoldTips(gf, skin, k); paintHoldThumb(gf, skin, k);
  s = { back, front, k };
  holdCache.set(key, s);
  return s;
}
const HOLD = (() => {
  // palm faces the viewer; fingers run up-left behind the cards; wrist exits bottom-right
  const f = { x:-.38, y:-.925 }, n = { x:.925, y:-.38 }, C = { x:.3, y:.4 }, S = .85;
  const at = (a, b) => ({ x:C.x + (f.x*a + n.x*b)*S, y:C.y + (f.y*a + n.y*b)*S });
  return { f, n, C, S, at };
})();
function paintHoldBack(g, skin, sleeve, k){
  const { at, f, S } = HOLD;
  const palmC = mix(skin, '#f0c4b2', .32);
  // shadow of hand and arm on the felt
  soft(g, .22*k, 'rgba(0,0,0,.5)', s => { s.beginPath(); s.ellipse(.75, 1.25, .75, .5, 1.1, 0, Math.PI*2); s.fill(); });
  // forearm: shirt cuff, then jacket sleeve, running off the bottom-right
  const W = at(-.7, .05), d = { x:-f.x, y:-f.y }, p = { x:-d.y, y:d.x };
  const P = (t, w) => ({ x:W.x + d.x*t*S + p.x*w*S, y:W.y + d.y*t*S + p.y*w*S });
  const quad = (t0, t1, w0, w1) => { const q = new Path2D(); const A = P(t0, -w0), B = P(t1, -w1), Cc = P(t1, w1), D = P(t0, w0); q.moveTo(A.x, A.y); q.lineTo(B.x, B.y); q.lineTo(Cc.x, Cc.y); q.lineTo(D.x, D.y); q.closePath(); return q; };
  const across = (t, w, stops) => { const A = P(t, -w), B = P(t, w), gr = g.createLinearGradient(A.x, A.y, B.x, B.y); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const sl = quad(.26, 3.2, .44, .54);
  g.fillStyle = across(1, .6, [[0, shade(sleeve, -50)], [.35, shade(sleeve, 16)], [.6, sleeve], [1, shade(sleeve, -60)]]); g.fill(sl);
  g.save(); g.clip(sl);
  soft(g, .05*k, 'rgba(0,0,0,.45)', s => { s.lineWidth = .045; for (const t of [.8, 1.15, 1.55]){ const a = P(t, -.5), b = P(t - .1, 0), c = P(t + .04, .55); s.beginPath(); s.moveTo(a.x, a.y); s.quadraticCurveTo(b.x, b.y, c.x, c.y); s.stroke(); } });
  const e0 = P(.3, .26), e1 = P(3, .32); soft(g, .05*k, 'rgba(255,255,255,.14)', s => { s.lineWidth = .05; s.beginPath(); s.moveTo(e0.x, e0.y); s.lineTo(e1.x, e1.y); s.stroke(); });
  g.restore();
  // palm (the part not hidden by the cards)
  const palmPts = [at(.5, -.48), at(.56, -.15), at(.56, .15), at(.5, .4), at(.32, .54), at(.05, .62), at(-.25, .6),
                   at(-.5, .46), at(-.66, .26), at(-.74, .02), at(-.68, -.26), at(-.5, -.44), at(-.15, -.55), at(.2, -.54)];
  const palm = splinePath(palmPts, true);
  const fingers = [-.38, -.13, .1, .3].map((b, i) => { const L = [.6, .68, .7, .62][i]; return limbPaths([at(.42, b), at(.42 + L*.5, b*1.05), at(.42 + L, b*1.1)], [.25, .23, .2]); });
  const tmp = document.createElement('canvas'); tmp.width = g.canvas.width; tmp.height = g.canvas.height;
  const t = tmp.getContext('2d'); t.setTransform(g.getTransform());
  t.fillStyle = shade(palmC, -18); fingers.forEach(F => t.fill(F.body));
  t.fillStyle = palmC; t.fill(palm);
  t.globalCompositeOperation = 'source-atop';
  // mounds catch light, the hollow and the edges fall into shade
  soft(t, .12*k, 'rgba(255,238,228,.5)', s => { const c = at(-.22, .36); s.beginPath(); s.ellipse(c.x, c.y, .2, .14, -1.2, 0, Math.PI*2); s.fill(); });   // thumb mound
  soft(t, .1*k, 'rgba(255,238,228,.35)', s => { const c = at(-.3, -.32); s.beginPath(); s.ellipse(c.x, c.y, .18, .11, -1.2, 0, Math.PI*2); s.fill(); }); // heel, little-finger side
  soft(t, .12*k, 'rgba(130,56,38,.28)', s => { const c = at(.12, -.02); s.beginPath(); s.ellipse(c.x, c.y, .2, .15, -1.2, 0, Math.PI*2); s.fill(); });   // hollow
  soft(t, .07*k, 'rgba(70,26,12,.55)', s => { s.lineWidth = .07; s.stroke(palm); });
  soft(t, .03*k, 'rgba(196,84,72,.25)', s => { s.lineWidth = .05; s.stroke(palm); });
  // palm creases, faint
  soft(t, 1.5, 'rgba(120,52,38,.42)', s => {
    s.lineWidth = .009;
    const C3 = (a, b, c, e) => { s.beginPath(); s.moveTo(a.x, a.y); s.bezierCurveTo(b.x, b.y, c.x, c.y, e.x, e.y); s.stroke(); };
    C3(at(.36, -.5), at(.4, -.2), at(.36, .05), at(.42, .3));          // heart line
    C3(at(.2, -.52), at(.22, -.2), at(.12, .1), at(.22, .42));         // head line
    C3(at(.28, .44), at(.02, .3), at(-.3, .26), at(-.6, .14));         // life line around the thumb mound
    s.lineWidth = .007;
    C3(at(-.66, -.2), at(-.69, -.06), at(-.69, .08), at(-.66, .22));  // wrist crease
  });
  const rnd = rng(41);
  for (let q = 0; q < 160; q++){ const c = at(-.7 + rnd()*1.25, -.55 + rnd()*1.15); t.fillStyle = `rgba(${rnd() > .5 ? '255,240,228' : '96,44,24'},${.025 + rnd()*.035})`; t.beginPath(); t.arc(c.x, c.y, .003 + rnd()*.005, 0, Math.PI*2); t.fill(); }
  t.globalCompositeOperation = 'source-over';
  t.strokeStyle = 'rgba(60,24,10,.45)'; t.lineWidth = 1.6/k; t.stroke(palm);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(tmp, 0, 0); g.restore();
  const cf = quad(-.02, .3, .36, .41);
  g.fillStyle = across(.1, .41, [[0, '#b9b3a6'], [.4, '#fbf8f1'], [.75, '#ece7dc'], [1, '#9f998c']]); g.fill(cf);
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1.5/k; g.stroke(cf);
  const lk = P(.12, -.24); g.fillStyle = '#b08a3c'; g.beginPath(); g.arc(lk.x, lk.y, .035, 0, Math.PI*2); g.fill();
}
// fingertips curling round the right edge of the cards from behind: they read the depth of the grip
function paintHoldTips(g, skin, k){
  // fingertips curl round the far edge of the front card from behind; we see their rounded sides, nails turned away
  const tips = [{ y:-.37, L:.085, w:.19, a:-.12 }, { y:-.185, L:.105, w:.2, a:-.04 }, { y:.0, L:.1, w:.195, a:.04 }, { y:.175, L:.075, w:.17, a:.12 }];
  const lit = mix(skin, '#f6d2c0', .25);
  tips.forEach(f => {
    const r = f.w/2, x0 = .497, x1 = .5 + f.L;
    g.save(); g.translate(.5, f.y); g.rotate(f.a); g.translate(-.5, -f.y);
    // capsule: straight sides from behind the card, round cap past the edge
    const p = new Path2D();
    p.moveTo(x0, f.y - r); p.lineTo(x1 - r, f.y - r); p.arc(x1 - r, f.y, r, -Math.PI/2, Math.PI/2); p.lineTo(x0, f.y + r); p.closePath();
    // cylinder shading across the finger: light from the upper left, deep shade underneath
    const gr = g.createLinearGradient(0, f.y - r, 0, f.y + r);
    gr.addColorStop(0, shade(skin, -18)); gr.addColorStop(.16, shade(lit, 12)); gr.addColorStop(.34, lit); gr.addColorStop(.6, skin); gr.addColorStop(.86, shade(skin, -44)); gr.addColorStop(1, shade(skin, -80));
    g.fillStyle = gr; g.fill(p);
    g.save(); g.clip(p);
    // the round cap turns away from the light
    const cap = g.createLinearGradient(x1 - r*1.2, 0, x1, 0);
    cap.addColorStop(0, 'rgba(90,34,18,0)'); cap.addColorStop(1, 'rgba(90,34,18,.38)');
    g.fillStyle = cap; g.fillRect(x0, f.y - r, x1 - x0 + r, 2*r);
    // pad flushes warm where it presses the card back
    g.fillStyle = 'rgba(214,104,88,.16)'; g.beginPath(); g.ellipse(x1 - r*.9, f.y + r*.3, r*.55, r*.45, 0, 0, Math.PI*2); g.fill();
    // specular sheen on the top of the tip
    soft(g, .02*k, 'rgba(255,250,244,.55)', s => { s.beginPath(); s.ellipse(x1 - r*1.05, f.y - r*.52, r*.48, r*.13, 0, 0, Math.PI*2); s.fill(); });
    // nail edge just visible on the far side
    g.strokeStyle = 'rgba(255,226,214,.5)'; g.lineWidth = 1.2/k; g.beginPath(); g.arc(x1 - r, f.y, r*.82, -Math.PI*.42, -Math.PI*.05); g.stroke();
    // occlusion where the finger comes out from behind the card
    const ao = g.createLinearGradient(.5, 0, .5 + .04, 0);
    ao.addColorStop(0, 'rgba(40,16,6,.7)'); ao.addColorStop(1, 'rgba(40,16,6,0)');
    g.fillStyle = ao; g.fillRect(x0, f.y - r, .04 + .03, 2*r);
    g.restore();
    g.strokeStyle = 'rgba(70,28,14,.5)'; g.lineWidth = 1.1/k; g.stroke(p);
    g.restore();
  });
  // dark gaps between neighbouring fingers
  soft(g, .012*k, 'rgba(40,14,4,.45)', s => { s.lineWidth = .012; for (let i = 0; i < 3; i++){ const y = (tips[i].y + tips[i + 1].y)/2; s.beginPath(); s.moveTo(.5, y); s.lineTo(.53, y + .005); s.stroke(); } });
}
function paintHoldThumb(g, skin, k){
  const { at, S } = HOLD;
  const palmC = mix(skin, '#f0c4b2', .32);
  // thumb comes off the thumb mound and rests across the corner of the front card, nail toward you
  const r0 = at(-.26, .34), r1 = at(-.08, .5);
  const j = { x:r1.x - .27, y:r1.y - .13 }, tip = { x:j.x - .21, y:j.y - .07 };
  const T = limbPaths([r0, r1, j, tip], [.4*S, .34*S, .3*S, .285*S]);
  g.save(); g.beginPath(); g.rect(-.5, -.71, 1, 1.42); g.clip();
  soft(g, .09*k, 'rgba(30,14,6,.45)', s => { s.save(); s.translate(.05, .07); s.fill(T.body); s.restore(); });
  g.restore();       // shadow on the card face
  const tone = g.createLinearGradient(r1.x, r1.y, j.x, j.y);
  tone.addColorStop(0, palmC); tone.addColorStop(1, skin);
  g.fillStyle = tone; g.fill(T.body);
  g.globalCompositeOperation = 'source-atop';
  // form: lit along the top, rolling into shade underneath where it presses the card
  soft(g, .045*k, 'rgba(255,240,228,.42)', s => { s.lineWidth = .07; s.beginPath(); s.moveTo(r1.x - .02, r1.y - .07); s.quadraticCurveTo(j.x, j.y - .08, tip.x + .04, tip.y - .07); s.stroke(); });
  soft(g, .05*k, 'rgba(70,28,12,.5)', s => { s.lineWidth = .06; s.beginPath(); s.moveTo(r1.x, r1.y + .1); s.quadraticCurveTo(j.x, j.y + .1, tip.x + .05, tip.y + .09); s.stroke(); });
  soft(g, .035*k, 'rgba(70,28,12,.35)', s => { s.lineWidth = .03; s.stroke(T.sides); });
  // rounded volume: a soft highlight running along the top of the thumb
  soft(g, .08*k, 'rgba(255,248,240,.35)', s => { s.beginPath(); s.ellipse(lerp(r1.x, j.x, .5), lerp(r1.y, j.y, .5) - .05, .18, .05, Math.atan2(j.y - r1.y, j.x - r1.x), 0, Math.PI*2); s.fill(); });
  // pad pressed against the card is warmer
  soft(g, .05*k, 'rgba(200,92,78,.2)', s => { s.beginPath(); s.ellipse(tip.x + .04, tip.y + .02, .1, .08, 0, 0, Math.PI*2); s.fill(); });
  // knuckle creases, faint
  soft(g, 1.2, 'rgba(110,50,32,.35)', s => {
    s.lineWidth = .006;
    for (const o of [-.018, .004, .024]){ s.beginPath(); s.moveTo(j.x + o - .02, j.y - .09); s.quadraticCurveTo(j.x + o + .015, j.y, j.x + o - .01, j.y + .09); s.stroke(); }
  });
  // nail near the tip, angled like the thumb
  const na = Math.atan2(tip.y - j.y, tip.x - j.x);
  g.save(); g.translate(lerp(j.x, tip.x, .66), lerp(j.y, tip.y, .66) - .01); g.rotate(na);
  const nl = .15, nw = .17;
  const ng = g.createLinearGradient(-nl/2, 0, nl/2, 0);
  ng.addColorStop(0, mix(skin, '#d9a196', .5)); ng.addColorStop(.75, mix(skin, '#efcbbf', .6)); ng.addColorStop(1, mix(skin, '#f6e6dc', .75));
  g.fillStyle = ng; rr(g, -nl/2, -nw/2, nl, nw, nw*.48); g.fill();
  g.strokeStyle = 'rgba(120,60,42,.28)'; g.lineWidth = 1.2/k; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.ellipse(-nl*.05, -nw*.2, nl*.3, nw*.08, 0, 0, Math.PI*2); g.fill();
  g.restore();
  const rnd = rng(77);
  for (let n = 0; n < 90; n++){ g.fillStyle = `rgba(${rnd() > .5 ? '255,240,228' : '96,44,24'},${.025 + rnd()*.03})`; g.beginPath(); g.arc(tip.x - .1 + rnd()*.7, tip.y - .15 + rnd()*.5, .003 + rnd()*.004, 0, Math.PI*2); g.fill(); }
  g.strokeStyle = 'rgba(60,24,10,.35)'; g.lineWidth = 1.4/k; g.stroke(T.sides);
  // dissolve the root into the palm behind it
  g.globalCompositeOperation = 'destination-out';
  const fo = g.createRadialGradient(r0.x, r0.y, .02, r0.x, r0.y, .2);
  fo.addColorStop(0, 'rgba(0,0,0,1)'); fo.addColorStop(.55, 'rgba(0,0,0,.8)'); fo.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fo; g.fillRect(r0.x - .4, r0.y - .4, .8, .8);
  // and blend the whole root: the thumb grows out of its mound with no hard edge
  const fl = g.createLinearGradient(r0.x, r0.y, lerp(r1.x, j.x, .25), lerp(r1.y, j.y, .25));
  fl.addColorStop(0, 'rgba(0,0,0,.9)'); fl.addColorStop(.6, 'rgba(0,0,0,.35)'); fl.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.beginPath(); g.rect(.5, -2, 3, 4); g.clip(); g.fillStyle = fl; g.fillRect(r0.x - .6, r0.y - .6, 1.2, 1.2); g.restore();
  g.globalCompositeOperation = 'source-over';
}
function drawHoldSprite(g, spr, x, y, rot, w, shadow){
  const sc = w/spr.k;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
  if (shadow){ g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = w*.08; g.shadowOffsetX = -w*.03; g.shadowOffsetY = w*.04; }
  g.drawImage(shadow ? spr.front : spr.back, HOLD_BOX.x0*spr.k, HOLD_BOX.y0*spr.k);
  g.restore();
}
