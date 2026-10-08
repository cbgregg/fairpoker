/* =====================================================================
   COURT CARDS — traditional double-ended figures (King / Queen / Jack),
   drawn on a 21 x 17 grid per half, mirrored for the bottom half.
   ===================================================================== */
const COURT_INK = {
  modern:  { r:'#c8201c', b:'#1f48a8', y:'#e8b020', k:'#111111', s:'#f6d2aa', w:'#ffffff', g:'#2a8a3a' },
  vintage: { r:'#a5281f', b:'#2a3f78', y:'#c9973a', k:'#1f1b17', s:'#efcfa6', w:'#f6ecd6', g:'#3d6b34' },
  pixel:   { r:'#c8201c', b:'#2048b0', y:'#e8b020', k:'#111111', s:'#f4c89c', w:'#ffffff', g:'#2a8a3a' }
};
function courtHalf(g, u, rk, red, C, suit){
  const rank = rk + 1;            // 12 king, 11 queen, 10 jack
  const P = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x*u, y*u) : g.moveTo(x*u, y*u)); g.closePath(); };
  const E = (x, y, rx, ry) => { g.beginPath(); g.ellipse(x*u, y*u, rx*u, ry*u, 0, 0, Math.PI*2); };
  const line = Math.max(1, u*.22);
  const ol = () => { g.strokeStyle = C.k; g.lineWidth = line; g.lineJoin = 'round'; g.stroke(); };
  // colour scheme per rank, swapped on red suits like a real pattern
  const main = rank === 11 ? (red ? C.b : C.r) : rank === 10 ? (red ? C.r : C.b) : (red ? C.y : C.r);
  const alt  = rank === 11 ? C.y : rank === 10 ? C.y : C.b;
  // robe
  g.beginPath(); g.moveTo(1.5*u, 17*u); g.lineTo(1.5*u, 12.6*u); g.quadraticCurveTo(2*u, 9.4*u, 6*u, 9*u); g.lineTo(14*u, 9*u); g.quadraticCurveTo(18*u, 9.4*u, 18.5*u, 12.6*u); g.lineTo(18.5*u, 17*u); g.closePath();
  g.fillStyle = main; g.fill(); ol();
  // front panel with a pattern
  g.fillStyle = alt; g.fillRect(8.4*u, 9.2*u, 3.2*u, 7.8*u);
  g.fillStyle = C.w; for (let y = 10.4; y < 16.6; y += 1.6){ g.fillRect(9.5*u, y*u, 1*u, .8*u); }
  g.strokeStyle = C.k; g.lineWidth = line*.8; g.strokeRect(8.4*u, 9.2*u, 3.2*u, 7.8*u);
  // trim bands
  for (let x = 1.6; x < 18.4; x += 1.4){ g.fillStyle = (Math.round(x/1.4) % 2) ? C.y : C.k; g.fillRect(x*u, 13.4*u, 1.4*u, 1*u); }
  g.fillStyle = C.w; g.fillRect(1.6*u, 15.6*u, 6.6*u, .7*u); g.fillRect(11.8*u, 15.6*u, 6.6*u, .7*u);
  // collar
  E(10, 9.2, 4, 1.3); g.fillStyle = C.w; g.fill(); ol();
  g.fillStyle = C.k; for (let x = 6.8; x <= 13.2; x += 1.6){ g.fillRect(x*u, 9*u, .5*u, .5*u); }
  // hair behind the face
  g.fillStyle = rank === 11 ? C.y : C.k;
  if (rank === 11){ P([[6.6, 4], [7, 9.2], [13, 9.2], [13.4, 4]]); g.fill(); }
  else { P([[6.9, 3.8], [6.9, 7.4], [13.1, 7.4], [13.1, 3.8]]); g.fill(); }
  // face
  E(10, 5.9, 2.7, 3); g.fillStyle = C.s; g.fill(); ol();
  g.fillStyle = C.k; E(8.95, 5.5, .38, .3); g.fill(); E(11.05, 5.5, .38, .3); g.fill();
  g.fillRect(8.4*u, 4.6*u, 1.2*u, .3*u); g.fillRect(10.4*u, 4.6*u, 1.2*u, .3*u);
  g.fillStyle = C.r; g.fillRect(9.4*u, 7.4*u, 1.2*u, .4*u);
  if (rank === 12){                                 // king: beard and moustache
    g.fillStyle = C.k; g.beginPath(); g.moveTo(7.4*u, 6.6*u); g.quadraticCurveTo(10*u, 11.4*u, 12.6*u, 6.6*u); g.quadraticCurveTo(10*u, 8.6*u, 7.4*u, 6.6*u); g.fill();
    g.fillRect(8.6*u, 6.9*u, 2.8*u, .45*u);
  }
  // headwear
  if (rank === 12){
    P([[6.4, 3.6], [6.4, 1.4], [7.7, 2.5], [8.85, .4], [10, 2.3], [11.15, .4], [12.3, 2.5], [13.6, 1.4], [13.6, 3.6]]); g.fillStyle = C.y; g.fill(); ol();
    g.fillStyle = C.r; E(8.2, 2.9, .45, .45); g.fill(); E(11.8, 2.9, .45, .45); g.fill(); g.fillStyle = C.b; E(10, 2.9, .5, .5); g.fill();
  } else if (rank === 11){
    P([[7, 3.4], [7, 1.8], [8.2, 2.6], [9.1, 1], [10, 2.4], [10.9, 1], [11.8, 2.6], [13, 1.8], [13, 3.4]]); g.fillStyle = C.y; g.fill(); ol();
    g.fillStyle = C.b; E(10, 2.8, .4, .4); g.fill();
  } else {
    g.beginPath(); g.ellipse(10*u, 3.3*u, 3.6*u, 2.4*u, 0, Math.PI, 0); g.closePath(); g.fillStyle = C.r; g.fill(); ol();
    g.fillStyle = C.y; g.fillRect(6*u, 3.1*u, 8*u, .9*u); g.strokeStyle = C.k; g.lineWidth = line*.8; g.strokeRect(6*u, 3.1*u, 8*u, .9*u);
    g.strokeStyle = C.y; g.lineWidth = u*.6; g.beginPath(); g.moveTo(12.6*u, 2*u); g.quadraticCurveTo(15.5*u, .4*u, 16.5*u, 2.2*u); g.stroke();
  }
  // the thing each figure holds
  if (rank === 12){                                 // sword
    g.fillStyle = C.w; g.fillRect(16.2*u, 0, 1*u, 10.4*u); g.strokeStyle = C.k; g.lineWidth = line*.8; g.strokeRect(16.2*u, 0, 1*u, 10.4*u);
    g.fillStyle = C.y; g.fillRect(14.6*u, 10.2*u, 4.2*u, .9*u); g.fillRect(16.3*u, 11.1*u, .8*u, 2*u);
    g.fillStyle = C.s; E(16.7, 12.2, 1, .8); g.fill();
  } else if (rank === 11){                          // flower
    g.strokeStyle = C.g; g.lineWidth = u*.5; g.beginPath(); g.moveTo(16.6*u, 3.4*u); g.lineTo(15.8*u, 11.6*u); g.stroke();
    g.fillStyle = C.r; for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]){ E(16.6 + dx*.8, 2.6 + dy*.8, .7, .7); g.fill(); }
    g.fillStyle = C.y; E(16.6, 2.6, .5, .5); g.fill();
    g.fillStyle = C.s; E(15.8, 11.8, 1, .8); g.fill();
  } else {                                          // halberd
    g.strokeStyle = C.k; g.lineWidth = u*.45; g.beginPath(); g.moveTo(17*u, 0); g.lineTo(17*u, 12*u); g.stroke();
    P([[15.2, .8], [17, 0], [18.8, .8], [18.8, 2.2], [17, 1.6], [15.2, 2.2]]); g.fillStyle = C.y; g.fill(); ol();
    g.fillStyle = C.s; E(17, 11.6, 1, .8); g.fill();
  }
  // suit in the corner of the frame
  g.fillStyle = red ? C.r : C.k; suitPath(g, suit, 2.6*u, 2.4*u, 2.6*u); g.fill();
}
// frame at (fx, fy) size fw x fh; draws both halves
function paintCourt(g, fx, fy, fw, fh, rank, suit, style){
  const C = COURT_INK[style] || COURT_INK.modern, red = suit === 1 || suit === 2;
  const u = fw/20, half = fh/2;
  g.save();
  g.beginPath(); g.rect(fx, fy, fw, fh); g.clip();
  g.fillStyle = C.w; g.fillRect(fx, fy, fw, fh);
  for (const flip of [0, 1]){
    g.save();
    if (flip){ g.translate(fx + fw, fy + fh); g.rotate(Math.PI); } else g.translate(fx, fy);
    g.scale(1, half/(17*u));
    g.translate(-.5*u, 0);
    courtHalf(g, u, rank, red, C, suit);
    g.restore();
  }
  g.strokeStyle = C.k; g.lineWidth = Math.max(1, u*.25);
  g.beginPath(); g.moveTo(fx, fy + half); g.lineTo(fx + fw, fy + half); g.stroke();
  g.restore();
  g.strokeStyle = C.k; g.lineWidth = Math.max(1, u*.3); g.strokeRect(fx, fy, fw, fh);
}

