// js/render.js v1.6.5
import { currentHandLabel } from "./state.js";
import { applyAutoScale } from "./autoscale.js";

export function render(app, dom){
  dom.roundLabel.textContent = currentHandLabel(app);
  dom.honbaLabel.textContent = String(app.runtime.roundState.honba);
  dom.riichiPotLabel.textContent = String(app.runtime.roundState.riichiPot);
  dom.dealerName.textContent = app.runtime.players[app.runtime.roundState.dealerIndex].name;

  dom.seats.forEach(seatEl=>{
    const i = Number(seatEl.dataset.seat);
    const p = app.runtime.players[i];

    const dealerBadge = (i === app.runtime.roundState.dealerIndex) ? `<span class="badge">친</span>` : "";
    const riichiBadge = p.riichi ? `<span class="badge riichi">리치✓</span>` : "";

    const riichiDisabled = p.riichi ? "disabled" : "";
    const riichiClass = p.riichi ? "riichi-done" : "";
    const riichiText = p.riichi ? "리치(완료)" : "리치(-1000)";

    seatEl.innerHTML = `
      <div class="player-head">
        <div class="player-name">${p.name}</div>
        <div style="display:flex; gap:6px; align-items:center;">${riichiBadge}${dealerBadge}</div>
      </div>
      <div class="score">${p.score.toLocaleString("ko-KR")}</div>
      <div class="actions">
        <button class="btn small ${riichiClass}" data-action="riichi" data-seat="${i}" ${riichiDisabled}>${riichiText}</button>
        <button class="btn small" data-action="pot" data-seat="${i}">공탁(-1000)</button>
        <button class="btn small primary" data-action="ron" data-seat="${i}">론(멀티)</button>
        <button class="btn small primary" data-action="tsumo" data-seat="${i}">쯔모</button>
        <button class="btn small" data-action="edit" data-seat="${i}">이름/점수</button>
      </div>
    `;
  });

  applyAutoScale(dom);
}