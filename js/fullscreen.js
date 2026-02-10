// js/fullscreen.js v1.6.6
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
function isPortrait(){
  return matchMedia("(orientation: portrait)").matches;
}

export function initFullscreen(dom, rerender){
  dom.fullscreenBtn.addEventListener("click", ()=>{
    if(isFullscreen()) exitFullscreen();
    else requestFullscreen();
  });

  const update = ()=>{
    const fs = isFullscreen();

    // ✅ fullscreen 상태 플래그(autoscale/CSS에서 사용)
    document.body.classList.toggle("is-fullscreen", fs);

    // ✅ 세로 전체화면이면 강제가로 UI 유지(기존 로직)
    document.body.classList.toggle("fs-force-landscape", fs && isPortrait());

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
