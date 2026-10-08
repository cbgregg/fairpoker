let feltPattern = null;
function noiseCanvas(){
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), id = g.createImageData(128, 128);
  for (let k = 0; k < id.data.length; k += 4){ const v = Math.random()*255; id.data[k] = id.data[k+1] = id.data[k+2] = v; id.data[k+3] = 14; }
  g.putImageData(id, 0, 0);
  return c;
}
