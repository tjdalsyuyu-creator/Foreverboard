// js/fullscreen.js v1.6.5 (debug-first)
import { dbg } from "./debug.js";
import { LS } from "./constants.js";
import { setTopbarHiddenValue } from "./topbar.js";
import { applyAutoScale } from "./autoscale.js";

function isFullscreen(){
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
async function requestFullscreen(){
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if(!fn) throw new Error("Fullscreen API 미지원");
  const ret = fn.call(el);
  if(ret?.then) await ret;
}
async function exitFullscreen(){
  const fn = document.exitFullscreen || document.webkitExitFullscreen;
  if(!fn) return;
  const ret = fn.call(document);
  if(ret?.then) await ret;
}
function isPortrait(){
  return matchMedia("(orientation: portrait)").matches;
}

export function initFullscreen(dom, rerender){
  const btn = dom.fullscreenBtn;
  if(!btn){
    dbg("❌ fullscreenBtn not found");
    return;
  }

  dbg("✅ fullscreenBtn found, binding click");

  btn.addEventListener("click", async (e)=>{
    dbg("👉 fullscreenBtn CLICKED");          // ✅ 이게 안 뜨면 클릭이 안 들어오는 것

    e.stopPropagation();
    e.preventDefault?.();

    try{
      if(isFullscreen()){
        dbg("↩ exiting fullscreen...");
        await exitFullscreen();
      }else{
        dbg("↪ requesting fullscreen...");
        await requestFullscreen();
      }
    }catch(err){
      dbg(`❌ fullscreen failed: ${err?.message || err}`);
      alert(`전체화면 실패: ${err?.message || err}`);
    }
  }, { capture:true });

  const sync = ()=>{
    const fs = isFullscreen();
    document.body.classList.toggle("fs-force-landscape", fs && isPortrait());

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

    btn.textContent = fs ? "⛶ 전체화면 해제" : "⛶ 전체화면";
    applyAutoScale(dom);
    rerender?.();
  };

  ["fullscreenchange","webkitfullscreenchange"].forEach(evt=>{
    document.addEventListener(evt, sync);
  });

  window.addEventListener("resize", sync);
  window.addEventListener("orientationchange", sync);

  sync();
}