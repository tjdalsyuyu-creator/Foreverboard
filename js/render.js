// js/render.js v1.6.5+ (disable chombo when ended)
import { currentHandLabel } from "./state.js";
import { applyAutoScale } from "./autoscale.js";

export function render(app, dom){
  dom.roundLabel.textContent = currentHandLabel(app);
  dom.honbaLabel.textContent = String(app.runtime.roundState.honba);
  dom.riichiPotLabel.textContent = String(app.runtime.roundState.riichiPot);
  dom.dealerName.textContent = app.runtime.players[app.runtime.roundState.dealerIndex].name;

  const ended = !!app.runtime.meta?.gameEnded;
  if(ended){
    dom.roundLabel.textContent = `${currentHandLabel(app)} (종료)`;
  }

  // 촌보 버튼도 종료 시 비활성(원하면 유지 가능)
  if(dom.chomboBtn) dom.chomboBtn.disabled = ended;

  dom.seats.forEach(seatEl=>{
    const i = Number(seatEl.dataset.seat);
    const p = app.runtime.players[i];

    const dealerBadge = (i === app.runtime.roundState.dealerIndex) ? `<span class="badge">친</span>` : "";
    const riichiBadge = p.riichi ? `<span class="badge riichi">리치✓</span>` : "";

    const riichiDisabled = p.riichi || ended ? "disabled" : "";
    const riichiClass = p.riichi ? "riichi-done" : "";
    const riichiText = p.riichi ? "리치(완료)" : "리치(-1000)";

    const disabledAll = ended ? "disabled" : "";

    seatEl.innerHTML = `
      <div class="player-head">
        <div class="player-name">${p.name}</div>
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