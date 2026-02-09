import {
  pushSnapshot, clearRiichiFlags,
  dealerAdvance, handAdvance,
  orderByNearestFrom, pickNearestFrom
} from "../state.js";
import { openModal } from "./modalBase.js";

function ceil100(x){ return Math.ceil(x/100)*100; }
function basePoints(fu,han){
  if(han>=13) return 8000;
  if(han>=11) return 6000;
  if(han>=8)  return 4000;
  if(han>=6)  return 3000;
  if(han>=5)  return 2000;
  const b = fu * Math.pow(2, 2+han);
  return Math.min(2000, b);
}
function ronPay(isDealer, fu, han){
  return ceil100(basePoints(fu,han) * (isDealer ? 6 : 4));
}

export function openMultiRonModal(app, dom, seedWinner, done){
  const names = app.runtime.players.map(p=>p.name);

  const winnersUI = [0,1,2,3].map(i=>`
    <label><input type="checkbox" id="w${i}" ${i===seedWinner?"checked":""}/> ${names[i]}</label>
  `).join("<br/>");

  openModal(dom,"론(멀티)",`
    <div class="grid2">
      <div class="card">
        <b>승자 선택</b><br/>${winnersUI}
      </div>
      <div class="card">
        <label>방총자
          <select id="loser">${names.map((n,i)=>`<option value="${i}">${n}</option>`).join("")}</select>
        </label>
        <hr/>
        <label>공통 부 <input id="fu" type="number" value="30"></label><br/>
        <label>공통 판 <input id="han" type="number" value="1"></label>
      </div>
    </div>
  `,()=>{
    const loser = Number(document.getElementById("loser").value);
    const winners = [0,1,2,3].filter(i=>document.getElementById(`w${i}`).checked);
    if(winners.length===0 || winners.includes(loser)) return false;

    pushSnapshot(app);

    const fu = Number(document.getElementById("fu").value);
    const han = Number(document.getElementById("han").value);
    const ordered = orderByNearestFrom(loser, winners);

    for(const w of ordered){
      const pay = ronPay(w===app.runtime.roundState.dealerIndex, fu, han);
      app.runtime.players[loser].score -= pay;
      app.runtime.players[w].score += pay;
    }

    // 공탁
    if(app.runtime.roundState.riichiPot>0){
      const recv = pickNearestFrom(loser, ordered);
      app.runtime.players[recv].score += app.runtime.roundState.riichiPot;
      app.runtime.roundState.riichiPot = 0;
    }

    // 진행
    if(ordered.includes(app.runtime.roundState.dealerIndex)){
      app.runtime.roundState.honba++;
    } else {
      app.runtime.roundState.honba=0;
      dealerAdvance(app); handAdvance(app);
    }

    clearRiichiFlags(app);
    done();
  });
}