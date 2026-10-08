function paintCard(g, w, h, c, style){
  if (style === 'pixel') return paintPixelCard(g, w, h, c);
  const vint = style === 'vintage';
  const r = w*.08;
  rr(g, .5, .5, w - 1, h - 1, r);
  if (c == null && deckReady && deckImg[vint ? 'back_red' : 'back_blue']){
    const im = deckImg[vint ? 'back_red' : 'back_blue'];
    g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
    if (vint){ g.globalCompositeOperation = 'multiply'; g.fillStyle = '#efe0c2'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
    g.restore();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; rr(g, .5, .5, w - 1, h - 1, r); g.stroke();
    return;
  }
  if (c == null){
    g.save(); g.clip();
    if (vint){
      g.fillStyle = '#f2e6cb'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#7a1e18'; rr(g, w*.07, w*.07, w - w*.14, h - w*.14, r*.6); g.fill();
      g.strokeStyle = 'rgba(240,220,170,.35)'; g.lineWidth = Math.max(1, w*.012);
      for (let k = -h; k < w + h; k += w*.09){ g.beginPath(); g.moveTo(k, w*.07); g.lineTo(k + h, h); g.stroke(); g.beginPath(); g.moveTo(k + h, w*.07); g.lineTo(k, h); g.stroke(); }
      g.strokeStyle = 'rgba(240,220,170,.7)'; g.lineWidth = Math.max(1, w*.015); rr(g, w*.11, w*.11, w - w*.22, h - w*.22, r*.4); g.stroke();
      g.fillStyle = 'rgba(240,220,170,.5)'; g.beginPath(); g.ellipse(w/2, h/2, w*.16, w*.22, 0, 0, Math.PI*2); g.fill();
    } else {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2b62b8'); gr.addColorStop(1, '#173a78');
      g.fillStyle = gr; rr(g, w*.07, w*.07, w - w*.14, h - w*.14, r*.6); g.fill();
      g.save(); rr(g, w*.07, w*.07, w - w*.14, h - w*.14, r*.6); g.clip();
      g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = Math.max(1, w*.018);
      for (let k = -h; k < w + h; k += w*.11){ g.beginPath(); g.moveTo(k, 0); g.lineTo(k + h, h); g.stroke(); g.beginPath(); g.moveTo(k + h, 0); g.lineTo(k, h); g.stroke(); }
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(1, w*.014); rr(g, w*.12, w*.12, w - w*.24, h - w*.24, r*.4); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(w/2, h/2, w*.13, 0, Math.PI*2); g.fill();
      g.fillStyle = '#1f4f9c'; suitPath(g, 0, w/2, h/2, w*.14); g.fill();
    }
    g.restore();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; rr(g, .5, .5, w - 1, h - 1, r); g.stroke();
    return;
  }
  const dk = deckKey(c), im = deckImg[dk];
  if (deckReady && im && im.complete && im.naturalWidth){
    g.save(); g.clip();
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.drawImage(im, 0, 0, w, h);
    if (vint){
      // aged card stock for the saloon
      g.globalCompositeOperation = 'multiply';
      const bg = g.createRadialGradient(w*.3, h*.2, w*.1, w*.5, h*.5, h*.75);
      bg.addColorStop(0, '#fff6e4'); bg.addColorStop(.6, '#f0e0c0'); bg.addColorStop(1, '#d8bf90');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'source-over';
    }
    g.restore();
    g.strokeStyle = vint ? 'rgba(110,75,30,.45)' : 'rgba(0,0,0,.2)'; g.lineWidth = 1; rr(g, .5, .5, w - 1, h - 1, r); g.stroke();
    return;
  }
  const rk = c >> 2, s = c & 3, red = s === 1 || s === 2;
  g.save(); g.clip();
  if (vint){
    const bg = g.createRadialGradient(w*.3, h*.2, w*.1, w*.5, h*.5, h*.75);
    bg.addColorStop(0, '#fffaf0'); bg.addColorStop(.6, '#f2e5c8'); bg.addColorStop(1, '#d9c193');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const rnd = rng(c*97 + 13);
    for (let k = 0; k < 40; k++){ g.fillStyle = `rgba(120,80,30,${rnd()*.06})`; g.beginPath(); g.arc(rnd()*w, rnd()*h, rnd()*w*.03, 0, Math.PI*2); g.fill(); }
  } else {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#eef1f6');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
  }
  g.restore();
  const ink = vint ? (red ? '#a5281f' : '#1f1b17') : (red ? '#d0262b' : '#14161b');
  g.fillStyle = ink;
  const small = w < 46;
  const FAM = vint ? '"DM Serif Display", Georgia, serif' : '"Barlow Condensed", "Arial Narrow", sans-serif';
  const WT = vint ? '' : '800';
  const corner = (cxI, top, rankPx, suitPx, maxW) => {
    g.font = `${WT} ${rankPx}px ${FAM}`.trim(); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const label = RANKS[rk], m = g.measureText(label);
    const asc = m.actualBoundingBoxAscent || rankPx*.72, desc = m.actualBoundingBoxDescent || 0;
    const sx = Math.min(1, maxW / Math.max(1, m.width));
    g.save(); g.translate(cxI, top + asc); g.scale(sx, 1); g.fillText(label, 0, 0); g.restore();
    suitPath(g, s, cxI, top + asc + desc + rankPx*.14 + suitPx/2, suitPx); g.fill();
  };
  if (small){
    corner(w*.25, h*.045, w*(vint ? .36 : .4), w*.22, w*.38);
    suitPath(g, s, w*.68, h*.72, w*.44); g.fill();
  } else {
    const rp = vint ? .2 : .23, sp = vint ? .12 : .13;
    corner(w*.12, h*.035, w*rp, w*sp, w*.18);
    g.save(); g.translate(w, h); g.rotate(Math.PI);
    corner(w*.12, h*.035, w*rp, w*sp, w*.18);
    g.restore();
    if (rk === 12){
      suitPath(g, s, w/2, h/2, w*(vint ? .46 : .5)); g.fill();
      if (vint){
        g.strokeStyle = ink; g.globalAlpha = .35; g.lineWidth = Math.max(1, w*.01);
        g.beginPath(); g.ellipse(w/2, h/2, w*.33, w*.37, 0, 0, Math.PI*2); g.stroke(); g.globalAlpha = 1;
      }
    } else if (rk >= 9){
      paintCourt(g, w*.2, h*.13, w*.6, h*.74, rk, s, vint ? 'vintage' : 'modern');
    } else {
      const x0 = w*.31, x1 = w*.69, y0 = h*.16, y1 = h*.84;
      for (const [px, py] of PIPS[rk + 2]){
        const x = lerp(x0, x1, px/100), y = lerp(y0, y1, py/100);
        g.save(); g.translate(x, y); if (py > 50) g.rotate(Math.PI);
        suitPath(g, s, 0, 0, w*.155); g.fill(); g.restore();
      }
    }
  }
  g.strokeStyle = vint ? 'rgba(110,75,30,.45)' : 'rgba(0,0,0,.16)'; g.lineWidth = 1; rr(g, .5, .5, w - 1, h - 1, r); g.stroke();
}
function drawDeck(g, x, y, w, n, spread = 0){
  for (let k = 0; k < n; k++) drawCard(g, null, x + k*spread*w*.12, y - k*w*.035, w, spread ? (k - n/2)*.06 : 0);
}
function drawMuck(g, x, y, w, n){
  // a loose, flat pile of discards
  const rnd = rng(17), B = flatBasis(L.D.muck, null);
  for (let k = 0; k < Math.min(n, 9); k++) drawFlat(g, null, B, x, y, 5.2, (rnd() - .5)*2.4, { dx:(rnd() - .5)*5, dy:(rnd() - .5)*3 });
}

/* ---- arms: shoulder → elbow → wrist, two-bone IK, elbows bend outward ---- */
function ikElbow(sh, wr, L1, L2, out){
  const dx = wr.x - sh.x, dy = wr.y - sh.y; let d = Math.hypot(dx, dy) || 1;
  const ux = dx/d, uy = dy/d;
  if (d >= L1 + L2 - .5) return { x:sh.x + ux*d*L1/(L1 + L2), y:sh.y + uy*d*L1/(L1 + L2) };
  d = Math.max(d, Math.abs(L1 - L2) + 1);
  const a = (L1*L1 - L2*L2 + d*d)/(2*d), h = Math.sqrt(Math.max(0, L1*L1 - a*a));
  let px = -uy, py = ux; if (px*out.x + py*out.y < 0){ px = -px; py = -py; }
  return { x:sh.x + ux*a + px*h, y:sh.y + uy*a + py*h };
}
const unit = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return { x:dx/l, y:dy/l }; };
let ARM_WF = 1;             // sleeve thickness factor (upright players in first person wear slimmer sleeves)
function armPath(sh, el, wr, size){
  const wS = size*.5*ARM_WF, wE = size*.42*ARM_WF, wW = size*.33*Math.min(1, ARM_WF*1.15);
  const u1 = unit(sh, el), u2 = unit(el, wr), p1 = { x:-u1.y, y:u1.x }, p2 = { x:-u2.y, y:u2.x };
  let pe = { x:p1.x + p2.x, y:p1.y + p2.y }; const pl = Math.hypot(pe.x, pe.y); pe = pl < .2 ? p1 : { x:pe.x/pl, y:pe.y/pl };
  const sEnd = { x:wr.x - u2.x*size*.16, y:wr.y - u2.y*size*.16 };
  const O = (p, n, w) => ({ x:p.x + n.x*w, y:p.y + n.y*w });
  const back = { x:sh.x - u1.x*size*.15, y:sh.y - u1.y*size*.15 };
  const cap = [];
  for (let i = 1; i < 6; i++){ const a = Math.PI/2 + i/6*Math.PI; cap.push({ x:back.x + (p1.x*Math.sin(a) + u1.x*Math.cos(a))*wS/2, y:back.y + (p1.y*Math.sin(a) + u1.y*Math.cos(a))*wS/2 }); }
  const ring = [O(back, p1, wS/2), O(sh, p1, wS/2), O(el, pe, wE/2), O(sEnd, p2, wW/2), sEnd, O(sEnd, p2, -wW/2), O(el, pe, -wE/2*.92), O(sh, p1, -wS/2), O(back, p1, -wS/2), ...cap.reverse()];
  return { path:splinePath(ring, true), u1, u2, p1, p2, pe, sEnd, wS, wE, wW };
}
function drawArm(g, sh, el, wr, size, sleeve, cuff){
  const A = armPath(sh, el, wr, size);
  const back = { x:sh.x - A.u1.x*size*.15, y:sh.y - A.u1.y*size*.15 };
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  // drop shadow on the felt
  g.fillStyle = 'rgba(0,0,0,.24)'; g.translate(size*.015, size*.1); g.fill(A.path); g.translate(-size*.015, -size*.1);
  g.fillStyle = shade(sleeve, -30); g.fill(A.path);
  // tube shading with strokes along the limb (no clipping, no per-frame gradients)
  const line = (off, w, col) => {
    g.strokeStyle = col; g.lineWidth = w; g.beginPath();
    g.moveTo(back.x + A.p1.x*off*A.wS, back.y + A.p1.y*off*A.wS);
    g.lineTo(el.x + A.pe.x*off*A.wE, el.y + A.pe.y*off*A.wE);
    g.lineTo(A.sEnd.x + A.p2.x*off*A.wW - A.u2.x*size*.04, A.sEnd.y + A.p2.y*off*A.wW - A.u2.y*size*.04);
    g.stroke();
  };
  line(.04, A.wW*.82, sleeve);
  line(.12, A.wW*.42, shade(sleeve, 18));
  line(.16, A.wW*.14, shade(sleeve, 36));
  // fabric bunching at the elbow and wrinkles on the forearm
  const bend = Math.abs(A.u1.x*A.u2.y - A.u1.y*A.u2.x);
  for (let i = 0; i < 3; i++){
    const t = .12 + i*.13, c = { x:lerp(el.x, A.sEnd.x, t), y:lerp(el.y, A.sEnd.y, t) }, wv = A.wE*(.42 - i*.05);
    g.strokeStyle = `rgba(0,0,0,${.18 + bend*.18})`; g.lineWidth = size*.022;
    g.beginPath(); g.moveTo(c.x + A.p2.x*wv, c.y + A.p2.y*wv); g.quadraticCurveTo(c.x - A.u2.x*size*.06, c.y - A.u2.y*size*.06, c.x - A.p2.x*wv*.6, c.y - A.p2.y*wv*.6); g.stroke();
  }
  if (cuff === 'garter'){
    const c = { x:lerp(back.x, el.x, .62), y:lerp(back.y, el.y, .62) }, w = A.wS*.5;
    g.lineCap = 'butt';
    g.lineWidth = size*.11; g.strokeStyle = '#1a1414';
    g.beginPath(); g.moveTo(c.x + A.p1.x*w, c.y + A.p1.y*w); g.lineTo(c.x - A.p1.x*w, c.y - A.p1.y*w); g.stroke();
    g.lineWidth = size*.025; g.strokeStyle = '#9a2c22'; g.stroke();
  }
  g.restore();
  return A;
}
/* shirt cuff over the wrist (drawn after the hand) */
function drawCuff(g, A, wr, size, white){
  const u = A.u2, p = A.p2, w0 = A.wW*.5, w1 = A.wW*.44;
  const a = { x:A.sEnd.x - u.x*size*.02, y:A.sEnd.y - u.y*size*.02 }, b = { x:wr.x + u.x*size*.035, y:wr.y + u.y*size*.035 };
  g.save();
  g.fillStyle = shade(white, -45); g.beginPath();
  g.moveTo(a.x + p.x*w0, a.y + p.y*w0); g.lineTo(b.x + p.x*w1, b.y + p.y*w1);
  g.quadraticCurveTo(b.x + u.x*size*.015, b.y + u.y*size*.015, b.x - p.x*w1, b.y - p.y*w1);
  g.lineTo(a.x - p.x*w0, a.y - p.y*w0); g.closePath();
  g.fill();
  g.strokeStyle = white; g.lineWidth = w1*.9; g.lineCap = 'butt';
  g.beginPath(); g.moveTo(a.x + p.x*w0*.1, a.y + p.y*w0*.1); g.lineTo(b.x + p.x*w1*.1, b.y + p.y*w1*.1); g.stroke();
  g.strokeStyle = '#ffffff'; g.lineWidth = w1*.3;
  g.beginPath(); g.moveTo(a.x + p.x*w0*.28, a.y + p.y*w0*.28); g.lineTo(b.x + p.x*w1*.28, b.y + p.y*w1*.28); g.stroke();
  const m = { x:lerp(a.x, b.x, .5) + p.x*w1*.55, y:lerp(a.y, b.y, .5) + p.y*w1*.55 };
  g.fillStyle = '#b08a3c'; g.beginPath(); g.arc(m.x, m.y, Math.max(1, size*.03), 0, Math.PI*2); g.fill();
  g.fillStyle = 'rgba(255,240,200,.8)'; g.beginPath(); g.arc(m.x - size*.008, m.y - size*.008, Math.max(.5, size*.011), 0, Math.PI*2); g.fill();
  g.restore();
}
