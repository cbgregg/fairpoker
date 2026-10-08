function paintAtariRoom(g){
  // black sky, raster-bar horizon, perspective checker floor
  g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH);
  // on tall screens the true horizon sits far above the table; pull it down to just over the dealer
  const t0 = proj({ x:TH.W/2, y:0 }), hz = Math.max(CY0 - P*COS/SIN, t0.y - 34*U*t0.s);
  const rs = rng(5);
  for (let k = 0; k < 90; k++){ g.fillStyle = rs() > .8 ? '#f0e070' : '#c8c8ff'; g.fillRect(rs()*CW, rs()*(hz - 50), 2, 2); }
  const bars = ['#2a0a6a', '#5a1a9a', '#9a2a8a', '#d0405a', '#e8783a', '#f0b040', '#f8e070'];
  bars.forEach((c, i) => { const y = hz - (bars.length - i)*6; g.fillStyle = c; g.fillRect(0, y, CW, 4 + i*.3); });
  g.fillStyle = '#10105a'; g.fillRect(0, hz, CW, CH);
  for (let gx = -16; gx < 26; gx++) for (let gy = -24; gy < 22; gy++){
    if ((gx + gy) & 1) continue;
    const s0 = 10, p0 = { x:gx*s0, y:gy*s0 }, q = [p0, { x:p0.x + s0, y:p0.y }, { x:p0.x + s0, y:p0.y + s0 }, { x:p0.x, y:p0.y + s0 }].map(proj);
    if (q.some(v => !isFinite(v.x) || v.s <= 0)) continue;
    g.fillStyle = '#1c2c9a'; g.beginPath(); q.forEach((v, k) => k ? g.lineTo(v.x, v.y) : g.moveTo(v.x, v.y)); g.closePath(); g.fill();
  }
  const fog = g.createLinearGradient(0, hz, 0, hz + CH*.25); fog.addColorStop(0, 'rgba(0,0,0,.85)'); fog.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fog; g.fillRect(0, hz, CW, CH*.25);
}
function paintRegularRoom(g){
  const bg = g.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, '#1b2c45'); bg.addColorStop(.5, '#0f1c30'); bg.addColorStop(1, '#070e19');
  g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
  g.save(); g.filter = 'blur(14px)';
  const rnd = rng(9);
  for (let k = 0; k < 7; k++){
    const x = rnd()*CW, w = 40 + rnd()*120;
    const lg = g.createLinearGradient(0, 0, 0, CH*.45); lg.addColorStop(0, 'rgba(120,150,190,.18)'); lg.addColorStop(1, 'rgba(120,150,190,0)');
    g.fillStyle = lg; g.fillRect(x, 0, w, CH*.45);
  }
  for (let k = 0; k < 4; k++){ g.fillStyle = 'rgba(255,220,160,.08)'; g.beginPath(); g.arc(rnd()*CW, CH*.05, 30, 0, Math.PI*2); g.fill(); }
  g.restore();
  const vg = g.createRadialGradient(CW/2, CH*.55, Math.min(CW, CH)*.3, CW/2, CH*.55, Math.max(CW, CH)*.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)');
  g.fillStyle = vg; g.fillRect(0, 0, CW, CH);
}
function paintSaloonRoom(g){
  const bg = g.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, '#2c1a0e'); bg.addColorStop(.35, '#1d1008'); bg.addColorStop(1, '#0e0703');
  g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
  const rnd = rng(3);
  // wall planks
  for (let x = 0; x < CW; x += 34){ g.fillStyle = `rgba(${60 + rnd()*30},${34 + rnd()*14},${16},.18)`; g.fillRect(x, 0, 33, CH*.4); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 33, 0, 1.5, CH*.4); }
  // back bar and shelf with bottles
  const by = CH*.17;
  g.fillStyle = '#1a0e06'; g.fillRect(0, by, CW, CH*.05);
  g.fillStyle = 'rgba(200,140,80,.15)'; g.fillRect(0, by, CW, 2);
  for (let k = 0; k < 22; k++){
    const x = CW*.55 + rnd()*CW*.45, h = 14 + rnd()*18, w = 6 + rnd()*5;
    const col = rnd() > .5 ? 'rgba(160,90,30,.55)' : rnd() > .5 ? 'rgba(60,100,50,.5)' : 'rgba(200,170,120,.35)';
    g.fillStyle = col; rr(g, x, by - h, w, h, 2); g.fill(); g.fillRect(x + w*.35, by - h - 7, w*.3, 8);
    g.fillStyle = 'rgba(255,220,160,.25)'; g.fillRect(x + 1, by - h + 3, 1.2, h - 6);
  }
  // shadowy patrons at the bar
  g.save(); g.filter = 'blur(3px)'; g.fillStyle = 'rgba(8,4,2,.75)';
  for (const fx of [.08, .3, .62, .8]){
    const x = CW*fx, y = by + 4;
    g.beginPath(); g.ellipse(x, y - 30, 9, 11, 0, 0, Math.PI*2); g.fill();
    g.beginPath(); g.ellipse(x, y - 40, 16, 4, 0, 0, Math.PI*2); g.fill();
    g.fillRect(x - 6, y - 42, 12, 8);
    g.beginPath(); g.moveTo(x - 20, y + 30); g.quadraticCurveTo(x, y - 25, x + 20, y + 30); g.fill();
  }
  g.restore();
  // lamps
  for (const fx of [.1, .9]){
    const x = CW*fx, y = CH*.07;
    const gl = g.createRadialGradient(x, y, 0, x, y, CH*.35); gl.addColorStop(0, 'rgba(255,190,100,.42)'); gl.addColorStop(1, 'rgba(255,190,100,0)');
    g.fillStyle = gl; g.fillRect(0, 0, CW, CH*.6);
    g.fillStyle = '#ffd98a'; g.beginPath(); g.ellipse(x, y, 7, 10, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = '#6b4a1f'; g.fillRect(x - 8, y + 9, 16, 4);
  }
  const vg = g.createRadialGradient(CW/2, CH*.6, Math.min(CW, CH)*.25, CW/2, CH*.55, Math.max(CW, CH)*.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.72)');
  g.fillStyle = vg; g.fillRect(0, 0, CW, CH);
}
const PROPS = { lamp:{ x:19, y:12 }, bottle:{ x:6, y:68 }, glass1:{ x:13, y:76 }, decanter:{ x:95, y:76 }, glass2:{ x:87, y:80 }, watch:{ x:86, y:118 } };
const PROPS0 = JSON.parse(JSON.stringify(PROPS));
function placeProps(){
  for (const k of Object.keys(PROPS0)){
    const pt = PROPS0[k];
    const busy = G && L.length && L.some((lay, i) => i > 0 && [lay.cards, lay.stack, add(lay.rail, lay.d, 4), lay.bet].some(o => Math.hypot(o.x - pt.x, o.y - pt.y) < 14));
    PROPS[k] = busy ? { x:-400, y:pt.y } : { ...pt };
  }
}
function paintProps(g){
  placeProps();
  // bottle
  let q = proj(PROPS.bottle), s = U*q.s;
  g.save(); g.translate(q.x, q.y);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 0, 3.4*s, 1.4*s, 0, 0, Math.PI*2); g.fill();
  const bgr = g.createLinearGradient(-3*s, 0, 3*s, 0); bgr.addColorStop(0, '#2a1206'); bgr.addColorStop(.35, '#6a3410'); bgr.addColorStop(.6, '#3d1a08'); bgr.addColorStop(1, '#1a0a03');
  g.fillStyle = bgr; rr(g, -3*s, -15*s, 6*s, 15*s, 1.2*s); g.fill();
  g.beginPath(); g.moveTo(-3*s, -14*s); g.quadraticCurveTo(-1.2*s, -17*s, -1*s, -20*s); g.lineTo(1*s, -20*s); g.quadraticCurveTo(1.2*s, -17*s, 3*s, -14*s); g.fill();
  g.fillStyle = '#1a0f08'; g.fillRect(-1.1*s, -22*s, 2.2*s, 2.5*s);
  g.fillStyle = '#e9dcbc'; g.fillRect(-2.6*s, -11*s, 5.2*s, 5.5*s);
  g.fillStyle = '#3a2412'; g.font = `${1.2*s}px "IM Fell English SC", Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('WHISKEY', 0, -9*s); g.font = `${.9*s}px "IM Fell English SC", Georgia, serif`; g.fillText('1877', 0, -7*s);
  g.fillStyle = 'rgba(255,220,170,.35)'; g.fillRect(-2*s, -14*s, .6*s, 12*s);
  g.restore();
  // glasses
  for (const key of ['glass1','glass2']){
    q = proj(PROPS[key]); s = U*q.s;
    g.save(); g.translate(q.x, q.y);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 0, 2.6*s, 1.1*s, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = 'rgba(200,120,40,.75)'; rr(g, -2.2*s, -3*s, 4.4*s, 3*s, .6*s); g.fill();
    g.strokeStyle = 'rgba(230,230,240,.6)'; g.lineWidth = Math.max(1, .25*s); rr(g, -2.4*s, -5.2*s, 4.8*s, 5.2*s, .7*s); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(-2.4*s, -5.2*s, 4.8*s, 2.2*s);
    g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(-1.7*s, -4.6*s, .4*s, 4*s);
    g.restore();
  }
  // decanter
  q = proj(PROPS.decanter); s = U*q.s;
  g.save(); g.translate(q.x, q.y);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 0, 3.8*s, 1.5*s, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = 'rgba(190,110,40,.7)'; rr(g, -3.4*s, -6*s, 6.8*s, 6*s, 1*s); g.fill();
  g.strokeStyle = 'rgba(230,230,240,.65)'; g.lineWidth = Math.max(1, .25*s); rr(g, -3.6*s, -10*s, 7.2*s, 10*s, 1.2*s); g.stroke();
  g.beginPath(); g.moveTo(-3.6*s, -10*s); g.lineTo(-1.5*s, -12.5*s); g.lineTo(1.5*s, -12.5*s); g.lineTo(3.6*s, -10*s); g.stroke();
  g.fillStyle = 'rgba(230,230,240,.35)'; rr(g, -1.6*s, -16*s, 3.2*s, 3.6*s, 1*s); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.25)'; for (let k = -2; k <= 2; k++){ g.beginPath(); g.moveTo(k*1.4*s, -9.5*s); g.lineTo(k*1.4*s, -.5*s); g.stroke(); }
  g.restore();
  // pocket watch, lying flat
  q = proj(PROPS.watch); s = U*q.s;
  g.save(); g.translate(q.x, q.y); g.scale(1, TH.squash*1.3);
  g.strokeStyle = '#b48a2c'; g.lineWidth = Math.max(1, .35*s);
  g.beginPath(); g.moveTo(-3.5*s, -3*s); for (let k = 0; k < 10; k++) g.quadraticCurveTo(-5*s - k*.8*s, -4*s + k*1.4*s, -4*s - k*.6*s, -2*s + k*1.6*s); g.stroke();
  const wg = g.createRadialGradient(-1*s, -1*s, 0, 0, 0, 4.6*s); wg.addColorStop(0, '#f7dc8a'); wg.addColorStop(1, '#9c7420');
  g.fillStyle = wg; g.beginPath(); g.arc(0, 0, 4.6*s, 0, Math.PI*2); g.fill();
  g.fillStyle = '#f6f0de'; g.beginPath(); g.arc(0, 0, 3.6*s, 0, Math.PI*2); g.fill();
  g.strokeStyle = '#2a2010'; g.lineWidth = Math.max(.5, .15*s);
  for (let k = 0; k < 12; k++){ const a = k/12*Math.PI*2; g.beginPath(); g.moveTo(Math.cos(a)*3*s, Math.sin(a)*3*s); g.lineTo(Math.cos(a)*3.4*s, Math.sin(a)*3.4*s); g.stroke(); }
  g.lineWidth = Math.max(.8, .25*s); g.beginPath(); g.moveTo(0, 0); g.lineTo(1.6*s, -1.2*s); g.moveTo(0, 0); g.lineTo(-.4*s, -2.6*s); g.stroke();
  g.fillStyle = '#c99a32'; g.fillRect(-.6*s, -5.8*s, 1.2*s, 1.4*s);
  g.restore();
  // lamp base (flame is drawn live)
  q = proj(PROPS.lamp); s = U*q.s;
  g.save(); g.translate(q.x, q.y);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 0, 4.5*s, 1.8*s, 0, 0, Math.PI*2); g.fill();
  const lg = g.createLinearGradient(-4*s, 0, 4*s, 0); lg.addColorStop(0, '#6b4b16'); lg.addColorStop(.4, '#e0b45a'); lg.addColorStop(1, '#5a3c10');
  g.fillStyle = lg; g.beginPath(); g.ellipse(0, -.6*s, 4*s, 1.4*s, 0, 0, Math.PI*2); g.fill();
  g.fillRect(-.8*s, -6*s, 1.6*s, 5.6*s);
  g.beginPath(); g.ellipse(0, -7*s, 3*s, 2.2*s, 0, 0, Math.PI*2); g.fill();
  g.strokeStyle = 'rgba(240,240,250,.55)'; g.lineWidth = Math.max(1, .25*s);
  g.beginPath(); g.moveTo(-1.6*s, -8.5*s); g.bezierCurveTo(-3.2*s, -11*s, -2.2*s, -14*s, -1.1*s, -17*s); g.lineTo(1.1*s, -17*s); g.bezierCurveTo(2.2*s, -14*s, 3.2*s, -11*s, 1.6*s, -8.5*s); g.stroke();
  g.restore();
}

