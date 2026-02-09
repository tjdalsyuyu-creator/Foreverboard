// js/dom.js v1.6.5
export function getDom(){
  return {
    topbar: document.getElementById("topbar"),
    toggleTopbarBtn: document.getElementById("toggleTopbarBtn"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    tableRoot: document.getElementById("tableRoot"),

    seats: [...document.querySelectorAll(".seat")],
    roundLabel: document.getElementById("roundLabel"),
    honbaLabel: document.getElementById("honbaLabel"),
    riichiPotLabel: document.getElementById("riichiPotLabel"),

    dealerName: document.getElementById("dealerName"),
    nextDealerBtn: document.getElementById("nextDealerBtn"),
    drawBtn: document.getElementById("drawBtn"),
    addHonbaBtn: document.getElementById("addHonbaBtn"),
    subHonbaBtn: document.getElementById("subHonbaBtn"),

    settingsBtn: document.getElementById("settingsBtn"),
    settleBtn: document.getElementById("settleBtn"),
    undoBtn: document.getElementById("undoBtn"),
    resetBtn: document.getElementById("resetBtn"),

    modal: document.getElementById("modal"),
    modalTitle: document.getElementById("modalTitle"),
    modalBody: document.getElementById("modalBody"),
    modalOk: document.getElementById("modalOk"),
  };
}