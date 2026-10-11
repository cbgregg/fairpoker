function logLine(text, cls = 'l'){
  if (typeof cliPush === 'function') cliPush('log', text);
  const el = document.createElement('div');
  el.className = cls; el.textContent = text;
  const log = $('#log');
  log.appendChild(el);
  while (log.children.length > 400) log.removeChild(log.firstChild);
  const panel = $('#p-log');
  panel.scrollTop = panel.scrollHeight;
}
function renderFair(){
  if (!H){ $('#curCommit').textContent = 'No hand dealt yet'; $('#curMeta').textContent = ''; return; }
  $('#curCommit').textContent = H.commitment;
  $('#curMeta').innerHTML = H.done
    ? `Hand #${H.nonce} is over. Server seed revealed: <span class="mono" style="word-break:break-all">${H.serverSeed}</span>`
    : `Hand #${H.nonce} · client seed <span class="mono">${esc(H.clientSeed)}</span>. The server seed stays hidden until the hand ends.`;
}
function renderStats(){
  if (!G) return;
  const s = G.stats, net = me().chips - s.bought;
  $('#stats').innerHTML = `<div><b>${s.played}</b><small>Hands played</small></div>
    <div><b>${s.won}</b><small>Pots won${s.played ? ` · ${Math.round(s.won/s.played*100)}%` : ''}</small></div>
    <div><b style="color:${net > 0 ? 'var(--good)' : net < 0 ? '#e0675b' : 'inherit'}">${net >= 0 ? '+' : '−'}${money(Math.abs(net))}</b><small>Net</small></div>
    <div><b>${money(s.best)}</b><small>Your biggest pot</small></div>`;
}
function renderHistory(){
  const h = $('#hist');
  if (!G.history.length){ h.innerHTML = '<p>Finished hands appear here with their revealed seeds.</p>'; return; }
  h.innerHTML = G.history.map((e, i) => `<button type="button" data-i="${i}"><span><b class="mono">#${e.nonce}</b> ${esc(e.summary)}</span><span class="v">Verify</span></button>`).join('');
}

