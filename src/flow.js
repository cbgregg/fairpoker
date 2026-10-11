/* ---- tweens, sprites and hand motion ---- */
function tween(dur, fn, ease = EASE.out){
  const d = RM ? 0 : T(dur);
  return new Promise(res => { if (d <= 0){ fn(1); res(); return; } tweens.add({ t0:performance.now(), d, fn, ease, res }); });
}
function flySprite(drawFn, from, to, dur, o = {}){
  const sp = { p:0, draw:(g, t) => {
    const e = sp.p;
    const x = lerp(from.x, to.x, e), y = lerp(from.y, to.y, e) - Math.sin(Math.PI*e)*(o.arc || 0);
    const s = lerp(from.s ?? 1, to.s ?? 1, e);
    drawFn(g, x, y, s, e);
  } };
  sprites.add(sp);
  return tween(dur, e => { sp.p = e; }, o.ease || EASE.inOut).then(() => sprites.delete(sp));
}
function handTo(k, side, to, dur, o = {}){
  const st = HS[k] && HS[k][side];
  if (!st || !handsOn()) return Promise.resolve();
  const tok = ++st.tok, from = { ...st.pos }, lift0 = st.lift, curl0 = st.curl;
  st.idle = !!o.idle; st.freeAt = performance.now() + T(dur);
  const liftPeak = o.lift ?? 1.4, curl1 = o.curl ?? st.curl;
  return tween(dur, e => {
    if (st.tok !== tok) return;
    st.pos = { x:lerp(from.x, to.x, e), y:lerp(from.y, to.y, e) };
    st.lift = lerp(lift0, 0, e) + Math.sin(Math.PI*e)*liftPeak;
    st.curl = lerp(curl0, curl1, e);
  }, o.ease || EASE.inOut);
}
const reach = (k, side, pt, dur, o) => handTo(k, side, wristFor(k, pt), dur, o);
const home = (k, side, dur = 420) => handsOn() && HS[k] ? handTo(k, side, restOf(k, side), dur, { curl:0, lift:.8 }) : Promise.resolve();
// hand arrives open over the object, fingers close on it, it travels in the fingers, is set down, fingers open
async function grip(k, side, pt, g = .6, dur = 130){ return handTo(k, side, wristFor(k, pt), dur, { curl:g, lift:0 }); }
async function letGo(k, side, pt, dur = 120){ return handTo(k, side, wristFor(k, pt), dur, { curl:0, lift:0 }); }
async function carry(k, side, draw, from, to, dur, o = {}){
  if (!handsOn()){ o.onGrab && o.onGrab(); await flySprite(draw, proj(from), proj(to), dur, { arc:o.arc ?? 4*U }); return; }
  const st = HS[k][side], g = o.grip ?? .6;
  await reach(k, side, from, o.reachDur ?? 380, { curl:0, lift:o.lift ?? 1.4 });
  st.obj = draw; o.onGrab && o.onGrab();
  await grip(k, side, from, g);
  await reach(k, side, to, dur, { curl:g, lift:o.carryLift ?? 1.4 });
  st.obj = null; o.onDrop && o.onDrop();
  await letGo(k, side, to);
}
const chipsDraw = amt => (g, x, y, s) => drawChips(g, x, y, amt, 3.5*U*s, 2, 8);
const backsDraw = (n, wu) => (g, x, y, s, e = 0) => {
  for (let k = 0; k < n; k++) drawCard(g, null, x + (k - (n - 1)/2)*wu*U*s*.35, y, wu*U*s, (k - (n - 1)/2)*.2 + e*3);
};
const bump = p => (p.animSeq = (p.animSeq || 0) + 1);
// a player's two hole cards, drawn in the fingers (face up shows them flipping with p.flipP)
const cardsObj = (p, up) => (g, x, y, s) => {
  const i = G.players.indexOf(p), lay = L[i]; if (!lay) return;
  const B = flatBasis(lay.cards, up ? null : lay), wu = (up ? 7.2 : 5.8)*fpShrink(lay.cards);
  p.hole.forEach((c, k) => { if (c != null) drawFlat(g, c, B, x, y, wu, (k - .5)*.14, { face:up, flip:up ? (p.flipP ?? 1) : 0, dx:(k - .5)*wu*.58, dy:-wu*.35, lift:1 }); });
};
function dropHeld(i, side, p){ const st = HS[i] && HS[i][side]; if (st) st.obj = null; if (p) p.inHandCards = false; }
async function revealInHand(h, p, slow){
  const i = idxOf(p);
  if (!handsOn() || !HS[i]){ p.flipP = 0; p.shown = true; sfx.flip(); await tween(slow ? 520 : 360, e => { p.flipP = e; }); return; }
  bump(p); p.peek = 0;
  const st = HS[i].R, cards = L[i].cards;
  await reach(i, 'R', cards, slow ? 420 : 280, { curl:0, lift:1.2 });
  if (!alive(h)) return dropHeld(i, 'R', p);
  p.flipP = 0; p.shown = true; p.inHandCards = true; st.obj = cardsObj(p, true);
  await grip(i, 'R', cards, .5, slow ? 170 : 130);
  await reach(i, 'R', add(cards, L[i].d, -1.5), slow ? 320 : 220, { curl:.5, lift:2.8 });
  sfx.flip();
  await tween(slow ? 560 : 380, e => { p.flipP = e; }, EASE.out);
  await reach(i, 'R', cards, slow ? 300 : 220, { curl:.5, lift:0 });
  dropHeld(i, 'R', p);
  await letGo(i, 'R', cards, 130);
  home(i, 'R', 380);
}
// your cards: slide down below the rail to hide them, tap to lift them back up
function setTuck(h, v){
  if (!h) return Promise.resolve();
  const tok = (h.tuckTok = (h.tuckTok || 0) + 1), from = h.tuckP || 0;
  h.tucked = v; dockKey = ''; renderDock();
  return tween(420, e => { if (h.tuckTok === tok) h.tuckP = lerp(from, v ? 1 : 0, e); }, EASE.inOut);
}

