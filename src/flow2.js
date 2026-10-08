async function dramaticReveal(h, lv){
  const n = G.players.length;
  const order = lv.slice().sort((a, b) => ((idxOf(a) - G.button - 1 + n) % n) - ((idxOf(b) - G.button - 1 + n) % n));
  for (const p of order){
    if (!alive(h)) return;
    const i = idxOf(p);
    h.spot = i;
    if (i === 0){
      if (h.tucked) await setTuck(h, false);
      await wait(350);
    } else if (!G.cfg.showCom && (!p.shown || p.flipP < 1)){
      sfx.drumroll(1.1*PACE[G.cfg.speed]);
      await wait(380); if (!alive(h)) return;
      await revealInHand(h, p, true);
    }
    p.shown = true;
    p.rlabel = { text:handName(p.hand), t0:performance.now(), state:'' };
    sfx.sting(p.hand.cat >= 6 ? 2 : 1);
    if (p.hand.cat >= 4) G.players.forEach((q, j) => { if (j && j !== i && q.inHand) react(j, 'startle', Math.random()*160); });
    await wait(p.hand.cat >= 4 ? 1500 : 1150);
  }
  h.spot = -1;
}
async function showdown(h){
  h.toAct = -1; h.think = null;
  const lv = G.players.filter(live);
  lv.forEach(p => { p.hand = evaluate([...p.hole, ...h.board]); });
  h.msg = 'Showdown';
  renderUI();
  sayLine('D', 'showdown', {}, 2);
  sfx.boom();
  await tween(700, e => { h.drama = e; }, EASE.inOut); if (!alive(h)) return;
  await dramaticReveal(h, lv); if (!alive(h)) return;
  lv.forEach(p => { p.last = shortHand(p.hand); p.kind = 'hand'; });
  renderUI();
  sfx.heart(); await wait(520); if (!alive(h)) return;
  sfx.heart(); await wait(620); if (!alive(h)) return;
  await wait(1100); if (!alive(h)) return;
  const pots = buildPots();
  const msgs = [], grants = [];
  const total = potAll();
  let mainWinners = [];
  pots.forEach((pot, k) => {
    if (pot.eligible.length === 1){
      const p = pot.eligible[0]; grants.push({ p, amt:pot.amount });
      if (k > 0){ msgs.push(`${who(p)} takes back ${money(pot.amount)} uncalled.`); return; }
      h.winners.add(p.id); mainWinners = [p]; msgs.push(`${who(p)} wins ${money(pot.amount)}.`); return;
    }
    const best = Math.max(...pot.eligible.map(p => p.hand.score));
    const ws = pot.eligible.filter(p => p.hand.score === best);
    const n = G.players.length;
    ws.sort((a,b) => ((a.id - G.button - 1 + n) % n) - ((b.id - G.button - 1 + n) % n));
    const share = Math.floor(pot.amount / ws.length);
    let rem = pot.amount - share * ws.length;
    ws.forEach(w => { grants.push({ p:w, amt:share + (rem-- > 0 ? 1 : 0) }); h.winners.add(w.id); });
    if (k === 0) mainWinners = ws;
    const label = pots.length > 1 ? (k === 0 ? ' main pot' : ` side pot ${k}`) : '';
    msgs.push(ws.length > 1
      ? `${ws.map(who).join(' and ')} split the ${money(pot.amount)}${label} with ${handName(ws[0].hand)}.`
      : `${who(ws[0])} wins the ${money(pot.amount)}${label} with ${handName(ws[0].hand)}.`);
  });
  const top = mainWinners[0];
  if (top && top.hand) h.highlight = bestUsed([...top.hole, ...h.board], top.hand);
  G.players.forEach(p => { if (h.winners.has(p.id)){ p.kind = 'win'; } });
  lv.forEach(p => { if (p.rlabel) p.rlabel.state = h.winners.has(p.id) ? 'win' : 'lose'; p.dimCards = !h.winners.has(p.id); });
  h.popT = performance.now(); h.shake = performance.now();
  sfx.sting(2);
  lv.forEach(p => logLine(`${who(p)} shows ${p.hole.map(cardTxt).join(' ')} (${handName(p.hand)}).`));
  h.msg = '';
  const mainAmt = pots[0] ? pots[0].amount : total;
  { const nm = p => p === me() ? p.name : p.name;
    if (mainWinners.length > 1) sayLine('D', 'split', {}, 2);
    else if (top && top === me() && VOICE_PACK === 'studio') sayLine('D', 'youWin', {}, 2);
    else if (top) sayLine('D', Math.random() < .6 && top.hand ? 'winHand' : 'win', { n:nm(top), h:top.hand ? handName(top.hand) : '', hc:top.hand ? HCAT[top.hand.cat === 8 && top.hand.vals[0] === 12 ? 9 : top.hand.cat] : '' }, 2); }
  h.banner = mainWinners.length > 1
    ? { title:`Split pot · ${money(mainAmt)}`, sub:`${mainWinners.map(p => p.name).join(' & ')} · ${handName(mainWinners[0].hand)}`, t0:performance.now(), mine:mainWinners.includes(me()) }
    : { title:`${top === me() ? 'You win' : (top ? top.name + ' wins' : 'Pot awarded')} ${money(mainAmt)}`, sub:top && top.hand ? handName(top.hand) : '', t0:performance.now(), mine:top === me() };
  renderUI();
  await wait(600); if (!alive(h)) return;
  await award(h, grants); if (!alive(h)) return;
  reactToResult(h, grants, lv);
  tween(900, e => { h.drama = 1 - e*.75; }, EASE.inOut);
  finishHand(h, msgs, total);
}