/* =====================================================================
   PIXEL DECK — original early-Windows-style cards: 33 x 47 pixel grid,
   bitmap index font and suits, pixel court figures, scaled up crisp.
   ===================================================================== */
const PXF = {   // 3 x 5 font
  A:['.X.','X.X','XXX','X.X','X.X'], 2:['XX.','..X','.X.','X..','XXX'], 3:['XX.','..X','.X.','..X','XX.'], 4:['X.X','X.X','XXX','..X','..X'],
  5:['XXX','X..','XX.','..X','XX.'], 6:['.XX','X..','XXX','X.X','XXX'], 7:['XXX','..X','.X.','.X.','.X.'], 8:['XXX','X.X','XXX','X.X','XXX'],
  9:['XXX','X.X','XXX','..X','XX.'], 0:['XXX','X.X','X.X','X.X','XXX'], 1:['.X.','XX.','.X.','.X.','XXX'],
  J:['..X','..X','..X','X.X','.X.'], Q:['XXX','X.X','X.X','XXX','..X'], K:['X.X','XX.','X..','XX.','X.X']
};
const PXS = [   // 5 x 5 suits: spade, heart, diamond, club
  ['..X..','.XXX.','XXXXX','XXXXX','..X..'],
  ['.X.X.','XXXXX','XXXXX','.XXX.','..X..'],
  ['..X..','.XXX.','XXXXX','.XXX.','..X..'],
  ['..X..','.XXX.','X.X.X','XXXXX','..X..']
];
const PXL = [   // 7 x 7 suits for pips
  ['...X...','..XXX..','.XXXXX.','XXXXXXX','XXXXXXX','..XXX..','.XXXXX.'],
  ['.XX.XX.','XXXXXXX','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..','...X...'],
  ['...X...','..XXX..','.XXXXX.','XXXXXXX','.XXXXX.','..XXX..','...X...'],
  ['..XXX..','..XXX..','XX.X.XX','XXXXXXX','XX.X.XX','...X...','..XXX..']
];
const pxCache = new Map();
function bmp(g, rows, x, y, col, s = 1, flip = false){
  g.fillStyle = col;
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === 'X'){
    const yy = flip ? y + (rows.length - 1 - j)*s : y + j*s, xx = flip ? x + (r.length - 1 - i)*s : x + i*s;
    g.fillRect(xx, yy, s, s);
  } });
}
function pixelCardBase(c){
  const key = c == null ? 'back' : c;
  let cv = pxCache.get(key); if (cv) return cv;
  const W = 33, Hh = 47;
  cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const g = cv.getContext('2d');
  // card body with a square corner notch
  g.fillStyle = '#000'; g.fillRect(1, 0, W - 2, Hh); g.fillRect(0, 1, W, Hh - 2);
  g.fillStyle = '#fff'; g.fillRect(1, 1, W - 2, Hh - 2);
  if (c == null){
    // original back: blue field, lattice, centre spade
    g.fillStyle = '#2048b0'; g.fillRect(3, 3, W - 6, Hh - 6);
    g.fillStyle = '#6a8ae8';
    for (let y = 3; y < Hh - 3; y++) for (let x = 3; x < W - 3; x++) if (((x + y) % 6 === 0) || ((x - y + 600) % 6 === 0)) g.fillRect(x, y, 1, 1);
    g.fillStyle = '#fff'; g.fillRect(11, 17, 11, 13);
    bmp(g, PXL[0], 13, 20, '#111');
    g.fillStyle = '#e8b020'; g.fillRect(3, 3, W - 6, 1); g.fillRect(3, Hh - 4, W - 6, 1); g.fillRect(3, 3, 1, Hh - 6); g.fillRect(W - 4, 3, 1, Hh - 6);
  } else {
    const rk = c >> 2, s = c & 3, red = s === 1 || s === 2, ink = red ? '#c8201c' : '#111';
    const label = RANKS[rk];
    const drawIndex = (flip) => {
      const glyphs = label === '10' ? ['1', '0'] : [label];
      if (!flip){ glyphs.forEach((ch, i) => bmp(g, PXF[ch], 2 + i*4, 2, ink)); bmp(g, PXS[s], 2, 8, ink); }
      else { glyphs.forEach((ch, i) => bmp(g, PXF[ch], W - 5 - (glyphs.length - 1 - i)*4, Hh - 7, ink, 1, true)); bmp(g, PXS[s], W - 7, Hh - 13, ink, 1, true); }
    };
    drawIndex(false); drawIndex(true);
    if (rk === 12){
      bmp(g, PXL[s], 9, 16, ink, 2);
    } else if (rk >= 9){
      // vector court art rendered tiny, then snapped to the card palette for hard pixels
      const fx = 8, fy = 3, fw = 20, fh = 41;
      const t = document.createElement('canvas'); t.width = fw*4; t.height = fh*4;
      paintCourt(t.getContext('2d'), 0, 0, fw*4, fh*4, rk, s, 'pixel');
      const sm = document.createElement('canvas'); sm.width = fw; sm.height = fh;
      const sg = sm.getContext('2d'); sg.imageSmoothingEnabled = true; sg.drawImage(t, 0, 0, fw, fh);
      const id = sg.getImageData(0, 0, fw, fh), d = id.data;
      const pal = Object.entries(COURT_INK.pixel).filter(([k]) => k !== 'g').map(([, h]) => h).map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
      for (let i = 0; i < d.length; i += 4){
        let best = pal[0], bd = 1e9;
        for (const p of pal){ const dd = (d[i] - p[0])**2*2 + (d[i + 1] - p[1])**2*3 + (d[i + 2] - p[2])**2; if (dd < bd){ bd = dd; best = p; } }
        d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2]; d[i + 3] = 255;
      }
      sg.putImageData(id, 0, 0);
      g.drawImage(sm, fx, fy);
      g.fillStyle = '#111'; g.fillRect(fx - 1, fy - 1, fw + 2, 1); g.fillRect(fx - 1, fy + fh, fw + 2, 1); g.fillRect(fx - 1, fy - 1, 1, fh + 2); g.fillRect(fx + fw, fy - 1, 1, fh + 2);
    } else {
      const x0 = 4, x1 = 22, y0 = 4, y1 = 36;
      for (const [px, py] of PIPS[rk + 2]){
        const x = Math.round(lerp(x0, x1, px/100)), y = Math.round(lerp(y0, y1, py/100));
        bmp(g, PXL[s], x, y, ink, 1, py > 50);
      }
    }
  }
  pxCache.set(key, cv);
  return cv;
}
function paintPixelCard(g, w, h, c){
  g.imageSmoothingEnabled = false;
  g.drawImage(pixelCardBase(c), 0, 0, w, h);
}

// 20 x 28 board card: big index and suit only, readable at 1:1 in the 8-bit buffer
const pxMini = new Map();
function pixelMiniCard(c){
  let cv = pxMini.get(c); if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = 16; cv.height = 24;
  const g = cv.getContext('2d'), W = 16, Hh = 24;
  g.fillStyle = '#000'; g.fillRect(1, 0, W - 2, Hh); g.fillRect(0, 1, W, Hh - 2);
  g.fillStyle = '#fff'; g.fillRect(1, 1, W - 2, Hh - 2);
  const rk = c >> 2, s = c & 3, ink = s === 1 || s === 2 ? '#c8201c' : '#111', label = RANKS[rk];
  const glyphs = label === '10' ? ['1', '0'] : [label];
  const gw = glyphs.length*8 - 2;
  glyphs.forEach((ch, i) => bmp(g, PXF[ch], Math.round((W - gw)/2) + i*8, 3, ink, 2));
  bmp(g, PXS[s], 3, 13, ink, 2);
  pxMini.set(c, cv);
  return cv;
}
