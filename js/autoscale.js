// js/autoscale.js v1.6.7 FIT-TO-SCREEN (no scroll, no clip)
export function applyAutoScale(dom){
  // reset vars
  document.documentElement.style.setProperty("--autoScale","1");
  document.documentElement.style.setProperty("--autoTx","0px");
  document.documentElement.style.setProperty("--autoTy","0px");

  // ✅ 기본은 OFF, 조건 만족 시에만 ON
  document.body.classList.remove("autoscale-on");

  const isCoarse = matchMedia("(pointer: coarse)").matches;
  const isLandscape = matchMedia("(orientation: landscape)").matches;
  const forceLandscapeUI = document.body.classList.contains("fs-force-landscape");

  // ✅ 전체화면(가로)에서는 autoscale(transform)을 무조건 끈다
  const isFullscreen = document.body.classList.contains("is-fullscreen");
  if (isFullscreen && isLandscape && !forceLandscapeUI) return;

  // ✅ 가로이거나 / 세로 전체화면 강제가로UI일 때만 적용
  if(!(isCoarse && (isLandscape || forceLandscapeUI))) return;
  if(!dom.tableRoot) return;

  // ✅ 이제 transform은 JS가 켤 때만 적용
  document.body.classList.add("autoscale-on");

  const PAD = 10;

  const topbarHidden = dom.topbar?.classList.contains("hidden");
  const topH = (!topbarHidden && dom.topbar) ? dom.topbar.getBoundingClientRect().height : 0;

  const availableW = Math.max(240, window.innerWidth - PAD*2);
  const availableH = Math.max(220, (window.innerHeight - topH) - PAD*2);

  // scale 1 기준으로 바운딩 계산
  document.documentElement.style.setProperty("--autoScale","1");
  document.documentElement.style.setProperty("--autoTx","0px");
  document.documentElement.style.setProperty("--autoTy","0px");

  const tableRect = dom.tableRoot.getBoundingClientRect();
  const items = dom.tableRoot.querySelectorAll(".seat, .center");

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

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

  if(!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return;

  const requiredW = Math.max(1, maxX - minX);
  const requiredH = Math.max(1, maxY - minY);

  let s = Math.min(availableW / requiredW, availableH / requiredH);
  s = Math.max(0.35, Math.min(1, s));

  const tx = (-minX * s) + PAD;
  const ty = (-minY * s) + (topH + PAD);

  document.documentElement.style.setProperty("--autoScale", String(s));
  document.documentElement.style.setProperty("--autoTx", `${tx}px`);
  document.documentElement.style.setProperty("--autoTy", `${ty}px`);
}

export function initAutoScale(dom, after){
  const handler = ()=>{
    applyAutoScale(dom);
    after?.();
  };
  window.addEventListener("resize", handler);
  window.addEventListener("orientationchange", handler);
  handler();
}
