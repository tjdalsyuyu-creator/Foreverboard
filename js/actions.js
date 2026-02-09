// js/actions.js v1.6.5+ (Chombo button + auto chombo)
import { pushSnapshot, popSnapshot, resetWithEastSelection, dealerAdvance } from "./state.js";
import { render } from "./render.js";
import { saveApp } from "./storage.js";

import { openEditModal, openModal } from "./modals/modalBase.js";
import { openTsumoModal } from "./modals/tsumoModal.js";
import { openDrawModal } from "./modals/drawModal.js";
import { openMultiRonModal } from "./modals/multiRonModal.js";
import { openSettingsModal } from "./modals/settingsModal.js";
import { openSettlementModal } from "./modals/settlementModal.js";

import { applyChombo } from "./scoring.js";

export function bindActions(app, dom){
  const doRerender = ()=>{ saveApp(app); render(app, dom); };

  // ---- Chombo button ----
  if(dom.chomboBtn){
    dom.chomboBtn.addEventListener("click", ()=>{
      openChomboModal(app, dom, doRerender);
    });
  }

  // seat buttons delegation
  document.body.addEventListener("click",(e)=>{
    const btn = e.target.closest("button");
    if(!btn) return;
    const action = btn.dataset.action;
    if(!action) return;

    // game ended: allow only settings/settle/reset/chombo/undo (seat actions disabled by render)
    if(app.runtime.meta?.gameEnded) return;

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
      const p = app.runtime.players[seat];
      p.score -= 1000;
      app.runtime.roundState.riichiPot += 1000;

      // ✅ 자동 촌보: 공탁(-1000) 3회 누적
      p.potCount = (p.potCount || 0) + 1;
      if(p.potCount >= 3){
        // 자동촌보 실행: 국/본장/공탁 유지, 점수만 조정, 국 재실행
        applyChombo(app, seat);
        alert(`${p.name} 공탁 3회 누적으로 자동 촌보 처리되었습니다.`);
      }

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

  // center buttons
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

/* ✅ 촌보 모달 */
function openChomboModal(app, dom, onDone){
  const opts = app.runtime.players.map((p,i)=>`<option value="${i}">${p.name}</option>`).join("");
  openModal(dom, "촌보", `
    <p class="small">촌보 대상자를 선택하면, 나머지 3명에게 각 3000점 지급 후 “국 재실행”됩니다.<br/>
    (국/본장/공탁 유지)</p>
    <div class="field">
      <label>대상자</label>
      <select id="chomboSeat">${opts}</select>
    </div>
  `, ()=>{
    const seat = Number(document.getElementById("chomboSeat").value);
    if(Number.isNaN(seat)) return false;

    pushSnapshot(app);
    applyChombo(app, seat);
    onDone?.();
  });
}