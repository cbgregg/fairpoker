function frame(t){
  requestAnimationFrame(frame);
  drawFrame(t);
}
/* ---- 16-bit console look (internal key is still 'atari') ---- */
let PIX = 3;                                 // screen px per console pixel (2 on phones, like a 256-wide SNES screen)
let pxCv = null, pxG = null, pxLUT = null, pxScan = null;
function atariPalette(){
  const pal = [];
  for (let hue = 0; hue < 16; hue++) for (let lum = 0; lum < 8; lum++){
    const y = .06 + lum/7*.9;
    let i = 0, q = 0;
    if (hue){ const a = (hue - 1)/15*Math.PI*2 + 2.6, sat = .23*(1 - Math.abs(lum - 3.5)/7); i = Math.cos(a)*sat; q = Math.sin(a)*sat; }
    pal.push([y + .956*i + .621*q, y - .272*i - .647*q, y - 1.106*i + 1.703*q].map(v => Math.round(clamp(v, 0, 1)*255)));
  }
  ['#c8201c','#e83a2a','#ffffff','#000000','#111111','#2048b0','#f0d040','#2aa040','#14682a','#f4c89c','#d9a27a','#8a5a3c','#2a1608'].forEach(h => pal.push([1,3,5].map(i => parseInt(h.slice(i, i + 2), 16))));
  return pal;
}
function buildLUT(){
  const pal = atariPalette(), lut = new Uint32Array(32768);
  for (let r = 0; r < 32; r++) for (let gg = 0; gg < 32; gg++) for (let b = 0; b < 32; b++){
    const R = r*8 + 4, G2 = gg*8 + 4, B = b*8 + 4;
    let best = 0, bd = 1e9;
    for (let k = 0; k < pal.length; k++){ const p = pal[k], dr = R - p[0], dg = G2 - p[1], db = B - p[2]; const d = dr*dr*3 + dg*dg*4 + db*db*2; if (d < bd){ bd = d; best = k; } }
    const p = pal[best]; lut[(r << 10) | (gg << 5) | b] = (255 << 24) | (p[2] << 16) | (p[1] << 8) | p[0];
  }
  return lut;
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v/16 - .5)*22);
let lowCv = null, lowG = null;
// 16-bit: 4096 colors (4 bits per channel) with a 4x4 ordered dither, the soft checkered shading of SNES and Genesis games
let Q16 = null, DITHER = 0, QLV = 9;      // no dither: flat, hard-edged color like vector pixel art
function quantize(c, gg){
  if (!Q16){
    Q16 = [];
    for (let k = 0; k < 16; k++){
      const off = (BAYER16[k]/16 - .47)*DITHER, t = new Uint8Array(256);
      for (let v = 0; v < 256; v++) t[v] = Math.round(Math.min(QLV - 1, Math.max(0, Math.round((v + off)/255*(QLV - 1))))*255/(QLV - 1));
      Q16.push(t);
    }
  }
  const W = c.width, H2 = c.height, img = gg.getImageData(0, 0, W, H2), d = img.data;
  for (let y = 0; y < H2; y++){
    const row = (y & 3)*4;
    for (let x = 0, o = y*W*4; x < W; x++, o += 4){
      const t = Q16[row + (x & 3)];
      d[o] = t[d[o]]; d[o + 1] = t[d[o + 1]]; d[o + 2] = t[d[o + 2]]; d[o + 3] = 255;
    }
  }
  gg.putImageData(img, 0, 0);
}
const BAYER16 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function drawAtariFrame(t, sx, sy){
  const w = Math.ceil(CW/PIX), h = Math.ceil(CH/PIX);
  if (!lowCv){ lowCv = document.createElement('canvas'); lowG = lowCv.getContext('2d', { willReadFrequently:true }); }
  if (lowCv.width !== w || lowCv.height !== h){ lowCv.width = w; lowCv.height = h; }
  const g = lowG;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.setTransform(1/PIX, 0, 0, 1/PIX, sx/PIX, sy/PIX);
  g.imageSmoothingEnabled = true; g.drawImage(staticCv, 0, 0, CW, CH);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  drawScene(g, t);
  quantize(lowCv, g);
  cx.setTransform(1, 0, 0, 1, 0, 0); cx.imageSmoothingEnabled = false;
  cx.drawImage(lowCv, 0, 0, w*PIX*DPR, h*PIX*DPR);
  cx.imageSmoothingEnabled = true;
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawAtariBoard(cx);
  drawYouPixel(t);
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawAtariLabels(cx, t);
}
function drawFrame(t){
  for (const tw of tweens){
    const p = tw.d <= 0 ? 1 : clamp((t - tw.t0)/tw.d, 0, 1);
    tw.fn(tw.ease(p));
    if (p >= 1){ tweens.delete(tw); tw.res(); }
  }
  if (!G || $('#game').hidden || !CW) return;
  if (showFps){ fpsN++; if (t - fpsT > 500){ fpsVal = Math.round(fpsN*1000/(t - fpsT)); fpsN = 0; fpsT = t; } }
  if (staticDirty) buildStatic();
  const g = cx;
  let sx = 0, sy = 0;
  if (H && H.shake && !RM){ const e = (t - H.shake)/480; if (e < 1){ const a = 7*(1 - e)*(1 - e); sx = (Math.random()*2 - 1)*a; sy = (Math.random()*2 - 1)*a; } }
  g.setTransform(DPR, 0, 0, DPR, sx*DPR, sy*DPR);
  if (TH.key === 'atari') drawAtariFrame(t, sx, sy);
  else {
    if (sx || sy){ g.fillStyle = '#000'; g.fillRect(-10, -10, CW + 20, CH + 20); }
    g.drawImage(staticCv, 0, 0, CW, CH);
    drawScene(g, t);
  }
  if (showFps){ g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(8, 8, 66, 22); g.fillStyle = '#9df0c4'; g.font = font(13, '"JetBrains Mono",monospace'); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(fpsVal + ' fps', 14, 19); }
}

