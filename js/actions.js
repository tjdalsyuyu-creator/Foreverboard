// js/actions.js v1.6.5
import { pushSnapshot, popSnapshot, resetWithEastSelection, dealerAdvance } from "./state.js";
import { render } from "./render.js";
import { saveApp } from "./storage.js";

import { openEditModal } from "./modals/modalBase.js";
import { openTsumoModal } from "./modals/tsumoModal.js";
import { openDrawModal } from "./modals/drawModal.js";
import { openMultiRonModal } from "./modals/multiRonModal.js";
import { openSettingsModal } from "./modals/settingsModal.js";
import { openSettlementModal } from "./modals/settlementModal.js";

export function bindActions(app, dom){
  // seat buttons (delegation)
  document.body.addEventListener("click",(e)=>{
    const btn = e.target.closest("button");
    if(!btn) return;
    const action = btn.dataset.action;
    if(!action) return;

    const seat = Number(btn.dataset.seat);

    if(action === "riichi"){
      const p = app.runtime.players[seat];
      if(p.riichi) return;
      pushSnapshot(app);
      p.riichi = true;
      p.score -= 1000;
      app.runtime.roundState.riichiPot += 1000;
      saveApp(app); render(app, dom);
      return;
    }

    if(action === "pot"){
      pushSnapshot(app);
      app.runtime.players[seat].score -= 1000;
      app.runtime.roundState.riichiPot += 1000;
      saveApp(app); render(app, dom);
      return;
    }

    if(action === "edit"){
      openEditModal(app, dom, seat, ()=>{
        saveApp(app); render(app, dom);
      });
      return;
    }

    if(action === "tsumo"){
      openTsumoModal(app, dom, seat, ()=>{
        saveApp(app); render(app, dom);
      });
      return;
    }

    if(action === "ron"){
      openMultiRonModal(app, dom, seat, ()=>{
        saveApp(app); render(app, dom);
      });
      return;
    }
  });

  // center buttons
  dom.undoBtn.addEventListener("click", ()=>{
    const ok = popSnapshot(app);
    if(!ok) return;
    saveApp(app); render(app, dom);
  });

  dom.resetBtn.addEventListener("click", ()=>{
    openResetEastModal(app, dom, ()=>{
      saveApp(app); render(app, dom);
    });
  });

  dom.nextDealerBtn.addEventListener("click", ()=>{
    pushSnapshot(app);
    dealerAdvance(app);
    saveApp(app); render(app, dom);
  });

  dom.addHonbaBtn.addEventListener("click", ()=>{
    pushSnapshot(app);
    app.runtime.roundState.honba += 1;
    saveApp(app); render(app, dom);
  });

  dom.subHonbaBtn.addEventListener("click", ()=>{
    pushSnapshot(app);
    app.runtime.roundState.honba = Math.max(0, app.runtime.roundState.honba - 1);
    saveApp(app); render(app, dom);
  });

  dom.drawBtn.addEventListener("click", ()=>{
    openDrawModal(app, dom, ()=>{
      saveApp(app); render(app, dom);
    });
  });

  dom.settingsBtn.addEventListener("click", ()=>{
    openSettingsModal(app, dom, ()=>{
      saveApp(app); render(app, dom);
    });
  });

  dom.settleBtn.addEventListener("click", ()=>{
    openSettlementModal(app, dom);
  });
}

function openResetEastModal(app, dom, onDone){
  const opts = app.runtime.players.map((p,i)=>`<option value="${i}">${p.name} (현재 ${i})</option>`).join("");
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