/* ---- reactions: additive lift / pull-back plus finger poses, layered on top of whatever the hand is doing ---- */
function fxTo(st, lift, back, dur, ease = EASE.out){
  const l0 = st.fxLift, b0 = st.fxBack, tok = (st.fxTok = (st.fxTok || 0) + 1);
  return tween(dur, e => { if (st.fxTok !== tok) return; st.fxLift = lerp(l0, lift, e); st.fxBack = lerp(b0, back, e); }, ease);
}
const setPose = (st, pose, ms) => { st.pose = pose; st.poseUntil = ms === Infinity ? Infinity : performance.now() + T(ms); };
function resetFx(){
  for (const k of Object.keys(HS)) for (const sd of ['L', 'R']){ const st = HS[k][sd]; st.fxLift = 0; st.fxBack = 0; st.pose = null; st.poseUntil = 0; st.fxTok = (st.fxTok || 0) + 1; }
}
async function react(i, kind, delay = 0){
  if (!handsOn() || RM || !HS[i] || (i === 0 && kind !== 'win')) return;
  if (delay) await sleep(T(delay));
  if (!HS[i]) return;
  const A = HS[i].L, B = HS[i].R, both = [A, B];
  const all = f => Promise.all(both.map(f));
  switch (kind){
    case 'startle':                                   // someone shoves or a monster hand hits the felt
      both.forEach(st => setPose(st, 'spread', 650));
      await all(st => fxTo(st, .9, 1.3, 150));
      await all(st => fxTo(st, 0, 0, 560, EASE.inOut));
      break;
    case 'tense':                                     // facing a big bet: fingers dig in
      setPose(B, 'claw', 1600); setPose(A, 'u2', 1600);
      break;
    case 'pat':                                       // small win: one satisfied tap
      setPose(B, 'u1', 500);
      await fxTo(B, .8, 0, 130); await fxTo(B, 0, 0, 110, EASE.lin); sfx.knock();
      break;
    case 'win': {                                     // big win: fists, pumps on the felt
      const n = 3;
      both.forEach(st => setPose(st, 'fist', 380*n + 300));
      for (let r = 0; r < n; r++){
        await all(st => fxTo(st, 1.7, .6, 150));
        await all(st => fxTo(st, 0, 0, 120, EASE.lin));
        sfx.knock();
      }
      break;
    }
    case 'lose':                                      // bad beat: slap the table, then grip it
      both.forEach(st => setPose(st, 'spread', 420));
      await all(st => fxTo(st, 2, -.5, 200));
      await all(st => fxTo(st, 0, 0, 80, EASE.lin));
      sfx.knock(); setTimeout(() => sfx.knock(), 40);
      both.forEach(st => setPose(st, 'claw', 1000));
      await all(st => fxTo(st, 0, 1.6, 700, EASE.inOut));
      await sleep(T(500));
      await all(st => fxTo(st, 0, 0, 800, EASE.inOut));
      break;
    case 'bust':                                      // out of chips: hands slide back off the table
      both.forEach(st => setPose(st, 'u1', Infinity));
      await all(st => fxTo(st, .3, 7, 1200, EASE.inOut));
      break;
  }
}

