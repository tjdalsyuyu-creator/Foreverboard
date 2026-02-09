import { pushSnapshot } from "../state.js";
import { openModal } from "./modalBase.js";

export function openSettingsModal(app, dom, done){
  openModal(dom,"설정",`
    <label>시작점수 <input id="start" value="${app.ruleSet.startScore}"></label><br/>
    <label>리턴점수 <input id="ret" value="${app.ruleSet.returnScore}"></label><br/>
    <label>오카(K) <input id="oka" value="${app.ruleSet.okaK}"></label>
  `,()=>{
    pushSnapshot(app);
    app.ruleSet.startScore = Number(document.getElementById("start").value);
    app.ruleSet.returnScore = Number(document.getElementById("ret").value);
    app.ruleSet.okaK = Number(document.getElementById("oka").value);
    done();
  });
}