async function winUncontested(h, p){
  h.toAct = -1; h.think = null;
  await wait(300); if (!alive(h)) return;
  await sweep(h); if (!alive(h)) return;
  const total = potAll();
  h.winners.add(p.id);
  p.last = 'Winner'; p.kind = 'win';
  h.msg = '';
  if (p === me() && VOICE_PACK === 'studio') sayLine('D', 'youWin', {}, 2); else sayLine('D', 'win', { n:p.name }, 2);
  h.banner = { title:`${p === me() ? 'You win' : p.name + ' wins'} ${money(total)}`, sub:'Everyone else folded', t0:performance.now(), mine:p === me() };
  renderUI();
  await wait(450); if (!alive(h)) return;
  await award(h, [{ p, amt:total }]); if (!alive(h)) return;
  reactToResult(h, [{ p, amt:total }], []);
  finishHand(h, [`${who(p)} wins ${money(total)} uncontested.`], total);
}
function reactToResult(h, grants, shown){
  const bb = G.cfg.bb;
  const net = i => grants.filter(gr => gr.p === G.players[i]).reduce((a, gr) => a + gr.amt, 0) - G.players[i].contrib;
  const idx = G.players.map((p, i) => i);
  const winners = idx.filter(i => net(i) > 0).sort((a, b) => net(b) - net(a));
  const top = winners.length ? winners[0] : -1;
  const shownLosers = idx.filter(i => shown.includes(G.players[i]) && net(i) < 0 && G.players[i].contrib >= bb*3);
  idx.forEach(i => {
    if (!i) return;
    const p = G.players[i], won = net(i);
    if (won > 0) react(i, won >= bb*20 ? 'win' : 'pat', 150);
    else if (p.chips <= 0 && p.inHand){ react(i, 'bust', 300); sayLine(i, 'bust', {}, 1.8, { lead:1800, ttl:9000 }); }
    else if (shown.includes(p) && p.contrib >= bb*10) react(i, 'lose', 200);
  });
  // who says what after the pot is pushed: at most an exchange or two, in a natural order
  const LD = { lead:1400, ttl:9000 };
  if (top > 0){
    const big = net(top) >= bb*10;
    if (shownLosers.includes(0) && chance(.55)){
      const id = ++convoN, a = sayAt(top, 'gloat', 0, 1.4, { ...LD, convo:id });
      const other = comsSeated().filter(j => j !== top);
      if (a && other.length && chance(.3)) sayLine(pick(other), 'needle', {}, 1.4, { convo:id, after:a, ttl:9000 });
    } else {
      const loser = shownLosers.find(i => i > 0);
      if (loser && chance(.6)){
        const id = ++convoN, a = sayAt(loser, 'loseTo', top, 1.4, { ...LD, convo:id });
        if (a && chance(.55)) sayAt(top, 'gloat', loser, 1.4, { convo:id, after:a, ttl:9000 });
      }
      else if (chance(big ? .7 : .3)) sayLine(top, 'comWin', {}, 1.4, LD);
      else if (loser && chance(.5)) sayLine(loser, 'comLose', {}, 1.4, LD);
    }
  }
  if (top === 0){
    const losers = idx.filter(i => i && G.players[i].inHand && G.players[i].contrib >= bb*3);
    if (losers.length && chance(.75)){
      const k = pick(losers), id = ++convoN;
      const a = sayLine(k, chance(.5) ? 'praise' : 'salty', {}, 1.4, { ...LD, convo:id });
      const other = comsSeated().filter(j => j !== k);
      if (a && other.length && chance(.3)) sayAt(pick(other), 'quitWhining', k, 1.4, { convo:id, after:a, ttl:9000 });
    }
    else if (chance(.4)) sayLine('D', 'youWin', {}, 1.4, LD);
  }
}

