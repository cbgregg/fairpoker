function buildPots(){
  const contrib = G.players.map(p => p.contrib);
  const pots = [];
  for (;;){
    const elig = G.players.filter((p,i) => live(p) && contrib[i] > 0);
    if (!elig.length) break;
    const level = Math.min(...elig.map(p => contrib[idxOf(p)]));
    let amount = 0;
    contrib.forEach((c,i) => { const t = Math.min(c, level); amount += t; contrib[i] -= t; });
    const prev = pots[pots.length-1];
    if (prev && prev.eligible.length === elig.length) prev.amount += amount;
    else pots.push({ amount, eligible:elig });
  }
  const left = contrib.reduce((a,b) => a+b, 0);
  if (left && pots.length) pots[pots.length-1].amount += left;
  return pots;
}

