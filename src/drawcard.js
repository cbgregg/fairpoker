function drawCard(g, c, x, y, w, rot = 0, opt = {}){
  const style = opt.style || TH.cardStyle;
  const flip = opt.flip ?? 1;            // 0..1 → shows back below .5
  const sx = Math.abs(Math.cos(Math.PI * (1 - flip) ));
  const face = flip >= .5 ? c : null;
  const img = cardCanvas(face, w, style);
  const h = w*1.42;
  g.save();
  g.translate(x, y); g.rotate(rot);
  if (opt.alpha != null) g.globalAlpha = opt.alpha;
  g.scale(Math.max(.02, sx), 1);
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = w*.12; g.shadowOffsetY = w*.05;
  if (style === 'pixel') g.imageSmoothingEnabled = false;
  g.drawImage(img, -w/2, -h/2, w, h);
  g.shadowColor = 'transparent';
  if (opt.dim){ g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, -w/2, -h/2, w, h, w*.08); g.fill(); }
  if (opt.hl){ g.strokeStyle = '#6ee39d'; g.lineWidth = Math.max(2, w*.05); g.shadowColor = 'rgba(110,227,157,.8)'; g.shadowBlur = w*.25; rr(g, -w/2, -h/2, w, h, w*.08); g.stroke(); }
  g.restore();
}