function finishHand(h, msgs, total){
  h.done = true; raiseOpen = false; humanResolve = null; preAct = null;
  G.biggest = Math.max(G.biggest, total);
  msgs.forEach(m => logLine(m, 'w'));
  logLine(`Server seed revealed: ${h.serverSeed.slice(0,16)}…`, 'st');
  G.history.unshift({
    nonce:h.nonce, serverSeed:h.serverSeed, clientSeed:h.clientSeed, commitment:h.commitment,
    dealt:[
      ...G.players.filter(p => p.hole.length).flatMap(p => p.hole.map((c,i) => ({ idx:p.holeIdx[i], card:c, who:who(p) }))),
      ...h.board.map((c,i) => ({ idx:h.boardIdx[i], card:c, who:'Board' }))
    ],
    summary:msgs[0]
  });
  if (G.history.length > 60) G.history.pop();
  renderHistory();
  G.stats.played++;
  if (h.winners.has(me().id)){ G.stats.won++; G.stats.best = Math.max(G.stats.best, total); }
  renderStats();
  G.players.filter(p => p.chips === 0 && p.inHand).forEach(p => logLine(`${who(p)} is out of chips.`, 'st'));
  const alivePl = G.players.filter(p => p.chips > 0);
  if (me().chips <= 0 || alivePl.length < 2) h.over = true;
  dockKey = '';
  renderUI();
  if (!h.over && G.cfg.auto){
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => { if (H === h) startHand(); }, T(4800));
  }
}

