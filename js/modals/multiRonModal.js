// js/modals/multiRonModal.js v1.6.5+
import {
  pushSnapshot, clearRiichiFlags,
  dealerAdvance, handAdvance,
  orderByNearestFrom, pickNearestFrom
} from "../state.js";
import { openModal } from "./modalBase.js";
import { ronPay, validateTwoHanShibari, applyPaoIfNeeded, transfer, checkTobiAndEnd } from "../scoring.js";

export function openMultiRonModal(app, dom, seedWinner, onDone){
  const names = app.runtime.players.map(p=>p.name);

  const winnerChecks = [0,1,2,3].map(i=>`
    <div class="field" style="margin:6px 0;">
      <label>${names[i]}</label>
      <input type="checkbox" id="w${i}" ${i===seedWinner?"checked":""}/>
      <span class="small">승자</span>
    </div>
  `).join("");

  const perWinnerPanels = [0,1,2,3].map(i=>`
    <div class="card" id="panel_w${i}" style="display:none; margin-top:8px;">
      <div class="small"><b>${names[i]}</b> 부/판(개별)</div>
      <div class="row">
        <div class="field"><label>부</label><input id="fu_w${i}" type="number" value="" placeholder="(공통값)" min="20" step="5"/></div>
        <div class="field"><label>판</label><input id="han_w${i}" type="number" value="" placeholder="(공통값)" min="1" max="13"/></div>
      </div>
    </div>
  `).join("");

  const loserOptions = [0,1,2,3].map(i=>`<option value="${i}">${names[i]}</option>`).join("");

  openModal(dom, "론(멀티) - 지불 미리보기", `
    <div class="grid2">
      <div class="card">
        <div class="small"><b>승자 선택</b>(복수)</div>
        ${winnerChecks}
        <hr/>
        <div class="small">승자별 부/판(체크된 승자만 표시)</div>
        ${perWinnerPanels}
      </div>

      <div class="card">
        <div class="field"><label>방총자</label><select id="loser">${loserOptions}</select></div>

        <div class="row">
          <div class="field"><label>공통 부</label><input id="fu_common" type="number" value="30" min="20" step="5"/></div>
          <div class="field"><label>공통 판</label><input id="han_common" type="number" value="1" min="1" max="13"/></div>
        </div>

        <hr/>

        <div class="card">
          <div class="small"><b>파오(책임지불)</b> (옵션 ON일 때만 적용)</div>
          <div class="field">
            <label>책임자</label>
            <select id="paoSeat">
              <option value="">(없음)</option>
              ${names.map((n,i)=>`<option value="${i}">${n}</option>`).join("")}
            </select>
          </div>
          <p class="small">대삼원/대사희/사깡쯔 등 파오 상황일 때만 선택</p>
        </div>

        <hr/>
        <div class="card" style="background:#0f1730;">
          <div class="small"><b>미리보기</b></div>
          <div id="previewBox" class="small" style="margin-top:8px;"></div>
          <div id="previewTable" style="margin-top:8px;"></div>
        </div>

        <p class="small" style="margin-top:8px;">공탁은 방총자 기준 “가까운 승자” 전액</p>
      </div>
    </div>
  `, ()=>{
    const loser = Number(document.getElementById("loser").value);
    const fuCommon = Number(document.getElementById("fu_common").value);
    const hanCommon = Number(document.getElementById("han_common").value);

    const winners = [0,1,2,3].filter(i=>document.getElementById(`w${i}`).checked);
    if(winners.length===0) return false;
    if(winners.includes(loser)) return false;

    // 2판 묶기(공통 han 기준 최소 검증)
    const v = validateTwoHanShibari(app, hanCommon);
    if(!v.ok){ alert(v.message); return false; }

    pushSnapshot(app);

    const ordered = orderByNearestFrom(loser, winners);
    const honbaBonus = app.runtime.roundState.honba * app.ruleSet.honba.ronBonusPer;

    const paoRaw = document.getElementById("paoSeat")?.value;
    const paoSeat = paoRaw === "" ? null : Number(paoRaw);

    for(const w of ordered){
      const fuW = Number(document.getElementById(`fu_w${w}`)?.value);
      const hanW = Number(document.getElementById(`han_w${w}`)?.value);

      const fu = (Number.isFinite(fuW) && fuW>0) ? fuW : fuCommon;
      const han = (Number.isFinite(hanW) && hanW>0) ? hanW : hanCommon;

      // 2판 묶기 승자별도 검증
      const v2 = validateTwoHanShibari(app, han);
      if(!v2.ok){ alert(v2.message); return false; }

      const base = ronPay(app, w===app.runtime.roundState.dealerIndex, fu, han);
      const totalPay = base + honbaBonus;

      // 파오(론: 방총자 50 + 책임자 50)
      const paoPlan = applyPaoIfNeeded({ app, totalPay, loserSeat:loser, paoSeat, isTsumo:false });
      if(paoPlan){
        for(const part of paoPlan){
          transfer(app, part.from, w, part.toPay);
        }
      } else {
        transfer(app, loser, w, totalPay);
      }
    }

    // 공탁: 방총자 기준 가까운 승자 전액
    if(app.runtime.roundState.riichiPot>0){
      const recv = pickNearestFrom(loser, ordered);
      if(recv != null){
        app.runtime.players[recv].score += app.runtime.roundState.riichiPot;
        app.runtime.roundState.riichiPot = 0;
      }
    }

    // 진행
    const dealer = app.runtime.roundState.dealerIndex;
    if(ordered.includes(dealer)) app.runtime.roundState.honba += 1;
    else { app.runtime.roundState.honba=0; dealerAdvance(app); handAdvance(app); }

    clearRiichiFlags(app);

    // 토비 체크
    checkTobiAndEnd(app);

    onDone?.();
  });

  wirePreview(app);
}

