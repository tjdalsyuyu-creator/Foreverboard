// js/render.js v1.6.8+ (click seat to set East, CCW mapping)
import { currentHandLabel } from "./state.js";
import { applyAutoScale } from "./autoscale.js";

const WINDS = ["동", "남", "서", "북"];
const CCW_PHYSICAL_ORDER = [0, 3, 2, 1]; // top -> left -> bottom -> right

function buildPhysicalToPlayerMap(eastSeatPos){
  const start = CCW_PHYSICAL_ORDER.indexOf(eastSeatPos);
  const s = start >= 0 ? start : 0;

  const map = new Array(4);
  for(let k=0;k<4;k++){
    const physical = CCW_PHYSICAL_ORDER[(s + k) % 4]; // k=0(E),1(S),2(W),3(N)
    map[physical] = k;
  }
  return map;
}

export function render(app, dom){
  dom.roundLabel.textContent = currentHandLabel(app);
  dom.honbaLabel.textContent = String(app.runtime.roundState.honba);
  dom.riichiPotLabel.textContent = String(app.runtime.roundState.riichiPot);
  dom.dealerName.textContent = app.runtime.players[app.runtime.roundState.dealerIndex].name;

  const ended = !!app.runtime.meta?.gameEnded;
  if(dom.chomboBtn) dom.chomboBtn.disabled = ended;

  const eastSeatPos = app.runtime.ui?.eastSeatPos ?? 0;
  const physicalToPlayer = buildPhysicalToPlayerMap(eastSeatPos);

  dom.seats.forEach(seatEl=>{
    const physicalSeat = Number(seatEl.dataset.seat); // 0/1/2/3 (화면 위치)
    const i = physicalToPlayer[physicalSeat];         // 0/1/2/3 (동/남/서/북)
    const p = app.runtime.players[i];

    const windLabel = WINDS[i];
    const isEastHere = (physicalSeat === eastSeatPos);

    // ✅ 좌석 카드 클릭으로 “동” 지정
    seatEl.dataset.action = "set-eastpos";
    seatEl.dataset.seatpos = String(physicalSeat);
    seatEl.style.cursor = isEastHere ? "default" : "pointer";

    const dealerBadge = (i === app.runtime.roundState.dealerIndex) ? `<span class="badge">친</span>` : "";
    const riichiBadge = p.riichi ? `<span class="badge riichi">리치✓</span>` : "";

    const riichiDisabled = p.riichi || ended ? "disabled" : "";
    const riichiClass = p.riichi ? "riichi-done" : "";
    const riichiText = p.riichi ? "리치(완료)" : "리치(-1000)";
    const disabledAll = ended ? "disabled" : "";

    seatEl.innerHTML = `
      <div class="player-head">
        <div class="player-name">
          <b>${windLabel}</b> <span style="opacity:.85">${p.name}</span>
          ${isEastHere ? `<span style="opacity:.7; font-size:12px; margin-left:6px;">(기준)</span>` : ``}
        </div>
        <div style="display:flex; gap:6px; align-items:center;">${riichiBadge}${dealerBadge}</div>
      </div>

      <div class="score">${p.score.toLocaleString("ko-KR")}</div>

      <div class="actions">
        <button class="btn small ${riichiClass}" data-action="riichi" data-seat="${i}" ${riichiDisabled}>${riichiText}</button>
        <button class="btn small" data-action="pot" data-seat="${i}" ${disabledAll}>공탁(-1000)</button>
        <button class="btn small primary" data-action="ron" data-seat="${i}" ${disabledAll}>론(멀티)</button>
        <button class="btn small primary" data-action="tsumo" data-seat="${i}" ${disabledAll}>쯔모</button>
        <button class="btn small" data-action="edit" data-seat="${i}" ${disabledAll}>이름/점수</button>
      </div>
    `;
  });

  applyAutoScale(dom);
}
