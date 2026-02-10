// js/autoscale.js v1.6.8
export function applyAutoScale(dom){
  // ✅ 가로 UI/전체화면 가로 UI에서는 autoscale 사용 금지
  if (
    document.body.classList.contains("ui-landscape") ||
    document.body.classList.contains("ui-fs-landscape")
  ) {
    document.documentElement.style.setProperty("--autoScale","1");
    document.documentElement.style.setProperty("--autoTx","0px");
    document.documentElement.style.setProperty("--autoTy","0px");
    document.body.classList.remove("autoscale-on");
    return;
  }

  // reset vars
  document.documentElement.style.setProperty("--autoScale","1");
  document.documentElement.style.setProperty("--autoTx","0px");
  document.documentElement.style.setProperty("--autoTy","0px");
  document.body.classList.remove("autoscale-on");

  // (현재 v1.6.8 구조에서는 세로도 autoscale 없이 리스트로 운영)
  // 필요하면 나중에 “세로에서만 자동 확대/축소” 옵션을 별도로 넣을 수 있음.
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