function wirePreview(app){
  const getChecked=()=>[0,1,2,3].filter(i=>document.getElementById(`w${i}`)?.checked);

  const updatePanels=()=>{
    for(let i=0;i<4;i++){
      const checked=!!document.getElementById(`w${i}`)?.checked;
      const panel=document.getElementById(`panel_w${i}`);
      if(panel) panel.style.display = checked ? "block":"none";
    }
  };

  const renderPreview=()=>{
    const box=document.getElementById("previewBox");
    const table=document.getElementById("previewTable");
    if(!box || !table) return;

    const loser=Number(document.getElementById("loser")?.value);
    const fuCommon=Number(document.getElementById("fu_common")?.value);
    const hanCommon=Number(document.getElementById("han_common")?.value);
    const winners=getChecked();
    const ordered=(Number.isNaN(loser)||winners.length===0)?[]:orderByNearestFrom(loser,winners);

    if(ordered.length===0){
      box.innerHTML="승자를 체크하면 미리보기가 표시돼.";
      table.innerHTML="";
      return;
    }

    const honbaBonus=app.runtime.roundState.honba * app.ruleSet.honba.ronBonusPer;

    const lines=ordered.map(w=>{
      const base=ronPay(app, w===app.runtime.roundState.dealerIndex, fuCommon, hanCommon);
      const total=base+honbaBonus;
      return {winner:w, fu:fuCommon, han:hanCommon, base, honbaBonus, total};
    });

    const sum=lines.reduce((a,b)=>a+b.total,0);
    const pot=app.runtime.roundState.riichiPot;
    const potReceiver = (pot>0) ? pickNearestFrom(loser, ordered) : null;

    box.innerHTML=`방총자: <b>${app.runtime.players[loser].name}</b> · 본장: <b>${app.runtime.roundState.honba}</b><br/>공탁: <b>${pot}</b> → <b>${potReceiver==null?"-":app.runtime.players[potReceiver].name}</b> 전액`;

    const rows=lines.map(l=>`
      <tr>
        <td>${app.runtime.players[l.winner].name}</td>
        <td class="right">${l.fu}</td>
        <td class="right">${l.han}</td>
        <td class="right">${l.base.toLocaleString("ko-KR")}</td>
        <td class="right">${l.honbaBonus.toLocaleString("ko-KR")}</td>
        <td class="right"><b>${l.total.toLocaleString("ko-KR")}</b></td>
      </tr>
    `).join("");

    table.innerHTML=`
      <table>
        <thead><tr><th>승자</th><th class="right">부</th><th class="right">판</th><th class="right">론</th><th class="right">본장</th><th class="right">지불</th></tr></thead>
        <tbody>${rows}<tr><td colspan="5" class="right"><b>총 지불</b></td><td class="right"><b>${sum.toLocaleString("ko-KR")}</b></td></tr></tbody>
      </table>
    `;
  };

  const onToggle=()=>{ updatePanels(); renderPreview(); };

  for(let i=0;i<4;i++){
    const cb=document.getElementById(`w${i}`);
    if(cb) cb.addEventListener("change", onToggle);
  }
  document.getElementById("loser")?.addEventListener("change", renderPreview);
  document.getElementById("fu_common")?.addEventListener("input", renderPreview);
  document.getElementById("han_common")?.addEventListener("input", renderPreview);

  updatePanels();
  renderPreview();
}