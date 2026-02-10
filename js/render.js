// js/render.js v1.6.8+ (seat wind mapping / set East position)
import { currentHandLabel } from "./state.js";
import { applyAutoScale } from "./autoscale.js";

const WINDS = ["동", "남", "서", "북"];

/**
 * 화면 좌석(data-seat): 0=top, 1=right, 2=bottom, 3=left
 * 반시계(CCW) 순서: top(0) -> left(3) -> bottom(2) -> right(1)
 */
const CCW_PHYSICAL_ORDER = [0, 3, 2, 1];

function buildPhysicalToPlayerMap(eastSeatPos){
  const start = CCW_PHYSICAL_ORDER.indexOf(eastSeatPos);
  const s = start >= 0 ? start : 0;

  // physicalSeatIndex(0..3) => playerIndex(0..3)
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

  // dealerIndex는 "플레이어 인덱스" 기준(0~3)
  dom.dealerName.textContent = app.runtime.players[app.runtime.roundState.dealerIndex].name;

  const ended = !!app.runtime.meta?.gameEnded;
  if(ended){
    dom.roundLabel.textContent = `${currentHandLabel(app)} (종료)`;
  }
  if(dom.chomboBtn) dom.chomboBtn.disabled = ended;

  const eastSeatPos = app.runtime.ui?.eastSeatPos ?? 0;
  const physicalToPlayer = buildPhysicalToPlayerMap(eastSeatPos);

  dom.seats.forEach(seatEl=>{
    const physicalSeat = Number(seatEl.dataset.seat);       // 0/1/2/3 (화면 위치)
    const playerIndex  = physicalToPlayer[physicalSeat];    // 0/1/2/3 (동/남/서/북)
    const p = app.runtime.players[playerIndex];

    const windLabel = WINDS[playerIndex];
    const dealerBadge = (playerIndex === app.runtime.roundState.dealerIndex) ? `<span class="badge">친</span>` : "";
    const riichiBadge = p.riichi ? `<span class="badge riichi">리치✓</span>` : "";

    const riichiDisabled = p.riichi || ended ? "disabled" : "";
    const riichiClass = p.riichi ? "riichi-done" : "";
    const riichiText = p.riichi ? "리치(완료)" : "리치(-1000)";
    const disabledAll = ended ? "disabled" : "";

    // 동(=player0)의 "화면 위치"를 바꾸는 버튼
    const setEastDisabled = (physicalSeat === eastSeatPos) ? "disabled" : "";
    const setEastText = (physicalSeat === eastSeatPos) ? "동(기준)" : "동 여기로";

    seatEl.innerHTML = `
      <div class="player-head">
        <div class="player-name"><b>${windLabel}</b> <span style="opacity:.85">${p.name}</span></div>
        <div style="display:flex; gap:6px; align-items:center;">
          ${riichiBadge}${dealerBadge}
          <button class="btn small" data-action="set-eastpos" data-seatpos="${physicalSeat}" ${setEastDisabled}>${setEastText}</button>
        </div>
      </div>

      <div class="score">${p.score.toLocaleString("ko-KR")}</div>

      <div class="actions">
        <button class="btn small ${riichiClass}" data-action="riichi" data-seat="${playerIndex}" ${riichiDisabled}>${riichiText}</button>
        <button class="btn small" data-action="pot" data-seat="${playerIndex}" ${disabledAll}>공탁(-1000)</button>
        <button class="btn small primary" data-action="ron" data-seat="${playerIndex}" ${disabledAll}>론(멀티)</button>
        <button class="btn small primary" data-action="tsumo" data-seat="${playerIndex}" ${disabledAll}>쯔모</button>
        <button class="btn small" data-action="edit" data-seat="${playerIndex}" ${disabledAll}>이름/점수</button>
      </div>
    `;
  });

  applyAutoScale(dom);
}
