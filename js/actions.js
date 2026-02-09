// js/actions.js v1.6.5+
import { pushSnapshot, popSnapshot, resetWithEastSelection, dealerAdvance } from "./state.js";
import { render } from "./render.js";
import { saveApp } from "./storage.js";

import { openEditModal } from "./modals/modalBase.js";
import { openTsumoModal } from "./modals/tsumoModal.js";
import { openDrawModal } from "./modals/drawModal.js";
import { openMultiRonModal } from "./modals/multiRonModal.js";
import { openSettingsModal } from "./modals/settingsModal.js";
import { openSettlementModal } from "./modals/settlementModal.js";

export function bindActions(app, dom, rerender){
  const doRerender = ()=>{ saveApp(app); render(app, dom); };

  document.body.addEventListener("click",(e)=>{
    const btn = e.target.closest("button");
    if(!btn) return;
    const action = btn.dataset.action;
    if(!action) return;

    // 게임 종료면 Reset/설정/정산만 허용(좌석 액션은 render에서 disabled 처리됨)
    if(app.runtime.meta?.gameEnded){
      return;
    }

    const seat = Number(btn.dataset.seat);

    if(action === "riichi"){
      const p = app.runtime.players[seat];
      if(p.riichi) return;
      pushSnapshot(app);
      p.riichi = true;
      p.score -= 1000;
      app.runtime.roundState.riichiPot += 1000;
      doRerender();
      return;
    }

    if(action === "pot"){
      pushSnapshot(app);
      app.runtime.players[seat].score -= 1000;
      app.runtime.roundState.riichiPot += 1000;
      doRerender();
      return;
    }

    if(action === "edit"){
      openEditModal(app, dom, seat, doRerender);
      return;
    }

    if(action === "tsumo"){
      openTsumoModal(app, dom, seat, doRerender);
      return;
    }

    if(action === "ron"){
      openMultiRonModal(app, dom, seat, doRerender);
      return;
    }
  });

  dom.undoBtn.addEventListener("click", ()=>{
    const ok = popSnapshot(app);
    if(!ok) return;
    doRerender();
  });

  dom.resetBtn.addEventListener("click", ()=>{
    openResetEastModal(app, dom, doRerender);
  });

  dom.nextDealerBtn.addEventListener("click", ()=>{
    if(app.runtime.meta?.gameEnded) return;
    pushSnapshot(app);
    dealerAdvance(app);
    doRerender();
  });

  dom.addHonbaBtn.addEventListener("click", ()=>{
    if(app.runtime.meta?.gameEnded) return;
    pushSnapshot(app);
    app.runtime.roundState.honba += 1;
    doRerender();
  });

  dom.subHonbaBtn.addEventListener("click", ()=>{
    if(app.runtime.meta?.gameEnded) return;
    pushSnapshot(app);
    app.runtime.roundState.honba = Math.max(0, app.runtime.roundState.honba - 1);
    doRerender();
  });

  dom.drawBtn.addEventListener("click", ()=>{
    if(app.runtime.meta?.gameEnded) return;
    openDrawModal(app, dom, doRerender);
  });

  dom.settingsBtn.addEventListener("click", ()=>{
    openSettingsModal(app, dom, doRerender);
  });

  dom.settleBtn.addEventListener("click", ()=>{
    openSettlementModal(app, dom);
  });
}

function openResetEastModal(app, dom, onDone){
  const opts = app.runtime.players.map((p,i)=>`<option value="${i}">${p.name} (현재 자리 ${i})</option>`).join("");
  openEditModal.raw(dom, "리셋 (동 위치 선택)", `
    <div class="field"><label>동(East)</label><select id="eastPick">${opts}</select></div>
  `, ()=>{
    const idx = Number(document.getElementById("eastPick").value);
    if(Number.isNaN(idx) || idx<0 || idx>3) return false;
    pushSnapshot(app);
    resetWithEastSelection(app, idx);
    onDone?.();
  });
}