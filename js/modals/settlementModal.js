import { openModal } from "./modalBase.js";

export function openSettlementModal(app, dom){
  const initDealer = app.runtime.meta.initialDealerIndex;
  const oka = app.ruleSet.okaK * 1000;
  const uma = app.ruleSet.umaK.map(v=>v*1000);

  const ranked = [0,1,2,3]
    .map(i=>({i, score:app.runtime.players[i].score}))
    .sort((a,b)=>{
      if(b.score!==a.score) return b.score-a.score;
      return (a.i-initDealer+4)%4 - (b.i-initDealer+4)%4;
    });

  openModal(dom,"최종정산",`
    <table>
      ${ranked.map((r,idx)=>{
        const base = r.score - app.ruleSet.returnScore;
        const final = (base + oka + uma[idx]) * 2;
        return `<tr><td>${app.runtime.players[r.i].name}</td><td>${final}</td></tr>`;
      }).join("")}
    </table>
  `,()=>true);
}