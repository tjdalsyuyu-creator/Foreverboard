// js/modals/multiRonModal.js v1.6.5
import { pushSnapshot, clearRiichiFlags, dealerAdvance, handAdvance, orderByNearestFrom, pickNearestFrom } from "../state.js";
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
function calcRonPay(winnerIsDealer, fu, han){
  const b=basicPoints(fu,han);
  const mult = winnerIsDealer ? 6 : 4;
  return ceilTo100(b*mult);
}
function transfer(app, from, to, amt){
  app.runtime.players[from].score -= amt;
  app.runtime.players[to].score += amt;
}

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

    pushSnapshot(app);

    const ordered = orderByNearestFrom(loser, winners);
    const honbaBonus = app.runtime.roundState.honba * app.ruleSet.honba.ronBonusPer;

    // 중복지급: 방총자가 승자 수만큼 각각 지불
    for(const w of ordered){
      const fuW = Number(document.getElementById(`fu_w${w}`)?.value);
      const hanW = Number(document.getElementById(`han_w${w}`)?.value);

      const fu = Number.isFinite(fuW) && fuW>0 ? fuW : fuCommon;
      const han = Number.isFinite(hanW) && hanW>0 ? hanW : hanCommon;

      const basePay = calcRonPay(w===app.runtime.roundState.dealerIndex, fu, han);
      transfer(app, loser, w, basePay + honbaBonus);
    }

    // 공탁: 방총자 기준 가까운 승자 1명이 전액
    if(app.runtime.roundState.riichiPot>0){
      const nearest = pickNearestFrom(loser, ordered);
      if(nearest != null){
        app.runtime.players[nearest].score += app.runtime.roundState.riichiPot;
        app.runtime.roundState.riichiPot = 0;
      }
    }

    // 진행(친 승리면 연장)
    const dealer = app.runtime.roundState.dealerIndex;
    if(ordered.includes(dealer)) app.runtime.roundState.honba += 1;
    else { app.runtime.roundState.honba = 0; dealerAdvance(app); handAdvance(app); }

    clearRiichiFlags(app);
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

  const readPlan=()=>{
    const loser=Number(document.getElementById("loser")?.value);
    const fuCommon=Number(document.getElementById("fu_common")?.value);
    const hanCommon=Number(document.getElementById("han_common")?.value);
    const winners=getChecked();
    const ordered=(Number.isNaN(loser)||winners.length===0)?[]:orderByNearestFrom(loser,winners);
    const honbaBonus=app.runtime.roundState.honba * app.ruleSet.honba.ronBonusPer;
    const pot = app.runtime.roundState.riichiPot;
    const potReceiver=(pot>0 && ordered.length>0)?pickNearestFrom(loser,ordered):null;

    const lines=ordered.map(w=>{
      const fuW=Number(document.getElementById(`fu_w${w}`)?.value);
      const hanW=Number(document.getElementById(`han_w${w}`)?.value);
      const fu=(Number.isFinite(fuW)&&fuW>0)?fuW:fuCommon;
      const han=(Number.isFinite(hanW)&&hanW>0)?hanW:hanCommon;
      const basePay=calcRonPay(w===app.runtime.roundState.dealerIndex, fu, han);
      const totalPay=basePay+honbaBonus;
      return {winner:w, fu, han, basePay, honbaBonus, totalPay};
    });
    const sum=lines.reduce((a,b)=>a+b.totalPay,0);
    return {loser, pot, potReceiver, lines, sum, honbaBonus};
  };

  const renderPreview=()=>{
    const box=document.getElementById("previewBox");
    const table=document.getElementById("previewTable");
    if(!box || !table) return;

    const p=readPlan();
    if(p.lines.length===0){
      box.innerHTML="승자를 체크하면 미리보기가 표시돼.";
      table.innerHTML="";
      return;
    }

    const loserName = Number.isNaN(p.loser) ? "-" : app.runtime.players[p.loser].name;
    const potReceiverName = (p.potReceiver==null) ? "-" : app.runtime.players[p.potReceiver].name;

    box.innerHTML = `방총자: <b>${loserName}</b> · 본장: <b>${app.runtime.roundState.honba}</b><br/>공탁: <b>${p.pot}</b> → <b>${potReceiverName}</b> 전액`;

    const rows=p.lines.map(l=>`
      <tr>
        <td>${app.runtime.players[l.winner].name}</td>
        <td class="right">${l.fu}</td>
        <td class="right">${l.han}</td>
        <td class="right">${l.basePay.toLocaleString("ko-KR")}</td>
        <td class="right">${l.honbaBonus.toLocaleString("ko-KR")}</td>
        <td class="right"><b>${l.totalPay.toLocaleString("ko-KR")}</b></td>
      </tr>
    `).join("");

    table.innerHTML=`
      <table>
        <thead><tr><th>승자</th><th class="right">부</th><th class="right">판</th><th class="right">론</th><th class="right">본장</th><th class="right">지불</th></tr></thead>
        <tbody>
          ${rows}
          <tr><td colspan="5" class="right"><b>총 지불</b></td><td class="right"><b>${p.sum.toLocaleString("ko-KR")}</b></td></tr>
        </tbody>
      </table>
    `;
  };

  const onToggle=()=>{ updatePanels(); renderPreview(); };

  for(let i=0;i<4;i++){
    const cb=document.getElementById(`w${i}`);
    if(cb) cb.addEventListener("change", onToggle);

    const fu=document.getElementById(`fu_w${i}`);
    const han=document.getElementById(`han_w${i}`);
    if(fu) fu.addEventListener("input", renderPreview);
    if(han) han.addEventListener("input", renderPreview);
  }

  const fuCommonEl=document.getElementById("fu_common");
  const hanCommonEl=document.getElementById("han_common");
  if(fuCommonEl) fuCommonEl.addEventListener("input", renderPreview);
  if(hanCommonEl) hanCommonEl.addEventListener("input", renderPreview);

  const loserSel=document.getElementById("loser");
  if(loserSel) loserSel.addEventListener("change", renderPreview);

  updatePanels();
  renderPreview();
}

