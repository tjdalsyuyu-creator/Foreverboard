// js/modals/tsumoModal.js v1.6.5+ (reset potCount per hand)
import { pushSnapshot, clearRiichiFlags, dealerAdvance, handAdvance } from "../state.js";
import { openModal } from "./modalBase.js";
import {
  tsumoPays, validateTwoHanShibari, applyPaoIfNeeded, transfer,
  checkTobiAndEnd, resetPotCountsPerHand
} from "../scoring.js";

export function openTsumoModal(app, dom, winner, onDone){
  openModal(dom, "쯔모 (부/판)", `
    <div class="row">
      <div class="field"><label>부</label><input id="fu" type="number" value="30" min="20" step="5"/></div>
      <div class="field"><label>판</label><input id="han" type="number" value="1" min="1" max="13"/></div>
    </div>

    <hr/>

    <div class="card">
      <div class="small"><b>파오(책임지불)</b> (옵션 ON일 때만 적용)</div>
      <div class="field">
        <label>책임자</label>
        <select id="paoSeat">
          <option value="">(없음)</option>
          ${app.runtime.players.map((p,i)=>`<option value="${i}">${p.name}</option>`).join("")}
        </select>
      </div>
      <p class="small">대삼원/대사희/사깡쯔 등 파오 상황일 때만 선택</p>
    </div>
  `, ()=>{
    const fu = Number(document.getElementById("fu").value);
    const han = Number(document.getElementById("han").value);

    const v = validateTwoHanShibari(app, han);
    if(!v.ok){ alert(v.message); return false; }

    pushSnapshot(app);

    const rs = app.runtime.roundState;
    const pays = tsumoPays(app, winner, fu, han);

    const paoRaw = document.getElementById("paoSeat")?.value;
    const paoSeat = paoRaw === "" ? null : Number(paoRaw);

    const totalFromEach = () => {
      if(pays.type==="dealerTsumo") return pays.each * 3;
      return pays.dealerPay + pays.childPay + pays.childPay;
    };

    const totalPay = totalFromEach();
    const paoPlan = applyPaoIfNeeded({ app, totalPay, loserSeat:null, paoSeat, isTsumo:true });

    if(paoPlan){
      for(const part of paoPlan){
        transfer(app, part.from, winner, part.toPay);
      }
    } else {
      if(pays.type==="dealerTsumo"){
        for(let i=0;i<4;i++) if(i!==winner) transfer(app, i, winner, pays.each);
      } else {
        const dealer = rs.dealerIndex;
        for(let i=0;i<4;i++) if(i!==winner){
          const amt = (i===dealer) ? pays.dealerPay : pays.childPay;
          transfer(app, i, winner, amt);
        }
      }
    }

    if(app.runtime.roundState.riichiPot>0){
      app.runtime.players[winner].score += app.runtime.roundState.riichiPot;
      app.runtime.roundState.riichiPot = 0;
    }

    clearRiichiFlags(app);

    if(winner === rs.dealerIndex && app.ruleSet.renchan.onWin){
      app.runtime.roundState.honba += 1;
      // 국 유지(연장)도 "국 종료"이므로 potCount 리셋
      resetPotCountsPerHand(app);
    } else {
      app.runtime.roundState.honba = 0;
      dealerAdvance(app);
      handAdvance(app);
      resetPotCountsPerHand(app);
    }

    checkTobiAndEnd(app);
    onDone?.();
  });
}