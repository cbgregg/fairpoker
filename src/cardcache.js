const PIPS = {
  2:[[50,12],[50,88]], 3:[[50,12],[50,50],[50,88]],
  4:[[22,12],[78,12],[22,88],[78,88]], 5:[[22,12],[78,12],[50,50],[22,88],[78,88]],
  6:[[22,12],[78,12],[22,50],[78,50],[22,88],[78,88]], 7:[[22,12],[78,12],[50,31],[22,50],[78,50],[22,88],[78,88]],
  8:[[22,12],[78,12],[50,31],[22,50],[78,50],[50,69],[22,88],[78,88]],
  9:[[22,12],[78,12],[22,37],[78,37],[50,50],[22,63],[78,63],[22,88],[78,88]],
  10:[[22,12],[78,12],[50,25],[22,37],[78,37],[22,63],[78,63],[50,75],[22,88],[78,88]]
};
const cardCache = new Map();
function cardCanvas(c, w, style){
  const pw = Math.max(10, Math.round(w*DPR));
  const key = style + '|' + c + '|' + pw;
  let cvs = cardCache.get(key);
  if (cvs) return cvs;
  if (cardCache.size > 500) cardCache.clear();
  cvs = document.createElement('canvas');
  cvs.width = pw; cvs.height = Math.round(pw*1.42);
  paintCard(cvs.getContext('2d'), cvs.width, cvs.height, c, style);
  cardCache.set(key, cvs);
  return cvs;
}