/* ---- dealer actions ---- */
async function collect(h){
  if (!h || h.collected || !G) return;
  h.collected = true; h.banner = null; h.drama = 0; G.players.forEach(p => { p.rlabel = null; });
  const deck = L.D.deck, deckQ = proj(deck), wD = 5.4*U*deckQ.s, flights = [];
  const fly = (fromQ, w0) => flights.push(flySprite((g, x, y, s, e) => drawCard(g, null, x, y, lerp(w0, wD, e), (1 - e)*.6), fromQ, deckQ, 520, { arc:3*U }));
  const H_ = handsOn();
  // your cards
  const p0 = me();
  if (p0.hole.length && !p0.collected){ p0.collected = true; if (!((h.youFold || 0) >= 1)){ const { w, pts } = youCardPts(); pts.forEach(pt => fly({ x:pt.x, y:pt.y, s:1 }, w)); } }
  // each COM slides their cards toward the dealer
  G.players.forEach((p, i) => {
    if (!i || !p.hole.length || p.collected) return;
    p.collected = true;
    if (p.folded) return;
    if (H_ && HS[i]){
      flights.push((async () => {
        p.collected = false; p.inHandCards = false;
        await reach(i, 'R', L[i].cards, 260, { curl:0, lift:.6 });
        p.collected = true; HS[i].R.obj = cardsObj(p, false);
        await grip(i, 'R', L[i].cards, .45, 120);
        await reach(i, 'R', add(L[i].cards, L[i].d, 4), 200, { curl:.15, lift:.4 });
        const from = tipScreen(i, 'R'); HS[i].R.obj = null; sfx.card();
        home(i, 'R', 360);
        await flySprite((g, x, y, s, e) => drawCard(g, null, x, y, lerp(5.4*U, wD, e), (1 - e)*.8), from, deckQ, 460, { arc:2.5*U });
      })());
    } else { const q = proj(L[i].cards); fly({ x:q.x, y:q.y - 3*U*q.s, s:q.s }, 5.4*U*q.s); }
  });
  const scoop = async (hand, getFrom, draw, clear) => {
    await reach('D', hand, getFrom, 300, { curl:0, lift:1 });
    clear(); HS.D[hand].obj = draw; sfx.card();
    await grip('D', hand, getFrom, .5, 130);
    await reach('D', hand, deck, 380, { curl:.5, lift:.5 });
    HS.D[hand].obj = null;
    await letGo('D', hand, deck, 110);
    home('D', hand, 300);
  };
  const stack = (wu, n) => (g, x, y, s) => { for (let k = 0; k < n; k++) drawCard(g, null, x + k*.4, y - k*w1(wu, s)*.04, w1(wu, s), (k - n/2)*.05); };
  const w1 = (wu, s) => wu*U*s;
  if (h.board.length && !h.boardGone){
    if (H_) flights.push(scoop(TS.muckN ? 'R' : dHand(boardPt(1)), boardPt(2), stack(TH.cardW*.62, Math.min(5, h.board.length)), () => { h.boardGone = true; }));
    else { h.boardGone = true; h.board.forEach((c, k) => { const q = proj(boardPt(k)); fly(q, TH.cardW*U*q.s); }); }
  }
  if (TS.burnN){ const q = proj(L.D.burn); TS.burnN = 0; fly(q, 5*U*q.s); }
  if (TS.muckN){
    if (H_) flights.push(scoop(dHand(L.D.muck), L.D.muck, stack(5, 3), () => { TS.muckN = 0; }));
    else { const q = proj(L.D.muck); TS.muckN = 0; fly(q, 5*U*q.s); fly(q, 5*U*q.s); }
  }
  if (!flights.length) return;
  sfx.card(); setTimeout(() => sfx.card(), T(160));
  await Promise.all(flights);
}
async function riffle(){
  if (!G) return;
  const d = L.D, c = d.deck, a = add(c, d.lat, 5.5), b = add(c, d.lat, -5.5);
  const half = (g, x, y, s) => drawDeck(g, x, y, 5.4*U*s, 5, .5);
  const one = (g, x, y, s) => drawCard(g, null, x, y, 5.4*U*s, 0);
  if (handsOn()){
    await Promise.all([reach('D', 'R', c, 260, { curl:.3, lift:.8 }), reach('D', 'L', c, 260, { curl:.3, lift:.8 })]);
    if (!G) return;
    TS.deckHidden = true; HS.D.R.obj = half; HS.D.L.obj = half; HS.D.R.curl = HS.D.L.curl = .5;
    await Promise.all([reach('D', 'R', a, 260, { curl:.5, lift:1 }), reach('D', 'L', b, 260, { curl:.5, lift:1 })]);
    if (!G) return;
    sfx.riffle();
    const fl = [];
    for (let k = 0; k < 12; k++){ fl.push(flySprite(one, tipScreen('D', k % 2 ? 'R' : 'L'), proj(c), 200, { arc:2*U })); await sleep(T(36)); }
    await Promise.all(fl);
    if (!G) return;
    await Promise.all([reach('D', 'R', c, 220, { curl:.4, lift:.5 }), reach('D', 'L', c, 220, { curl:.4, lift:.5 })]);
    HS.D.R.obj = HS.D.L.obj = null; TS.deckHidden = false;
    await Promise.all([home('D', 'R', 300), home('D', 'L', 300)]);
  } else {
    TS.deckHidden = true;
    const sa = { draw:g => { const q = proj(a); half(g, q.x, q.y, q.s); } }, sb = { draw:g => { const q = proj(b); half(g, q.x, q.y, q.s); } };
    sprites.add(sa); sprites.add(sb); sfx.riffle();
    const fl = [];
    for (let k = 0; k < 12; k++){ fl.push(flySprite(one, proj(k % 2 ? a : b), proj(c), 200, { arc:2*U })); await sleep(T(36)); }
    await Promise.all(fl);
    sprites.delete(sa); sprites.delete(sb); TS.deckHidden = false;
  }
}
async function moveButton(from, to){
  const a = L[from].button, b = L[to].button, draw = (g, x, y, s) => drawButton(g, x, y, s);
  TS.btnHidden = true;
  if (handsOn() && a.y <= TH.H*.6 && b.y <= TH.H*.6){
    await carry('D', 'R', draw, a, b, 560, { grip:.35, reachDur:340 });
    home('D', 'R');
  } else {
    await flySprite(draw, proj(a), proj(b), 650, { arc:3*U });
  }
  TS.btnHidden = false;
}
async function pitch(planeT, to, wEnd, endRot = 0, dur = 420, flat = null){
  const d = L.D, deckEdge = add(d.deck, d.lat, 2.5);
  let from;
  if (handsOn()){
    await reach('D', 'R', deckEdge, 110, { curl:.45, lift:.3 });
    from = tipScreen('D', 'R');
    const dx = planeT.x - d.deck.x, dy = planeT.y - d.deck.y, l = Math.hypot(dx, dy) || 1;
    reach('D', 'R', { x:deckEdge.x + dx/l*4.5, y:deckEdge.y + dy/l*4.5 }, 90, { curl:.15, lift:.6 })
      .then(() => reach('D', 'R', deckEdge, 130, { curl:.4, lift:.2 }));
  } else {
    from = proj(d.deck);
  }
  sfx.card();
  const w0 = 5.4*U*proj(d.deck).s;
  if (flat){
    // the card slides flat across the felt, spinning, and settles squared to its owner
    const B = flatBasis(flat.pt, flat.lay);
    return flySprite((g, x, y, s, e) => drawFlat(g, null, B, x, y, 5.8, endRot + (1 - e)*Math.PI*1.6, { lift:Math.sin(Math.PI*e)*.6 }), from, to, dur, { arc:.8*U, ease:EASE.out });
  }
  return flySprite((g, x, y, s, e) => drawCard(g, null, x, y, lerp(w0, wEnd, e), endRot + (1 - e)*Math.PI*1.2), from, to, dur, { arc:2.5*U, ease:EASE.out });
}
async function burnCard(h){
  h.burns.push(h.ptr++);
  const d = L.D;
  await carry('D', 'R', backsDraw(1, 5), add(d.deck, d.lat, 2.5), d.burn, 300, { grip:.4, reachDur:160 });
  TS.burnN++;
  sfx.card();
}
async function sweep(h){
  const bettors = G.players.filter(p => p.bet > 0);
  if (!bettors.length) return;
  const pp = potPt();
  if (handsOn()){
    const lft = bettors.filter(p => L[idxOf(p)].bet.x < TH.W/2), rgt = bettors.filter(p => L[idxOf(p)].bet.x >= TH.W/2);
    const gather = async (arr, hand) => {
      if (!arr.length) return;
      arr.sort((a, b) => L[idxOf(a)].bet.y - L[idxOf(b)].bet.y);
      let acc = 0;
      for (const p of arr){
        const bp = L[idxOf(p)].bet;
        await reach('D', hand, bp, 300, { curl:acc ? .35 : 0, lift:1 });
        if (!alive(h)) return;
        acc += p.bet; p.betTaken = true;
        const amt = acc; HS.D[hand].obj = chipsDraw(amt);
        await grip('D', hand, bp, .6, 120);
        sfx.chips(3);
      }
      const drop = add(pp, { x:hand === 'R' ? -3.5 : 3.5, y:-2 });
      await reach('D', hand, drop, 380, { curl:.6, lift:.6 });
      HS.D[hand].obj = null;
      await letGo('D', hand, drop, 110);
      arr.forEach(p => { p.bet = 0; p.betTaken = false; });
      sfx.chips(5);
    };
    await Promise.all([gather(lft, 'R'), gather(rgt, 'L')]);
    if (!alive(h)) return;
  } else {
    h.sweeping = true;
    setTimeout(() => sfx.chips(6), T(360));
    await Promise.all(bettors.map(p => flySprite(chipsDraw(p.bet), proj(L[idxOf(p)].bet), proj(pp), 480, { arc:2*U })));
    if (!alive(h)) return;
    h.sweeping = false;
  }
  G.players.forEach(p => { p.bet = 0; p.betTaken = false; });
  home('D', 'R'); home('D', 'L');
}
async function award(h, grants){
  const iWon = grants.some(gr => gr.p === me() && h.winners.has(me().id));
  if (iWon) sfx.win(potAll() >= G.cfg.bb*25); else if (me().inHand && !me().folded) sfx.lose();
  const pp = potPt();
  for (const gr of grants){
    const i = idxOf(gr.p), lay = L[i];
    const meet = reachable({ x:lerp(pp.x, lay.bet.x, .55), y:lerp(pp.y, lay.bet.y, .55) });
    h.potCarry = (h.potCarry || 0) + gr.amt;
    const cur = { pos:{ ...pp } };
    const sp = { draw:g => { const q = proj(cur.pos); drawPotPile(g, q.x, q.y, gr.amt, 3.6*U*q.s, h.nonce*31 + i); } };
    sprites.add(sp);
    sfx.slide();
    if (handsOn()){
      const behind = add(pp, L.D.d, -3), dir = { x:meet.x - pp.x, y:meet.y - pp.y };
      await Promise.all([reach('D', 'R', add(behind, { x:-4, y:0 }), 280, { curl:.1, lift:1 }), reach('D', 'L', add(behind, { x:4, y:0 }), 280, { curl:.1, lift:1 })]);
      await Promise.all([
        tween(520, e => { cur.pos = { x:pp.x + dir.x*e, y:pp.y + dir.y*e }; }, EASE.inOut),
        reach('D', 'R', add(add(behind, dir), { x:-4, y:0 }), 520, { curl:.1, lift:0 }),
        reach('D', 'L', add(add(behind, dir), { x:4, y:0 }), 520, { curl:.1, lift:0 })
      ]);
      home('D', 'R'); home('D', 'L');
      const sides = i === 0 ? ['L'] : ['L', 'R'];
      await Promise.all(sides.map(sd => reach(i, sd, add(meet, lay.lat, sd === 'L' ? -3 : 3), 380, { curl:.2, lift:1.4 })));
      setTimeout(() => sfx.chips(7), T(300));
      await Promise.all([
        tween(620, e => { cur.pos = { x:lerp(meet.x, lay.stack.x, e), y:lerp(meet.y, lay.stack.y, e) }; }, EASE.inOut),
        ...sides.map(sd => reach(i, sd, add(lay.stack, lay.lat, sd === 'L' ? -3 : 3), 620, { curl:.55, lift:0 }))
      ]);
      sides.forEach(sd => home(i, sd));
    } else {
      setTimeout(() => sfx.chips(7), T(500));
      await tween(820, e => { cur.pos = { x:lerp(pp.x, lay.stack.x, e), y:lerp(pp.y, lay.stack.y, e) }; }, EASE.inOut);
    }
    sprites.delete(sp);
    if (!alive(h)) return;
    gr.p.chips += gr.amt;
  }
  h.potGone = true;
}