/* ---------- DOM UI ---------- */
function renderUI(){
  renderTop();
  if (!G) return;
  $('#overlayHost').innerHTML = H && H.over ? overlayHTML() : '';
  bindOverlay();
  renderDock();
  renderFair();
}
function overlayHTML(){
  const won = me().chips > 0;
  return `<div class="overlay"><div class="box">
    <h2>${won ? 'Table won' : 'Out of chips'}</h2>
    <p>${won ? `You took every chip in ${G.handNo} hands. Biggest pot: ${money(G.biggest)}.` : `Busted after ${G.handNo} hands. Biggest pot you saw: ${money(G.biggest)}.`}</p>
    <div class="row">
      ${won ? '' : `<button class="btn primary" id="rebuy" type="button">Rebuy ${money(G.startStack)}</button>`}
      <button class="btn" id="again" type="button">New table</button>
    </div></div></div>`;
}
function bindOverlay(){
  const rb = $('#rebuy'); if (rb) rb.onclick = () => { me().chips = G.startStack; G.stats.bought += G.startStack; logLine(`${me().name} rebuys for ${money(G.startStack)}.`, 'st'); H.over = false; renderUI(); startHand(); };
  const ag = $('#again'); if (ag) ag.onclick = leave;
}
let leaveArmed = false, leaveTimer = null;
function renderTop(){
  const Ld = $('#topL'), C = $('#topC'), Rr = $('#topR');
  if (!G){
    Ld.innerHTML = '<div class="brand">Fair<span>Poker</span></div>';
    C.innerHTML = ''; Rr.innerHTML = '';
    return;
  }
  Ld.innerHTML = `<button class="pill ${leaveArmed ? 'armed' : ''}" id="leaveBtn" type="button" aria-label="${leaveArmed ? 'Tap again to leave the table' : 'Back to lobby'}">${IC.back}<span>${leaveArmed ? 'Tap to leave' : 'Lobby'}</span></button>`;
  C.innerHTML = `<div class="info-1">${TH.key === 'saloon' ? '1877 Saloon' : TH.key === 'atari' ? '16-Bit' : "Texas Hold'em"} · No limit${H ? ` · Hand ${H.nonce}` : ''}</div><div class="info-2">Blinds ${money(G.cfg.sb)}/${money(G.cfg.bb)}</div>`;
  if (!Rr.firstChild){
    Rr.innerHTML = `<button class="ico" id="sndBtn" type="button"></button>
      <button class="ico" data-open="log" aria-label="Hand log" title="Hand log" type="button">${IC.log}</button>
      <button class="ico" data-open="fair" aria-label="Fairness" title="Fairness" type="button">${IC.shield}</button>
      <button class="ico" data-open="set" aria-label="Settings" title="Settings" type="button">${IC.gear}</button>`;
  }
  renderSnd();
  $('#leaveBtn').onclick = () => {
    if (!leaveArmed){ leaveArmed = true; renderTop(); clearTimeout(leaveTimer); leaveTimer = setTimeout(() => { leaveArmed = false; if (G) renderTop(); }, 3500); return; }
    leave();
  };
}
function renderSnd(){
  const b = $('#sndBtn'); if (!b) return;
  b.innerHTML = sfx.on ? IC.snd : IC.mute;
  b.setAttribute('aria-label', sfx.on ? 'Sound on, tap to mute' : 'Sound off, tap to turn on');
  b.title = sfx.on ? 'Sound on' : 'Sound off';
  b.classList.toggle('off', !sfx.on);
  b.onclick = () => { sfx.on = !sfx.on; if (sfx.on){ sfx.init(); setTimeout(() => sfx.chips(4), 60); } const t = $('#t-sound'); if (t) t.checked = sfx.on; renderSnd(); };
}
function leave(){
  clearTimeout(autoTimer); clearTimeout(leaveTimer);
  if (H) H.abort = true;
  leaveArmed = false; G = null; H = null; humanResolve = null; preAct = null; dealing = false;
  tweens.clear(); sprites.clear();
  $('#overlayHost').innerHTML = '';
  $('#game').hidden = true; $('#drawer').hidden = true; $('#lobby').hidden = false;
  closeDrawer();
  renderTop();
}
const miniCards = cards => cards.map(c => `<span class="mc ${(c&3) === 1 || (c&3) === 2 ? 'r' : ''}">${cardShort(c)}</span>`).join('');
// ---- what the info bar tells you: your hand, your chance to win, and whether the price is right ----
let ODDS = store.get('odds') !== '0';
let eqCache = { key:'', val:null };
function heroEquity(){
  const p = me(), h = H;
  const opp = G.players.filter(q => q !== p && live(q)).length;
  if (!opp) return null;
  const key = G.handNo + '|' + h.board.length + '|' + opp + '|' + p.hole.join(',');
  if (eqCache.key === key) return eqCache.val;
  eqCache = { key, val:null };
  setTimeout(() => {
    if (eqCache.key !== key || !G || !H) return;
    eqCache.val = equity(p.hole, h.board, opp, 1400);
    dockKey = ''; renderDock();
  }, 20);
  return null;
}
function preName(hole){
  const [a, b] = hole.map(c => c >> 2).sort((x, y) => y - x), suited = (hole[0] & 3) === (hole[1] & 3);
  const n = r => RANKS[r] === '10' ? 'T' : RANKS[r];
  return a === b ? `Pocket ${RN_PL[a]}` : `${n(a)}-${n(b)} ${suited ? 'suited' : 'offsuit'}`;
}
const RN_PL = ['Twos','Threes','Fours','Fives','Sixes','Sevens','Eights','Nines','Tens','Jacks','Queens','Kings','Aces'];
function drawsOf(hole, board){
  if (board.length < 3 || board.length > 4) return '';
  const all = [...hole, ...board], out = [];
  const made = evaluate(all).cat;
  if (made < 5){
    const bySuit = [0, 0, 0, 0]; all.forEach(c => bySuit[c & 3]++);
    const fs = bySuit.findIndex(n => n === 4);
    if (fs >= 0 && hole.some(c => (c & 3) === fs)) out.push('flush draw');
  }
  if (made < 4){
    const ranks = new Set(all.map(c => c >> 2)); if (ranks.has(12)) ranks.add(-1);
    let outsN = 0;
    for (let r = 0; r < 13; r++){
      if (ranks.has(r)) continue;
      const rs = new Set(ranks); rs.add(r); if (r === 12) rs.add(-1);
      for (let lo = -1; lo <= 8; lo++){ let ok = true; for (let k = 0; k < 5; k++) if (!rs.has(lo + k)) { ok = false; break; } if (ok){ outsN++; break; } }
    }
    if (outsN >= 2) out.push('open-ended'); else if (outsN === 1) out.push('gutshot');
  }
  return out.join(' + ');
}
function hudHTML(status){
  const p = me(), h = H;
  const up = h && h.heroFlip >= 1 && p.hole.length === 2;
  const live_ = h && up && p.inHand && !p.folded && !h.done;
  let hand = '', sub = '';
  if (up){
    if (h.board.length){
      hand = handName(evaluate([...p.hole, ...h.board])); sub = drawsOf(p.hole, h.board);
      if (CW < 560 && hand.length > 18){
        const L1 = { Twos:'2s', Threes:'3s', Fours:'4s', Fives:'5s', Sixes:'6s', Sevens:'7s', Eights:'8s', Nines:'9s', Tens:'10s', Jacks:'Js', Queens:'Qs', Kings:'Ks', Aces:'As' };
        hand = hand.replace(/\b(Twos|Threes|Fours|Fives|Sixes|Sevens|Eights|Nines|Tens|Jacks|Queens|Kings|Aces)\b/g, m => L1[m]).replace(' and ', ' & ');
      }
    }
    else { hand = preName(p.hole); sub = `top ${Math.max(1, Math.round(prePct(p.hole)*100))}%`; }
  }
  const toCall = h && !h.done ? Math.max(0, Math.min(h.currentBet - p.bet, p.chips)) : 0;
  const pot = h ? potAll() : 0;
  const need = toCall > 0 ? toCall/(pot + toCall) : 0;
  const opp = G.players.filter(q => q !== p && live(q)).length;
  const eq = ODDS && live_ ? heroEquity() : null;
  const good = eq != null && eq >= need;
  const eqTxt = !ODDS || !live_ ? '' : eq == null ? `<span class="eq">Win <b>…</b></span>` :
    `<span class="eq ${toCall > 0 ? (good ? 'good' : 'bad') : 'good'}" title="Chance to win against ${opp} random hand${opp > 1 ? 's' : ''}">Win <b>${Math.round(eq*100)}%</b><small> vs ${opp}</small></span>`;
  const mini = up ? miniCards(p.hole) : '';
  const callTxt = !live_ ? '' : toCall > 0 ? `Call <b>${money(toCall)}</b> · Need <b>${Math.round(need*100)}%</b>` : humanResolve ? '<span class="free">Free to check</span>' : '';
  const bar = `<div class="ebar">${ODDS && live_ && eq != null ? `<i class="${toCall > 0 && !good ? 'bad' : 'good'}" style="width:${(eq*100).toFixed(1)}%"></i>${toCall > 0 ? `<u style="left:${(need*100).toFixed(1)}%"></u>` : ''}` : ''}</div>`;
  // first person already shows your hand above the table, so the bar carries the price instead
  const mid = FP() ? `<span class="hn">${callTxt}</span>` : `<span class="hn">${esc(hand)}${sub ? ` <i>${esc(sub)}</i>` : ''}</span>`;
  const left2 = FP() ? '' : callTxt;
  return `<div class="strip hud">
    <div class="h1"><span class="me-st" title="Your stack">${money(p.chips)}</span>${mini}${mid}${eqTxt}</div>
    ${bar}
    <div class="h2"><span class="facts">${left2}</span><span class="st">${status || ''}</span></div>
  </div>`;
}
function renderDock(){
  const box = $('#dock');
  if (!G) return;
  const p = me(), h = H;
  const myTurn = !!(humanResolve && h && !h.done);
  const key = [G.handNo, h && h.street, h && h.done, h && h.over, myTurn, h && h.currentBet, p.chips, p.bet, h && h.toAct, raiseOpen, G.cfg.auto, h && h.heroFlip >= 1, h && h.board.length, p.folded, TH.key, preAct, dealing, h && h.tucked, G.players.filter(live).length, eqCache.val, ODDS].join('|');
  if (key === dockKey) return;
  dockKey = key;
  box.classList.toggle('myturn', myTurn);
  const up = h && h.heroFlip >= 1 && p.hole.length === 2;
  const hud = status => hudHTML(status);
  const preRow = dis => `<div class="pre">${['Check / Fold', 'Check', 'Call any'].map(l => `<button type="button" disabled><i></i>${l}</button>`).join('')}</div>`;
  if (!h || (h.done && dealing)){ box.innerHTML = `${hud('The dealer is shuffling')}${preRow()}`; return; }
  if (h.done){
    box.innerHTML = `${hud(h.over ? '' : (G.cfg.auto ? 'Next hand in a moment' : 'Hand complete'))}
      ${h.over ? '' : `<div class="btns"><button class="abtn next" id="nextHand" type="button">${IC.deal}Deal next hand <span class="kbd">N</span></button></div>`}`;
    const nb = $('#nextHand'); if (nb) nb.onclick = () => startHand();
    return;
  }
  const toCall = Math.min(h.currentBet - p.bet, p.chips);
  if (!myTurn){
    const cur = h.toAct >= 0 ? G.players[h.toAct] : null;
    const right = p.folded && p.inHand ? 'You folded' : p.allIn ? 'You are all-in' : (cur && cur.isCom && needsAction(cur) ? `Waiting on ${esc(cur.name)}` : (up ? '' : 'Dealing'));
    const canPre = p.inHand && !p.folded && !p.allIn && up;
    if (!up && p.inHand && !p.folded){ box.innerHTML = `${hud(right)}${preRow()}`; return; }
    const pb = (v, label, dis) => `<button type="button" data-pre="${v}" aria-pressed="${preAct === v}" ${dis ? 'disabled' : ''}><i></i>${label}</button>`;
    box.innerHTML = `${hud(right)}
      ${canPre ? `<div class="pre" id="pre">
        ${pb('checkfold', 'Check / Fold')}
        ${pb('check', toCall > 0 ? 'Check' : 'Check', toCall > 0)}
        ${pb('callany', 'Call any')}
      </div>` : ''}`;
    const pre = $('#pre');
    if (pre) pre.onclick = e => { const b = e.target.closest('button[data-pre]'); if (!b || b.disabled) return; preAct = preAct === b.dataset.pre ? null : b.dataset.pre; dockKey = ''; renderDock(); };
    return;
  }
  const max = p.bet + p.chips;
  const minTo = Math.min(h.currentBet + h.minRaise, max);
  const raiseOk = canRaise(p) && max > h.currentBet && minTo < max;
  const allInOk = p.chips > 0 && (canRaise(p) || p.chips <= toCall);
  const pot = potAll();
  const right = 'Your move';
  const betWord = h.currentBet === 0 ? 'Bet' : 'Raise';
  box.innerHTML = `${hud(right)}
    ${raiseOk && raiseOpen ? `<div class="sheet">
      <div class="presets" id="presets">
        <button type="button" data-f="min">Min</button><button type="button" data-f="0.5">½ Pot</button>
        <button type="button" data-f="0.75">¾ Pot</button><button type="button" data-f="1">Pot</button>
      </div>
      <div class="slide">
        <button type="button" class="step" id="rMinus" aria-label="Less">${IC.minus}</button>
        <input type="range" id="rSlider" min="${minTo}" max="${max}" step="1" value="${minTo}" aria-label="${betWord} amount">
        <button type="button" class="step" id="rPlus" aria-label="More">${IC.plus}</button>
        <input type="number" class="val" id="rAmt" min="${minTo}" max="${max}" value="${minTo}" aria-label="${betWord} to">
      </div>
    </div>` : ''}
    <div class="btns">
      <button class="abtn fold" id="aFold" type="button">${IC.fold}Fold <span class="kbd">F</span></button>
      <button class="abtn call" id="aCall" type="button">${IC.check}<span>${toCall > 0 ? 'Call' : 'Check'}${toCall > 0 ? `<br><small>${money(toCall)}</small>` : ''}</span></button>
      <button class="abtn raise" id="aRaise" type="button" aria-expanded="${raiseOpen}" ${raiseOk ? '' : 'disabled'}>${IC.raise}<span id="raiseLbl">${betWord}</span></button>
      <button class="abtn allin" id="aAll" type="button" ${allInOk ? '' : 'disabled'}>${IC.allin}<span>All in<br><small>${money(max)}</small></span></button>
    </div>`;
  $('#aFold').onclick = () => submit({ type:'fold' });
  $('#aCall').onclick = () => submit({ type:toCall <= 0 ? 'check' : 'call' });
  $('#aAll').onclick = () => submit(max > h.currentBet && canRaise(p) ? { type:'raise', to:max } : { type:'call' });
  const rb = $('#aRaise');
  if (raiseOk && raiseOpen){
    const sl = $('#rSlider'), am = $('#rAmt'), lbl = $('#raiseLbl');
    const stepAmt = G.cfg.bb;
    const setTo = v => {
      v = Math.max(minTo, Math.min(max, Math.round(+v || minTo)));
      sl.value = v; am.value = v; rb.dataset.to = v;
      lbl.innerHTML = `${v === max ? 'All in' : betWord}<br><small>${money(v)}</small>`;
    };
    setTo(minTo);
    sl.oninput = () => setTo(sl.value);
    am.onchange = () => setTo(am.value);
    $('#rMinus').onclick = () => setTo(+sl.value - stepAmt);
    $('#rPlus').onclick = () => setTo(+sl.value + stepAmt);
    $('#presets').onclick = e => {
      const f = e.target.dataset.f; if (!f) return;
      setTo(f === 'min' ? minTo : h.currentBet + Math.round(+f * (potAll() + toCall)));
    };
    rb.onclick = () => submit({ type:'raise', to:+rb.dataset.to });
  } else if (raiseOk){
    rb.onclick = () => { raiseOpen = true; dockKey = ''; renderDock(); const s = $('#rSlider'); if (s) s.focus(); };
  }
}

