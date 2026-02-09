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
  const availableH = Math.max(220, (window.innerHeight - topH) - PAD*2);

  // ✅ "스케일 1" 기준에서 seat/center 전체 바운딩 박스 계산
  // (현재 CSS가 이미 scale을 적용 중일 수 있으니, vars를 1/0으로 먼저 고정)
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

  // ✅ “무조건 한 화면” => 가로/세로 둘 다 만족하는 최소 스케일
  let s = Math.min(availableW / requiredW, availableH / requiredH);

  // 너무 작아지더라도(기종이 아주 작아도) 스크롤/잘림 없이 들어가게 우선
  s = Math.max(0.35, Math.min(1, s));

  // ✅ 바운딩 박스의 좌상단이 (PAD, topH+PAD)로 오게 이동
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