/* ---- player actions ---- */
async function moveChips(h, i, amt, commit){
  const p = G.players[i], lay = L[i];
  if (amt <= 0){ commit(); return; }
  bump(p);
  if (!handsOn()) p.carry = amt;
  await carry(i, 'L', chipsDraw(amt), lay.stack, lay.bet, 520, { grip:.7, onGrab:() => { p.carry = amt; }, carryLift:1.6, reachDur:i === 0 ? 460 : 360 });
  p.carry = 0;
  if (!alive(h)) return;
  commit();
  home(i, 'L');
  await wait(90);
}
async function foldCards(h, i){
  const p = G.players[i];
  bump(p); dropHeld(i, 'R', p);
  if (i === 0){
    sfx.card();
    await tween(640, e => { h.youFold = e; }, EASE.lin);
    p.folded = true; TS.muckN += 2;
    return;
  }
  const lay = L[i], mq = proj(L.D.muck);
  if (handsOn()){
    await reach(i, 'R', lay.cards, 300, { curl:0, lift:1 });
    if (!alive(h)) return;
    p.mucking = true; HS[i].R.obj = backsDraw(2, 5.4);
    await grip(i, 'R', lay.cards, .55, 130);
    await reach(i, 'R', add(lay.cards, lay.d, 3.5), 170, { curl:.2, lift:2 });       // flick: fingers spring open
    const from = tipScreen(i, 'R');
    HS[i].R.obj = null;
    sfx.card();
    home(i, 'R', 380);
    const B = flatBasis(L.D.muck, null), spin = (Math.random() < .5 ? -1 : 1)*(2 + Math.random());
    await flySprite((g, x, y, s, e) => { drawFlat(g, null, B, x, y, 5.2, e*spin, { lift:Math.sin(Math.PI*e)*.8 }); drawFlat(g, null, B, x, y, 5.2, e*spin + .5, { dx:1.2, dy:.4 }); },
      from, mq, 520, { arc:1.4*U, ease:EASE.out });
  } else {
    p.mucking = true; sfx.card();
    const q = proj(lay.cards);
    await flySprite(backsDraw(2, 5), { x:q.x, y:q.y - 3*U*q.s, s:q.s }, mq, 460, { arc:3*U });
  }
  p.folded = true; p.mucking = false; TS.muckN += 2;
}
async function checkTap(h, i){
  const p = G.players[i]; bump(p);
  if (!handsOn()){ sfx.knock(); await wait(140); sfx.knock(); await wait(200); return; }
  const side = i === 0 ? 'L' : 'R';
  const spot = i === 0 ? { x:TH.W/2 - 16, y:TH.H - 20 } : add(L[i].cards, L[i].d, 3);
  await reach(i, side, spot, i === 0 ? 380 : 240, { curl:.55, lift:1 });
  setPose(HS[i][side], 'knock', 420);
  for (let k = 0; k < 2; k++){
    await handTo(i, side, wristFor(i, spot), 140, { curl:.55, lift:1.1 });
    sfx.knock();
    if (!alive(h)) return;
  }
  home(i, side, i === 0 ? 420 : 320);
  await wait(100);
}
function peekAll(h){
  G.players.forEach((p, i) => {
    if (!i || !live(p)) return;
    const seq = bump(p);
    sleep(T(200 + Math.random()*1200)).then(() => peekOne(h, p, i, seq));
  });
}
async function peekOne(h, p, i, seq){
  const ok = () => alive(h) && !p.folded && p.animSeq === seq;
  if (!ok()) return;
  if (!handsOn() || !HS[i]){
    await tween(240, e => { p.peek = e; }); await sleep(T(340)); await tween(240, e => { p.peek = 1 - e; }); return;
  }
  const st = HS[i].R, cards = L[i].cards;
  await reach(i, 'R', cards, 300, { curl:0, lift:.9 });
  if (!ok()) return dropHeld(i, 'R', p);
  p.inHandCards = true; st.obj = cardsObj(p, false);
  await grip(i, 'R', cards, .55, 150);
  await reach(i, 'R', add(cards, L[i].d, -2.5), 280, { curl:.55, lift:2.4 });         // lift the corners up toward the eyes
  await sleep(T(450 + Math.random()*450));
  if (!ok()){ dropHeld(i, 'R', p); return; }
  await reach(i, 'R', cards, 240, { curl:.55, lift:0 });
  dropHeld(i, 'R', p);
  await letGo(i, 'R', cards, 130);
  if (ok()) home(i, 'R', 380);
}
async function reveal(h, players){
  const fresh = players.filter(p => p.isCom && !p.shown);
  players.forEach(p => { p.shown = true; p.peek = 0; });
  if (G.cfg.showCom){ fresh.forEach(p => p.flipP = 1); await wait(300); return; }
  fresh.forEach(p => { p.flipP = 0; });
  await Promise.all(fresh.map((p, k) => sleep(T(k*240)).then(() => revealInHand(h, p, false))));
  await wait(300);
}

