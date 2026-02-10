// js/dom.js v1.6.8+ (add updateTopbarHeightVar)
export function getDom(){
  return {
    topbar: document.getElementById("topbar"),
    toggleTopbarBtn: document.getElementById("toggleTopbarBtn"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    chomboBtn: document.getElementById("chomboBtn"),
    tableRoot: document.getElementById("tableRoot"),

    seats: [...document.querySelectorAll(".seat")],
    roundLabel: document.getElementById("roundLabel"),
    honbaLabel: document.getElementById("honbaLabel"),
    riichiPotLabel: document.getElementById("riichiPotLabel"),

    dealerName: document.getElementById("dealerName"),
    nextDealerBtn: document.getElementById("nextDealerBtn"),

    // topbar buttons
    settingsBtn: document.getElementById("settingsBtn"),
    updatesBtn: document.getElementById("updatesBtn"),
    settleBtn: document.getElementById("settleBtn"),
    undoBtn: document.getElementById("undoBtn"),
    resetBtn: document.getElementById("resetBtn"),

    // center buttons
    drawBtn: document.getElementById("drawBtn"),
    addHonbaBtn: document.getElementById("addHonbaBtn"),
    subHonbaBtn: document.getElementById("subHonbaBtn"),
  };
}

// ✅ 실제 topbar 높이를 CSS 변수로 반영 (가로/전체화면 잘림 해결 핵심)
export function updateTopbarHeightVar(dom){
  const hidden = dom.topbar?.classList.contains("hidden");
  const h = (!dom.topbar || hidden) ? 0 : dom.topbar.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--topbarH", `${Math.round(h)}px`);
}
