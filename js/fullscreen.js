// js/fullscreen.js v1.6.8
import { LS } from "./constants.js";
import { setTopbarHiddenValue } from "./topbar.js";
import { applyAutoScale } from "./autoscale.js";

function isFullscreen(){
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
function requestFullscreen(){
  (document.documentElement.requestFullscreen ||
   document.documentElement.webkitRequestFullscreen)?.call(document.documentElement);
}
function exitFullscreen(){
  (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
}

function setUiMode(){
  const fs = isFullscreen();
  const isLandscape = matchMedia("(orientation: landscape)").matches;

  document.body.classList.remove("ui-portrait", "ui-landscape", "ui-fs-landscape");

  if (fs) {
    // ✅ 전체화면은 무조건 가로 UI
    document.body.classList.add("ui-fs-landscape");
  } else {
    document.body.classList.add(isLandscape ? "ui-landscape" : "ui-portrait");
  }
}

export function initFullscreen(dom, rerender){
  dom.fullscreenBtn.addEventListener("click", ()=>{
    if(isFullscreen()) exitFullscreen();
    else requestFullscreen();
  });

  const update = ()=>{
    const fs = isFullscreen();

    // ✅ fullscreen 플래그
    document.body.classList.toggle("is-fullscreen", fs);

    // ✅ UI 모드 강제 결정 (CSS 섞임 방지)
    setUiMode();

    // ✅ fullscreen 동안 상단바 자동 숨김(기존 동작 유지)
    if(fs){
      if(localStorage.getItem(LS.AUTO_HIDE_TOPBAR_IN_FS)==null){
        localStorage.setItem(
          LS.AUTO_HIDE_TOPBAR_IN_FS,
          localStorage.getItem(LS.UI_TOPBAR_HIDDEN) === "1" ? "1":"0"
        );
      }
      setTopbarHiddenValue(dom,true);
    } else {
      const prev = localStorage.getItem(LS.AUTO_HIDE_TOPBAR_IN_FS);
      if(prev==="0"||prev==="1") setTopbarHiddenValue(dom, prev==="1");
      localStorage.removeItem(LS.AUTO_HIDE_TOPBAR_IN_FS);
    }

    dom.fullscreenBtn.textContent = fs ? "⛶ 전체화면 해제" : "⛶ 전체화면";

    // ✅ autoscale은 “세로 강제 가로 UI” 같은 모드에서만 쓰는 게 안전하지만,
    //    현재 v1.6.8 구조에서는 ui-portrait/landscape/fullsreen 모두 autoscale을 끔.
    //    (applyAutoScale 내부에서 가로/전체화면 early return 처리)
    applyAutoScale(dom);

    rerender();
  };

  ["fullscreenchange","webkitfullscreenchange"].forEach(e=>{
    document.addEventListener(e, update);
  });
  window.addEventListener("orientationchange", update);
  window.addEventListener("resize", update);

  update();
}
