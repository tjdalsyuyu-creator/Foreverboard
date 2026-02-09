// js/topbar.js v1.6.5
import { LS } from "./constants.js";

export function applyTopbarHiddenFromStorage(dom){
  const hidden = localStorage.getItem(LS.UI_TOPBAR_HIDDEN) === "1";
  if(!dom.topbar || !dom.toggleTopbarBtn) return;

  dom.topbar.classList.toggle("hidden", hidden);
  document.body.classList.toggle("topbar-hidden", hidden);
  dom.toggleTopbarBtn.textContent = hidden ? "상단바 표시" : "상단바 숨김";
}

export function setTopbarHiddenValue(dom, hidden){
  localStorage.setItem(LS.UI_TOPBAR_HIDDEN, hidden ? "1" : "0");
  applyTopbarHiddenFromStorage(dom);
}

export function toggleTopbar(dom, after){
  const hidden = localStorage.getItem(LS.UI_TOPBAR_HIDDEN) === "1";
  localStorage.setItem(LS.UI_TOPBAR_HIDDEN, hidden ? "0" : "1");
  applyTopbarHiddenFromStorage(dom);
  after?.();
}

export function initTopbar(dom, after){
  if(dom.toggleTopbarBtn){
    dom.toggleTopbarBtn.addEventListener("click", ()=>toggleTopbar(dom, after));
  }
  applyTopbarHiddenFromStorage(dom);
}