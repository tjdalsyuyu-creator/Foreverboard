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

  // ✅ 전체화면은 무조건 가로 UI만 확장 표시
  if(fs){
    document.body.classList.add("ui-fs-landscape");
    return;
  }

  document.body.classList.add(isLandscape ? "ui-landscape" : "ui-portrait");
}

export function initFullscreen(dom, rerender){
  dom.fullscreenBtn.addEventListener("click", ()=>{
    if(isFullscreen()) exitFullscreen();
    else requestFullscreen();
  });

  const update = ()=>{
    const fs = isFullscreen();

    // ✅ UI 모드 결정 (세로/가로/전체화면가로)
    setUiMode();

    // ✅ fullscreen 상태 플래그(기존 로직 호환)
    document.body.classList.toggle("is-fullscreen", fs);

    // ✅ 기존 “세로 전체화면 강제가로”는 이제 사용하지 않음(겹침 원인)
    // 필요하면 오버레이 정책으로만 남길 수 있지만, 우선 완전 OFF
    document.body.classList.remove("fs-force-landscape");

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

    // ✅ autoscale은 이제 “ui 모드 분리” 구조에서는 사실상 필요 없음
    // 그래도 남겨두면 일부 기기에서 도움이 될 수 있어 호출은 유지
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