/* ---- idle life: players fiddle with chips, shift, guard their cards, drum, lean back; the dealer squares the deck ---- */
async function idleAct(k, side){
  const st = HS[k] && HS[k][side]; if (!st) return;
  st.idleBusy = true;
  const still = () => st.idle && G && HS[k];
  const go = (pt, dur, o = {}) => handTo(k, side, wristFor(k, pt), dur, { ...o, idle:true });
  try {
    if (k === 'D'){
      const d = L.D.deck;
      await go(add(d, L.D.lat, side === 'R' ? 3 : -3), 420, { curl:.4, lift:.6 }); if (!still()) return;
      for (let r = 0; r < 2; r++){ await go(add(d, L.D.lat, side === 'R' ? 2.4 : -2.4), 140, { curl:.5, lift:.35 }); if (!still()) return; }
      await handTo(k, side, restOf(k, side), 420, { curl:0, lift:.5, idle:true });
      return;
    }
    const p = G.players[k], lay = L[k], r = Math.random();
    const hasCards = H && p.inHand && !p.folded && p.hole.length && !p.collected && !p.shown;
    if (r < .3 && p.chips > 0){                                     // riffle a few chips on the stack
      await go(lay.stack, 420, { curl:.55, lift:.8 }); if (!still()) return;
      for (let n = 0; n < 3; n++){
        await go(lay.stack, 150, { curl:.6, lift:.7 }); if (!still()) return;
        await go(lay.stack, 120, { curl:.6, lift:0 }); if (!still()) return;
      }
      await handTo(k, side, restOf(k, side), 420, { curl:0, lift:.6, idle:true });
    } else if (r < .5 && hasCards && side === 'R'){                 // guard the cards
      await go(add(lay.cards, lay.d, -1.5), 520, { curl:.2, lift:.4 }); if (!still()) return;
      await sleep(T(1800 + Math.random()*2200));
      if (still()) await handTo(k, side, restOf(k, side), 480, { curl:0, lift:.4, idle:true });
    } else if (r < .62 && hasCards && side === 'R'){                // sneak another look
      await peekOne(H, p, k, p.animSeq);
    } else if (r < .78){                                            // drum the fingers
      st.drumUntil = performance.now() + T(1400 + Math.random()*900);
      await sleep(T(1600));
    } else if (r < .9){                                             // lean back, then come forward again
      const both = [HS[k].L, HS[k].R];
      await Promise.all(both.map(s2 => fxTo(s2, .3, 2.6, 900, EASE.inOut)));
      await sleep(T(1500 + Math.random()*1500));
      await Promise.all(both.map(s2 => fxTo(s2, 0, 0, 900, EASE.inOut)));
    } else if (r < .95){                                            // change how they sit
      const opts = REST_STYLES.filter(x => x !== lay.restStyle);
      lay.restStyle = opts[Math.floor(Math.random()*opts.length)];
      await Promise.all(['L', 'R'].map(sd => handTo(k, sd, restOf(k, sd), 800, { curl:0, lift:.4, idle:true })));
    } else {                                                        // settle the hand somewhere new
      const rp = restOf(k, side);
      await go(add(add(rp, lay.lat, (Math.random() - .5)*4), lay.d, (Math.random() - .3)*3), 700, { curl:Math.random()*.3, lift:.3 });
    }
  } finally { st.idleBusy = false; }
}
setInterval(() => {
  if (!G || !H || dealing || !handsOn() || RM || document.hidden) return;
  const now = performance.now();
  const keys = [...G.players.keys()].filter(i => i > 0);
  if (!H.sweeping && !H.done) keys.push('D');
  for (const k of keys){
    if (!HS[k]) continue;
    if (k !== 'D'){ const p = G.players[k]; if (p.chips <= 0 && !p.inHand) continue; if (H.think && H.think.i === k) continue; }
    if (Math.random() > (k === 'D' ? .025 : .05)) continue;
    const side = Math.random() < .5 ? 'L' : 'R', st = HS[k][side];
    if (st.obj || st.idleBusy || now < (st.freeAt || 0) + 1600) continue;
    if (st.pose && st.poseUntil > now) continue;
    idleAct(k, side);
  }
}, 400);

