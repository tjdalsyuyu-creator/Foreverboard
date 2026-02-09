// app.js v1.6.0
console.log("Mahjong Score Pointer app.js v1.6.0 LOADED");

const LS_UI_TOPBAR_HIDDEN = "mjp_ui_topbar_hidden_v1";

const players = [
  { name: "동", score: 25000, riichi: false },
  { name: "남", score: 25000, riichi: false },
  { name: "서", score: 25000, riichi: false },
  { name: "북", score: 25000, riichi: false },
];

const state = {
  handLabel: "E1",
  honba: 0,
  riichiPot: 0,
  dealerIndex: 0,
};

function $(id){ return document.getElementById(id); }

function applyTopbarHiddenFromStorage(){
  const hidden = localStorage.getItem(LS_UI_TOPBAR_HIDDEN) === "1";
  const topbar = $("topbar");
  const btn = $("toggleTopbarBtn");
  if (!topbar || !btn) return;

  if (hidden){
    topbar.classList.add("hidden");
    document.body.classList.add("topbar-hidden");
    btn.textContent = "상단바 표시";
  } else {
    topbar.classList.remove("hidden");
    document.body.classList.remove("topbar-hidden");
    btn.textContent = "상단바 숨김";
  }
}

function toggleTopbar(){
  const hidden = localStorage.getItem(LS_UI_TOPBAR_HIDDEN) === "1";
  localStorage.setItem(LS_UI_TOPBAR_HIDDEN, hidden ? "0" : "1");
  applyTopbarHiddenFromStorage();
  applyAutoScaleForMobileLandscape();
}

function fmt(n){ return Number(n).toLocaleString("ko-KR"); }

function renderStatus(){
  $("roundLabel").textContent = state.handLabel;
  $("honbaLabel").textContent = String(state.honba);
  $("riichiPotLabel").textContent = fmt(state.riichiPot);
  $("dealerName").textContent = players[state.dealerIndex].name;
}

function renderSeats(){
  document.querySelectorAll(".seat").forEach(seatEl=>{
    const i = Number(seatEl.dataset.seat);
    const p = players[i];
    const dealerBadge = (i===state.dealerIndex) ? `<span class="badge">친</span>` : "";
    const riichiBadge = p.riichi ? `<span class="badge riichi">리치✓</span>` : "";

    const riichiDisabled = p.riichi ? "disabled" : "";
    const riichiClass = p.riichi ? "riichi-done" : "";
    const riichiText = p.riichi ? "리치(완료)" : "리치(-1000)";

    seatEl.innerHTML = `
      <div class="player-head">
        <div class="player-name">${p.name}</div>
        <div style="display:flex; gap:6px; align-items:center;">${riichiBadge}${dealerBadge}</div>
      </div>
      <div class="score">${fmt(p.score)}</div>
      <div class="actions">
        <button class="btn small ${riichiClass}" data-action="riichi" data-seat="${i}" ${riichiDisabled}>${riichiText}</button>
        <button class="btn small" data-action="pot" data-seat="${i}">공탁(-1000)</button>
        <button class="btn small primary" data-action="dummy" data-seat="${i}">론(멀티)</button>
        <button class="btn small primary" data-action="dummy" data-seat="${i}">쯔모</button>
      </div>
    `;
  });
}

function render(){
  renderStatus();
  renderSeats();
  applyAutoScaleForMobileLandscape();
}

/* ✅ 자동 스케일: 기종 불문
   - 가로 + 터치 + 낮은 높이일 때만 autoScale을 계산해서 CSS 변수로 넣음 */
function applyAutoScaleForMobileLandscape(){
  const isCoarse = matchMedia("(pointer: coarse)").matches;
  const isLandscape = matchMedia("(orientation: landscape)").matches;
  if(!isCoarse || !isLandscape){
    document.documentElement.style.removeProperty("--autoScale");
    return;
  }

  const table = document.getElementById("tableRoot");
  if(!table) return;

  const topbar = document.getElementById("topbar");
  const topbarHidden = topbar?.classList.contains("hidden");
  const topH = (!topbarHidden && topbar) ? topbar.getBoundingClientRect().height : 0;

  const availableH = Math.max(220, window.innerHeight - topH - 8);

  // 스케일 1로 놓고 높이 측정
  document.documentElement.style.setProperty("--autoScale", "1");
  const rect = table.getBoundingClientRect();
  const tableH = Math.max(1, rect.height);

  let s = availableH / tableH;
  s = Math.max(0.62, Math.min(1, s));
  document.documentElement.style.setProperty("--autoScale", String(s));
}

/* Actions */
document.body.addEventListener("click",(e)=>{
  const b = e.target.closest("button");
  if(!b) return;
  const action = b.dataset.action;

  if(action === "riichi"){
    const seat = Number(b.dataset.seat);
    const p = players[seat];
    if(p.riichi) return;
    p.riichi = true;
    p.score -= 1000;
    state.riichiPot += 1000;
    render();
  }

  if(action === "pot"){
    const seat = Number(b.dataset.seat);
    players[seat].score -= 1000;
    state.riichiPot += 1000;
    render();
  }
});

$("toggleTopbarBtn").addEventListener("click", toggleTopbar);
$("nextDealerBtn").addEventListener("click", ()=>{
  state.dealerIndex = (state.dealerIndex + 1) % 4;
  render();
});

window.addEventListener("resize", applyAutoScaleForMobileLandscape);
window.addEventListener("orientationchange", applyAutoScaleForMobileLandscape);

/* init */
applyTopbarHiddenFromStorage();
render();