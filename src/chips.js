/* ---- chips ---- */
const DENOMS = [
  [5000,'#e07a2e','#f6eadb'],[1000,'#e4bd3c','#3a2c08'],[500,'#7b4fa8','#efe6f6'],
  [100,'#2a2d33','#ece7da'],[25,'#2f9a5c','#f1ede1'],[5,'#cf3b32','#f4efe3'],[1,'#ece6d6','#2d5fa8']
];
const DENOMS_OLD = [
  [5000,'#b86a35','#efe2c9'],[1000,'#c9a34a','#3a2c08'],[500,'#6e4c86','#eadfcf'],
  [100,'#3a3d48','#e5dccb'],[25,'#3f7a4f','#ece2cc'],[5,'#a8423a','#efe4cf'],[1,'#e3d8c0','#4a6a96']
];
const chipCache = new Map();
function chipImg(di){
  const key = TH.key + di + '|' + DPR;
  let c = chipCache.get(key); if (c) return c;
  const [, col, edge] = (TH.key === 'saloon' ? DENOMS_OLD : DENOMS)[di];
  const W = Math.round(64*DPR), sq = TH.squash, top = W*sq, th = W*.17;
  c = document.createElement('canvas'); c.width = W; c.height = Math.ceil(top + th + 2);
  const g = c.getContext('2d');
  const cx0 = W/2, cy0 = top/2;
  // side
  g.fillStyle = shade(col, -45);
  g.beginPath(); g.ellipse(cx0, cy0 + th, W/2 - .5, top/2 - .5, 0, 0, Math.PI); g.lineTo(1, cy0); g.ellipse(cx0, cy0, W/2 - .5, top/2 - .5, 0, Math.PI, 0, true); g.closePath(); g.fill();
  g.save(); g.clip();
  g.fillStyle = edge; g.globalAlpha = .85;
  for (let k = 0; k < 6; k++){ const a = (k + .5)/6*Math.PI; const x = cx0 - Math.cos(a)*W/2; g.fillRect(x - W*.035, cy0, W*.07, th + top/2); }
  g.restore();
  // top
  g.save(); g.translate(cx0, cy0); g.scale(1, sq);
  g.fillStyle = col; g.beginPath(); g.arc(0, 0, W/2 - .5, 0, Math.PI*2); g.fill();
  g.fillStyle = edge;
  for (let k = 0; k < 8; k++){ const a = k/8*Math.PI*2; g.beginPath(); g.arc(0, 0, W/2 - .5, a - .14, a + .14); g.arc(0, 0, W*.36, a + .14, a - .14, true); g.closePath(); g.fill(); }
  g.strokeStyle = edge; g.lineWidth = W*.025; g.beginPath(); g.arc(0, 0, W*.3, 0, Math.PI*2); g.stroke();
  const inl = g.createRadialGradient(-W*.08, -W*.1, 0, 0, 0, W*.3); inl.addColorStop(0, shade(col, 40)); inl.addColorStop(1, col);
  g.fillStyle = inl; g.beginPath(); g.arc(0, 0, W*.27, 0, Math.PI*2); g.fill();
  g.restore();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx0, cy0, W/2 - .5, top/2 - .5, 0, 0, Math.PI*2); g.stroke();
  c._top = top/DPR; c._th = th/DPR; c._h = c.height/DPR;
  chipCache.set(key, c);
  return c;
}
function chipCols(amount, maxCols, maxH){
  let rest = Math.round(amount); const cols = [];
  const D = TH.key === 'saloon' ? DENOMS_OLD : DENOMS;
  D.forEach(([v], di) => { const k = Math.floor(rest / v); if (k > 0){ cols.push({ di, k:Math.min(k, maxH) }); rest -= k*v; } });
  return cols.slice(0, maxCols);
}
function drawChips(g, x, y, amount, cw, maxCols = 3, maxH = 10){
  if (amount <= 0) return;
  cw = Math.max(13, cw);
  const cols = chipCols(amount, maxCols, maxH);
  const gap = cw*.1, total = cols.length*cw + (cols.length - 1)*gap;
  cols.forEach((col, ci) => {
    const img = chipImg(col.di), f = cw/64;
    const x0 = x - total/2 + ci*(cw + gap) + (ci % 2 ? 0 : 0);
    const yb = y + (ci % 2 ? cw*.12 : 0);
    for (let k = 0; k < col.k; k++){
      g.drawImage(img, x0, yb - img._h*f - k*img._th*f, cw, img._h*f);
    }
  });
}
function drawPotPile(g, x, y, amount, cw, seed){
  if (amount <= 0) return;
  const bb = G.cfg.bb;
  const rnd = rng(seed);
  if (TH.key === 'saloon'){
    const n = clamp(Math.round(Math.log2(amount/bb + 1)*1.6), 1, 14);
    // bills
    for (let k = 0; k < Math.round(n*.8); k++){
      const bx = x + (rnd() - .5)*cw*7, by = y + (rnd() - .5)*cw*2.2, rot = (rnd() - .5)*1.6;
      g.save(); g.translate(bx, by); g.scale(1, TH.squash*1.25); g.rotate(rot);
      const bw = cw*3.1, bh = cw*1.35;
      g.fillStyle = '#a9b58c'; g.strokeStyle = '#5d6b48'; g.lineWidth = 1;
      g.fillRect(-bw/2, -bh/2, bw, bh); g.strokeRect(-bw/2, -bh/2, bw, bh);
      g.strokeStyle = 'rgba(70,85,55,.6)'; g.strokeRect(-bw/2 + bw*.06, -bh/2 + bh*.12, bw*.88, bh*.76);
      g.fillStyle = 'rgba(90,105,70,.5)'; g.beginPath(); g.ellipse(0, 0, bw*.13, bh*.3, 0, 0, Math.PI*2); g.fill();
      g.restore();
    }
    // coins
    for (let k = 0; k < n; k++){
      const bx = x + (rnd() - .5)*cw*7.5, by = y + (rnd() - .5)*cw*2.6;
      const gold = rnd() > .35;
      g.fillStyle = gold ? '#9c7a22' : '#7c7c80';
      g.beginPath(); g.ellipse(bx, by + cw*.1, cw*.45, cw*.45*TH.squash, 0, 0, Math.PI*2); g.fill();
      const gr = g.createRadialGradient(bx - cw*.15, by - cw*.1, 0, bx, by, cw*.5);
      gr.addColorStop(0, gold ? '#f7d978' : '#e8e8ec'); gr.addColorStop(1, gold ? '#c49a2c' : '#9b9ba2');
      g.fillStyle = gr; g.beginPath(); g.ellipse(bx, by, cw*.45, cw*.45*TH.squash, 0, 0, Math.PI*2); g.fill();
    }
  }
  drawChips(g, x, y + cw*.3, amount, cw, 4, 9);
}