function openSettingsModal(){
  // (ESM 버전처럼 분리 없이 통짜에서도 동작할 수 있게 최소 구현)
  // 필요하면 ESM 분할본을 쓰는 걸 권장.
  openModal("⚙️ 설정", `<p class="small">ES module 분할본을 사용하면 설정/프리셋도 동일하게 동작합니다.</p>`, ()=>true);
}

function openSettlementModal(){
  openModal("📊 최종정산", `<p class="small">ES module 분할본을 사용하면 정산(×2/토글/타이브레이크)도 동일하게 동작합니다.</p>`, ()=>true);
}

/* =========================
   Fullscreen logic
========================= */
function isFullscreen(){
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}
function requestFullscreen(){
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if(fn) fn.call(el);
}
function exitFullscreen(){
  const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
  if(fn) fn.call(document);
}
function toggleFullscreen(){
  if(isFullscreen()) exitFullscreen();
  else requestFullscreen();
}
function updateFullscreenButton(){
  if(!els.fullscreenBtn) return;
  els.fullscreenBtn.textContent = isFullscreen() ? "⛶ 전체화면 해제" : "⛶ 전체화면";
}
function isPortrait(){ return matchMedia("(orientation: portrait)").matches; }

function updateFsAndForceLandscapeState(){
  const fs=isFullscreen();
  const portrait=isPortrait();

  document.body.classList.toggle("fs-force-landscape", fs && portrait);

  if(fs){
    if(localStorage.getItem(LS_AUTO_HIDE_TOPBAR_IN_FS)==null){
      const prev = localStorage.getItem(LS_UI_TOPBAR_HIDDEN)==="1" ? "1":"0";
      localStorage.setItem(LS_AUTO_HIDE_TOPBAR_IN_FS, prev);
    }
    setTopbarHiddenValue(true);
  } else {
    const prev = localStorage.getItem(LS_AUTO_HIDE_TOPBAR_IN_FS);
    if(prev==="0"||prev==="1") setTopbarHiddenValue(prev==="1");
    localStorage.removeItem(LS_AUTO_HIDE_TOPBAR_IN_FS);
  }

  updateFullscreenButton();
  applyAutoScaleForMobileLandscape();
}

