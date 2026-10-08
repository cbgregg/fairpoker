function drawBadge(g, x, y, text, kind, s){
  s = LS(s);
  const saloon = TH.key === 'saloon';
  const fs = TH.key === 'atari' ? 8 : Math.max(9, (saloon ? 2.3 : 2.2)*U*s);
  g.font = saloon ? font(fs, F_OLD) : font(fs, F_UI, '800');
  const label = saloon ? text : text.toUpperCase();
  const w = g.measureText(label).width + fs*1.4, h = fs*1.5;
  x = clamp(x, w/2 + 4, CW - w/2 - 4);
  const colors = saloon ? {
    fold:['#e9dcc0','#7a2a1f'], check:['#e9dcc0','#2f4a22'], call:['#e9dcc0','#2f4a22'], bet:['#e9dcc0','#5a3a14'], raise:['#e9dcc0','#5a3a14'],
    allin:['#c9a04a','#2a1a06'], win:['#d8c27a','#1d2a10'], turn:['#d9b061','#1e1406'], think:['#e9dcc0','#4a3a2a'], hand:['#f6ecd2','#2a1a06'], '':['#e9dcc0','#3a2a1a'], out:['#9c8f78','#2a2018'] } : {
    fold:['#3a1f24','#ff9e95'], check:['#173a2d','#9df0c4'], call:['#173a2d','#9df0c4'], bet:['#1a2f52','#a8cbff'], raise:['#1a2f52','#a8cbff'],
    allin:['#f2c94c','#1b1505'], win:['#5cc08b','#08170e'], turn:['#f2c94c','#1b1505'], think:['#0c1626','#f2d16b'], hand:['#eaf1fb','#0b1526'], '':['#0c1626','#d3dceb'], out:['#0c1626','#7f8da3'] };
  const [bg, fg] = colors[kind] || colors[''];
  g.save();
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
  g.fillStyle = bg;
  if (saloon){ g.beginPath(); g.moveTo(x - w/2, y - h/2); g.lineTo(x + w/2 - h*.3, y - h/2); g.lineTo(x + w/2, y); g.lineTo(x + w/2 - h*.3, y + h/2); g.lineTo(x - w/2, y + h/2); g.closePath(); g.fill(); }
  else { sq(g, x - w/2, y - h/2, w, h, h/2); g.fill(); g.shadowColor = 'transparent'; g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 1; g.stroke(); }
  g.shadowColor = 'transparent';
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, x, y + fs*.06);
  g.restore();
}
