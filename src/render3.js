function handScreen(k, side, t){
  const st = HS[k][side];
  let pos = st.pos;
  if (st.fxBack){ const d = layOf(k).d; pos = { x:pos.x - d.x*st.fxBack, y:pos.y - d.y*st.fxBack }; }
  if (!RM){
    const ph = (k === 'D' ? 9 : k)*1.7 + (side === 'L' ? 0 : 2.1);
    pos = { x:pos.x + Math.sin(t/1400 + ph)*.22, y:pos.y + Math.cos(t/1700 + ph)*.18 };
  }
  const q = proj(pos);
  q.y -= (st.lift + (st.fxLift || 0))*U*q.s;
  return q;
}
// which finger pose to stamp this frame
function poseOf(k, side, st, t){
  if (st.pose && t < st.poseUntil) return st.pose;
  if (st.pose && st.poseUntil === Infinity) return st.pose;
  if (((H && H.think && H.think.i === k && side === 'R') || (st.drumUntil && t < st.drumUntil)) && !RM && !st.obj){
    // fingers roll little → index in a continuous wave, quantised to cached sprites
    const ph = t/1150*Math.PI*2 + (typeof k === 'number' ? k*1.3 : 0);
    return 'c' + [0, 1, 2, 3].map(i => Math.round((.1 + .62*Math.max(0, Math.sin(ph - i*.75))**2)*9)).join('');
  }
  return 'u' + Math.round(clamp(Math.max(st.curl, .2), 0, 1)*5);      // relaxed fingers, never a starfish
}
const HAND_SIZE = 12.5;
function armOut(k, side){
  // elbows bend away from the body's midline
  if (k === 'D') return FP() || TH.key === 'atari' ? unit({ x:0, y:0 }, { x:side === 'R' ? -.3 : .3, y:1 }) : unit({ x:0, y:0 }, { x:side === 'R' ? -.85 : .85, y:.55 });     // elbows out and down, never up
  if (FP() && k !== 0){ const a = uprightShoulder(k, 'L'), b = uprightShoulder(k, 'R'); return { x:Math.sign((side === 'L' ? a.x - b.x : b.x - a.x)) || (side === 'L' ? -1 : 1), y:0 }; }
  const lay = layOf(k), a = proj(lay.shoulder.L), b = proj(lay.shoulder.R), s = side === 'L' ? a : b;
  return unit({ x:(a.x + b.x)/2, y:(a.y + b.y)/2 }, s);
}
function handGeom(k, side, t){
  const q = handScreen(k, side, t);
  const sh = k === 'D' ? dealerShoulder(side) : (FP() && k !== 0 ? armShoulder(k, side) : proj(layOf(k).shoulder[side]));
  let qs = q.s;
  if (FP() && k !== 0) qs = Math.min(qs, proj(k === 'D' ? L.D.rail : layOf(k).rail).s*1.15);
  const size = HAND_SIZE*U*qs, flat = COS*.96;
  const r0 = proj(restOf(k, side));
  // seen from above, a seated player's upper arm hangs mostly downward, so it reads short; the forearm reads full length
  let el;
  if (k === 'D') el = FP() || TH.key === 'atari' ? ikElbow(sh, q, size*.55, size*.7, armOut(k, side)) : ikElbow(sh, q, size*.95, size*1.2, armOut(k, side));
  else if (FP() && k !== 0){
    // sitting upright: the upper arm drops from the shoulder along the side of the body, the forearm comes forward onto the felt
    const out = armOut(k, side), dx = q.x - sh.x, dy = q.y - sh.y, dl = Math.hypot(dx, dy) || 1;
    const Lu = Math.min(dl*.55, size*1.05);
    let ux = out.x*.32 + dx/dl*.3, uy = 1 + dy/dl*.3; const ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
    el = { x:sh.x + ux*Lu, y:sh.y + uy*Lu };
  }
  else {
    // elbows stay close to the body: only the slack in the arm pushes them out a little
    const out = armOut(k, side), dx = q.x - sh.x, dy = q.y - sh.y, dl = Math.hypot(dx, dy) || 1;
    let px = -dy/dl, py = dx/dl; if (px*out.x + py*out.y < 0){ px = -px; py = -py; }
    const bow = Math.min(Math.max(0, size*1.9 - dl)*.4, size*.32);
    el = { x:sh.x + dx*.36 + px*bow, y:sh.y + dy*.36 + py*bow };
  }
  const fa = Math.atan2((q.y - el.y)/flat, q.x - el.x);
  const lay = layOf(k), r1 = proj(add(restOf(k, side), lay.d, 5));
  const da = Math.atan2((r1.y - r0.y)/flat, r1.x - r0.x) + (side === 'L' ? .18 : -.18);
  let dd = da - fa; while (dd > Math.PI) dd -= 2*Math.PI; while (dd < -Math.PI) dd += 2*Math.PI;
  const ang = fa + dd*(k === 'D' ? .85 : .45);
  const reachTip = size*(.55 - clamp(HS[k][side].curl, 0, 1)*.18);
  const tip = { x:q.x + Math.cos(ang)*reachTip, y:q.y + Math.sin(ang)*reachTip*flat, s:q.s };
  return { q, sh, el, size, flat, ang, tip };
}
const tipScreen = (k, side) => handGeom(k, side, performance.now()).tip;
function drawArmHand(g, k, side, t){
  if (!HS[k]) return;
  const st = HS[k][side], person = k === 'D' ? DEALER : G.players[k];
  const { q, sh, el, size, flat, ang, tip } = handGeom(k, side, t);
  const A = drawArm(g, sh, el, q, size, sleeveOf(person), cuffOf(person));
  if (st.obj) st.obj(g, tip.x, tip.y, q.s);
  drawHand(g, q.x, q.y, ang, size, person.skin, { pose:poseOf(k, side, st, t), mirror:side === 'R', flat });
  drawCuff(g, A, q, size, k === 'D' ? '#e9e6de' : '#efebe2');
  return { A, sh, size };
}
function drawHands(g, t){
  const on = handsOn() && HS.D;
  if (on){ drawArmHand(g, 'D', 'R', t); drawArmHand(g, 'D', 'L', t); }
  g.drawImage(ovCv, 0, 0, CW, CH);
  drawDealerMouth(g, t);
  if (!on) return;
  const order = [];
  G.players.forEach((p, i) => { if (i && HS[i] && (p.inHand || p.chips > 0)) order.push(i); });
  order.sort((a, b) => L[a].rail.y - L[b].rail.y).forEach(i => {
    if (FP()){
      drawUpright(g, i, t);
      // the arm on the far side of the body goes first; the near arm, then both shoulder caps, sit over the torso
      const far = proj(restOf(i, 'L')).y < proj(restOf(i, 'R')).y ? 'L' : 'R', near = far === 'L' ? 'R' : 'L';
      ARM_WF = .72; const a1 = drawArmHand(g, i, far, t), a2 = drawArmHand(g, i, near, t); ARM_WF = 1;
      void a1; void a2;
    }
    else { drawArmHand(g, i, 'L', t); drawArmHand(g, i, 'R', t); drawBody(g, i, t); }
  });
}
/* ---- first person: opponents sit upright across the table, facing you ---- */
function uprightBase(i){ const lay = L[i]; return add(lay.rail, lay.d, -3); }
// every opponent sits square to the camera like a figure on a stage, so the shoulders are always side by side on screen
// (built from the table's own axes, seats at the near corners got one shoulder above the other and no chest at all)
function uprightShoulder(i, side){
  const q = proj(uprightBase(i)), k = U*q.s;
  const other = side === 'L' ? 'R' : 'L', hx = proj(restOf(i, side)).x, ox = proj(restOf(i, other)).x;
  const dir = hx === ox ? (side === 'L' ? -1 : 1) : Math.sign(hx - ox);
  const cx = clamp(q.x, 9.5*k, CW - 9.5*k);          // keep the whole body on screen at the near corners
  return { x:cx + dir*7.5*k, y:q.y - 15*k };
}
function armShoulder(i, side){
  const s = uprightShoulder(i, side), k = U*proj(uprightBase(i)).s;
  return { x:s.x, y:s.y + 1.6*k };
}
function drawUpright(g, i, t){
  const lay = L[i], p = G.players[i], base = proj(uprightBase(i)), k = U*base.s;
  const br = RM ? 0 : Math.sin(t/1700 + i*1.9)*.35;
  const sl = uprightShoulder(i, 'L'), sr = uprightShoulder(i, 'R');
  let tgt = potPt();
  if (H && !H.done && H.toAct > 0 && H.toAct !== i && L[H.toAct]) tgt = L[H.toAct].rail;
  if (H && H.toAct === 0 && !H.done) tgt = { x:TH.W/2, y:TH.H };
  const tq = proj(tgt), want = clamp((tq.x - base.x)/(CW*.5), -1, 1);
  headLook[i] = headLook[i] == null ? want : lerp(headLook[i], want, .05);
  const jacket = sleeveOf(p), cx0 = (sl.x + sr.x)/2, top = Math.min(sl.y, sr.y) - br*k;
  g.save();
  // torso: shoulders down to where the rail hides the body
  const tw = Math.abs(sr.x - sl.x) + 2.5*k;
  g.fillStyle = shade(jacket, -10);
  g.beginPath();
  g.moveTo(cx0 - tw/2, top + 3*k); g.quadraticCurveTo(cx0 - tw/2, top - 1*k, cx0 - tw*.3, top - 1.6*k);
  g.lineTo(cx0 + tw*.3, top - 1.6*k); g.quadraticCurveTo(cx0 + tw/2, top - 1*k, cx0 + tw/2, top + 3*k);
  g.lineTo(cx0 + tw*.42, base.y); g.lineTo(cx0 - tw*.42, base.y); g.closePath(); g.fill();
  g.fillStyle = shade(jacket, 25); g.fillRect(cx0 - tw*.45, top - 1*k, tw*.9, 1.4*k);
  // shirt front, lapels and tie
  g.fillStyle = '#efebe2'; g.beginPath(); g.moveTo(cx0 - 3*k, top - 1.6*k); g.lineTo(cx0 + 3*k, top - 1.6*k); g.lineTo(cx0, top + 9*k); g.closePath(); g.fill();
  g.fillStyle = i % 2 ? '#c8281c' : '#1c1c1c'; g.fillRect(cx0 - .7*k, top - 1*k, 1.4*k, 8*k);
  g.fillStyle = shade(jacket, -45); g.beginPath(); g.moveTo(cx0 - 3*k, top - 1.6*k); g.lineTo(cx0 - 1*k, top + 9*k); g.lineTo(cx0 - 5*k, top + 2*k); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(cx0 + 3*k, top - 1.6*k); g.lineTo(cx0 + 1*k, top + 9*k); g.lineTo(cx0 + 5*k, top + 2*k); g.closePath(); g.fill();
  // neck + head
  const hx = cx0 + headLook[i]*1.2*k, hy = top - 6.5*k, hr = 4.4*k;
  g.fillStyle = shade(p.skin, -30); g.fillRect(cx0 - 1.8*k, top - 3.5*k, 3.6*k, 2.5*k);
  g.fillStyle = p.skin; g.beginPath(); g.ellipse(hx, hy, hr*.86, hr, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = shade(p.skin, -40); g.beginPath(); g.ellipse(hx + hr*.3, hy + hr*.1, hr*.5, hr*.85, 0, -1.2, 1.2); g.fill();
  // face: eyes follow the action, a moustache on every other player
  const ex = headLook[i]*1.1*k;
  g.fillStyle = '#111';
  g.fillRect(hx - 1.7*k + ex, hy - .2*k, 1*k, 1*k); g.fillRect(hx + .8*k + ex, hy - .2*k, 1*k, 1*k);
  const mo = mouthOpen(i, t);
  g.fillStyle = '#3a0c0c'; g.fillRect(hx - 1.2*k + ex, hy + 2.3*k, 2.4*k, (.45 + mo*1.4)*k);             // mouth moves with the voice
  if (i % 2) { g.fillStyle = HAIR[i % HAIR.length]; g.fillRect(hx - 1.8*k + ex, hy + 1.5*k, 3.6*k, .9*k); }
  // hat
  const hat = HATS_MOD[i % HATS_MOD.length];
  g.fillStyle = shade(hat, -20); g.beginPath(); g.ellipse(hx, hy - hr*.55, hr*1.9, hr*.45, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = hat; g.beginPath(); g.moveTo(hx - hr*.95, hy - hr*.6); g.lineTo(hx - hr*.8, hy - hr*1.75); g.quadraticCurveTo(hx, hy - hr*1.45, hx + hr*.8, hy - hr*1.75); g.lineTo(hx + hr*.95, hy - hr*.6); g.closePath(); g.fill();
  g.fillStyle = '#1a120c'; g.fillRect(hx - hr*.95, hy - hr*.95, hr*1.9, hr*.3);
  g.restore();
  lay.headScreen = { x:hx, y:hy - hr*1.2 }; lay.headR = hr*1.6;
}
// a rounded shoulder in jacket cloth over the top of the sleeve, so the arm grows out of the body
function drawShoulderCap(g, i, a){
  const p = G.players[i], jacket = sleeveOf(p), { A, sh } = a, r = A.wS*.56;
  const u = A.u1;
  g.save();
  g.translate(sh.x - u.x*r*.25, sh.y - u.y*r*.25);
  g.rotate(Math.atan2(u.y, u.x) - Math.PI/2);
  const gr = g.createLinearGradient(-r, -r, r, r);
  gr.addColorStop(0, shade(jacket, 24)); gr.addColorStop(.55, jacket); gr.addColorStop(1, shade(jacket, -30));
  g.fillStyle = gr;
  g.beginPath(); g.ellipse(0, 0, r*1.05, r*1.15, 0, Math.PI*1.02, Math.PI*1.98 + Math.PI, false); g.fill();
  g.restore();
}
/* ---- seated players: shoulders, collar and the top of the head (hat in the saloon), seen from above ---- */
const HAIR = ['#2a1d14', '#4a3020', '#121010', '#8a6a3a', '#6b3a22', '#9a9590', '#3a2a1c', '#c9a46a'];
const HATS = ['#3b2a1c', '#1c1a18', '#6b5136', '#4a4038', '#2e2a24', '#5a4630', '#24201c', '#7a6a50'];
const HATS_MOD = ['#2a2d33', '#1c1e22', '#4a4f57', '#3a3226', '#23272e', '#5a5f66', '#30343b', '#6b5d4a'];
const headLook = {};
function drawBody(g, i, t){
  const lay = L[i], p = G.players[i], sal = TH.key === 'saloon';
  const m = add(lay.rail, lay.d, -12), c = add(m, lay.d, -2.5);
  const br = RM ? 0 : Math.sin(t/1700 + i*1.9);                              // breathing
  // where is this player looking: whoever is acting, else the pot
  let tgt = potPt();
  if (H && !H.done && H.toAct > 0 && H.toAct !== i && L[H.toAct]) tgt = L[H.toAct].rail;
  if (H && H.toAct === 0 && !H.done) tgt = { x:TH.W/2, y:TH.H };
  if (H && H.spot >= 0 && L[H.spot]) tgt = L[H.spot].rail;
  const dx = tgt.x - m.x, dy = tgt.y - m.y, dl = Math.hypot(dx, dy) || 1;
  const want = clamp((dx*lay.lat.x + dy*lay.lat.y)/dl, -1, 1)*1.6 + (RM ? 0 : Math.sin(t/2900 + i*2.3)*.35);
  headLook[i] = headLook[i] == null ? want : lerp(headLook[i], want, .04);
  const P2 = (a, b, o = c) => proj(add(add(o, lay.lat, a), lay.d, b));
  const ring = (o, rx, rd, n = 28, pw = 2.4) => { const pts = []; for (let k = 0; k < n; k++){ const a = k/n*Math.PI*2, ca = Math.cos(a), sa = Math.sin(a);
    pts.push(P2(Math.sign(ca)*Math.abs(ca)**(2/pw)*rx, Math.sign(sa)*Math.abs(sa)**(2/pw)*rd, o)); } return pts; };
  const fillPts = (pts) => { g.beginPath(); pts.forEach((q, k) => k ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath(); };
  const jacket = sleeveOf(p), q0 = proj(c), k = U*q0.s;
  g.save();
  // soft shadow the body throws on the floor / rail
  g.fillStyle = 'rgba(0,0,0,.35)'; fillPts(ring(add(c, lay.d, -1), 14, 9)); g.fill();
  // shoulders and upper back
  const sh = ring(c, 12.5 + br*.12, 7.2 + br*.12, 32, 2.8);
  const front = P2(0, 7), back = P2(0, -7);
  const jg = g.createLinearGradient(front.x, front.y, back.x, back.y);
  jg.addColorStop(0, shade(jacket, 26)); jg.addColorStop(.45, jacket); jg.addColorStop(1, shade(jacket, -45));
  g.fillStyle = jg; fillPts(sh); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = Math.max(1, .2*k); g.stroke();
  // shoulder seams
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = Math.max(1, .25*k);
  for (const sx of [-1, 1]){ const a = P2(sx*6.5, 5), b = P2(sx*9.5, 0), e = P2(sx*7, -5); g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo(b.x, b.y, e.x, e.y); g.stroke(); }
  // collar line where the neck meets the jacket
  { const a1 = P2(-3.6, 4.2), a2 = P2(0, 6.4), a3 = P2(3.6, 4.2); g.strokeStyle = 'rgba(236,230,218,.85)'; g.lineWidth = Math.max(1, .55*k); g.beginPath(); g.moveTo(a1.x, a1.y); g.quadraticCurveTo(a2.x, a2.y, a3.x, a3.y); g.stroke(); }
  // head, a little higher than the shoulders, turned toward the action
  const hc = add(add(m, lay.lat, headLook[i]*.6), lay.d, -.8 + br*.08);
  const lift = 3.4*k;
  const HP = (a, b) => { const q = P2(a, b, hc); q.y -= lift; return q; };
  const hring = (rx, rd, n = 24, off = 0) => { const pts = []; for (let kk = 0; kk < n; kk++){ const a = kk/n*Math.PI*2; pts.push(HP(Math.cos(a)*rx + off*0, Math.sin(a)*rd)); } return pts; };
  const lookA = headLook[i]*.12;
  const rot = (a, b) => ({ a:a*Math.cos(lookA) - b*Math.sin(lookA), b:a*Math.sin(lookA) + b*Math.cos(lookA) });
  const HR = (a, b) => { const r = rot(a, b); return HP(r.a, r.b); };
  const hr = (rx, rd, n = 24) => { const pts = []; for (let kk = 0; kk < n; kk++){ const a = kk/n*Math.PI*2; pts.push(HR(Math.cos(a)*rx, Math.sin(a)*rd)); } return pts; };
  // neck shadow
  g.fillStyle = 'rgba(0,0,0,.35)'; fillPts(hring(4.6, 5)); g.fill();
  const skin = p.skin;
  // ears
  for (const sx of [-1, 1]){ const e = HR(sx*4.25, .6); g.fillStyle = shade(skin, -18); g.beginPath(); g.ellipse(e.x, e.y, 1*k, 1.5*k, 0, 0, Math.PI*2); g.fill(); }
  // skull: forehead/face edge toward the table catches the lamp
  const hg = g.createLinearGradient(HR(0, 5).x, HR(0, 5).y, HR(0, -5).x, HR(0, -5).y);
  hg.addColorStop(0, shade(skin, 18)); hg.addColorStop(1, shade(skin, -50));
  g.fillStyle = hg; fillPts(hr(4.1, 5)); g.fill();
  if (true){
    // wide-brimmed hat (both tables)
    const hat = (sal ? HATS : HATS_MOD)[i % HATS.length];
    const brim = hr(8.6, 8.2, 32);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.save(); g.translate(.6*k, 1.2*k); fillPts(brim); g.fill(); g.restore();
    const bg = g.createLinearGradient(HR(0, 8).x, HR(0, 8).y, HR(0, -8).x, HR(0, -8).y);
    bg.addColorStop(0, shade(hat, 30)); bg.addColorStop(.5, hat); bg.addColorStop(1, shade(hat, -30));
    g.fillStyle = bg; fillPts(brim); g.fill();
    g.strokeStyle = shade(hat, -45); g.lineWidth = Math.max(1, .35*k); g.stroke();
    const crown = hr(4.6, 5.4, 24).map(q => ({ x:q.x, y:q.y - 1.6*k }));
    g.fillStyle = shade(hat, 10); fillPts(crown); g.fill();
    g.strokeStyle = '#1a120c'; g.lineWidth = Math.max(1.2, .7*k); g.stroke();             // band
    const cr1 = HR(0, 3.6), cr2 = HR(0, -3.6);
    g.strokeStyle = shade(hat, -40); g.lineWidth = Math.max(1, .45*k); g.beginPath(); g.moveTo(cr1.x, cr1.y - 1.9*k); g.lineTo(cr2.x, cr2.y - 1.9*k); g.stroke();   // crease
    const hl = HR(-1.6, 1.8); g.fillStyle = 'rgba(255,240,210,.12)'; g.beginPath(); g.ellipse(hl.x, hl.y - 2*k, 1.6*k, 1.1*k, 0, 0, Math.PI*2); g.fill();
  } else {
    // hair, parted, with a cap on every third player
    const hair = HAIR[i % HAIR.length];
    const hp = hr(4.25, 5.05).map((q, kk) => kk > 2 && kk < 10 ? HR(Math.cos(kk/24*Math.PI*2)*4.25, Math.sin(kk/24*Math.PI*2)*3.2) : q);
    const hgr = g.createLinearGradient(HR(0, 4).x, HR(0, 4).y, HR(0, -5).x, HR(0, -5).y);
    hgr.addColorStop(0, shade(hair, 22)); hgr.addColorStop(1, shade(hair, -20));
    g.fillStyle = hgr; fillPts(hp); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = Math.max(.6, .2*k);
    for (let s2 = -2; s2 <= 2; s2++){ const a = HR(s2*.9, 3), b = HR(s2*1.3, -4.6); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    const crown = HR(-.6, -1.2); g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.ellipse(crown.x, crown.y, 1.8*k, 1.3*k, 0, 0, Math.PI*2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = Math.max(1, .25*k); fillPts(hp); g.stroke();
  }
  g.restore();
  lay.headScreen = HR(0, 0); lay.headR = 8.6*k;
}
// players sit just outside the lamplight: their shoulders fade into the room
function shoulderShade(g, i){
  const lay = L[i], m = add(add(lay.rail, lay.d, -17), lay.lat, 0), q = proj(m), r = 15*U*q.s;
  const c = TH.key === 'saloon' ? '16,10,6' : '6,11,22';
  const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
  gr.addColorStop(0, `rgba(${c},.92)`); gr.addColorStop(.5, `rgba(${c},.62)`); gr.addColorStop(1, `rgba(${c},0)`);
  g.fillStyle = gr; g.beginPath(); g.ellipse(q.x, q.y, r, r*.85, 0, 0, Math.PI*2); g.fill();
}
function dealerBody(){
  const t = proj({ x:TH.W/2, y:.5 }), k = U*t.s, x0 = t.x, y0 = t.y + 2*k, X = v => x0 + v*k, Y = v => y0 + v*k;
  const body = new Path2D();
  body.moveTo(X(-15.5), Y(3));
  body.bezierCurveTo(X(-15.8), Y(-3), X(-17.6), Y(-8), X(-17.4), Y(-12));      // side up to the deltoid
  body.bezierCurveTo(X(-17.2), Y(-15.2), X(-13.5), Y(-16.4), X(-9), Y(-17));    // round shoulder
  body.bezierCurveTo(X(-6.5), Y(-17.4), X(-4.6), Y(-17.9), X(-3.4), Y(-19.2));  // trapezius into the neck
  body.lineTo(X(3.4), Y(-19.2));
  body.bezierCurveTo(X(4.6), Y(-17.9), X(6.5), Y(-17.4), X(9), Y(-17));
  body.bezierCurveTo(X(13.5), Y(-16.4), X(17.2), Y(-15.2), X(17.4), Y(-12));
  body.bezierCurveTo(X(17.6), Y(-8), X(15.8), Y(-3), X(15.5), Y(3));
  body.closePath();
  return body;
}
/* ---- dealer's shoulder yoke: the part of his shirt that sits over the top of the sleeves ---- */
function dealerYoke(){
  const t = proj({ x:TH.W/2, y:.5 }), k = U*t.s, x0 = t.x, y0 = t.y + 2*k, X = v => x0 + v*k, Y = v => y0 + v*k;
  const p = new Path2D();
  p.moveTo(X(-23), Y(-30)); p.lineTo(X(23), Y(-30)); p.lineTo(X(23), Y(-11));
  p.bezierCurveTo(X(19), Y(-9.4), X(15), Y(-9.2), X(12.4), Y(-10.6));         // armhole seam, right
  p.lineTo(X(-12.4), Y(-10.6));
  p.bezierCurveTo(X(-15), Y(-9.2), X(-19), Y(-9.4), X(-23), Y(-11));          // armhole seam, left
  p.closePath();
  return p;
}
function paintShoulderSeams(g){
  const t = proj({ x:TH.W/2, y:.5 }), k = U*t.s, x0 = t.x, y0 = t.y + 2*k, X = v => x0 + v*k, Y = v => y0 + v*k;
  g.save();
  for (const sx of [-1, 1]){
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = Math.max(1, .35*k);
    g.beginPath(); g.moveTo(X(sx*12.6), Y(-10.5)); g.bezierCurveTo(X(sx*14.8), Y(-9.3), X(sx*17), Y(-9.4), X(sx*18.6), Y(-10.4)); g.stroke();
  }
  g.restore();
}
/* ---- dealer, painted into the static layer behind the table ---- */
function paintDealerTorso(g, overlay){
  const sal = TH.key === 'saloon';
  const t = proj({ x:TH.W/2, y:.5 }), k = U*t.s, x0 = t.x, y0 = t.y + 2*k;
  const shirt = '#ece8df', vest = sal ? '#3a2416' : '#141c2c';
  const X = v => x0 + v*k, Y = v => y0 + v*k;
  g.save();
  // the dealer sits back in shadow; soft shape behind him
  if (!overlay) soft(g, 14*k, 'rgba(0,0,0,.55)', s => { s.beginPath(); s.ellipse(X(0), Y(-8), 22*k, 12*k, 0, 0, Math.PI*2); s.fill(); });
  // shirt: neck base → sloping shoulders → rounded deltoids → sides down behind the rail
  const body = dealerBody();
  const sg = g.createLinearGradient(X(-19.5), 0, X(19.5), 0);
  sg.addColorStop(0, shade(shirt, -55)); sg.addColorStop(.16, shade(shirt, -22)); sg.addColorStop(.38, shade(shirt, -4));
  sg.addColorStop(.55, shirt); sg.addColorStop(.8, shade(shirt, -20)); sg.addColorStop(1, shade(shirt, -60));
  g.fillStyle = sg; g.fill(body);
  g.save(); g.clip(body);
  // light from the lamp falls on the tops of the shoulders, the lower torso falls off into shadow
  const vg = g.createLinearGradient(0, Y(-19), 0, Y(3));
  vg.addColorStop(0, 'rgba(255,246,226,.25)'); vg.addColorStop(.35, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
  g.fillStyle = vg; g.fillRect(X(-22), Y(-20), 44*k, 24*k);
  // shirt folds by the armpits
  soft(g, 1.2*k, 'rgba(60,50,40,.35)', s => { s.lineWidth = .5*k; for (const sx of [-1, 1]){ s.beginPath(); s.moveTo(X(sx*17), Y(-7)); s.quadraticCurveTo(X(sx*15.5), Y(-4), X(sx*16.5), Y(0)); s.stroke(); } });
  g.restore();
  // vest panels with a deep V
  const V = new Path2D();
  V.moveTo(X(-15.5), Y(3)); V.lineTo(X(-15.2), Y(-9));
  V.bezierCurveTo(X(-14.6), Y(-12.6), X(-11), Y(-14.2), X(-6.6), Y(-15.6));
  V.bezierCurveTo(X(-4.8), Y(-16.3), X(-3.8), Y(-17), X(-3.1), Y(-18));
  V.lineTo(X(0), Y(-7.5)); V.lineTo(X(3.1), Y(-18));
  V.bezierCurveTo(X(3.8), Y(-17), X(4.8), Y(-16.3), X(6.6), Y(-15.6));
  V.bezierCurveTo(X(11), Y(-14.2), X(14.6), Y(-12.6), X(15.2), Y(-9));
  V.lineTo(X(15.5), Y(3)); V.closePath();
  const vgr = g.createLinearGradient(X(-15.5), 0, X(15.5), 0);
  vgr.addColorStop(0, shade(vest, -30)); vgr.addColorStop(.3, shade(vest, 12)); vgr.addColorStop(.48, shade(vest, 30)); vgr.addColorStop(.62, shade(vest, 10)); vgr.addColorStop(1, shade(vest, -34));
  g.fillStyle = vgr; g.fill(V);
  g.save(); g.clip(V);
  if (sal){
    g.strokeStyle = 'rgba(214,170,100,.12)'; g.lineWidth = Math.max(1, .2*k);
    for (let yy = -19, r = 0; yy < 4; yy += 2.1, r++) for (let xx = -16; xx < 16; xx += 2.5){ g.beginPath(); g.arc(X(xx + (r % 2)*1.25), Y(yy), .55*k, 0, Math.PI*2); g.stroke(); }
  } else {
    const sh = g.createLinearGradient(X(-12), Y(-16), X(6), Y(2)); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.5, 'rgba(150,180,230,.14)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.fillRect(X(-16), Y(-20), 32*k, 24*k);
  }
  const vd = g.createLinearGradient(0, Y(-16), 0, Y(3)); vd.addColorStop(0, 'rgba(255,240,210,.1)'); vd.addColorStop(1, 'rgba(0,0,0,.5)');
  g.fillStyle = vd; g.fillRect(X(-16), Y(-20), 32*k, 24*k);
  // lapel edges and pocket welts
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = Math.max(1, .25*k);
  g.beginPath(); g.moveTo(X(-3), Y(-17.6)); g.lineTo(X(-.2), Y(-8)); g.moveTo(X(3), Y(-17.6)); g.lineTo(X(.2), Y(-8)); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = Math.max(1, .3*k);
  for (const sx of [-1, 1]){ g.beginPath(); g.moveTo(X(sx*6), Y(-3.5)); g.lineTo(X(sx*11), Y(-4.2)); g.stroke(); }
  g.restore();
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = Math.max(1, .25*k); g.stroke(V);
  g.fillStyle = sal ? '#c9a24f' : '#c9ced8';
  for (const by of [-5.6, -2.8, 0]){ g.beginPath(); g.arc(X(0), Y(by), .55*k, 0, Math.PI*2); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(X(-.15), Y(by - .15), .2*k, 0, Math.PI*2); g.fill(); g.fillStyle = sal ? '#c9a24f' : '#c9ced8'; }
  if (sal){                         // watch chain from the button to the pocket
    g.strokeStyle = '#d8b25a'; g.lineWidth = Math.max(1, .22*k); g.beginPath(); g.moveTo(X(0), Y(-2.8)); g.quadraticCurveTo(X(-4), Y(-.6), X(-8.5), Y(-3.9)); g.stroke();
  }
  // neck and collar, the head itself is up inside the lamp's shadow
  const neck = g.createLinearGradient(0, Y(-23), 0, Y(-17));
  neck.addColorStop(0, shade(DEALER.skin, -110)); neck.addColorStop(1, shade(DEALER.skin, -55));
  g.fillStyle = neck; g.beginPath(); g.moveTo(X(-3.4), Y(-17.5)); g.lineTo(X(-3.6), Y(-24)); g.lineTo(X(3.6), Y(-24)); g.lineTo(X(3.4), Y(-17.5)); g.closePath(); g.fill();
  g.fillStyle = shirt; g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = Math.max(1, .2*k);
  for (const sx of [-1, 1]){ g.beginPath(); g.moveTo(X(sx*4.1), Y(-20.2)); g.lineTo(X(sx*.4), Y(-16.4)); g.lineTo(X(sx*3.3), Y(-16.2)); g.lineTo(X(sx*4.4), Y(-18.4)); g.closePath(); g.fill(); g.stroke(); }
  if (TH.key === 'atari' || FP()){
    // head: neck, ears, face, slicked hair, dealer's visor and a big handlebar mustache
    const hx = X(0), hy = Y(-26.6), hr = 6*k, skin = DEALER.skin;
    const nk = g.createLinearGradient(0, Y(-24), 0, Y(-18));
    nk.addColorStop(0, shade(skin, -55)); nk.addColorStop(1, shade(skin, -25));
    g.fillStyle = nk; g.beginPath(); g.moveTo(X(-2.8), Y(-18)); g.lineTo(X(-2.6), Y(-24)); g.lineTo(X(2.6), Y(-24)); g.lineTo(X(2.8), Y(-18)); g.closePath(); g.fill();
    for (const sx of [-1, 1]){ g.fillStyle = shade(skin, -18); g.beginPath(); g.ellipse(hx + sx*hr*.86, hy + .4*k, 1.1*k, 1.7*k, 0, 0, Math.PI*2); g.fill(); }
    const fg = g.createRadialGradient(hx - hr*.3, hy - hr*.3, hr*.2, hx, hy, hr*1.1);
    fg.addColorStop(0, shade(skin, 18)); fg.addColorStop(.7, skin); fg.addColorStop(1, shade(skin, -38));
    g.fillStyle = fg; g.beginPath(); g.ellipse(hx, hy, hr*.84, hr, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(hx, hy + hr*.72, hr*.55, hr*.28, 0, 0, Math.PI*2); g.fill();     // jaw shadow
    g.fillStyle = '#1e140c';                                                                                                // hair
    g.beginPath(); g.ellipse(hx, hy - hr*.42, hr*.88, hr*.62, 0, Math.PI*1.02, Math.PI*1.98); g.closePath(); g.fill();
    g.fillRect(hx - hr*.86, hy - hr*.5, hr*.22, hr*.7); g.fillRect(hx + hr*.64, hy - hr*.5, hr*.22, hr*.7);
    g.fillStyle = shade(skin, -25); g.beginPath(); g.ellipse(hx, hy + .6*k, 1*k, 1.6*k, 0, 0, Math.PI*2); g.fill();          // nose
    g.fillStyle = shade(skin, 30); g.beginPath(); g.ellipse(hx - .3*k, hy + .5*k, .35*k, .7*k, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = '#fff'; for (const sx of [-1, 1]){ g.beginPath(); g.ellipse(hx + sx*1.8*k, hy - .9*k, .8*k, .5*k, 0, 0, Math.PI*2); g.fill(); }
    g.fillStyle = '#1a1a1a'; for (const sx of [-1, 1]){ g.beginPath(); g.arc(hx + sx*1.8*k, hy - .85*k, .42*k, 0, Math.PI*2); g.fill(); }
    g.fillStyle = '#2a1608'; for (const sx of [-1, 1]){ g.save(); g.translate(hx + sx*1.9*k, hy - 2.2*k); g.rotate(sx*-.12); g.fillRect(-1.3*k, -.3*k, 2.6*k, .6*k); g.restore(); }
    // the mustache: a huge handlebar curled up at both ends
    g.fillStyle = '#2a1608';
    g.save(); g.translate(hx, hy + 2.6*k); g.scale(1.2, 1.1); g.translate(-hx, -hy - 1.8*k);
    for (const sx of [-1, 1]){
      g.beginPath();
      g.moveTo(hx, hy + 1.8*k);
      g.bezierCurveTo(hx + sx*3*k, hy + 1*k, hx + sx*6*k, hy + 3.6*k, hx + sx*9*k, hy + 2.2*k);
      g.bezierCurveTo(hx + sx*11.5*k, hy + 1*k, hx + sx*11*k, hy - 2*k, hx + sx*9.2*k, hy - 1.6*k);
      g.bezierCurveTo(hx + sx*10.2*k, hy - .4*k, hx + sx*9.6*k, hy + 1*k, hx + sx*8.4*k, hy + 1*k);
      g.bezierCurveTo(hx + sx*6*k, hy + 1.2*k, hx + sx*3*k, hy + 4.4*k, hx, hy + 3.2*k);
      g.closePath(); g.fill();
    }
    g.fillStyle = 'rgba(255,220,180,.18)'; g.fillRect(hx - 4*k, hy + 2.1*k, 8*k, .35*k);
    g.restore();
    g.fillStyle = shade(skin, -60); g.fillRect(hx - 1.2*k, hy + 4.4*k, 2.4*k, .4*k);                                         // mouth
    if (TH.key === 'saloon'){
      // saloon dealer: black bowler hat
      g.fillStyle = '#1a1410'; g.beginPath(); g.ellipse(hx, hy - hr*.62, hr*1.25, hr*.3, 0, 0, Math.PI*2); g.fill();
      g.beginPath(); g.ellipse(hx, hy - hr*.95, hr*.82, hr*.62, 0, Math.PI, 0); g.closePath(); g.fill();
      g.fillStyle = '#4a2a18'; g.fillRect(hx - hr*.82, hy - hr*.82, hr*1.64, hr*.16);
      g.fillStyle = 'rgba(255,240,210,.12)'; g.beginPath(); g.ellipse(hx - hr*.3, hy - hr*1.2, hr*.25, hr*.15, -.4, 0, Math.PI*2); g.fill();
    } else if (TH.key === 'regular'){
      // modern dealer: neat side part, no hat
      g.fillStyle = '#2a1c12'; g.beginPath(); g.ellipse(hx, hy - hr*.55, hr*.9, hr*.55, 0, Math.PI, 0); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = Math.max(1, .3*k); g.beginPath(); g.moveTo(hx - hr*.3, hy - hr*1.05); g.lineTo(hx - hr*.4, hy - hr*.6); g.stroke();
    } else {
    // green dealer's visor with a band
    const vg2 = g.createLinearGradient(0, hy - hr*.9, 0, hy - hr*.2);
    vg2.addColorStop(0, '#2fa048'); vg2.addColorStop(1, '#14602a');
    g.fillStyle = 'rgba(30,140,60,.22)'; g.beginPath(); g.ellipse(hx, hy - hr*.45, hr*.8, hr*.2, 0, 0, Math.PI); g.fill();      // green light on the brow
    g.fillStyle = vg2; g.beginPath(); g.ellipse(hx, hy - hr*.74, hr*1.15, hr*.26, 0, 0, Math.PI); g.closePath(); g.fill();
    g.fillStyle = '#0e2a14'; g.fillRect(hx - hr*.84, hy - hr*.9, hr*1.68, hr*.18);
    }
  }
  if (sal){
    g.fillStyle = '#1b1210';
    for (const sx of [-1, 1]){ g.beginPath(); g.moveTo(X(0), Y(-17.4)); g.lineTo(X(sx*2.5), Y(-18.6)); g.lineTo(X(sx*2.5), Y(-16.2)); g.closePath(); g.fill(); }
    g.beginPath(); g.arc(X(0), Y(-17.4), .55*k, 0, Math.PI*2); g.fill();
  } else {
    g.fillStyle = '#8a1a2a'; g.beginPath(); g.moveTo(X(-.9), Y(-17.2)); g.lineTo(X(.9), Y(-17.2)); g.lineTo(X(1.3), Y(-9.2)); g.lineTo(X(0), Y(-7.9)); g.lineTo(X(-1.3), Y(-9.2)); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(X(-.3), Y(-16.8), .6*k, 7*k);
    g.fillStyle = '#d9b45a'; sq(g, X(-12.6), Y(-12.4), 7*k, 2*k, .4*k); g.fill();
    g.fillStyle = '#1b1505'; g.font = font(1.3*k, F_UI, '800'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('DEALER', X(-9.1), Y(-11.35));
  }
  g.restore();
}

/* ---- pendant lamp: a lathe-turned shade with real volume, lighting the felt ---- */
function paintPendant(g, part){
  const sal = TH.key === 'saloon';
  const t = proj({ x:TH.W/2, y:.5 }), k = U*t.s, x0 = t.x, sy = t.y - (TH.key === 'atari' || FP() ? (CW < CH*.9 && FP() ? 50 : 41) : sal ? 18.6 : 19)*k;
  const rt = (sal ? 4 : 3)*k, rb = (sal ? 15 : 14)*k, hgt = (sal ? 11 : 6.5)*k, er = .27;
  const R = u => sal ? rt + (rb - rt)*(u*.82 + u*u*.18) : rt + (rb - rt)*Math.sin(u*Math.PI/2)**.9;
  const Yu = u => sy - hgt*(1 - u);
  g.save();
  // light pool on the felt and a faint cone of light
  const c = proj({ x:TH.W/2, y:TH.H*.42 });
  const pool = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(CW, CH)*.55);
  pool.addColorStop(0, sal ? 'rgba(255,214,140,.16)' : 'rgba(255,240,215,.1)'); pool.addColorStop(1, 'rgba(0,0,0,0)');
  if (part === 'pool'){ g.globalCompositeOperation = 'lighter'; g.fillStyle = pool; g.fillRect(0, 0, CW, CH); g.restore(); return; }
  // cord / chain
  g.strokeStyle = sal ? '#2a1a0e' : '#0b0f15'; g.lineWidth = Math.max(1.5, .45*k);
  g.beginPath(); g.moveTo(x0, -10); g.lineTo(x0, Yu(0) - 2*k); g.stroke();
  if (sal){ g.strokeStyle = '#a0782e'; g.lineWidth = Math.max(1, .3*k); for (let y = Yu(0) - 3*k; y > -10; y -= 1.6*k){ g.beginPath(); g.ellipse(x0, y, .5*k, .8*k, 0, 0, Math.PI*2); g.stroke(); } }
  // light escaping under the rim
  const ug = g.createRadialGradient(x0, sy + 1.5*k, 0, x0, sy + 1.5*k, rb);
  ug.addColorStop(0, sal ? 'rgba(255,228,165,.75)' : 'rgba(255,248,232,.7)'); ug.addColorStop(.45, sal ? 'rgba(255,214,140,.18)' : 'rgba(255,240,215,.14)'); ug.addColorStop(1, 'rgba(255,220,150,0)');
  g.fillStyle = ug; g.beginPath(); g.ellipse(x0, sy + 1.2*k, rb*.95, rb*er*1.3, 0, 0, Math.PI*2); g.fill();
  // shade silhouette: left profile → front half of the rim → right profile → front half of the top opening
  const N = 24, P = new Path2D();
  for (let i = 0; i <= N; i++){ const u = i/N; i ? P.lineTo(x0 - R(u), Yu(u)) : P.moveTo(x0 - R(u), Yu(u)); }
  for (let i = 1; i <= N; i++){ const a = Math.PI - i/N*Math.PI; P.lineTo(x0 + rb*Math.cos(a), sy + rb*er*Math.sin(a)); }
  for (let i = N; i >= 0; i--){ const u = i/N; P.lineTo(x0 + R(u), Yu(u)); }
  for (let i = 1; i <= N; i++){ const a = i/N*Math.PI; P.lineTo(x0 + rt*Math.cos(a), Yu(0) + rt*er*Math.sin(a)); }
  P.closePath();
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 3*k; g.shadowOffsetY = 1.5*k;
  g.fillStyle = sal ? '#174a2a' : '#9c7c34'; g.fill(P);
  g.shadowColor = 'transparent';
  g.save(); g.clip(P);
  // cylindrical shading across the shade
  const hz = g.createLinearGradient(x0 - rb, 0, x0 + rb, 0);
  if (sal){ hz.addColorStop(0, '#061a0d'); hz.addColorStop(.18, '#11402a'); hz.addColorStop(.36, '#3f9a62'); hz.addColorStop(.46, '#2b7a4a'); hz.addColorStop(.72, '#154a2c'); hz.addColorStop(1, '#04140a'); }
  else { hz.addColorStop(0, '#2e2310'); hz.addColorStop(.2, '#7a5f26'); hz.addColorStop(.36, '#f4dc98'); hz.addColorStop(.46, '#caa552'); hz.addColorStop(.7, '#7d6229'); hz.addColorStop(1, '#241b0b'); }
  g.fillStyle = hz; g.fillRect(x0 - rb - 2, Yu(0) - 2*k, rb*2 + 4, hgt + rb*er + 4*k);
  // top darker, lower edge glows through (glass) or catches the light (metal)
  const vt = g.createLinearGradient(0, Yu(0), 0, sy + rb*er);
  vt.addColorStop(0, 'rgba(0,0,0,.35)'); vt.addColorStop(.6, 'rgba(0,0,0,0)'); vt.addColorStop(1, sal ? 'rgba(170,255,190,.22)' : 'rgba(255,240,200,.25)');
  g.fillStyle = vt; g.fillRect(x0 - rb - 2, Yu(0) - 2*k, rb*2 + 4, hgt + rb*er + 4*k);
  // latitude rings give it turned-metal / blown-glass volume
  for (const u of sal ? [.25, .5, .75] : [.2, .42, .64, .84]){
    g.strokeStyle = sal ? 'rgba(200,255,215,.08)' : 'rgba(255,245,210,.16)'; g.lineWidth = Math.max(1, .18*k);
    g.beginPath(); g.ellipse(x0, Yu(u), R(u), R(u)*er, 0, 0, Math.PI); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.14)';
    g.beginPath(); g.ellipse(x0, Yu(u) + .35*k, R(u), R(u)*er, 0, 0, Math.PI); g.stroke();
  }
  // specular streak and a window reflection
  soft(g, 1.6*k, sal ? 'rgba(220,255,230,.5)' : 'rgba(255,252,236,.75)', s => {
    s.beginPath();
    for (let i = 0; i <= 12; i++){ const u = .08 + i/12*.84; const x = x0 - R(u)*.42; i ? s.lineTo(x, Yu(u)) : s.moveTo(x, Yu(u)); }
    for (let i = 12; i >= 0; i--){ const u = .08 + i/12*.84; s.lineTo(x0 - R(u)*.3, Yu(u)); }
    s.closePath(); s.fill();
  });
  soft(g, .8*k, 'rgba(255,255,255,.22)', s => { s.beginPath(); s.ellipse(x0 + R(.5)*.45, Yu(.45), R(.5)*.06, hgt*.18, -.15, 0, Math.PI*2); s.fill(); });
  g.restore();
  // rim: rolled edge with the bright lining just visible
  g.lineWidth = Math.max(1.6, .7*k); g.strokeStyle = sal ? '#b8913f' : '#e9cf86';
  g.beginPath(); g.ellipse(x0, sy, rb, rb*er, 0, 0, Math.PI); g.stroke();
  g.lineWidth = Math.max(1, .25*k); g.strokeStyle = sal ? '#fff1c8' : '#fffaf0';
  g.beginPath(); g.ellipse(x0, sy + .45*k, rb*.985, rb*er*.985, 0, .15, Math.PI - .15); g.stroke();
  g.lineWidth = Math.max(1, .25*k); g.strokeStyle = 'rgba(0,0,0,.4)';
  g.beginPath(); g.ellipse(x0, sy - .45*k, rb*.99, rb*er*.99, 0, .1, Math.PI - .1); g.stroke();
  // top opening and fitting
  g.fillStyle = '#0c0805'; g.beginPath(); g.ellipse(x0, Yu(0), rt, rt*er, 0, 0, Math.PI*2); g.fill();
  const fit = g.createLinearGradient(x0 - rt*.7, 0, x0 + rt*.7, 0);
  fit.addColorStop(0, '#4a3610'); fit.addColorStop(.35, '#f2d48a'); fit.addColorStop(1, '#3a2a0c');
  g.fillStyle = fit; g.beginPath();
  g.moveTo(x0 - rt*.55, Yu(0)); g.lineTo(x0 - rt*.4, Yu(0) - 2.4*k); g.lineTo(x0 + rt*.4, Yu(0) - 2.4*k); g.lineTo(x0 + rt*.55, Yu(0));
  g.ellipse(x0, Yu(0), rt*.55, rt*.55*er, 0, 0, Math.PI); g.closePath(); g.fill();
  g.fillStyle = fit; g.beginPath(); g.ellipse(x0, Yu(0) - 2.4*k, rt*.4, rt*.4*er, 0, 0, Math.PI*2); g.fill();
  g.restore();
}

/* ---- dynamic drawing helpers ---- */
function font(px, fam, w = ''){ return `${w} ${px}px ${fam}`.trim(); }
const F_UI0 = '"Barlow Condensed","Arial Narrow",sans-serif', F_PIXEL = '"Press Start 2P",ui-monospace,monospace';
let F_UI = F_UI0;
const F_OLD = '"IM Fell English SC",Georgia,serif';
const F_WEST = '"Rye","DM Serif Display",Georgia,serif';
// compact name tag: sits where the player's body is, in the shadow beyond the rail
// text on the table keeps a phone-friendly size in first person, where the scale near the camera is large
const LS = s => FP() ? Math.min(s, 4.2/U) : s;
function drawTag(g, x, y, name, stack, s, o = {}){
  s = LS(s);
  const sal = TH.key === 'saloon';
  const pix = TH.key === 'atari', fs = pix ? 8 : Math.max(10, 2.25*U*s), fs2 = pix ? 8 : Math.max(10.5, 2.4*U*s);
  g.save();
  g.font = sal ? font(fs, F_OLD) : font(fs, F_UI, '600');
  const nw = g.measureText(name).width;
  g.font = sal ? font(fs2, F_OLD) : font(fs2, F_UI, '700');
  const sw = g.measureText(money(stack)).width;
  const w = Math.max(nw, sw) + fs*1.5, h = fs*1.2 + fs2*1.15 + 6;
  x = clamp(x, w/2 + 4, CW - w/2 - 4); y = clamp(y, h/2 + 4, CH - h/2 - 4);
  if (o.active || o.winner){ g.shadowColor = o.winner ? 'rgba(110,210,150,.7)' : (sal ? 'rgba(255,214,140,.7)' : 'rgba(242,201,76,.65)'); g.shadowBlur = 14; }
  g.fillStyle = sal ? 'rgba(24,14,8,.74)' : 'rgba(6,14,28,.74)';
  sq(g, x - w/2, y - h/2, w, h, h*.22); g.fill();
  g.shadowColor = 'transparent'; g.shadowBlur = 0;
  g.lineWidth = o.active || o.winner ? 1.4 : 1;
  g.strokeStyle = o.winner ? '#6ed39a' : o.active ? (sal ? '#e8c27a' : '#f2c94c') : (sal ? 'rgba(220,180,110,.28)' : 'rgba(150,190,240,.22)');
  g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = sal ? '#e9dcc0' : '#dfe8f5'; g.font = sal ? font(fs, F_OLD) : font(fs, F_UI, '600');
  g.fillText(name, x, y - h/2 + 3 + fs*.62);
  g.fillStyle = sal ? '#e8c27a' : '#f2d16b'; g.font = sal ? font(fs2, F_OLD) : font(fs2, F_UI, '700');
  g.fillText(money(stack), x, y + h/2 - 3 - fs2*.6);
  if (o.prog >= 0){
    const bw = w - 8; g.fillStyle = 'rgba(255,255,255,.1)'; sq(g, x - bw/2, y + h/2 + 3, bw, 3, 1.5); g.fill();
    g.fillStyle = sal ? '#e8c27a' : '#f2c94c'; sq(g, x - bw/2, y + h/2 + 3, bw*(1 - o.prog), 3, 1.5); g.fill();
  }
  if (o.dim){ g.fillStyle = sal ? 'rgba(14,8,4,.55)' : 'rgba(4,8,16,.55)'; sq(g, x - w/2, y - h/2, w, h, h*.22); g.fill(); }
  g.restore();
  return { x, y, w, h };
}
function drawNamePlate(g, x, y, p, isCom, s, o){
  return drawTag(g, x, y, (isCom ? 'COM · ' : '') + p.name, p.chips - (p.carry || 0), s, o);
}
function drawBet(g, q0, amt){
  const sal = TH.key === 'saloon';
  drawChips(g, q0.x, q0.y, amt, 3.4*U*q0.s, 2, 8);
  const q = { x:q0.x, y:q0.y, s:LS(q0.s) };
  g.save(); g.font = font(Math.max(11, 2.4*U*q.s), sal ? F_OLD : F_UI, sal ? '' : '700');
  const tw = g.measureText(money(amt)).width + 12, th = Math.max(16, 3.4*U*q.s);
  g.fillStyle = 'rgba(0,0,0,.62)'; sq(g, q.x - tw/2, q.y + 3, tw, th, th/2); g.fill();
  g.fillStyle = sal ? '#f1e3c3' : '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(money(amt), q.x, q.y + 3 + th/2);
  g.restore();
}
// cards lying on the felt. lay basis = squared to that player (face down); world basis = readable from your seat (face up)
function flatBasis(pt, lay){
  const d = lay ? lay.d : { x:0, y:-1 }, lat = lay ? lay.lat : { x:1, y:0 };
  const q = proj(pt), a = proj(add(pt, lat, 1)), b = proj(add(pt, d, -1));
  return { q, ax:a.x - q.x, ay:a.y - q.y, bx:b.x - q.x, by:b.y - q.y };
}
function drawFlat(g, c, B, x, y, wu, rot, o = {}){
  const sc = Math.hypot(B.ax, B.ay), px = Math.max(8, Math.round(wu*sc*1.3));
  const flip = o.flip ?? 1, img = cardCanvas(o.face && flip >= .5 ? c : null, px, TH.cardStyle), hu = wu*1.42;
  g.save();
  g.transform(B.ax, B.ay, B.bx, B.by, x, y);
  g.translate(o.dx || 0, o.dy || 0); g.rotate(rot);
  g.scale(Math.max(.03, Math.abs(Math.cos(Math.PI*(1 - flip)))), 1);
  g.shadowColor = 'rgba(0,0,0,.42)'; g.shadowBlur = wu*sc*.14; g.shadowOffsetY = wu*sc*(.05 + (o.lift || 0)*.2);
  g.drawImage(img, -wu/2, -hu/2, wu, hu);
  g.shadowColor = 'transparent';
  if (o.hl){ g.strokeStyle = '#6ee39d'; g.lineWidth = .35; g.strokeRect(-wu/2, -hu/2, wu, hu); }
  g.restore();
}
function drawFlatCard(g, c, pt, wu, lay, rot, o = {}){
  const B = flatBasis(pt, lay);
  if (o.lean){ const up = Math.hypot(B.ax, B.ay); B.bx *= 1 - o.lean; B.by = lerp(B.by, up, o.lean); }     // card propped partway up toward you
  drawFlat(g, c, B, B.q.x, B.q.y, wu, rot, o);
}
const seatCardPt = (lay, k, wu = 5.8) => add(add(lay.cards, lay.lat, (k - .5)*wu*.55), lay.d, k*.4);
// first person: things near the camera would grow huge, so they keep the size they'd have by the pot
const fpShrink = pt => FP() ? Math.min(1, proj(potPt()).s*1.1/proj(pt).s) : 1;
function drawSeatCards(g, q, p, cards, up){
  const i = G.players.indexOf(p), lay = L[i];
  if (!lay) return;
  const f = fpShrink(lay.cards);
  if (!up){ cards.forEach((c, k) => drawFlatCard(g, c, seatCardPt(lay, k, 5.8*f), 5.8*f, lay, (k - .5)*.16)); return; }
  // turned over in place, facing the room
  const wu = 7.2*f;
  cards.forEach((c, k) => drawFlatCard(g, c, add(lay.cards, { x:1, y:0 }, (k - .5)*wu*.62), wu, null, (k - .5)*.12,
    { face:true, flip:p.flipP ?? 1, hl:H.highlight.has(c) }));
}
function drawPotPill(g){
  const h = H, sal = TH.key === 'saloon';
  const q = proj({ x:TH.W/2, y:TH.H*TH.pillY }), total = potAll(); q.s = LS(q.s);
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  {
    const fs = TH.key === 'atari' ? 8 : Math.max(12, 2.6*U*q.s);
    g.font = sal ? font(fs, F_OLD) : font(fs, F_UI, '700');
    const txt = sal ? `${PHASES[h.street]} · Pot ${money(total)}` : `${PHASES[h.street].toUpperCase()} · POT ${money(total)}`;
    const tw = g.measureText(txt).width + fs*1.6;
    g.fillStyle = sal ? 'rgba(20,12,6,.6)' : 'rgba(6,16,34,.62)'; sq(g, q.x - tw/2, q.y - fs*.85, tw, fs*1.7); g.fill();
    g.strokeStyle = sal ? 'rgba(217,176,97,.35)' : 'rgba(160,200,250,.22)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = sal ? '#efe0bd' : '#ffffff'; g.fillText(txt, q.x, q.y + fs*.05);
  }
  if (h.msg){
    const fs = Math.max(12, 2.5*U*q.s), y2 = q.y + fs*1.9;
    g.font = sal ? font(fs, F_OLD) : font(fs, F_UI, '700');
    g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 6;
    g.fillStyle = sal ? '#f5e6c2' : '#f2d16b'; g.fillText(h.msg, q.x, y2);
  }
  g.restore();
}
function drawBanner(g){
  const b = H && H.banner; if (!b) return;
  const sal = TH.key === 'saloon';
  const e = clamp((performance.now() - b.t0)/T(450), 0, 1), sc = .6 + .4*EASE.back(e);
  let q = proj({ x:TH.W/2, y:TH.H*TH.msgY });
  let w = Math.min(CW - 32, Math.max(240, 62*U)), h = Math.max(64, 15*U);
  if (FP()){ q = { x:CW/2, y:Math.max(60, CH*.13) }; w = Math.min(CW - 32, 320); h = 70; }     // first person: banner up in the room, clear of the board
  g.save(); g.translate(q.x, q.y); g.scale(sc, sc); g.globalAlpha = e;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (sal){
    const tail = h*.42;
    g.fillStyle = '#b48d4a';
    for (const sx of [-1, 1]){ g.beginPath(); g.moveTo(sx*w/2, -h*.32); g.lineTo(sx*(w/2 + tail), -h*.32); g.lineTo(sx*(w/2 + tail*.7), h*.05); g.lineTo(sx*(w/2 + tail), h*.42); g.lineTo(sx*w/2, h*.42); g.closePath(); g.fill(); }
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 14; g.shadowOffsetY = 4;
    const pg = g.createLinearGradient(0, -h/2, 0, h/2); pg.addColorStop(0, '#f6e7c3'); pg.addColorStop(1, '#d8bd85');
    g.fillStyle = pg; g.fillRect(-w/2, -h/2, w, h);
    g.shadowColor = 'transparent';
    g.strokeStyle = '#6b4a1f'; g.lineWidth = 2; g.strokeRect(-w/2 + 4, -h/2 + 4, w - 8, h - 8);
    g.fillStyle = '#3a2208'; g.font = font(h*.32, F_WEST); g.fillText(b.title, 0, -h*.12, w*.9);
    g.fillStyle = '#5a3a14'; g.font = font(h*.22, F_OLD); g.fillText(b.sub, 0, h*.24, w*.9);
  } else {
    g.shadowColor = b.mine ? 'rgba(242,201,76,.55)' : 'rgba(0,0,0,.6)'; g.shadowBlur = 24;
    const pg = g.createLinearGradient(0, -h/2, 0, h/2); pg.addColorStop(0, '#16305a'); pg.addColorStop(1, '#0a1a33');
    g.fillStyle = pg; sq(g, -w/2, -h/2, w, h, h*.28); g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = b.mine ? '#f2c94c' : 'rgba(170,205,250,.4)'; g.lineWidth = 1.6; sq(g, -w/2, -h/2, w, h, h*.28); g.stroke();
    g.fillStyle = b.mine ? '#f8d775' : '#ffffff'; g.font = TH.key === 'atari' ? font(16, F_UI) : font(h*.36, F_UI, '800'); g.fillText(b.title, 0, -h*.13, w*.9);
    g.fillStyle = '#b8cbe6'; g.font = TH.key === 'atari' ? font(8, F_UI) : font(h*.23, F_UI, '600'); g.fillText(b.sub, 0, h*.25, w*.9);
  }
  g.restore();
}
function drawLampFlame(g, t){
  const q = proj(PROPS.lamp), s = U*q.s;
  const fl = RM ? 1 : .85 + Math.sin(t/70)*.06 + Math.sin(t/23)*.04;
  const gl = g.createRadialGradient(q.x, q.y - 12*s, 0, q.x, q.y - 12*s, 34*s);
  gl.addColorStop(0, `rgba(255,200,110,${.32*fl})`); gl.addColorStop(1, 'rgba(255,200,110,0)');
  g.fillStyle = gl; g.fillRect(q.x - 40*s, q.y - 50*s, 80*s, 80*s);
  g.fillStyle = `rgba(255,230,150,${.9*fl})`;
  g.beginPath(); g.moveTo(q.x, q.y - 15.5*s*fl); g.quadraticCurveTo(q.x + 1.2*s, q.y - 11.5*s, q.x, q.y - 10.2*s); g.quadraticCurveTo(q.x - 1.2*s, q.y - 11.5*s, q.x, q.y - 15.5*s*fl); g.fill();
}

/* ---- the scene ---- */
function drawScene(g, t){
  const h = H, sal = TH.key === 'saloon';
  if (sal) drawLampFlame(g, t);
  if (h && !h.done && h.toAct >= 0 && G.players[h.toAct] && needsAction(G.players[h.toAct]) && h.toAct !== 0){
    const lay = L[h.toAct], q = proj(add(lay.rail, lay.d, 9)), r = 24*U*q.s;
    const gl = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
    gl.addColorStop(0, sal ? 'rgba(255,214,140,.26)' : 'rgba(242,201,76,.14)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gl; g.beginPath(); g.ellipse(q.x, q.y, r, r*COS*.8, 0, 0, Math.PI*2); g.fill();
  }
  const items = [];
  const push = (pt, f, dy = 0) => { const q = proj(pt); items.push({ y:q.y + dy, f:() => f(q) }); };
  const flatPile = (pt, n, wu, spread) => { const rnd = rng(31); for (let k = 0; k < n; k++) drawFlatCard(g, null, pt, wu, null, spread ? (rnd() - .5)*2 : 0, { dx:spread ? (rnd() - .5)*4 : 0, dy:spread ? (rnd() - .5)*2.5 : -k*.15 }); };
  if (FP()){
    if (!TS.deckHidden) push(L.D.deck, () => flatPile(L.D.deck, 4, 5.4, false));
    if (TS.burnN) push(L.D.burn, () => flatPile(L.D.burn, Math.min(TS.burnN, 3), 5, false));
    if (TS.muckN) push(L.D.muck, () => flatPile(L.D.muck, Math.min(TS.muckN, 9), 5.2, true));
  } else {
  if (!TS.deckHidden) push(L.D.deck, q => drawDeck(g, q.x, q.y, 5.4*U*q.s, 4));
  if (TS.burnN) push(L.D.burn, q => drawDeck(g, q.x, q.y, 5*U*q.s, Math.min(TS.burnN, 3), 1));
  if (TS.muckN) push(L.D.muck, q => drawMuck(g, q.x, q.y, 5*U*q.s, TS.muckN));
  }
  G.players.forEach((p, i) => {
    const lay = L[i];
    const stackAmt = p.chips - (p.carry || 0);
    if (stackAmt > 0) push(lay.stack, q => drawChips(g, q.x, q.y, stackAmt, (sal ? 3.7 : 3.5)*U*q.s, 3, 10));
    if (h && p.bet > 0 && !h.sweeping && !p.betTaken) push(lay.bet, q => drawBet(g, q, p.bet));
    if (i === 0) return;
    const cards = p.hole.filter(c => c != null);
    if (h && cards.length && !p.folded && !p.mucking && !p.collected && !p.inHandCards){
      const up = p.shown || G.cfg.showCom;
      push(lay.cards, q => drawSeatCards(g, q, p, cards, up));
    }
  });
  if (h && G.button >= 0 && !TS.btnHidden) push(L[G.button].button, q => drawButton(g, q.x, q.y, q.s*fpShrink(L[G.button].button)));
  if (h && !h.potGone){
    const mid = potCenter() - (h.potCarry || 0);
    if (mid > 0) push(potPt(), q => drawPotPile(g, q.x, q.y, mid, (sal ? 3.7 : 3.6)*U*q.s, h.nonce*31));
  }
  if (h && !h.boardGone){
    const pop = h.popT ? EASE.back(clamp((performance.now() - h.popT)/T(420), 0, 1)) : 0;
    if (FP()) h.board.forEach((c, k) => push(boardPt(k), q => drawFlatCard(g, c, boardPt(k), TH.cardW, null, 0, { face:true, flip:h.boardFlip[k] ?? 1, hl:h.highlight.has(c), lean:.55 }), -200));
    else h.board.forEach((c, k) => push(boardPt(k), q => {
      const hl = h.highlight.has(c), lift = hl ? pop*1.6*U*q.s : 0;
      drawCard(g, c, q.x, q.y - lift, TH.cardW*U*q.s*(hl ? 1 + pop*.06 : 1), 0, { flip:h.boardFlip[k] ?? 1, hl });
    }, -200));
  }
  items.sort((a, b) => a.y - b.y).forEach(it => it.f());
  if (h && !h.done && !h.banner && TH.key !== 'atari') drawPotPill(g);
  drawHands(g, t);
  for (const sp of sprites) sp.draw(g, t);
  if (TH.key === 'atari'){
    // this pass draws straight into the low-resolution buffer; labels are added on top afterwards at full size
    if (h && h.drama > 0) drawDrama(g, h, t, 'world');
    return;
  }
  if (h && h.drama > 0) drawDrama(g, h, t);
  if (FP()){ drawSpeech(g, t); if (h && !h.done && !h.banner && TH.key !== 'atari') drawPotPill(g); }
  drawSeats(g);
  drawYou(g, t);
  if (FP()) drawTopBoard(g);
  if (!FP()) drawSpeech(g, t);
  drawBanner(g);
}
// showdown: the room darkens, a spotlight follows each reveal, hand names pop up over the cards
function drawDrama(g, h, t, part){
  if (part === 'labels') return dramaLabels(g, h);
  const d = h.drama, c = proj({ x:TH.W/2, y:TH.H*TH.boardY });
  const R = Math.max(CW, CH);
  const vg = g.createRadialGradient(c.x, c.y, R*.08, c.x, c.y, R*.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.35, `rgba(0,0,0,${.35*d})`); vg.addColorStop(1, `rgba(0,0,0,${.78*d})`);
  g.fillStyle = vg; g.fillRect(0, 0, CW, CH);
  G.players.forEach((p, i) => {
    if (!i || !p.inHand || p.folded || !p.hole.length || p.collected) return;
    const q = proj(L[i].cards), lit = h.spot === i || (p.rlabel && p.rlabel.state === 'win');
    if (lit){
      const r = 20*U*q.s, gl = g.createRadialGradient(q.x, q.y - 3*U*q.s, 0, q.x, q.y - 3*U*q.s, r);
      gl.addColorStop(0, TH.key === 'saloon' ? 'rgba(255,214,140,.45)' : 'rgba(255,230,160,.35)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl; g.beginPath(); g.ellipse(q.x, q.y - 3*U*q.s, r, r*.8, 0, 0, Math.PI*2); g.fill();
    }
    if ((p.shown || G.cfg.showCom) && !p.inHandCards) drawSeatCards(g, q, p, p.hole.filter(x => x != null), true);
    if (!part && !FP() && p.rlabel && !(h.banner && p.rlabel.state === 'lose')) drawRevealLabel(g, q.x, q.y - 11*U*q.s, p.rlabel, q.s);
  });
  if (part) return;
  const p0 = me();
  if (p0.rlabel && !p0.folded && !p0.collected && !(h.banner && p0.rlabel.state === 'lose')){ const { w, pts } = youCardPts(); drawRevealLabel(g, (pts[0].x + pts[1].x)/2, Math.min(pts[0].y, pts[1].y) - w*.95, p0.rlabel, 1.25); }
}
function dramaLabels(g, h){
  G.players.forEach((p, i) => {
    if (!i || FP() || !p.rlabel || !p.inHand || p.folded || p.collected || (h.banner && p.rlabel.state === 'lose')) return;
    const q = proj(L[i].cards); drawRevealLabel(g, q.x, q.y - 11*U*q.s, p.rlabel, q.s);
  });
  const p0 = me();
  if (p0.rlabel && !p0.folded && !p0.collected && !(h.banner && p0.rlabel.state === 'lose')){ const { w, pts } = youCardPts(); drawRevealLabel(g, (pts[0].x + pts[1].x)/2, Math.min(pts[0].y, pts[1].y) - w*.95, p0.rlabel, 1.25); }
}
function drawRevealLabel(g, x, y, L, s){
  s = LS(s);
  const sal = TH.key === 'saloon';
  const e = clamp((performance.now() - L.t0)/T(380), 0, 1), sc = .4 + .6*EASE.back(e);
  const win = L.state === 'win', lose = L.state === 'lose';
  const fs = TH.key === 'atari' ? 8 : Math.max(13, 3.1*U*s);
  const txt = sal ? L.text : L.text.toUpperCase();
  let f2 = fs; g.save(); g.font = sal ? font(f2, F_WEST) : font(f2, F_UI, '800');
  const maxW = Math.min(CW*.62, 260);
  while (g.measureText(txt).width + f2*1.6 > maxW && f2 > 10){ f2 -= 1; g.font = sal ? font(f2, F_WEST) : font(f2, F_UI, '800'); }
  const w = g.measureText(txt).width + f2*1.6, hh = f2*1.75;
  g.restore();
  x = clamp(x, w/2 + 6, CW - w/2 - 6);
  g.save(); g.translate(x, y); g.scale(sc, sc); g.globalAlpha = e;
  g.font = sal ? font(f2, F_WEST) : font(f2, F_UI, '800');
  if (win){ g.shadowColor = 'rgba(255,214,120,.9)'; g.shadowBlur = 22 + Math.sin(performance.now()/160)*6; }
  else { g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 12; }
  const bg = g.createLinearGradient(0, -hh/2, 0, hh/2);
  if (win){ bg.addColorStop(0, sal ? '#f6e1a6' : '#ffe08a'); bg.addColorStop(1, sal ? '#c9973f' : '#e3a92c'); }
  else if (lose){ bg.addColorStop(0, '#3a3a3a'); bg.addColorStop(1, '#222'); }
  else { bg.addColorStop(0, sal ? '#3b2412' : '#13284a'); bg.addColorStop(1, sal ? '#1f1309' : '#0a162c'); }
  g.fillStyle = bg; sq(g, -w/2, -hh/2, w, hh, hh*.3); g.fill();
  g.shadowColor = 'transparent';
  g.strokeStyle = win ? '#fff3c4' : lose ? 'rgba(255,255,255,.15)' : (sal ? '#d9b061' : '#f2c94c'); g.lineWidth = 1.5; g.stroke();
  g.fillStyle = win ? '#2b1a05' : lose ? '#a8a8a8' : (sal ? '#f3e2bb' : '#ffffff');
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, fs*.05, w - fs*.8);
  g.restore();
}
function seatBadge(p, i, active){
  const h = H;
  const out = p.chips <= 0 && !(h && p.inHand && !h.done) && !(h && h.winners.has(p.id));
  if (out) return ['Out', 'out'];
  if (active) return i === 0 ? ['Your turn', 'turn'] : ['Thinking', 'think'];
  if (p.last) return [p.last, p.kind || ''];
  return null;
}
function drawSeat(g, p, i){ drawSeatAt(g, p, i, null); }
// first person: one compact tag per opponent (name, stack, what they just did), floated over their head and nudged so tags never overlap
const BADGE_COL = {
  regular:{ fold:['#3a1f24','#ff9e95'], check:['#173a2d','#9df0c4'], call:['#173a2d','#9df0c4'], bet:['#1a2f52','#a8cbff'], raise:['#1a2f52','#a8cbff'],
    allin:['#f2c94c','#1b1505'], win:['#5cc08b','#08170e'], turn:['#f2c94c','#1b1505'], think:['#3a3010','#f2d16b'], '':['#16243a','#c9d6ea'], out:['#0c1626','#7f8da3'] },
  saloon:{ fold:['#5a1e16','#f3d9cf'], check:['#2f4a22','#e9dcc0'], call:['#2f4a22','#e9dcc0'], bet:['#5a3a14','#f1e3c3'], raise:['#5a3a14','#f1e3c3'],
    allin:['#c9a04a','#2a1a06'], win:['#6d8a3a','#f6ecd2'], turn:['#d9b061','#1e1406'], think:['#4a3a2a','#f1d9a0'], '':['#3a2a1a','#e9dcc0'], out:['#2a2018','#9c8f78'] }
};
const topBand = () => { if (!FP() || !H || !H.board.length || H.boardGone) return 0; const R = topBoardRect(); return R.y0 + R.hh + 40; };
function drawSeats(g){
  if (!FP()){ G.players.forEach((p, i) => { if (i) drawSeat(g, p, i); }); return; }
  const h = H, tags = [];
  G.players.forEach((p, i) => {
    if (!i) return;
    const lay = L[i]; if (!lay) return;
    const hs = lay.headScreen || proj(lay.rail);
    const out = p.chips <= 0 && !(h && p.inHand && !h.done) && !(h && h.winners.has(p.id));
    if (out && !(h && p.inHand)) { /* still shown, dimmed */ }
    const active = !!(h && !h.done && h.toAct === i && needsAction(p));
    const t = { p, i, active, out, b:seatBadge(p, i, active),
      prog:active && h.think && h.think.i === i ? clamp((performance.now() - h.think.t0)/h.think.d, 0, 1) : -1,
      dim:out || !!(h && p.folded && !h.done), winner:!!(h && h.winners.has(p.id) && h.potGone) };
    fpTagSize(g, t);
    t.x = clamp(hs.x, t.w/2 + 3, CW - t.w/2 - 3);
    t.y = clamp(hs.y - (lay.headR || 20)*.95 - 4 - t.h/2, t.h/2 + 3 + topBand(), CH*.62);
    t.ax = t.x;
    tags.push(t);
  });
  // push overlapping tags apart along whichever axis needs the smaller move
  for (let it = 0; it < 40; it++){
    let moved = false;
    for (let a = 0; a < tags.length; a++) for (let b = a + 1; b < tags.length; b++){
      const A = tags[a], B = tags[b];
      const ox = (A.w + B.w)/2 + 3 - Math.abs(A.x - B.x), oy = (A.h + B.h)/2 + 3 - Math.abs(A.y - B.y);
      if (ox <= 0 || oy <= 0) continue;
      moved = true;
      if (ox < oy*1.6){ const d = ox/2 + .5, sgn = A.x < B.x || (A.x === B.x && A.ax <= B.ax) ? -1 : 1; A.x += sgn*d; B.x -= sgn*d; }
      else { const d = oy/2 + .5, sgn = A.y <= B.y ? -1 : 1; A.y += sgn*d; B.y -= sgn*d; }
      for (const T of [A, B]){ T.x = clamp(T.x, T.w/2 + 3, CW - T.w/2 - 3); T.y = clamp(T.y, T.h/2 + 3 + topBand(), CH*.66); }
    }
    if (!moved) break;
  }
  // a thin leader back to the head when a tag had to move aside
  tags.forEach(t => {
    const lay = L[t.i], hs = lay.headScreen; if (!hs) return;
    const ty = hs.y - (lay.headR || 20)*.95;
    if (Math.abs(t.x - hs.x) < t.w*.45 && Math.abs(t.y + t.h/2 - ty) < 14) return;
    g.save(); g.strokeStyle = TH.key === 'saloon' ? 'rgba(232,194,122,.55)' : 'rgba(200,220,255,.5)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(clamp(hs.x, t.x - t.w/2 + 4, t.x + t.w/2 - 4), t.y + t.h/2); g.lineTo(hs.x, ty); g.stroke();
    g.fillStyle = g.strokeStyle; g.fillRect(hs.x - 1.5, ty - 1.5, 3, 3); g.restore();
  });
  tags.forEach(t => drawFpTag(g, t));
}
function fpTagFonts(){
  const pix = TH.key === 'atari', sal = TH.key === 'saloon';
  const fs = pix ? 9 : CW < 520 ? 11.5 : 13;
  return { pix, sal, fs, fName:pix ? font(fs, F_UI) : sal ? font(fs + 1, F_OLD) : font(fs, F_UI, '700'), fSt:pix ? font(fs, F_UI) : sal ? font(fs + 1, F_OLD) : font(fs, F_UI, '700'),
    fB:pix ? font(fs, F_UI) : sal ? font(fs - .5, F_OLD) : font(fs - 2, F_UI, '800') };
}
function fpTagSize(g, t){
  const F = fpTagFonts();
  g.save();
  g.font = F.fName; const nw = g.measureText(t.p.name).width;
  g.font = F.fSt; const sw = g.measureText(money(t.p.chips - (t.p.carry || 0))).width;
  let bw = 0; if (t.b){ g.font = F.fB; bw = g.measureText(F.sal ? t.b[0] : t.b[0].toUpperCase()).width; }
  g.restore();
  t.row = F.fs*1.55; t.w = Math.max(nw + sw + F.fs*1.6, bw + F.fs*1.2); t.h = t.row + (t.b ? F.fs*1.3 : 0); t.F = F;
}
function drawFpTag(g, t){
  const { x, y, w, h, F, p } = t, sal = F.sal, x0 = x - w/2, y0 = y - h/2;
  const pal = BADGE_COL[sal ? 'saloon' : 'regular'];
  g.save();
  if (t.active || t.winner){ g.shadowColor = t.winner ? 'rgba(110,210,150,.75)' : 'rgba(242,201,76,.7)'; g.shadowBlur = 12; }
  g.fillStyle = F.pix ? '#000' : sal ? 'rgba(24,14,8,.86)' : 'rgba(6,14,28,.86)';
  g.fillRect(x0, y0, w, h);
  g.shadowColor = 'transparent'; g.shadowBlur = 0;
  // status strip under the name row
  if (t.b){
    const [bg, fg] = pal[t.b[1]] || pal[''];
    g.fillStyle = bg; g.fillRect(x0, y0 + t.row, w, h - t.row);
    if (t.prog >= 0){ g.fillStyle = 'rgba(242,201,76,.35)'; g.fillRect(x0, y0 + t.row, w*(1 - t.prog), h - t.row); }
    g.fillStyle = fg; g.font = F.fB; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(sal ? t.b[0] : t.b[0].toUpperCase(), x, y0 + t.row + (h - t.row)/2 + .5);
  }
  g.textBaseline = 'middle';
  g.font = F.fName; g.textAlign = 'left'; g.fillStyle = sal ? '#efe2c6' : '#e8eef8';
  g.fillText(p.name, x0 + F.fs*.55, y0 + t.row/2 + .5);
  g.font = F.fSt; g.textAlign = 'right'; g.fillStyle = sal ? '#e8c27a' : '#f2d16b';
  g.fillText(money(p.chips - (p.carry || 0)), x0 + w - F.fs*.55, y0 + t.row/2 + .5);
  g.lineWidth = t.active || t.winner ? 2 : 1;
  g.strokeStyle = t.winner ? '#6ed39a' : t.active ? (sal ? '#e8c27a' : '#f2c94c') : (sal ? 'rgba(220,180,110,.35)' : 'rgba(150,190,240,.28)');
  g.strokeRect(x0 + .5, y0 + .5, w - 1, h - 1);
  if (t.dim){ g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x0, y0, w, h); }
  g.restore();
}
function drawSeatAt(g, p, i, at){
  const h = H, lay = L[i];
  let q = proj(lay.plate);
  if (at){ q = at; }
  else
  if (lay.headScreen && handsOn()){
    const hs = lay.headScreen, below = !FP() && lay.rail.y > TH.H*.55;
    if (FP() && (hs.x < 30 || hs.x > CW - 30 || hs.y < 40)){
      // seat is out of view: pin its tag to that edge at the seat's depth
      const rq = proj(lay.rail);
      return drawSeatAt(g, p, i, { x:hs.x < CW/2 ? 0 : CW, y:clamp(rq.y - 24, 50, CH - 60), s:q.s });
    }
    q = { x:hs.x, y:hs.y + (below ? 1 : -1)*(lay.headR*.95 + 14), s:q.s };
  }
  const active = !!(h && !h.done && h.toAct === i && needsAction(p));
  const out = p.chips <= 0 && !(h && p.inHand && !h.done) && !(h && h.winners.has(p.id));
  const prog = active && h.think && h.think.i === i ? clamp((performance.now() - h.think.t0)/h.think.d, 0, 1) : -1;
  const box = drawNamePlate(g, q.x, q.y, p, true, q.s, { active, prog, dim:out || (h && p.folded && !h.done), winner:!!(h && h.winners.has(p.id) && h.potGone) });
  const b = seatBadge(p, i, active);
  if (b) drawBadge(g, box.x, box.y - box.h/2 - Math.max(9, 2.2*U*q.s)*.95, b[0], b[1], q.s);
}
let youCv = null;
function drawYouPixel(t){
  const w = Math.ceil(CW/PIX), h = Math.ceil(CH/PIX);
  if (!youCv) youCv = document.createElement('canvas');
  if (youCv.width !== w || youCv.height !== h){ youCv.width = w; youCv.height = h; }
  const yg = youCv.getContext('2d');
  yg.setTransform(1, 0, 0, 1, 0, 0); yg.clearRect(0, 0, w, h);
  yg.setTransform(1/PIX, 0, 0, 1/PIX, 0, 0); yg.imageSmoothingEnabled = true; yg.imageSmoothingQuality = 'high';
  drawYou(yg, t, 'world');
  cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.imageSmoothingEnabled = false;
  cx.drawImage(youCv, 0, 0, w*PIX*DPR, h*PIX*DPR);
  cx.restore();
}
function drawYou(g, t, part){
  const h = H, p = me();
  const { w, pts } = youCardPts();
  const rb = proj({ x:TH.W/2, y:TH.H - TH.rail/2 });
  if (handsOn() && HS[0]) drawArmHand(g, 0, 'L', t);
  if (!h) return;
  const drop = h.youFold || 0;
  const hold = handsOn() && HS[0] && youHolding();
  const hp = hold ? holdPose(pts[1], w, drop) : null;
  if (hp) drawHoldSprite(g, holdSprites(p.skin, sleeveOf(p)), hp.x, hp.y, hp.r, w, false);
  if (drop < 1 && !p.collected){
    const mq = proj(L.D.muck), wEnd = 5*U*mq.s;
    p.hole.forEach((c, k) => {
      if (c == null) return;
      const pt = pts[k], e = EASE.inOut(drop);
      drawCard(g, c, lerp(pt.x, mq.x + (k ? 4 : -4), e), lerp(pt.y, mq.y, e) - Math.sin(Math.PI*e)*w*.6, lerp(w, wEnd, e), pt.r + e*(k ? 5 : -4.4),
        { flip:drop > 0 ? 0 : (h.heroFlip ?? 0), hl:h.highlight.has(c) });
    });
  }
  if (hp) drawHoldSprite(g, holdSprites(p.skin, sleeveOf(p)), hp.x, hp.y, hp.r, w, true);

  else if (handsOn() && HS[0]) drawArmHand(g, 0, 'R', t);
}
function youHolding(){
  const p = me();
  return !!(H && p.hole.length === 2 && p.hole[1] != null && !p.collected && !((H.youFold || 0) >= 1));
}
function holdPose(pt, w, drop){
  // the hand follows the front card; on a fold it flicks toward the muck then drops away
  let x = pt.x, y = pt.y, r = pt.r;
  if (FP() && !RM){ const t = performance.now(); x += Math.sin(t/1900)*w*.012; y += Math.sin(t/1300)*w*.01; r += Math.sin(t/2300)*.012; }     // a living hand: tiny sway
  if (drop > 0){
    const mq = proj(L.D.muck), e1 = clamp(drop/.3, 0, 1);
    x += (mq.x - x)*.12*e1; y += (mq.y - y)*.12*e1; r -= .25*e1;
    y += EASE.inOut(clamp((drop - .3)/.7, 0, 1))*w*3.4;
  }
  return { x, y, r };
}

// labels, tags and banner for the 8-bit table, drawn crisp over the pixel image
// 8-bit first person: the board as a tidy row of crisp pixel cards, at 2 screen px per card pixel
function drawAtariBoard(g){ drawTopBoard(g); }
// first person: a readable copy of the board in the open space above the lamp, with your best hand under it.
// The real cards still land on the felt where the dealer puts them.
function topBoardRect(){
  const pix = TH.key === 'atari', classic = !pix || TH.cardStyle !== 'pixel';
  const w = pix && !classic ? (CW < 520 ? 40 : 56) : Math.round(Math.min(CW*.125, 60)), hh = classic ? Math.round(w*1.42) : w*1.5, gap = Math.round(w*.1);
  return { pix, classic, w, hh, gap, x0:Math.round(CW/2 - (5*w + 4*gap)/2), y0:10 };
}
function drawTopBoard(g){
  const h = H; if (!h || h.boardGone || !h.board.length) return;
  const R = topBoardRect(), { pix, classic, w, hh, gap, x0, y0 } = R;
  g.save(); g.imageSmoothingEnabled = classic;
  // empty slots so the row reads as five places from the flop on
  for (let k = h.board.length; k < 5; k++){
    g.strokeStyle = TH.key === 'saloon' ? 'rgba(232,194,122,.28)' : 'rgba(200,220,255,.2)'; g.lineWidth = 1;
    g.strokeRect(x0 + k*(w + gap) + .5, y0 + .5, w - 1, hh - 1);
  }
  h.board.forEach((c, k) => {
    const f = h.boardFlip[k] ?? 1, sx = Math.max(.05, Math.abs(Math.cos(Math.PI*(1 - f))));
    const img = pix && !classic ? (f >= .5 ? pixelMiniCard(c) : pixelCardBase(null)) : cardCanvas(f >= .5 ? c : null, w, pix ? 'modern' : TH.cardStyle);
    const cxk = x0 + k*(w + gap) + w/2;
    g.save(); g.translate(cxk, 0); g.scale(sx, 1);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(-w/2 + 2, y0 + 2, w, hh);
    g.drawImage(img, -w/2, y0, w, hh);
    if (h.highlight.has(c)){ g.strokeStyle = '#6ee39d'; g.lineWidth = 2; g.strokeRect(-w/2 - 1, y0 - 1, w + 2, hh + 2); }
    g.restore();
  });
  // your best hand right now
  const p = me();
  if (p.hole.length === 2 && h.heroFlip >= 1 && !p.folded && p.inHand){
    const name = handName(evaluate([...p.hole, ...h.board]));
    const sal = TH.key === 'saloon', fs = pix ? 10 : sal ? 15 : 13;
    g.font = pix ? font(fs, F_UI) : sal ? font(fs, F_OLD) : font(fs, F_UI, '800');
    const label = pix || sal ? name : name.toUpperCase(), tw = g.measureText(label).width + 22, th = fs + 12, ty = y0 + hh + 8;
    g.fillStyle = pix ? '#000' : sal ? 'rgba(24,14,8,.88)' : 'rgba(6,14,28,.88)'; g.fillRect(CW/2 - tw/2, ty, tw, th);
    g.strokeStyle = sal ? 'rgba(232,194,122,.6)' : pix ? '#f2c94c' : 'rgba(242,201,76,.65)'; g.lineWidth = 1; g.strokeRect(CW/2 - tw/2 + .5, ty + .5, tw - 1, th - 1);
    g.fillStyle = sal ? '#e8c27a' : '#f2d16b'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, CW/2, ty + th/2 + 1);
  }
  g.restore();
}
function drawAtariLabels(g, t){
  const h = H;
  if (h && !h.done && !h.banner) drawPotPill(g);
  if (h && h.drama > 0) drawDrama(g, h, t, 'labels');
  drawSpeech(g, t);
  drawSeats(g);
  drawBanner(g);
}