/* ---------- game flow ---------- */
function newGame(c){
  const n = c.opp + 1;
  const pool = NAMES.slice().sort(() => Math.random() - .5);
  const styles = Object.keys(STYLES);
  const players = [{ id:0, name:c.name, isCom:false, chips:c.stack, skin:SKINS_T[0] }];
  for (let i = 1; i < n; i++) players.push({ id:i, name:pool[i-1], isCom:true, style:styles[Math.floor(Math.random()*styles.length)], chips:c.stack, skin:SKINS_T[i % SKINS_T.length] });
  players.forEach(p => Object.assign(p, { inHand:false, folded:false, allIn:false, bet:0, contrib:0, hole:[], holeIdx:[], last:'', kind:'', carry:0, peek:0, animSeq:0 }));
  G = { cfg:c, players, button:-1, handNo:0, history:[], clientSeed:c.seed, biggest:0, startStack:c.stack, stats:{ played:0, won:0, bought:c.stack, best:0 } };
  H = null; raiseOpen = false; humanResolve = null; preAct = null; dealing = false;
  Object.assign(TS, { deckHidden:false, burnN:0, muckN:0, btnHidden:false });
  for (const k of Object.keys(HS)) delete HS[k];
  tweens.clear(); sprites.clear();
  $('#log').innerHTML = '';
  $('#hist').innerHTML = '<p>Finished hands appear here with their revealed seeds.</p>';
  $('#g-seed').value = c.seed;
  $('#t-auto').checked = c.auto; $('#t-show').checked = false;
  setSeg('#seg-speed2', c.speed);
  $('#seatList').innerHTML = players.slice(1).map(p => `COM ${esc(p.name)} plays ${STYLES[p.style].label}`).join('<br>');
  logLine(`${c.name} sits down with ${money(c.stack)}. Blinds ${money(c.sb)}/${money(c.bb)}.`, 'st');
  players.slice(1).forEach(p => logLine(`COM ${p.name} joins with ${money(p.chips)}.`, 'st'));
}
const viewFor = key => store.get('view_' + key) || 'first';
function applyView(v){
  store.set('view_' + cfg.skin, v);
  applySkin(cfg.skin);
}
function applySkin(key){
  cfg.skin = key;
  TH = themeFor(key, viewFor(key));
  document.body.classList.toggle('skin-saloon', key === 'saloon');
  document.body.classList.toggle('skin-regular', key === 'regular' || key === 'atari');
  document.body.classList.toggle('skin-cli', key === 'cli');
  document.body.classList.toggle('skin-vpoker', key === 'vpoker');
  document.body.classList.toggle('skin-flat', !!THEMES[key].flat);
  document.body.classList.toggle('skin-atari', key === 'atari');
  F_UI = key === 'atari' ? F_PIXEL : F_UI0;
  setSeg('#seg-skin', key); setSeg('#seg-skin2', key); setSeg('#seg-view', TH.view); setSeg('#seg-view2', TH.view);
  chipCache.clear(); cardCache.clear(); handCache.clear(); holdCache.clear();
  if (G){ G.cfg.skin = key; computeLayout(); fit(); }
  staticDirty = true;
}

async function startHand(){
  if (VOICE_PACK === 'neural') neuralWarm();
  if (dealing || !G) return;
  clearTimeout(autoTimer);
  const prev = H;
  if (prev && !prev.done) prev.abort = true;
  humanResolve = null; preAct = null;
  const alivePl = G.players.filter(p => p.chips > 0);
  if (me().chips <= 0 || alivePl.length < 2){ if (prev) prev.over = true; renderUI(); return; }
  dealing = true;
  resetFx();
  try {
    if (prev){ prev.banner = null; dockKey = ''; renderUI(); await collect(prev); }
    if (!G) return;
    if (Math.random() < .35) sayLine('D', 'shuffle');
    await riffle();
    if (!G) return;
    G.handNo++;
    const prevBtn = G.button;
    G.button = prevBtn < 0 ? G.players.indexOf(alivePl[Math.floor(Math.random()*alivePl.length)]) : nextIdx(prevBtn, p => p.chips > 0);
    const serverSeed = randomHex(32), clientSeed = G.clientSeed, nonce = G.handNo;
    const commitment = await sha256Hex(serverSeed);
    const deck = await shuffleDeck(serverSeed, clientSeed, nonce);
    if (!G) return;
    const h = H = { deck, ptr:0, serverSeed, clientSeed, nonce, commitment, board:[], boardIdx:[], boardFlip:[], burns:[], street:0,
      currentBet:0, minRaise:G.cfg.bb, raiseSeq:0, toAct:-1, done:false, over:false, msg:'', winners:new Set(),
      heroFlip:0, youFold:0, highlight:new Set(), sweeping:false, potGone:false, potCarry:0, think:null, banner:null };
    for (const p of G.players){
      Object.assign(p, { inHand:p.chips > 0, folded:p.chips <= 0, allIn:false, bet:0, contrib:0, hole:[], holeIdx:[], acted:false, actedSeq:-1, last:'', kind:'', shown:false, flipP:1, hand:null, carry:0, mucking:false, collected:false, peek:0, rlabel:null, dimCards:false, inHandCards:false, betTaken:false });
    }
    TS.burnN = 0; TS.muckN = 0;
    raiseOpen = false; dockKey = '';
    logLine(`Hand #${nonce}`, 'hand');
    logLine(`Commitment ${commitment.slice(0,16)}…`, 'st');
    renderUI();
    dealing = false;
    if (prevBtn >= 0 && prevBtn !== G.button){ await moveButton(prevBtn, G.button); if (!alive(h)) return; }
    await wait(200); if (!alive(h)) return;
    const nAlive = alivePl.length;
    const sb = nAlive === 2 ? G.button : nextIdx(G.button, p => p.inHand);
    const bb = nextIdx(sb, p => p.inHand);
    await post(h, sb, G.cfg.sb, 'small blind'); if (!alive(h)) return;
    await post(h, bb, G.cfg.bb, 'big blind'); if (!alive(h)) return;
    h.currentBet = G.cfg.bb;
    await wait(200); if (!alive(h)) return;
    await dealHole(h, nAlive); if (!alive(h)) return;
    h.toAct = nextIdx(bb, p => p.inHand);
    play(h);
  } finally { dealing = false; }
}