/* =========================
   Event bindings
========================= */
document.body.addEventListener("click",(e)=>{
  const btn=e.target.closest("button");
  if(!btn) return;
  const action=btn.dataset.action;
  if(!action) return;

  const seat=Number(btn.dataset.seat);

  if(action==="riichi"){
    const p=runtime.players[seat];
    if(p.riichi) return;
    saveSnapshot();
    p.riichi=true;
    p.score -= 1000;
    runtime.roundState.riichiPot += 1000;
    persistAll(); render();
    return;
  }

  if(action==="pot"){
    saveSnapshot();
    runtime.players[seat].score -= 1000;
    runtime.roundState.riichiPot += 1000;
    persistAll(); render();
    return;
  }

  if(action==="edit"){
    openModal("이름/점수 수정",`
      <div class="field"><label>이름</label><input id="name" value="${escapeHtml(runtime.players[seat].name)}"/></div>
      <div class="field"><label>점수</label><input id="score" type="number" value="${runtime.players[seat].score}"/></div>
    `,()=>{
      saveSnapshot();
      const name=(document.getElementById("name").value||"").trim() || runtime.players[seat].name;
      const score=Number(document.getElementById("score").value);
      runtime.players[seat].name=name;
      if(!Number.isNaN(score)) runtime.players[seat].score=score;
      persistAll(); render();
    });
    return;
  }

  if(action==="ron"){ openMultiRonModal(seat); return; }
  if(action==="tsumo"){ openTsumoModal(seat); return; }
});

if(els.toggleTopbarBtn) els.toggleTopbarBtn.addEventListener("click", toggleTopbar);
if(els.fullscreenBtn) els.fullscreenBtn.addEventListener("click", toggleFullscreen);

if(els.undoBtn) els.undoBtn.addEventListener("click", undo);

if(els.resetBtn) els.resetBtn.addEventListener("click", ()=>{
  const opts=runtime.players.map((p,i)=>`<option value="${i}">${escapeHtml(p.name)} (현재 ${i})</option>`).join("");
  openModal("리셋 (동 위치 선택)",`
    <div class="field"><label>동(East)</label><select id="eastPick">${opts}</select></div>
  `,()=>{
    const idx=Number(document.getElementById("eastPick").value);
    if(Number.isNaN(idx)||idx<0||idx>3) return false;
    saveSnapshot();
    resetWithEastSelection(idx);
    persistAll(); render();
  });
});

if(els.nextDealerBtn) els.nextDealerBtn.addEventListener("click", ()=>{
  saveSnapshot();
  dealerAdvance();
  persistAll(); render();
});

if(els.addHonbaBtn) els.addHonbaBtn.addEventListener("click", ()=>{
  saveSnapshot();
  runtime.roundState.honba += 1;
  persistAll(); render();
});

if(els.subHonbaBtn) els.subHonbaBtn.addEventListener("click", ()=>{
  saveSnapshot();
  runtime.roundState.honba = Math.max(0, runtime.roundState.honba-1);
  persistAll(); render();
});

if(els.drawBtn) els.drawBtn.addEventListener("click", ()=>openDrawModal());
// settings/settle는 통짜 축약(ESM 분할본 권장)
if(els.settingsBtn) els.settingsBtn.addEventListener("click", ()=>openSettingsModal());
if(els.settleBtn) els.settleBtn.addEventListener("click", ()=>openSettlementModal());

["fullscreenchange","webkitfullscreenchange","msfullscreenchange"]
  .forEach(evt => document.addEventListener(evt, updateFsAndForceLandscapeState));

window.addEventListener("resize", updateFsAndForceLandscapeState);
window.addEventListener("orientationchange", updateFsAndForceLandscapeState);

/* =========================
   Init
========================= */
applyTopbarHiddenFromStorage();
updateFullscreenButton();
render();
persistAll();
updateFsAndForceLandscapeState();