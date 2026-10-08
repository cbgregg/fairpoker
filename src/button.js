function drawButton(g, x, y, s){
  const saloon = TH.key === 'saloon';
  const r = (saloon ? 2.8 : 3.4)*U*s;
  g.save();
  g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(x, y + r*.35, r, r*TH.squash, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = saloon ? '#bfb39a' : '#b9c0c9'; g.beginPath(); g.ellipse(x, y + r*.18, r, r*TH.squash, 0, 0, Math.PI*2); g.fill();
  const gr = g.createRadialGradient(x - r*.3, y - r*.3, 0, x, y, r);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, saloon ? '#e3d6b8' : '#dfe5ec');
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r*TH.squash, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = '#1b1c20'; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (saloon){ g.font = font(r*.9, F_WEST); g.fillText('D', x, y + r*.03); }
  else { g.font = font(r*.48, F_UI, '800'); g.fillText('DEALER', x, y + r*.03); }
  g.restore();
}
