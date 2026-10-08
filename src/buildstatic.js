function buildStatic(){
  staticDirty = false;
  staticCv.width = cv.width; staticCv.height = cv.height;
  const g = staticCv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!feltPattern) feltPattern = g.createPattern(noiseCanvas(), 'repeat');
  if (TH.key === 'saloon') paintSaloonRoom(g); else if (TH.key === 'atari') paintAtariRoom(g); else paintRegularRoom(g);
  paintDealerTorso(g);
  // table shadow
  g.save();
  g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 40*U/4; g.shadowOffsetY = 18*U/4;
  g.beginPath(); tracePoly(g, tablePoly(0)); g.fillStyle = '#000'; g.fill();
  g.restore();
  // rail
  g.save();
  g.beginPath(); tracePoly(g, tablePoly(0));
  const top = proj({ x:TH.W/2, y:0 }), bot = proj({ x:TH.W/2, y:TH.H });
  const rg = g.createLinearGradient(0, top.y, 0, bot.y);
  if (TH.key === 'saloon'){ rg.addColorStop(0, '#5a321c'); rg.addColorStop(.5, '#6e3e22'); rg.addColorStop(1, '#4a2914'); }
  else if (TH.key === 'atari'){ rg.addColorStop(0, '#7a3c10'); rg.addColorStop(1, '#a8581c'); }
  else { rg.addColorStop(0, '#1d3a63'); rg.addColorStop(.5, '#16304f'); rg.addColorStop(1, '#0d2038'); }
  g.fillStyle = rg; g.fill();
  g.clip();
  if (TH.key === 'saloon'){
    const rnd = rng(77);
    for (let k = 0; k < 140; k++){
      const y0 = top.y + rnd()*(bot.y - top.y + 60) - 20, x0 = rnd()*CW;
      g.strokeStyle = `rgba(${rnd() > .5 ? '20,10,4' : '160,100,60'},${.06 + rnd()*.1})`; g.lineWidth = .6 + rnd()*1.2;
      g.beginPath(); g.moveTo(x0 - 120, y0); g.bezierCurveTo(x0 - 40, y0 + (rnd() - .5)*8, x0 + 40, y0 + (rnd() - .5)*8, x0 + 120, y0 + (rnd() - .5)*6); g.stroke();
    }
    // nicks and wear
    for (let k = 0; k < 30; k++){ g.fillStyle = 'rgba(220,170,120,.12)'; g.fillRect(rnd()*CW, top.y + rnd()*(bot.y - top.y), 2 + rnd()*10, 1); }
  }
  g.restore();
  // rail highlight
  g.save(); g.beginPath(); tracePoly(g, tablePoly(.6));
  g.strokeStyle = TH.key === 'saloon' ? 'rgba(255,210,160,.22)' : 'rgba(140,190,255,.25)'; g.lineWidth = 1.5; g.stroke(); g.restore();
  // felt
  const fp = tablePoly(TH.rail);
  g.save();
  g.beginPath(); tracePoly(g, fp);
  const c0 = proj({ x:TH.W/2, y:TH.H*.5 });
  const fg = g.createRadialGradient(c0.x, c0.y, 0, c0.x, c0.y, Math.max(CW, CH)*.6);
  if (TH.key === 'saloon'){ fg.addColorStop(0, '#2f6e47'); fg.addColorStop(.55, '#225436'); fg.addColorStop(1, '#123321'); }
  else if (TH.key === 'atari'){ fg.addColorStop(0, '#2aa040'); fg.addColorStop(1, '#14682a'); }
  else { fg.addColorStop(0, '#2f78c4'); fg.addColorStop(.55, '#225fa5'); fg.addColorStop(1, '#173f73'); }
  g.fillStyle = fg; g.fill();
  g.clip();
  g.fillStyle = feltPattern; g.fillRect(0, 0, CW, CH);
  if (TH.key === 'regular'){
    // soft spokes
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 18*U/4;
    for (let k = 0; k < 10; k++){
      const a = k/10*Math.PI*2, e = proj({ x:TH.W/2 + Math.cos(a)*90, y:TH.H/2 + Math.sin(a)*120 });
      g.beginPath(); g.moveTo(c0.x, c0.y); g.lineTo(e.x, e.y); g.stroke();
    }
  }
  // inner edge shading
  g.lineWidth = 14; g.strokeStyle = 'rgba(0,0,0,.35)'; g.filter = 'blur(6px)';
  g.beginPath(); tracePoly(g, fp); g.stroke(); g.filter = 'none';
  g.restore();
  // padded rail edge
  g.save(); g.beginPath(); tracePoly(g, fp);
  g.strokeStyle = TH.key === 'saloon' ? '#2a170c' : '#0b1b30'; g.lineWidth = 3; g.stroke();
  g.strokeStyle = TH.key === 'saloon' ? 'rgba(255,200,140,.18)' : 'rgba(120,180,255,.35)'; g.lineWidth = 1; g.beginPath(); tracePoly(g, tablePoly(TH.rail - .5)); g.stroke();
  g.restore();
  // betting line
  g.save(); g.beginPath(); tracePoly(g, trackPoly());
  g.strokeStyle = TH.key === 'saloon' ? 'rgba(236,228,206,.55)' : TH.key === 'atari' ? '#f0e040' : 'rgba(126,186,245,.7)'; g.lineWidth = Math.max(1.2, U*.45); g.stroke();
  if (TH.key === 'regular'){ g.fillStyle = 'rgba(255,255,255,.035)'; g.fill(); }
  g.restore();
  if (TH.key === 'saloon') paintProps(g);
  paintPendant(g, 'pool');
  // overlay drawn above the dealer's arms: his shoulder yoke (so sleeves grow out of the shoulders) and the lamp shade
  ovCv.width = cv.width; ovCv.height = cv.height;
  const og = ovCv.getContext('2d');
  og.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!FP()){
    og.save();
    og.beginPath(); og.rect(-20, -20, CW + 40, CH + 40); tracePoly(og, tablePoly(0)); og.clip('evenodd');
    // only the shoulders sit over the arms (so sleeves grow out of them); below the armpits the arms are in front of the body
    const dt = proj({ x:TH.W/2, y:.5 }), dk = U*dt.s;
    og.beginPath(); og.rect(-20, -20, CW + 40, dt.y - 4.5*dk + 20); og.clip();
    paintDealerTorso(og, true);
    og.restore();
  }
  paintPendant(og, 'shade');
}
