// js/modals/drawModal.js v1.6.5
import { pushSnapshot, clearRiichiFlags, dealerAdvance, handAdvance } from "../state.js";
import { openModal } from "./modalBase.js";

export function openDrawModal(app, dom, onDone){
  const checks = app.runtime.players.map((p,i)=>`
    <div class="field">
      <label>${p.name}</label>
      <input type="checkbox" id="tp${i}"/><span class="small">텐파이</span>
    </div>
  `).join("");

  openModal(dom, "유국 (텐파이 정산)", `
    <p class="small">표준 3000 정산 · 유국이면 본장 +1</p>
    <div class="card">${checks}</div>
  `, ()=>{
    pushSnapshot(app);

    const tenpais = [0,1,2,3].filter(i=>document.getElementById(`tp${i}`).checked);
    if(tenpais.length>0 && tenpais.length<4){
      const notens=[0,1,2,3].filter(i=>!tenpais.includes(i));
      const recv=Math.floor(3000/tenpais.length);
      const pay=Math.floor(3000/notens.length);
      for(const n of notens) app.runtime.players[n].score -= pay;
      for(const t of tenpais) app.runtime.players[t].score += recv;
    }

    app.runtime.roundState.honba += 1;

    const dealer=app.runtime.roundState.dealerIndex;
    const dealerTenpai=tenpais.includes(dealer);
    if(!(dealerTenpai && app.ruleSet.renchan.onTenpai)){
      dealerAdvance(app);
      handAdvance(app);
    }

    if(!app.ruleSet.riichiPotCarryOnDraw) app.runtime.roundState.riichiPot = 0;

    clearRiichiFlags(app);
    onDone?.();
  });
}