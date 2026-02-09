// js/autoscale.js v1.6.5 FIT-TO-SCREEN (no scroll, no clip)
export function applyAutoScale(dom){
  // reset vars
  document.documentElement.style.setProperty("--autoScale","1");
  document.documentElement.style.setProperty("--autoTx","0px");
  document.documentElement.style.setProperty("--autoTy","0px");

  const isCoarse = matchMedia("(pointer: coarse)").matches;
  const isLandscape = matchMedia("(orientation: landscape)").matches;
  const forceLandscapeUI = document.body.classList.contains("fs-force-landscape");

  // ✅ 가로이거나(실제) / 세로 전체화면 강제가로UI일 때만 적용
  if(!(isCoarse && (isLandscape || forceLandscapeUI))) return;
  if(!dom.tableRoot) return;

  // 화면 여백(안전 마진)
  const PAD = 10;

  // topbar 높이 고려(숨김이면 0)
  const topbarHidden = dom.topbar?.classList.contains("hidden");
  const topH = (!topbarHidden && dom.topbar) ? dom.topbar.getBoundingClientRect().height : 0;

  const availableW = Math.max(240, window.innerWidth - PAD*2);
  const availableH = Math.max(