// js/modals/drawModal.js v1.6.5+ (유국만관 선택 버튼 추가)
import { pushSnapshot, clearRiichiFlags, dealerAdvance, handAdvance } from "../state.js";
import { openModal } from "./modalBase.js";
import { checkTobiAndEnd, applyNagashiMangan } from "../scoring.js";

export function openDrawModal(app, dom, onDone){
  const checks = app.runtime.players.map((p,i)=>`
    <div class="field">
      <label>${p.name}</label>
      <input type="checkbox" id="tp${i}"/><span class="small">텐파이</span>
    </div>
  `).join("");

  const nagashi = app.runtime.players.map((p,i)=>`
    <div class="field">
      <label>${p.name}</label>
      <input type="radio" name="nagashiWin" value="${i}"/>
      <span class="small">유국만관</span>
    </div>
  `).join("");

  openModal(dom, "유국 (텐파이 정산)", `
    <div class="card">
      <div class="small"><b>유국만관(선택)</b></div>
      <p class="small">유국만관을 적용하려면 승자 1명을 선택 후 확인.</p>
      ${nagashi}
    </div>

    <hr/>

    <div class="card">
      <div class="small"><b>텐파이 체크(일반 유국 정산)</b></div>
      <p class="small">표준 3000 정산 · 유국이면 본장 +1</p>
      ${checks}
    </div>
  `, ()=>{
    pushSnapshot(app);

    // ✅ 유국만관 우선 처리
    const sel = document.querySelector('input[name="nagashiWin"]:checked');
    if(sel){
      const winner = Number(sel.value);
      applyNagashiMangan(app, winner);

      // 유국만관도 “화료” 취급(본장/친 처리): 여기선 간단히 ‘화료’처럼 처리
      // 친이 유국만관이면 본장+1, 아니면 본장0 + 다음 국
      if(winner === app.runtime.roundState.dealerIndex){
        app.runtime.roundState.honba += 1;
      } else {
        app.runtime.roundState.honba = 0;
        dealerAdvance(app);
        handAdvance(app);
      }

      clearRiichiFlags(app);
      checkTobiAndEnd(app);
      onDone?.();
      return;
    }

    // ✅ 일반 유국(텐파이 정산)
    const tenpais=[0,1,2,3].filter(i=>document.getElementById(`tp${i}`).checked);
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

    if(!app.ruleSet.riichiPotCarryOnDraw) app.runtime.roundState.riichiPot=0;

    clearRiichiFlags(app);
    checkTobiAndEnd(app);

    onDone?.();
  });
}