// js/autoscale.js v1.6.5
export function applyAutoScale(dom){
  // reset vars
  document.documentElement.style.setProperty("--autoScale","1");
  document.documentElement.style.setProperty("--autoTx","0px");
  document.documentElement.style.setProperty("--autoTy","0px");

  const isCoarse = matchMedia("(pointer: coarse)").matches;
  const isLandscape = matchMedia("(orientation: landscape)").matches;
  const forceLandscapeUI = document.body.classList.contains("fs-force-landscape");
  if(!(isCoarse && (isLandscape || forceLandscapeUI))) return;

  if(!dom.tableRoot) return;

  const topbarHidden = dom.topbar?.classList.contains("hidden");
  const topH = (!topbarHidden && dom.topbar) ? dom.topbar.getBoundingClientRect().height : 0;

  const availableW = Math.max(240, window.innerWidth - 8);
  const availableH = Math.max(220, window.innerHeight - topH - 8);

  const tableRect = dom.tableRoot.getBoundingClientRect();
  const items = dom.tableRoot.querySelectorAll(".seat, .center");

  let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;

  items.forEach(el=>{
    const r = el.getBoundingClientRect();
    const x1 = r.left - tableRect.left;
    const y1 = r.top  - tableRect.top;
    const x2 = r.right - tableRect.left;
    const y2 = r.bottom- tableRect.top;
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  if(!isFinite(minX)||!isFinite(minY)||!isFinite(maxX)||!isFinite(maxY)) return;

  const requiredW = Math.max(1, maxX - minX);
  const requiredH = Math.max(1, maxY - minY);

  let s = Math.min(availableW/requiredW, availableH/requiredH);
  s = Math.max(0.62, Math.min(1, s));

  const tx = (-minX * s);
  const ty = (-minY * s);

  document.documentElement.style.setProperty("--autoScale", String(s));
  document.documentElement.style.setProperty("--autoTx", `${tx}px`);
  document.documentElement.style.setProperty("--autoTy", `${ty}px`);
}

export function initAutoScale(dom, after){
  const handler = ()=>{ applyAutoScale(dom); after?.(); };
  window.addEventListener("resize", handler);
  window.addEventListener("orientationchange", handler);
  handler();
}