/* ---- suits as paths ---- */
function suitPath(g, s, x, y, size){
  const k = size/2;
  g.beginPath();
  if (s === 2){ g.moveTo(x, y - k); g.lineTo(x + k*.78, y); g.lineTo(x, y + k); g.lineTo(x - k*.78, y); g.closePath(); }
  else if (s === 1){
    g.moveTo(x, y + k*.95);
    g.bezierCurveTo(x - k*.55, y + k*.55, x - k*1.05, y + k*.15, x - k*.95, y - k*.35);
    g.bezierCurveTo(x - k*.85, y - k*.85, x - k*.2, y - k*.95, x, y - k*.45);
    g.bezierCurveTo(x + k*.2, y - k*.95, x + k*.85, y - k*.85, x + k*.95, y - k*.35);
    g.bezierCurveTo(x + k*1.05, y + k*.15, x + k*.55, y + k*.55, x, y + k*.95);
    g.closePath();
  } else if (s === 0){
    g.moveTo(x, y - k*.95);
    g.bezierCurveTo(x + k*.55, y - k*.5, x + k*1.0, y - k*.15, x + k*.92, y + k*.25);
    g.bezierCurveTo(x + k*.85, y + k*.65, x + k*.3, y + k*.7, x + k*.08, y + k*.4);
    g.lineTo(x + k*.28, y + k*.95); g.lineTo(x - k*.28, y + k*.95); g.lineTo(x - k*.08, y + k*.4);
    g.bezierCurveTo(x - k*.3, y + k*.7, x - k*.85, y + k*.65, x - k*.92, y + k*.25);
    g.bezierCurveTo(x - k*1.0, y - k*.15, x - k*.55, y - k*.5, x, y - k*.95);
    g.closePath();
  } else {
    g.arc(x, y - k*.42, k*.4, 0, Math.PI*2);
    g.moveTo(x - k*.06, y + k*.12); g.arc(x - k*.45, y + k*.12, k*.4, 0, Math.PI*2);
    g.moveTo(x + k*.85, y + k*.12); g.arc(x + k*.45, y + k*.12, k*.4, 0, Math.PI*2);
    g.moveTo(x - k*.1, y + k*.1); g.lineTo(x + k*.1, y + k*.1); g.lineTo(x + k*.3, y + k*.95); g.lineTo(x - k*.3, y + k*.95); g.closePath();
  }
}
function rr(g, x, y, w, h, r){
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// UI panels on the table use square corners (cards keep their rounded corners via rr)
function sq(g, x, y, w, h){ g.beginPath(); g.rect(x, y, w, h); }
