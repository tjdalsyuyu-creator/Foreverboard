// js/modals/settingsModal.js v1.6.5 FULL (Accordion + 2x2 Preset Grid)
import { openModal } from "./modalBase.js";
import { pushSnapshot } from "../state.js";

export function openSettingsModal(app, dom, done) {
  const presetOptions = app.ruleSets
    .map(r => `<option value="${r.id}" ${r.id === app.ruleSet.id ? "selected" : ""}>${esc(r.name)}</option>`)
    .join("");

  const handsOptions = app.handsPlans
    .map(h => `<option value="${h.id}" ${h.id === app.runtime.roundState.handsPlanId ? "selected" : ""}>${esc(h.name)}</option>`)
    .join("");

  openModal(dom, "⚙️ 설정", `
    <div class="settings-accordion">

      <!-- 프리셋 -->
      <details class="acc" open>
        <summary class="acc-summary">프리셋</summary>
        <div class="acc-body">

          <div class="field">
            <label>선택</label>
            <select id="presetSel">${presetOptions}</select>
          </div>

          <div class="preset-grid">
            <button class="btn" id="presetLoadBtn" type="button">불러오기</button>
            <button class="btn" id="presetSaveBtn" type="button">저장(덮어쓰기)</button>
            <button class="btn" id="presetSaveAsBtn" type="button">다른 이름으로 저장</button>
            <button class="btn danger" id="presetDeleteBtn" type="button">삭제</button>
          </div>

          <p class="small" style="margin-top:10px;">
            ※ K 단위: 20 → 20000점 (오카/우마)
          </p>
        </div>
      </details>

      <!-- 국수 -->
      <details class="acc">
        <summary class="acc-summary">국수(Hands Plan)</summary>
        <div class="acc-body">
          <div class="field">
            <label>플랜</label>
            <select id="handsSel">${handsOptions}</select>
          </div>
          <p class="small">플랜 변경은 “다음 국 진행”부터 반영(현재 국 인덱스는 유지).</p>
        </div>
      </details>

      <!-- 점수 -->
      <details class="acc">
        <summary class="acc-summary">점수</summary>
        <div class="acc-body">
          <div class="field"><label>시작점수</label><input id="startScore" type="number" value="${num(app.ruleSet.startScore)}"/></div>
          <div class="field"><label>리턴점수</label><input id="returnScore" type="number" value="${num(app.ruleSet.returnScore)}"/></div>

          <hr/>

          <div class="field"><label>오카(+K)</label><input id="okaK" type="number" value="${num(app.ruleSet.okaK)}"/></div>

          <div class="row">
            <div class="field"><label>우마1</label><input id="u1" type="number" value="${num(app.ruleSet.umaK[0])}"/></div>
            <div class="field"><label>우마2</label><input id="u2" type="number" value="${num(app.ruleSet.umaK[1])}"/></div>
          </div>
          <div class="row">
            <div class="field"><label>우마3</label><input id="u3" type="number" value="${num(app.ruleSet.umaK[2])}"/></div>
            <div class="field"><label>우마4</label><input id="u4" type="number" value="${num(app.ruleSet.umaK[3])}"/></div>
          </div>

          <p class="small">
            최종정산: { (점수-리턴) + 오카 + 우마 } × 2
          </p>
        </div>
      </details>

      <!-- 옵션 -->
      <details class="acc">
        <summary class="acc-summary">옵션</summary>
        <div class="acc-body">
          <div class="field">
            <label>멀티론</label>
            <select id="multiRonEnabled">
              <option value="true" ${app.ruleSet.multiRon.enabled ? "selected" : ""}>ON (중복지급)</option>
              <option value="false" ${!app.ruleSet.multiRon.enabled ? "selected" : ""}>OFF</option>
            </select>
          </div>

          <div class="field">
            <label>공탁 유국시</label>
            <select id="potCarry">
              <option value="true" ${app.ruleSet.riichiPotCarryOnDraw ? "selected" : ""}>누적</option>
              <option value="false" ${!app.ruleSet.riichiPotCarryOnDraw ? "selected" : ""}>초기화</option>
            </select>
          </div>

          <div class="row">
            <div class="field">
              <label>연장(화료)</label>
              <select id="renWin">
                <option value="true" ${app.ruleSet.renchan.onWin ? "selected" : ""}>ON</option>
                <option value="false" ${!app.ruleSet.renchan.onWin ? "selected" : ""}>OFF</option>
              </select>
            </div>
            <div class="field">
              <label>연장(유국텐파이)</label>
              <select id="renTenpai">
                <option value="true" ${app.ruleSet.renchan.onTenpai ? "selected" : ""}>ON</option>
                <option value="false" ${!app.ruleSet.renchan.onTenpai ? "selected" : ""}>OFF</option>
              </select>
            </div>
          </div>
        </div>
      </details>

    </div>
  `, () => {
    pushSnapshot(app);
    applyFromUI(app);
    done?.();
    return true;
  });

  wirePresetButtons(app, dom, done);
}

