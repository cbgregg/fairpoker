function youCardPts(){
  const rb0 = proj({ x:TH.W/2, y:TH.H - TH.rail/2 });
  const w = TH.key === 'atari' && TH.cardStyle === 'pixel' ? 33*PIX*clamp(Math.floor(CW*(FP() ? .3 : .2)/(33*PIX)), 1, 3) : FP() ? Math.min(CW*.24, 130) : 12.5*U, rb = { x:rb0.x, y:Math.min(rb0.y, CH + w*.1) }, tk = (H && H.tuckP) || 0, dy = tk*w*1.02;
  return { w, pts:[ { x:rb.x - w*.5, y:rb.y - w*.5 + dy, r:-.12 + tk*.06 }, { x:rb.x + w*.34, y:rb.y - w*.58 + dy, r:.05 - tk*.03 } ] };
}
