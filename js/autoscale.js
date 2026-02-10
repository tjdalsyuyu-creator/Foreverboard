// js/autoscale.js v1.6.8
// - 자식(.seat/.center) rect 기반 측정 제거(브라우저별 튐 방지)
// - tableRoot의 scrollWidth/scrollHeight 기반으로 안정적인 스케일 산출
// - autoscale은 JS가 조건 만족 시에만 body.autoscale-on을 켬

export function applyAutoScale(dom){
  // reset vars
  document.documentElement.style.setProperty("--autoScale","1");
  document.documentElement.style.setProperty("--autoTx","0px");
  document.documentElement.style.setProperty("--autoTy","0px");
  document.body.classList.remove("autoscale-on");

  const isCoarse = matchMedia("(pointer: coarse)").matches;
  const isLandscape = matchMedia("(orientation: landscape)").matches;
  const forceLandscapeUI = document.body.classList.contains("fs-force-landscape");

  // ✅ 전체화면(가로)에서는 autoscale(transform) OFF
  const isFullscreen = document.body.classList.contains("is-fullscreen");
  if (isFullscreen && isLandscape && !forceLandscapeUI) return;

  // ✅ 가로이거나 / 세로 전체화면 강제가로UI일 때만 autoscale ON
  if(!(isCoarse && (isLandscape || forceLandscapeUI))) return;
  if(!dom.tableRoot) return;

  // ✅ 이제 transform은 JS가 켤 때만 적용
  document.body.classList.add("autoscale-on");

  const PAD = 10;

  const topbarHidden = dom.topbar?.classList.contains("hidden");
  const topH = (!topbarHidden && dom.topbar) ? dom.topbar.getBoundingClientRect().height : 0;

  const availableW = Math.max(240, window.innerWidth - PAD*2);
  const availableH = Math.max(220, (window.innerHeight - topH) - PAD*2);

  // ✅ 핵심: children rect 대신 scrollWidth/scrollHeight 사용(안정)
  // scrollWidth/Height가 0으로 나오는 브라우저도 있어서 fallback 포함
  const root = dom.tableRoot;

  // transform 영향 제거된 상태에서 측정되도록 한 번 더 리셋
  document.documentElement.style.setProperty("--autoScale","1");
  document.documentElement.style.setProperty("--autoTx","0px");
  document.documentElement.style.setProperty("--autoTy","0px");

  let requiredW = root.scrollWidth;
  let requiredH = root.scrollHeight;

  if(!requiredW || !requiredH){
    // fallback
    const r = root.getBoundingClientRect();
    requiredW = Math.max(1, r.width);
    requiredH = Math.max(1, r.height);
  }

  // ✅ 필요하면 “확대”도 허용 (큰 화면에서 너무 작게 보이는 문제 방지)
  //    너무 크면 터치 오작동/블러가 생길 수 있어 1.25까지만
  let s = Math.min(availableW / requiredW, availableH / requiredH);
  s = Math.max(0.55, Math.min(1.25, s));

  // ✅ 중앙 정렬: 남는 공간을 계산해서 가운데로
  const usedW = requiredW * s;
  const usedH = requiredH * s;

  const tx = Math.round((availableW - usedW) / 2 + PAD);
  const ty = Math.round((availableH - usedH) / 2 + (topH + PAD));

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

  // ✅ 모바일에서 가로/전체화면 진입 직후 레이아웃 재계산 타이밍 보정
  setTimeout(handler, 50);
  setTimeout(handler, 250);

  handler();
}