async function post(h, i, amt, label){
  const p = G.players[i];
  const a = Math.min(amt, p.chips);
  await moveChips(h, i, a, () => move(p, a));
  if (!alive(h)) return;
  p.last = p.allIn ? 'All-in' : (label === 'small blind' ? 'Small blind' : 'Big blind');
  p.kind = p.allIn ? 'allin' : '';
  logLine(`${who(p)} posts ${label} ${money(a)}.`);
  renderUI();
  await wait(120);
}
function move(p, amt){ p.chips -= amt; p.bet += amt; p.contrib += amt; if (p.chips === 0) p.allIn = true; sfx.chips(Math.ceil(Math.log2(amt/G.cfg.bb + 2)*1.5)); }

async function dealHole(h, nAlive){
  const yc = youCardPts(), flights = [];
  for (let pass = 0; pass < 2; pass++){
    let i = G.button;
    for (let k = 0; k < nAlive; k++){
      i = nextIdx(i, p => p.inHand);
      const p = G.players[i], seat = i, at = h.ptr++, card = h.deck[at];
      let planeT, to, wEnd, rot = 0;
      if (seat === 0){
        planeT = { x:TH.W/2 + (pass ? 6 : -6), y:TH.H - 6 };
        const pt = yc.pts[pass]; to = { x:pt.x, y:pt.y, s:1 }; wEnd = yc.w; rot = pt.r;
      } else {
        planeT = L[seat].cards;
        const cpt = seatCardPt(L[seat], pass), q = proj(cpt);
        to = { x:q.x, y:q.y, s:q.s }; wEnd = 5.4*U*q.s; rot = (pass - .5)*.16;
      }
      flights.push(pitch(planeT, to, wEnd, rot, 420, seat ? { pt:seatCardPt(L[seat], pass), lay:L[seat] } : null).then(() => { if (!alive(h)) return; p.hole[pass] = card; p.holeIdx[pass] = at; }));
      await wait(60);
      if (!alive(h)) return;
    }
  }
  await Promise.all(flights);
  if (!alive(h)) return;
  home('D', 'R');
  await wait(220);
  sfx.flip();
  await tween(420, e => { h.heroFlip = e; });
  setTimeout(() => { if (alive(h) && !h.tuckTouched && !h.done && !me().folded) setTuck(h, true); }, 2400*PACE[G.cfg.speed]);
  logLine(`You are dealt ${me().hole.map(cardTxt).join(' ')}.`);
  dockKey = ''; renderUI();
  peekAll(h);
  if (chance(.35)) sayLine('D', 'dealt', {}, 1, { lead:600 });
  await wait(500);
}

async function play(h){
  const n = G.players.length;
  for (;;){
    if (!alive(h)) return;
    const lv = G.players.filter(live);
    if (lv.length === 1) return winUncontested(h, lv[0]);
    const actors = lv.filter(p => !p.allIn);
    const pending = G.players.filter(needsAction);
    if (!pending.length || (actors.length <= 1 && actors.every(p => p.bet >= h.currentBet))){
      const cont = await endStreet(h);
      if (!cont) return;
      continue;
    }
    let i = h.toAct < 0 ? 0 : h.toAct, guard = 0;
    while (!needsAction(G.players[i]) && guard++ <= n) i = (i + 1) % n;
    h.toAct = i;
    const p = G.players[i];
    renderUI();
    let d;
    if (p.isCom){
      const think = T(1100 + Math.random()*1300);
      h.think = { i, t0:performance.now(), d:think };
      bump(p);
      if (handsOn()) home(i, 'R', 300);
      if (h.currentBet - p.bet >= Math.max(potAll()*.5, G.cfg.bb*6)){ react(i, 'tense', 200); if (chance(.5)){ if (h.aggr != null && h.aggr !== i && chance(.6)) sayAt(i, 'toughAt', h.aggr, 1.4, { ttl:3000 }); else sayLine(i, 'tough', {}, 1, { ttl:2500 }); } }
      else if (chance(.18)) setTimeout(() => { if (h.think && h.think.i === i) sayLine(i, 'thinking'); }, 500);
      await sleep(think);
      h.think = null;
      if (!alive(h)) return;
      d = comDecide(p);
    } else {
      const toCall = h.currentBet - p.bet;
      let auto = null;
      if (preAct === 'checkfold') auto = { type:toCall > 0 ? 'fold' : 'check' };
      else if (preAct === 'check' && toCall <= 0) auto = { type:'check' };
      else if (preAct === 'callany') auto = { type:toCall > 0 ? 'call' : 'check' };
      preAct = null;
      if (auto){ d = auto; dockKey = ''; renderUI(); await wait(250); }
      else {
        sfx.turn();
        if (chance(.3)) sayLine('D', 'yourTurn');
        yourTurnStart();
        d = await new Promise(res => { humanResolve = res; dockKey = ''; renderUI(); });
      }
      if (!alive(h)) return;
    }
    await act(h, p, d);
    if (!alive(h)) return;
    h.toAct = nextIdx(i, q => live(q));
  }
}
function submit(d){
  if (!humanResolve) return;
  yourTurnEnd();
  const r = humanResolve; humanResolve = null; raiseOpen = false; dockKey = ''; renderDock();
  r(d);
}