/* ---------------- helpers ---------------- */
function num(v){ return (v ?? 0); }
function esc(s){
  return String(s).replace(/[&<>"']/g,(m)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function applyFromUI(app){
  const handsSel = document.getElementById("handsSel")?.value;
  if (handsSel && app.handsPlans.some(h => h.id === handsSel)){
    app.runtime.roundState.handsPlanId = handsSel;
    app.ruleSet.endCondition.handsPlanId = handsSel;
  }

  const startScore = Number(document.getElementById("startScore")?.value);
  const returnScore = Number(document.getElementById("returnScore")?.value);
  if (!Number.isNaN(startScore)) app.ruleSet.startScore = Math.max(0, Math.trunc(startScore));
  if (!Number.isNaN(returnScore)) app.ruleSet.returnScore = Math.max(0, Math.trunc(returnScore));

  const okaK = Number(document.getElementById("okaK")?.value);
  const u1 = Number(document.getElementById("u1")?.value);
  const u2 = Number(document.getElementById("u2")?.value);
  const u3 = Number(document.getElementById("u3")?.value);
  const u4 = Number(document.getElementById("u4")?.value);
  if (!Number.isNaN(okaK)) app.ruleSet.okaK = Math.trunc(okaK);
  app.ruleSet.umaK = [u1,u2,u3,u4].map(x => Number.isNaN(x) ? 0 : Math.trunc(x));

  const mre = document.getElementById("multiRonEnabled")?.value;
  app.ruleSet.multiRon.enabled = (mre === "true");

  const carry = document.getElementById("potCarry")?.value;
  app.ruleSet.riichiPotCarryOnDraw = (carry === "true");

  const renWin = document.getElementById("renWin")?.value;
  const renTen = document.getElementById("renTenpai")?.value;
  app.ruleSet.renchan.onWin = (renWin === "true");
  app.ruleSet.renchan.onTenpai = (renTen === "true");
}

/* ---------------- preset buttons ---------------- */
function wirePresetButtons(app, dom, done){
  const loadBtn = document.getElementById("presetLoadBtn");
  const saveBtn = document.getElementById("presetSaveBtn");
  const saveAsBtn = document.getElementById("presetSaveAsBtn");
  const delBtn = document.getElementById("presetDeleteBtn");

  loadBtn?.addEventListener("click", () => {
    const id = document.getElementById("presetSel").value;
    const found = app.ruleSets.find(r => r.id === id);
    if (!found) return;

    pushSnapshot(app);

    app.ruleSet = JSON.parse(JSON.stringify(found));
    app.activeRuleSetId = app.ruleSet.id;

    app.runtime.roundState.handsPlanId = app.ruleSet.endCondition.handsPlanId || app.runtime.roundState.handsPlanId;

    done?.();
    dom.modal.close("ok");
  });

  saveBtn?.addEventListener("click", () => {
    pushSnapshot(app);
    applyFromUI(app);

    const idx = app.ruleSets.findIndex(r => r.id === app.ruleSet.id);
    if (idx >= 0) app.ruleSets[idx] = JSON.parse(JSON.stringify(app.ruleSet));
    else app.ruleSets.unshift(JSON.parse(JSON.stringify(app.ruleSet)));

    app.activeRuleSetId = app.ruleSet.id;

    done?.();
    dom.modal.close("ok");
  });

  saveAsBtn?.addEventListener("click", () => {
    pushSnapshot(app);
    applyFromUI(app);

    openModal(dom, "프리셋 이름", `
      <div class="field"><label>이름</label><input id="newPresetName" value="${esc(app.ruleSet.name)}"/></div>
    `, () => {
      const name = (document.getElementById("newPresetName").value || "").trim();
      if (!name) return false;

      const copy = JSON.parse(JSON.stringify(app.ruleSet));
      copy.id = (crypto?.randomUUID?.() || ("preset-" + Math.random().toString(16).slice(2)));
      copy.name = name;

      app.ruleSets.unshift(copy);
      app.ruleSet = copy;
      app.activeRuleSetId = copy.id;

      done?.();
      return true;
    });
  });

  delBtn?.addEventListener("click", () => {
    const id = document.getElementById("presetSel").value;
    if (app.ruleSets.length <= 1) return alert("프리셋은 최소 1개는 남겨야 해.");

    openModal(dom, "프리셋 삭제", `<p class="small">정말 삭제할까요?</p>`, () => {
      pushSnapshot(app);

      app.ruleSets = app.ruleSets.filter(r => r.id !== id);
      if (!app.ruleSets.some(r => r.id === app.ruleSet.id)){
        app.ruleSet = app.ruleSets[0];
        app.activeRuleSetId = app.ruleSet.id;
      }

      done?.();
      return true;
    });
  });
}