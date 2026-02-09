// js/fullscreen.js v1.6.5 FIX (robust Fullscreen)
import { LS } from "./constants.js";
import { setTopbarHiddenValue } from "./topbar.js";
import { applyAutoScale } from "./autoscale.js";

function isFullscreen(){
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

async function requestFullscreen(){
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!fn) throw new Error("이 브라우저는 Fullscreen API를 지원하지 않습니다.");
  // iOS/Safari 계열은 제약이 많음. Android Chrome/Samsung Internet은 보통 OK.
  const ret = fn.call(el);
  if (ret && typeof ret.then === "function") await ret;
}

async function exitFullscreen(){
  const fn = document.exitFullscreen || document.webkitExitFullscreen;
  if (!fn) return;
  const ret = fn.call(document);
  if (ret && typeof ret.then === "function") await ret;
}

function isPortrait(){
  return matchMedia("(orientation: portrait)").matches;
}

function updateBtn(dom){
  if(!dom.fullscreenBtn) return;
  dom.fullscreenBtn.textContent = isFullscreen() ? "⛶ 전체화면 해제" : "⛶ 전체화면";
}

export function initFullscreen(dom, rerender){
  if(!dom.fullscreenBtn){
    console.warn("[fullscreen] #fullscreenBtn not found");
    return;
  }

  // ✅ 클릭이 확실히 들어오게: 캡처 단계에서 처리 + stopPropagation
  dom.fullscreenBtn.addEventListener("click", async (e)=>{
    e.stopPropagation();
    // (버튼이 폼 안이 아니면 preventDefault는 필요 없지만 안전하게)
    e.preventDefault?.();

    try{
      if(isFullscreen()) await exitFullscreen();
      else await requestFullscreen();
    }catch(err){
      console.error("[fullscreen] request failed:", err);
      alert(`전체화면을 시작할 수 없어요.\n\n원인: ${err?.message || err}`);
    }
  }, { capture:true });

  const sync = ()=>{
    const fs = isFullscreen();
    document.body.classList.toggle("fs-force-landscape", fs && isPortrait());

    // 전체화면이면 상단바 자동 숨김(기존 상태 저장/복원)
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

    updateBtn(dom);
    applyAutoScale(dom);
    rerender?.();
  };

  // Fullscreen state change events
  ["fullscreenchange","webkitfullscreenchange"].forEach(evt=>{
    document.addEventListener(evt, sync);
  });

  window.addEventListener("resize", sync);
  window.addEventListener("orientationchange", sync);

  sync();
}