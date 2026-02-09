// js/modals/tsumoModal.js v1.6.5
import { pushSnapshot, clearRiichiFlags, dealerAdvance, handAdvance } from "../state.js";
import { openModal } from "./modalBase.js";

function ceilTo100(x){ return Math.ceil(x/100)*100; }
function basicPoints(fu, han){
  if(han>=13) return 8000;
  if(han>=11) return 6000;
  if(han>=8) return 4000;
  if(han>=6) return 3000;
  if(han>=5) return 2000;
  const b = fu * Math.pow(2, 2+han);
  if(b>=2000) return 2000;
  return b;
}
function calcTsumoPays(app, winner, fu, han){
  const b=basicPoints(fu,han);
  const rs=app.runtime.roundState;
  const dealer=rs.dealerIndex;

  if(winner===dealer){
    const each=ceilTo100(b*2)+rs.honba*app.ruleSet.honba.tsumoBonusPerEach;
    return {type:"dealerTsumo", each};
  } else {
    const dealerPay=ceilTo100(b*2)+rs.honba*app.ruleSet.honba.tsumoBonusPerEach;
    const childPay=ceilTo100(b*1)+rs.honba*app.ruleSet.honba.tsumoBonusPerEach;
    return {type:"childTsumo", dealerPay, childPay};
  }
}
function transfer(app, from, to, amt){
  app.runtime.players[from].score -= amt;
  app.runtime.players[to].score += amt;
}

export function openTsumoModal(app, dom, winner, onDone){
  openModal(dom, "쯔모 (부/판)", `
    <div class="row">
      <div class="field"><label>부</label><input id="fu" type="number" value="30" min="20" step="5"/></div>
      <div class="field"><label>판</label><input id="han" type="number" value="1" min="1" max="13"/></div>
    </div>
    <p class="small">본장: 각자 +${app.ruleSet.honba.tsumoBonusPerEach}/본장 · 공탁: 승자 전액</p>
  `, ()=>{
    const fu = Number(document.getElementById("fu").value);
    const han = Number(document.getElementById("han").value);
    if(!fu || !han) return false;

    pushSnapshot(app);

    const pays = calcTsumoPays(app, winner, fu, han);
    if(pays.type==="dealerTsumo"){
      for(let i=0;i<4;i++) if(i!==winner) transfer(app,i,winner,pays.each);
    } else {
      const dealer=app.runtime.roundState.dealerIndex;
      for(let i=0;i<4;i++) if(i!==winner){
        transfer(app,i,winner,(i===dealer)?pays.dealerPay:pays.childPay);
      }
    }

    // 공탁 전액
    if(app.runtime.roundState.riichiPot>0){
      app.runtime.players[winner].score += app.runtime.roundState.riichiPot;
      app.runtime.roundState.riichiPot = 0;
    }

    // 진행
    clearRiichiFlags(app);
    if(winner === app.runtime.roundState.dealerIndex && app.ruleSet.renchan.onWin){
      app.runtime.roundState.honba += 1;
    } else {
      app.runtime.roundState.honba = 0;
      dealerAdvance(app);
      handAdvance(app);
    }

    onDone?.();
  });
}