function wrapText(g, text, maxW){
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words){ const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur){ lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}

