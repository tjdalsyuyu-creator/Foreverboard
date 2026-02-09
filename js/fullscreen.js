// js/fullscreen.js v1.6.5
import { LS } from "./constants.js";
import { applyAutoScale } from "./autoscale.js";
import { setTopbarHiddenValue } from "./topbar.js";

function isFullscreen(){
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}
function requestFullscreen(){
  const el = document.documentElement;
  (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el);
}
function exitFullscreen(){
  (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen)?.call(document);
}
function isPortrait(){
  return matchMedia("(orientation: portrait)").matches;
}

export function updateFullscreenButton(dom){
  if(!dom.fullscreenBtn) return;
  dom.fullscreenBtn.textContent = isFullscreen() ? "⛶ 전체화면 해제" : "⛶ 전체화면";
}

export function updateFsAndForceLandscapeState(dom){
  const fs = isFullscreen();
  const portrait = isPortrait();

  document.body.classList.toggle("fs-force-landscape", fs && portrait);

  // fullscreen이면 상단바 자동 숨김(이전 상태 저장/복원)
  if(fs){
    if(localStorage.getItem(LS.AUTO_HIDE_TOPBAR_IN_FS) == null){
      const prev = localStorage.getItem(LS.UI_TOPBAR_HIDDEN) === "1" ? "1" : "0";
      localStorage.setItem(LS.AUTO_HIDE_TOPBAR_IN_FS, prev);
    }
    setTopbarHiddenValue(dom, true);
  } else {
    const prev = localStorage.getItem(LS.AUTO_HIDE_TOPBAR_IN_FS);
    if(prev === "0" || prev === "1"){
      setTopbarHiddenValue(dom, prev === "1");
    }
    localStorage.removeItem(LS.AUTO_HIDE_TOPBAR_IN_FS);
  }

  updateFullscreenButton(dom);
  applyAutoScale(dom);
}

export function initFullscreen(dom, after){
  if(dom.fullscreenBtn){
    dom.fullscreenBtn.addEventListener("click", ()=>{
      if(isFullscreen()) exitFullscreen();
      else requestFullscreen();
    }, { passive:true });
  }

  const handler = ()=>{ updateFsAndForceLandscapeState(dom); after?.(); };

  ["fullscreenchange","webkitfullscreenchange","msfullscreenchange"]
    .forEach(evt => document.addEventListener(evt, handler));

  window.addEventListener("resize", handler);
  window.addEventListener("orientationchange", handler);

  handler();
}