async function act(h, p, d){
  voiceTick();
  let { type, to } = d;
  const i = idxOf(p);
  const toCall = h.currentBet - p.bet;
  if (type === 'check' && toCall > 0) type = 'call';
  if (type === 'call' && toCall <= 0) type = 'check';
  if (type === 'raise'){
    const max = p.bet + p.chips;
    if (!canRaise(p)) type = toCall > 0 ? 'call' : 'check';
    else {
      to = Math.min(Math.max(Math.round(to), Math.min(h.currentBet + h.minRaise, max)), max);
      if (to <= h.currentBet) type = toCall > 0 ? 'call' : 'check';
    }
  }
  if (type === 'fold'){
    p.last = 'Fold'; p.kind = 'fold';
    logLine(`${who(p)} folds.`);
    if (p.isCom && (TALK_MODE === 'basic' || Math.random() < (TALK_MODE === 'chatty' ? .6 : .3))) sayLine(i, 'fold', {}, 1, { gap:120, ttl:1800 });
    else if (!p.isCom && toCall > 0 && chance(.14)){ const c = comsLive(); if (c.length) sayAt(pick(c), 'atYouFold', 0, 1.2, { lead:500, ttl:3000 }); }
    renderUI();
    await foldCards(h, i);
  } else if (type === 'check'){
    p.last = 'Check'; p.kind = 'check';
    logLine(`${who(p)} checks.`);
    if (p.isCom) sayLine(i, 'check', {}, 1, { gap:100, ttl:1500 });
    renderUI();
    await checkTap(h, i);
  } else if (type === 'call'){
    const amt = Math.min(toCall, p.chips);
    p.last = amt >= p.chips ? 'All-in' : `Call ${money(amt)}`; p.kind = amt >= p.chips ? 'allin' : 'call';
    renderUI();
    await moveChips(h, i, amt, () => move(p, amt));
    if (!alive(h)) return;
    logLine(`${who(p)} ${p.allIn ? 'calls all-in' : 'calls'} ${money(amt)}.`);
    if (p.isCom) sayLine(i, p.allIn ? 'allin' : 'call', {}, p.allIn ? 2 : 1, { gap:100, ttl:1800 });
  } else {
    const prev = h.currentBet;
    const allIn = to === p.bet + p.chips;
    p.last = allIn ? 'All-in' : (prev === 0 ? `Bet ${money(to)}` : `Raise ${money(to)}`); p.kind = allIn ? 'allin' : (prev === 0 ? 'bet' : 'raise');
    renderUI();
    await moveChips(h, i, to - p.bet, () => move(p, to - p.bet));
    if (!alive(h)) return;
    const inc = to - prev;
    if (inc >= h.minRaise){ h.minRaise = inc; h.raiseSeq++; }
    h.currentBet = Math.max(prev, to);
    logLine(`${who(p)} ${prev === 0 ? 'bets' : 'raises to'} ${money(to)}${p.allIn ? ' (all-in)' : ''}.`);
    h.aggr = i;
    if (p.isCom) sayLine(i, p.allIn ? 'allin' : prev === 0 ? 'bet' : 'raise', {}, p.allIn ? 2 : 1, { gap:100, ttl:1800 });
    { // the table talks back
      const others = comsLive().filter(j => j !== i), big = p.allIn || inc >= Math.max(potAll()*.45, G.cfg.bb*6);
      if (others.length){
        if (!p.isCom && (p.allIn ? chance(.75) : chance(big ? .5 : .25))) sayAt(pick(others), p.allIn ? 'atYouAllin' : 'atYouBet', 0, 1.5, { lead:350, ttl:3500 });
        else if (p.isCom && big && chance(.28)) setTimeout(() => jab(pick(others), i), 500);
      }
    }
    if (p.allIn && Math.random() < .6) sayLine('D', 'allinD', {}, 1.6, { lead:700, ttl:5000 });
    else if (!p.allIn && inc >= Math.max(potAll()*.5, G.cfg.bb*8) && chance(.3)) sayLine('D', 'bigBet', {}, 1, { lead:600, ttl:3000 });
    if (p.allIn || inc >= Math.max(potAll()*.6, G.cfg.bb*10)) G.players.forEach((q, j) => { if (q !== p && j && live(q)) react(j, 'startle', Math.random()*180); });
  }
  p.acted = true; p.actedSeq = h.raiseSeq;
  renderUI();
  await wait(320);
}

async function dealStreet(h){
  voiceTick();
  await burnCard(h); if (!alive(h)) return;
  const n = h.street === 0 ? 3 : 1;
  h.street++;
  sayLine('D', ['', 'flop', 'turn', 'river'][h.street], {}, 2);
  dockKey = ''; renderUI();
  const fresh = [];
  for (let k = 0; k < n; k++){
    const idx = h.board.length, at = h.ptr++, card = h.deck[at];
    const pt = boardPt(idx), q = proj(pt);
    await pitch(pt, { x:q.x, y:q.y, s:q.s }, TH.cardW*U*q.s, 0, 360);
    if (!alive(h)) return;
    h.boardIdx.push(at); h.board.push(card); h.boardFlip[idx] = 0; fresh.push(idx);
  }
  await wait(n === 3 ? 240 : 140); if (!alive(h)) return;
  for (const idx of fresh){
    if (handsOn()) await reach('D', dHand(boardPt(idx)), boardPt(idx), 170, { curl:.35, lift:.9 });
    if (!alive(h)) return;
    sfx.flip();
    tween(300, e => { h.boardFlip[idx] = e; });
    await wait(n === 3 ? 130 : 60);
  }
  await wait(300);
  home('D', 'R'); home('D', 'L');
  logLine(`${PHASES[h.street]}: ${h.board.map(cardTxt).join(' ')}`, 'st');
  dockKey = ''; renderUI();
}

async function endStreet(h){
  await wait(420); if (!alive(h)) return false;
  await sweep(h); if (!alive(h)) return false;
  for (const p of G.players){
    if (live(p) && !p.allIn){ p.acted = false; p.actedSeq = -1; p.last = ''; p.kind = ''; }
  }
  h.currentBet = 0; h.minRaise = G.cfg.bb; h.raiseSeq++;
  if (preAct === 'check') preAct = null;
  renderUI();
  if (h.street === 3){ await showdown(h); return false; }
  const lv = G.players.filter(live);
  if (lv.filter(p => !p.allIn).length <= 1){
    logLine('All-in. Hands are turned face up.', 'st');
    h.msg = 'All-in · running it out';
    await reveal(h, lv); if (!alive(h)) return false;
    while (h.street < 3){
      await wait(700); if (!alive(h)) return false;
      await dealStreet(h); if (!alive(h)) return false;
    }
    await wait(700); if (!alive(h)) return false;
    await showdown(h);
    return false;
  }
  await wait(200); if (!alive(h)) return false;
  await dealStreet(h); if (!alive(h)) return false;
  h.toAct = nextIdx(G.button, p => live(p) && !p.allIn);
  await wait(300);
  return alive(h);
}

