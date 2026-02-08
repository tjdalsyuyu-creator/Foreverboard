// Mahjong Score Pointer v1.5 (custom rules - full integrated)
// ✅ Reset 시 동(East) 시작 위치 선택 -> 선택한 사람이 동(0)이 되도록 자리 재배치
// ✅ Multi Ron: Double/Triple ron 인정(중복지급)
// ✅ Multi Ron 공탁: 방총자 기준 가까운 승자(동→남→서→북) 1명이 전액 수령
// ✅ Multi Ron: 승자별 부/판 개별 입력 (체크된 승자만 표시) + 지불 미리보기(실시간)
// ✅ Final Settlement: ((score - returnScore) + oka + uma) * 2
// ✅ Settlement display toggle: points vs /1000
// ✅ Tie-break(공동순위): 처음 친(initial dealer) 기준 가까운 좌석 우선
//
// 용어 변경:
// - "혼바" -> "본장"
// - "딜러" -> "친"
// - 배지: "親" -> "친"

const LS_SCHEMA = "mjp_v15_schema";
const LS_RUNTIME = "mjp_v15_runtime";
const LS_RULESETS = "mjp_v15_rulesets";
const LS_ACTIVE_RULESET_ID = "mjp_v15_active_ruleset_id";
const LS_HANDS_PLANS = "mjp_v15_hands_plans";
const SCHEMA_VERSION = 1;

/* ===========================
   Defaults
=========================== */
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function defaultHandsPlans() {
  return [
    { id: "han-8", name: "반장전(8국) - E1~E4, S1~S4", sequence: ["E1","E2","E3","E4","S1","S2","S3","S4"] },
    { id: "han-24", name: "확장(24국) - E,S,W,N + E,S", sequence: [
      "E1","E2","E3","E4",
      "S1","S2","S3","S4",
      "W1","W2","W3","W4",
      "N1","N2","N3","N4",
      "E1","E2","E3","E4",
      "S1","S2","S3","S4",
    ] }
  ];
}

function ruleSetTemplate(name = "작혼룰") {
  return {
    id: uuid(),
    name,
    base: "custom",
    startScore: 25000,
    returnScore: 30000,

    // K units: 20 => 20000 points
    okaK: 20,
    umaK: [20, 10, -10, -20],

    riichiPotCarryOnDraw: true,
    honba: { ronBonusPer: 300, tsumoBonusPerEach: 100 }, // 내부 키는 honba(표시는 본장)

    multiRon: { enabled: true, policy: "double" },

    renchan: { onWin: true, onTenpai: true },
    endCondition: { type: "hands", handsPlanId: "han-8" }
  };
}

function defaultRuntime(ruleSet, handsPlans) {
  const hp = handsPlans.find(h => h.id === ruleSet.endCondition.handsPlanId) || handsPlans[0];
  return {
    players: [
      { name: "동", score: ruleSet.startScore },
      { name: "남", score: ruleSet.startScore },
      { name: "서", score: ruleSet.startScore },
      { name: "북", score: ruleSet.startScore },
    ],
    roundState: {
      handsPlanId: hp.id,
      handIndex: 0,
      dealerIndex: 0, // 친(親)
      honba: 0,       // 본장
      riichiPot: 0
    },
    meta: { initialDealerIndex: 0 }, // "처음 친" 기준
    history: []
  };
}

/* ===========================
   Storage helpers
=========================== */
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function ensureSchema() {
  const schema = readJson(LS_SCHEMA, null);
  if (!schema || schema.version !== SCHEMA_VERSION) {
    writeJson(LS_SCHEMA, { version: SCHEMA_VERSION, createdAt: Date.now() });
  }
}
function loadHandsPlans() {
  const plans = readJson(LS_HANDS_PLANS, null);
  if (Array.isArray(plans) && plans.length) return plans;
  const d = defaultHandsPlans();
  writeJson(LS_HANDS_PLANS, d);
  return d;
}
function loadRuleSets() {
  const sets = readJson(LS_RULESETS, null);
  if (Array.isArray(sets) && sets.length) return sets;
  const base = ruleSetTemplate("작혼룰");
  writeJson(LS_RULESETS, [base]);
  writeJson(LS_ACTIVE_RULESET_ID, base.id);
  return [base];
}
function saveRuleSets(ruleSets) { writeJson(LS_RULESETS, ruleSets); }
function loadActiveRuleSetId(ruleSets) {
  const id = localStorage.getItem(LS_ACTIVE_RULESET_ID);
  if (id && ruleSets.some(r => r.id === id)) return id;
  const fallback = ruleSets[0].id;
  localStorage.setItem(LS_ACTIVE_RULESET_ID, fallback);
  return fallback;
}
function setActiveRuleSetId(id) { localStorage.setItem(LS_ACTIVE_RULESET_ID, id); }
function stripHistory(rt) { const { history, ...rest } = rt; return rest; }

function migrateRuntime(rt, ruleSet, handsPlans) {
  if (!rt.meta) rt.meta = { initialDealerIndex: rt.roundState?.dealerIndex ?? 0 };
  if (typeof rt.meta.initialDealerIndex !== "number") rt.meta.initialDealerIndex = rt.roundState?.dealerIndex ?? 0;

  if (!rt.roundState) rt.roundState = {};
  if (!rt.roundState.handsPlanId) rt.roundState.handsPlanId = ruleSet.endCondition.handsPlanId || (handsPlans[0]?.id ?? "han-8");
  if (typeof rt.roundState.handIndex !== "number") rt.roundState.handIndex = 0;
  if (typeof rt.roundState.dealerIndex !== "number") rt.roundState.dealerIndex = 0;
  if (typeof rt.roundState.honba !== "number") rt.roundState.honba = 0;
  if (typeof rt.roundState.riichiPot !== "number") rt.roundState.riichiPot = 0;

  if (!Array.isArray(rt.players) || rt.players.length !== 4) return defaultRuntime(ruleSet, handsPlans);
  rt.players = rt.players.map((p, i) => ({
    name: (p && typeof p.name === "string" && p.name.trim()) ? p.name : ["동","남","서","북"][i],
    score: (p && typeof p.score === "number") ? p.score : ruleSet.startScore
  }));
  return rt;
}

function loadRuntime(ruleSet, handsPlans) {
  const rt = readJson(LS_RUNTIME, null);
  if (!rt || !rt.players || !rt.roundState) {
    const fresh = defaultRuntime(ruleSet, handsPlans);
    writeJson(LS_RUNTIME, stripHistory(fresh));
    return fresh;
  }
  return { ...migrateRuntime(rt, ruleSet, handsPlans), history: [] };
}
function saveRuntime(runtime) { writeJson(LS_RUNTIME, stripHistory(runtime)); }

/* ===========================
   App state
=========================== */
ensureSchema();
let handsPlans = loadHandsPlans();
let ruleSets = loadRuleSets();
let activeRuleSetId = loadActiveRuleSetId(ruleSets);
let ruleSet = ruleSets.find(r => r.id === activeRuleSetId) || ruleSets[0];
let runtime = loadRuntime(ruleSet, handsPlans);

/* ===========================
   UI elements
=========================== */
const els = {
  seats: [...document.querySelectorAll(".seat")],
  dealerName: document.getElementById("dealerName"),
  nextDealerBtn: document.getElementById("nextDealerBtn"),
  honbaLabel: document.getElementById("honbaLabel"),
  riichiPotLabel: document.getElementById("riichiPotLabel"),
  roundLabel: document.getElementById("roundLabel"),
  settingsBtn: document.getElementById("settingsBtn"),
  settleBtn: document.getElementById("settleBtn"),
  undoBtn: document.getElementById("undoBtn"),
  resetBtn: document.getElementById("resetBtn"),
  drawBtn: document.getElementById("drawBtn"),
  addHonbaBtn: document.getElementById("addHonbaBtn"),
  subHonbaBtn: document.getElementById("subHonbaBtn"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody"),
  modalOk: document.getElementById("modalOk"),
};

/* ===========================
   Utilities
=========================== */
function fmt(n) { return Number(n).toLocaleString("ko-KR"); }
const fmtK = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function clampInt(v, min, max) {
  const x = Number(v);
  if (Number.isNaN(x)) return min;
  const t = Math.trunc(x);
  return Math.max(min, Math.min(max, t));
}
function clampMaybeInt(v, min, max) {
  const x = Number(v);
  if (Number.isNaN(x)) return null;
  const t = Math.trunc(x);
  return Math.max(min, Math.min(max, t));
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function seatName(i) { return runtime.players[i].name; }
function isDealer(i) { return i === runtime.roundState.dealerIndex; } // 친

function currentHandsPlan() {
  const id = runtime.roundState.handsPlanId || ruleSet.endCondition.handsPlanId;
  return handsPlans.find(h => h.id === id) || handsPlans[0];
}
function currentHandLabel() {
  const hp = currentHandsPlan();
  const idx = runtime.roundState.handIndex || 0;
  return hp.sequence[idx] || hp.sequence[hp.sequence.length - 1] || "E1";
}

function saveSnapshot() {
  const snap = JSON.parse(JSON.stringify({
    ruleSet,
    runtime: stripHistory(runtime),
    handsPlans,
    activeRuleSetId
  }));
  runtime.history.push(snap);
  if (runtime.history.length > 50) runtime.history.shift();
}

function undo() {
  const snap = runtime.history.pop();
  if (!snap) return;

  handsPlans = snap.handsPlans;
  ruleSets = loadRuleSets();
  activeRuleSetId = snap.activeRuleSetId;
  ruleSet = snap.ruleSet;
  runtime = { ...migrateRuntime(snap.runtime, ruleSet, handsPlans), history: runtime.history };

  writeJson(LS_HANDS_PLANS, handsPlans);

  const idx = ruleSets.findIndex(r => r.id === ruleSet.id);
  if (idx >= 0) ruleSets[idx] = ruleSet;
  else ruleSets.unshift(ruleSet);
  saveRuleSets(ruleSets);
  setActiveRuleSetId(activeRuleSetId);

  saveRuntime(runtime);
  render();
}

function openModal(title, bodyHtml, onOk) {
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = bodyHtml;
  els.modalOk.onclick = (e) => {
    e.preventDefault();
    const ok = onOk?.();
    if (ok !== false) els.modal.close("ok");
  };
  els.modal.showModal();
}

function persistAll() {
  const idx = ruleSets.findIndex(r => r.id === ruleSet.id);
  if (idx >= 0) ruleSets[idx] = ruleSet;
  else ruleSets.unshift(ruleSet);
  saveRuleSets(ruleSets);
  setActiveRuleSetId(ruleSet.id);

  writeJson(LS_HANDS_PLANS, handsPlans);
  saveRuntime(runtime);
}

/* ===========================
   Seat priority (동→남→서→북) + rotate for East selection
=========================== */
function seatDistance(from, to) { return (to - from + 4) % 4; }
function orderByNearestFrom(fromSeat, seats) {
  return [...seats].sort((a, b) => seatDistance(fromSeat, a) - seatDistance(fromSeat, b));
}
function pickNearestFrom(fromSeat, seats) {
  const ordered = orderByNearestFrom(fromSeat, seats);
  const filtered = ordered.filter(x => x !== fromSeat);
  return filtered[0] ?? ordered[0] ?? null;
}
function rotateArray(arr, startIndex) {
  const n = arr.length;
  const s = ((startIndex % n) + n) % n;
  return arr.slice(s).concat(arr.slice(0, s));
}
function resetWithEastSelection(eastOldIndex) {
  runtime.players = rotateArray(runtime.players, eastOldIndex);
  for (const p of runtime.players) p.score = ruleSet.startScore;

  runtime.roundState.handIndex = 0;
  runtime.roundState.honba = 0;      // 본장
  runtime.roundState.riichiPot = 0;

  runtime.roundState.dealerIndex = 0;      // 친 = 동
  runtime.meta.initialDealerIndex = 0;     // 처음 친 기준

  runtime.roundState.handsPlanId = ruleSet.endCondition.handsPlanId || runtime.roundState.handsPlanId;
}

/* ===========================
   Scoring (Riichi)
=========================== */
function ceilTo100(x) { return Math.ceil(x / 100) * 100; }

function basicPoints(fu, han) {
  if (han >= 13) return 8000;
  if (han >= 11) return 6000;
  if (han >= 8) return 4000;
  if (han >= 6) return 3000;
  if (han >= 5) return 2000;
  const b = fu * Math.pow(2, 2 + han);
  if (b >= 2000) return 2000;
  return b;
}

function calcRonPay({ winnerIsDealer, fu, han }) {
  const b = basicPoints(fu, han);
  const mult = winnerIsDealer ? 6 : 4;
  return ceilTo100(b * mult);
}

function calcTsumoPays({ winner, fu, han }) {
  const b = basicPoints(fu, han);
  const rs = runtime.roundState;
  const dealer = rs.dealerIndex;

  if (winner === dealer) {
    const each = ceilTo100(b * 2) + rs.honba * ruleSet.honba.tsumoBonusPerEach;
    return { type: "dealerTsumo", each };
  } else {
    const dealerPay = ceilTo100(b * 2) + rs.honba * ruleSet.honba.tsumoBonusPerEach;
    const childPay = ceilTo100(b * 1) + rs.honba * ruleSet.honba.tsumoBonusPerEach;
    return { type: "childTsumo", dealerPay, childPay };
  }
}

function applyTransfer(from, to, amt) {
  runtime.players[from].score -= amt;
  runtime.players[to].score += amt;
}

/* ===========================
   Riichi pot policy
=========================== */
function awardRiichiPotNearestToLoser(loser, winners) {
  const pot = runtime.roundState.riichiPot;
  if (pot <= 0) return;
  if (!Array.isArray(winners) || winners.length === 0) return;

  const nearest = pickNearestFrom(loser, winners);
  if (nearest == null) return;

  runtime.players[nearest].score += pot;
  runtime.roundState.riichiPot = 0;
}

/* ===========================
   Round progression
=========================== */
function dealerAdvance() { runtime.roundState.dealerIndex = (runtime.roundState.dealerIndex + 1) % 4; } // 친 이동
function handAdvance() {
  runtime.roundState.handIndex += 1;
  const hp = currentHandsPlan();
  if (runtime.roundState.handIndex >= hp.sequence.length) runtime.roundState.handIndex = hp.sequence.length - 1;
}
function afterWin(winner) {
  if (isDealer(winner) && ruleSet.renchan.onWin) {
    runtime.roundState.honba += 1; // 본장 +1
  } else {
    runtime.roundState.honba = 0;
    dealerAdvance();
    handAdvance();
  }
}
function afterDraw(tenpais) {
  if (tenpais.length > 0 && tenpais.length < 4) {
    const notens = [0,1,2,3].filter(i => !tenpais.includes(i));
    const recv = Math.floor(3000 / tenpais.length);
    const pay = Math.floor(3000 / notens.length);
    for (const n of notens) runtime.players[n].score -= pay;
    for (const t of tenpais) runtime.players[t].score += recv;
  }

  runtime.roundState.honba += 1; // 유국이면 본장 +1

  const dealer = runtime.roundState.dealerIndex;
  const dealerTenpai = tenpais.includes(dealer);
  if (!(dealerTenpai && ruleSet.renchan.onTenpai)) {
    dealerAdvance();
    handAdvance();
  }

  if (!ruleSet.riichiPotCarryOnDraw) runtime.roundState.riichiPot = 0;
}

/* ===========================
   Render
=========================== */
function render() {
  els.honbaLabel.textContent = runtime.roundState.honba; // 본장 표시
  els.riichiPotLabel.textContent = runtime.roundState.riichiPot;
  els.roundLabel.textContent = currentHandLabel();
  els.dealerName.textContent = seatName(runtime.roundState.dealerIndex); // 친 표시

  els.seats.forEach((seatEl) => {
    const i = Number(seatEl.dataset.seat);
    const p = runtime.players[i];

    // ✅ 배지 한글화: 親 -> 친
    const dealerBadge = isDealer(i) ? `<span class="badge">친</span>` : "";

    seatEl.innerHTML = `
      <div class="player-head">
        <div class="player-name">${escapeHtml(p.name)}</div>
        <div>${dealerBadge}</div>
      </div>
      <div class="score">${fmt(p.score)}</div>
      <div class="actions">
        <button class="btn small" data-action="riichi" data-seat="${i}">리치(-1000)</button>
        <button class="btn small primary" data-action="ron" data-seat="${i}">론(멀티)</button>
        <button class="btn small primary" data-action="tsumo" data-seat="${i}">쯔모</button>
        <button class="btn small" data-action="edit" data-seat="${i}">이름/점수</button>
      </div>
    `;
  });
}

/* ===========================
   Global actions
=========================== */
document.body.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  if (!action) return;

  const seat = Number(btn.dataset.seat);

  if (action === "riichi") {
    saveSnapshot();
    runtime.players[seat].score -= 1000;
    runtime.roundState.riichiPot += 1000;
    persistAll(); render();
  }

  if (action === "edit") {
    openModal("이름/점수 수정", `
      <div class="field"><label>이름</label><input id="name" value="${escapeHtml(runtime.players[seat].name)}" /></div>
      <div class="field"><label>점수</label><input id="score" type="number" value="${runtime.players[seat].score}" /></div>
    `, () => {
      saveSnapshot();
      const name = (document.getElementById("name").value || "").trim() || runtime.players[seat].name;
      const score = Number(document.getElementById("score").value);
      runtime.players[seat].name = name;
      if (!Number.isNaN(score)) runtime.players[seat].score = score;
      persistAll(); render();
    });
  }

  if (action === "tsumo") openTsumoModal(seat);
  if (action === "ron") openMultiRonModal(seat);
});

els.undoBtn.addEventListener("click", () => undo());

els.resetBtn.addEventListener("click", () => {
  const opts = runtime.players.map((p, i) =>
    `<option value="${i}">${escapeHtml(p.name)} (현재 자리 ${i})</option>`
  ).join("");

  openModal("리셋 (동 위치 선택)", `
    <p class="small">
      리셋 후 “동(East)”이 될 사람을 선택해줘.<br/>
      선택한 사람은 동(0)으로 자리 재배치되고, 친도 동부터 시작해.
    </p>
    <div class="field">
      <label>동(East)</label>
      <select id="eastPick">${opts}</select>
    </div>
    <p class="small">※ 점수/국/본장/공탁은 초기화되고, 이름은 유지돼.</p>
  `, () => {
    const eastOldIndex = Number(document.getElementById("eastPick").value);
    if (Number.isNaN(eastOldIndex) || eastOldIndex < 0 || eastOldIndex > 3) return false;

    saveSnapshot();
    resetWithEastSelection(eastOldIndex);
    persistAll(); render();
  });
});

els.nextDealerBtn.addEventListener("click", () => {
  saveSnapshot();
  dealerAdvance();
  persistAll(); render();
});

els.addHonbaBtn.addEventListener("click", () => {
  saveSnapshot();
  runtime.roundState.honba += 1;
  persistAll(); render();
});

els.subHonbaBtn.addEventListener("click", () => {
  saveSnapshot();
  runtime.roundState.honba = Math.max(0, runtime.roundState.honba - 1);
  persistAll(); render();
});

els.drawBtn.addEventListener("click", () => openDrawModal());
els.settingsBtn.addEventListener("click", () => openSettingsModal());
els.settleBtn.addEventListener("click", () => openSettlementModal());

/* ===========================
   TSUMO modal
=========================== */
function openTsumoModal(winner) {
  openModal("쯔모 (부/판)", `
    <div class="row">
      <div class="field"><label>부</label><input id="fu" type="number" value="30" min="20" step="5"/></div>
      <div class="field"><label>판</label><input id="han" type="number" value="1" min="1" max="13"/></div>
    </div>
    <p class="small">본장: 각자 +${ruleSet.honba.tsumoBonusPerEach}/본장. 공탁: 승자 전액.</p>
  `, () => {
    const fu = clampInt(document.getElementById("fu").value, 20, 110);
    const han = clampInt(document.getElementById("han").value, 1, 13);

    saveSnapshot();

    const rs = runtime.roundState;
    const pays = calcTsumoPays({ winner, fu, han });

    if (pays.type === "dealerTsumo") {
      for (let i = 0; i < 4; i++) if (i !== winner) applyTransfer(i, winner, pays.each);
    } else {
      const dealer = rs.dealerIndex;
      for (let i = 0; i < 4; i++) if (i !== winner) {
        const amt = (i === dealer) ? pays.dealerPay : pays.childPay;
        applyTransfer(i, winner, amt);
      }
    }

    if (runtime.roundState.riichiPot > 0) {
      runtime.players[winner].score += runtime.roundState.riichiPot;
      runtime.roundState.riichiPot = 0;
    }

    afterWin(winner);
    persistAll(); render();
  });
}

/* ===========================
   MULTI RON modal (enhanced UI + preview)
=========================== */
function openMultiRonModal(seedWinner) {
  const names = runtime.players.map(p => p.name);

  const winnerChecks = [0,1,2,3].map(i => `
    <div class="field" style="margin:6px 0;">
      <label>${escapeHtml(names[i])}</label>
      <input type="checkbox" id="w${i}" ${i === seedWinner ? "checked" : ""}/>
      <span class="small">승자</span>
    </div>
  `).join("");

  const perWinnerPanels = [0,1,2,3].map(i => `
    <div class="card" id="panel_w${i}" style="display:none; margin-top:8px;">
      <div class="small"><b>${escapeHtml(names[i])}</b> 부/판 (개별)</div>
      <div class="row">
        <div class="field"><label>부</label><input id="fu_w${i}" type="number" value="" placeholder="(공통값 사용)" min="20" step="5"/></div>
        <div class="field"><label>판</label><input id="han_w${i}" type="number" value="" placeholder="(공통값 사용)" min="1" max="13"/></div>
      </div>
      <div class="field">
        <label>개별 고정</label>
        <select id="lock_w${i}">
          <option value="false" selected>OFF (공통 변경 시 자동 반영)</option>
          <option value="true">ON (이 승자만 개별 유지)</option>
        </select>
      </div>
      <p class="small">개별 입력이 비어있으면 공통 부/판이 적용돼.</p>
    </div>
  `).join("");

  const loserOptions = [0,1,2,3].map(i => `<option value="${i}">${escapeHtml(names[i])}</option>`).join("");

  openModal("론(멀티) - 지불 미리보기", `
    <div class="grid2">
      <div class="card">
        <div class="small"><b>승자 선택</b>(복수 가능)</div>
        ${winnerChecks}
        <hr/>
        <div class="small">승자별 부/판(체크된 승자만 표시)</div>
        ${perWinnerPanels}
      </div>

      <div class="card">
        <div class="field">
          <label>방총자</label>
          <select id="loser">${loserOptions}</select>
        </div>

        <div class="row">
          <div class="field"><label>공통 부</label><input id="fu_common" type="number" value="30" min="20" step="5"/></div>
          <div class="field"><label>공통 판</label><input id="han_common" type="number" value="1" min="1" max="13"/></div>
        </div>

        <div class="row">
          <button class="btn" id="copyCommonBtn" type="button">공통값을 체크된 승자에게 복사</button>
          <button class="btn" id="clearWinnerInputsBtn" type="button">승자 개별입력 비우기</button>
        </div>

        <hr/>

        <div class="card" style="background:#0f1730;">
          <div class="small"><b>지불 미리보기</b></div>
          <div id="previewBox" class="small" style="margin-top:8px;"></div>
          <div id="previewTable" style="margin-top:8px;"></div>
        </div>

        <hr/>
        <div class="small">
          - 중복지급: 방총자가 승자 수만큼 각각 지불<br/>
          - 본장(론): 각 승자에게 +${ruleSet.honba.ronBonusPer}/본장씩 중복 적용<br/>
          - “첫 승자”: 방총자 기준 가까운 승자(동→남→서→북)<br/>
          - 공탁: “첫 승자”가 전액 수령
        </div>
      </div>
    </div>
  `, () => {
    const loser = Number(document.getElementById("loser").value);
    const fuCommon = clampInt(document.getElementById("fu_common").value, 20, 110);
    const hanCommon = clampInt(document.getElementById("han_common").value, 1, 13);

    const winners = [0,1,2,3].filter(i => document.getElementById(`w${i}`).checked);
    if (winners.length === 0) return false;
    if (winners.includes(loser)) return false;

    saveSnapshot();

    const ordered = orderByNearestFrom(loser, winners);
    const honbaBonus = runtime.roundState.honba * ruleSet.honba.ronBonusPer;

    for (const w of ordered) {
      const fuW = clampMaybeInt(document.getElementById(`fu_w${w}`)?.value, 20, 110);
      const hanW = clampMaybeInt(document.getElementById(`han_w${w}`)?.value, 1, 13);

      const fu = (fuW == null) ? fuCommon : fuW;
      const han = (hanW == null) ? hanCommon : hanW;

      const basePay = calcRonPay({ winnerIsDealer: isDealer(w), fu, han });
      applyTransfer(loser, w, basePay + honbaBonus);
    }

    awardRiichiPotNearestToLoser(loser, ordered);

    const dealer = runtime.roundState.dealerIndex;
    if (ordered.includes(dealer)) runtime.roundState.honba += 1;
    else { runtime.roundState.honba = 0; dealerAdvance(); handAdvance(); }

    persistAll(); render();
  });

  wireMultiRonEnhancedUIWithPreview();
}

/* ===========================
   MultiRon modal wiring + preview
=========================== */
function wireMultiRonEnhancedUIWithPreview() {
  const getCheckedWinners = () => [0,1,2,3].filter(i => document.getElementById(`w${i}`)?.checked);

  const updatePanels = () => {
    for (let i = 0; i < 4; i++) {
      const checked = !!document.getElementById(`w${i}`)?.checked;
      const panel = document.getElementById(`panel_w${i}`);
      if (panel) panel.style.display = checked ? "block" : "none";
    }
  };

  const applyCommonToWinnerIfNotLocked = (i) => {
    const lockSel = document.getElementById(`lock_w${i}`);
    const locked = (lockSel?.value === "true");
    if (locked) return;

    const fuCommon = document.getElementById("fu_common")?.value;
    const hanCommon = document.getElementById("han_common")?.value;

    const fuInput = document.getElementById(`fu_w${i}`);
    const hanInput = document.getElementById(`han_w${i}`);

    if (fuInput && fuInput.value === "") fuInput.value = fuCommon ?? "";
    if (hanInput && hanInput.value === "") hanInput.value = hanCommon ?? "";
  };

  const readCurrentRonPlan = () => {
    const loser = Number(document.getElementById("loser")?.value);
    const fuCommon = clampInt(document.getElementById("fu_common")?.value, 20, 110);
    const hanCommon = clampInt(document.getElementById("han_common")?.value, 1, 13);
    const winners = getCheckedWinners();

    const ordered = (Number.isNaN(loser) || winners.length === 0) ? [] : orderByNearestFrom(loser, winners);
    const potReceiver = (runtime.roundState.riichiPot > 0 && ordered.length > 0) ? pickNearestFrom(loser, ordered) : null;

    const honbaBonus = runtime.roundState.honba * ruleSet.honba.ronBonusPer;

    const lines = ordered.map(w => {
      const fuW = clampMaybeInt(document.getElementById(`fu_w${w}`)?.value, 20, 110);
      const hanW = clampMaybeInt(document.getElementById(`han_w${w}`)?.value, 1, 13);
      const fu = (fuW == null) ? fuCommon : fuW;
      const han = (hanW == null) ? hanCommon : hanW;

      const basePay = calcRonPay({ winnerIsDealer: isDealer(w), fu, han });
      const totalPay = basePay + honbaBonus;

      return { winner: w, fu, han, basePay, honbaBonus, totalPay };
    });

    const sum = lines.reduce((acc, x) => acc + x.totalPay, 0);

    return { loser, winners, ordered, potReceiver, lines, sum, honbaBonus };
  };

  const renderPreview = () => {
    const box = document.getElementById("previewBox");
    const table = document.getElementById("previewTable");
    if (!box || !table) return;

    const plan = readCurrentRonPlan();
    const pot = runtime.roundState.riichiPot;

    if (plan.winners.length === 0) {
      box.innerHTML = `승자를 체크하면 미리보기가 표시돼.`;
      table.innerHTML = "";
      return;
    }

    const loserName = Number.isNaN(plan.loser) ? "-" : seatName(plan.loser);
    const potReceiverName = (plan.potReceiver == null) ? "-" : seatName(plan.potReceiver);

    box.innerHTML = `
      방총자: <b>${escapeHtml(loserName)}</b> · 본장: <b>${runtime.roundState.honba}</b>
      (론 보너스 ${fmt(plan.honbaBonus)}점/승자)<br/>
      공탁: <b>${fmt(pot)}</b>점 → (가까운 승자) <b>${escapeHtml(potReceiverName)}</b> 전액
    `;

    const rows = plan.lines.map(l => `
      <tr>
        <td>${escapeHtml(seatName(l.winner))}${isDealer(l.winner) ? ' <span class="badge">친</span>' : ''}</td>
        <td class="right">${l.fu}</td>
        <td class="right">${l.han}</td>
        <td class="right">${fmt(l.basePay)}</td>
        <td class="right">${fmt(l.honbaBonus)}</td>
        <td class="right"><b>${fmt(l.totalPay)}</b></td>
      </tr>
    `).join("");

    table.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>승자</th>
            <th class="right">부</th>
            <th class="right">판</th>
            <th class="right">론점수</th>
            <th class="right">본장</th>
            <th class="right">방총자 지불</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr>
            <td colspan="5" class="right"><b>방총자 총 지불</b></td>
            <td class="right"><b>${fmt(plan.sum)}</b></td>
          </tr>
        </tbody>
      </table>
    `;
  };

  const onWinnerToggle = () => {
    updatePanels();
    for (const i of getCheckedWinners()) applyCommonToWinnerIfNotLocked(i);
    renderPreview();
  };

  for (let i = 0; i < 4; i++) {
    const cb = document.getElementById(`w${i}`);
    if (cb) cb.addEventListener("change", onWinnerToggle);
  }

  const fuCommonEl = document.getElementById("fu_common");
  const hanCommonEl = document.getElementById("han_common");
  const onCommonChange = () => {
    for (const i of getCheckedWinners()) applyCommonToWinnerIfNotLocked(i);
    renderPreview();
  };
  if (fuCommonEl) fuCommonEl.addEventListener("input", onCommonChange);
  if (hanCommonEl) hanCommonEl.addEventListener("input", onCommonChange);

  const loserSel = document.getElementById("loser");
  if (loserSel) loserSel.addEventListener("change", renderPreview);

  for (let i = 0; i < 4; i++) {
    const fu = document.getElementById(`fu_w${i}`);
    const han = document.getElementById(`han_w${i}`);
    const lock = document.getElementById(`lock_w${i}`);
    if (fu) fu.addEventListener("input", renderPreview);
    if (han) han.addEventListener("input", renderPreview);
    if (lock) lock.addEventListener("change", renderPreview);
  }

  const copyBtn = document.getElementById("copyCommonBtn");
  if (copyBtn) copyBtn.onclick = () => {
    const fuCommon = document.getElementById("fu_common")?.value ?? "";
    const hanCommon = document.getElementById("han_common")?.value ?? "";
    for (const i of getCheckedWinners()) {
      const lockSel = document.getElementById(`lock_w${i}`);
      const locked = (lockSel?.value === "true");
      if (locked) continue;
      const fuInput = document.getElementById(`fu_w${i}`);
      const hanInput = document.getElementById(`han_w${i}`);
      if (fuInput) fuInput.value = fuCommon;
      if (hanInput) hanInput.value = hanCommon;
    }
    renderPreview();
  };

  const clearBtn = document.getElementById("clearWinnerInputsBtn");
  if (clearBtn) clearBtn.onclick = () => {
    for (const i of getCheckedWinners()) {
      const fuInput = document.getElementById(`fu_w${i}`);
      const hanInput = document.getElementById(`han_w${i}`);
      if (fuInput) fuInput.value = "";
      if (hanInput) hanInput.value = "";
    }
    renderPreview();
  };

  updatePanels();
  onWinnerToggle();
}

/* ===========================
   DRAW modal
=========================== */
function openDrawModal() {
  const checks = runtime.players.map((p, i) => `
    <div class="field">
      <label>${escapeHtml(p.name)}</label>
      <input type="checkbox" id="tp${i}" />
      <span class="small">텐파이</span>
    </div>
  `).join("");

  openModal("유국 (텐파이 정산)", `
    <p class="small">표준: 텐파이 인원끼리 3000점 정산. 유국이면 본장 +1. 친 텐파이면 연장(설정값).</p>
    <div class="card">${checks}</div>
  `, () => {
    const tenpais = [0,1,2,3].filter(i => document.getElementById(`tp${i}`).checked);
    saveSnapshot();
    afterDraw(tenpais);
    persistAll(); render();
  });
}

/* ===========================
   SETTINGS / Final Settlement
   (이하 동일: 본장/친 문구는 index.html에서 처리)
=========================== */
function openSettingsModal() {
  const presetOptions = ruleSets.map(r =>
    `<option value="${r.id}" ${r.id === ruleSet.id ? "selected" : ""}>${escapeHtml(r.name)}</option>`
  ).join("");

  const hpOptions = handsPlans.map(h =>
    `<option value="${h.id}" ${h.id === runtime.roundState.handsPlanId ? "selected" : ""}>${escapeHtml(h.name)}</option>`
  ).join("");

  openModal("⚙️ 설정 (룰 프리셋 / 국수 플랜)", `
    <div class="grid2">
      <div class="card">
        <div class="small">프리셋</div>
        <div class="field"><label>선택</label><select id="presetSel">${presetOptions}</select></div>
        <div class="row">
          <button class="btn" id="presetLoadBtn" type="button">불러오기</button>
          <button class="btn" id="presetSaveBtn" type="button">저장(덮어쓰기)</button>
        </div>
        <div class="row" style="margin-top:8px;">
          <button class="btn" id="presetSaveAsBtn" type="button">다른 이름으로 저장</button>
          <button class="btn danger" id="presetDeleteBtn" type="button">삭제</button>
        </div>
      </div>

      <div class="card">
        <div class="small">국수(Hands Plan)</div>
        <div class="field"><label>플랜</label><select id="handsSel">${hpOptions}</select></div>
      </div>
    </div>

    <hr/>

    <div class="grid2">
      <div class="card">
        <div class="small">기본 점수</div>
        <div class="field"><label>시작점수</label><input id="startScore" type="number" value="${ruleSet.startScore}" /></div>
        <div class="field"><label>리턴점수</label><input id="returnScore" type="number" value="${ruleSet.returnScore}" /></div>
      </div>

      <div class="card">
        <div class="small">오카/우마(K 단위)</div>
        <div class="field"><label>오카(+K)</label><input id="okaK" type="number" value="${ruleSet.okaK}" /></div>
        <div class="row">
          <div class="field"><label>우마1</label><input id="u1" type="number" value="${ruleSet.umaK[0]}" /></div>
          <div class="field"><label>우마2</label><input id="u2" type="number" value="${ruleSet.umaK[1]}" /></div>
        </div>
        <div class="row">
          <div class="field"><label>우마3</label><input id="u3" type="number" value="${ruleSet.umaK[2]}" /></div>
          <div class="field"><label>우마4</label><input id="u4" type="number" value="${ruleSet.umaK[3]}" /></div>
        </div>
      </div>
    </div>

    <hr/>

    <div class="card">
      <div class="small">멀티론/공탁/연장</div>
      <div class="field">
        <label>멀티론</label>
        <select id="multiRonEnabled">
          <option value="true" ${ruleSet.multiRon.enabled ? "selected" : ""}>ON</option>
          <option value="false" ${!ruleSet.multiRon.enabled ? "selected" : ""}>OFF</option>
        </select>
      </div>
      <div class="field">
        <label>공탁 유국시</label>
        <select id="potCarry">
          <option value="true" ${ruleSet.riichiPotCarryOnDraw ? "selected" : ""}>누적</option>
          <option value="false" ${!ruleSet.riichiPotCarryOnDraw ? "selected" : ""}>초기화</option>
        </select>
      </div>
      <div class="row">
        <div class="field">
          <label>연장(화료)</label>
          <select id="renWin">
            <option value="true" ${ruleSet.renchan.onWin ? "selected" : ""}>ON</option>
            <option value="false" ${!ruleSet.renchan.onWin ? "selected" : ""}>OFF</option>
          </select>
        </div>
        <div class="field">
          <label>연장(유국텐파이)</label>
          <select id="renTenpai">
            <option value="true" ${ruleSet.renchan.onTenpai ? "selected" : ""}>ON</option>
            <option value="false" ${!ruleSet.renchan.onTenpai ? "selected" : ""}>OFF</option>
          </select>
        </div>
      </div>
      <p class="small">공탁은 멀티론 시 “방총자 기준 가까운 승자”가 전액 수령(고정).</p>
    </div>
  `, () => { applySettingsFromModal(); return true; });

  wireSettingsButtons();
}

function wireSettingsButtons() {
  const loadBtn = document.getElementById("presetLoadBtn");
  const saveBtn = document.getElementById("presetSaveBtn");
  const saveAsBtn = document.getElementById("presetSaveAsBtn");
  const delBtn = document.getElementById("presetDeleteBtn");

  loadBtn.onclick = () => {
    const id = document.getElementById("presetSel").value;
    const found = ruleSets.find(r => r.id === id);
    if (!found) return;

    saveSnapshot();
    ruleSet = JSON.parse(JSON.stringify(found));
    activeRuleSetId = ruleSet.id;
    setActiveRuleSetId(ruleSet.id);

    const allEqual = runtime.players.every(p => p.score === runtime.players[0].score);
    if (allEqual) for (const p of runtime.players) p.score = ruleSet.startScore;

    runtime.roundState.handsPlanId = ruleSet.endCondition.handsPlanId || runtime.roundState.handsPlanId;

    persistAll(); render();
    els.modal.close("ok");
  };

  saveBtn.onclick = () => {
    applySettingsFromModal();
    saveSnapshot();

    const idx = ruleSets.findIndex(r => r.id === ruleSet.id);
    if (idx >= 0) ruleSets[idx] = ruleSet;
    else ruleSets.unshift(ruleSet);
    saveRuleSets(ruleSets);
    setActiveRuleSetId(ruleSet.id);

    persistAll(); render();
    els.modal.close("ok");
  };

  saveAsBtn.onclick = () => {
    applySettingsFromModal();
    saveSnapshot();

    openModal("프리셋 다른 이름으로 저장", `
      <div class="field"><label>이름</label><input id="newPresetName" value="${escapeHtml(ruleSet.name)}" /></div>
    `, () => {
      const name = (document.getElementById("newPresetName").value || "").trim();
      if (!name) return false;

      const newSet = JSON.parse(JSON.stringify(ruleSet));
      newSet.id = uuid();
      newSet.name = name;

      ruleSets.unshift(newSet);
      saveRuleSets(ruleSets);
      setActiveRuleSetId(newSet.id);

      ruleSet = newSet;
      activeRuleSetId = newSet.id;

      persistAll(); render();
    });
  };

  delBtn.onclick = () => {
    const id = document.getElementById("presetSel").value;
    if (ruleSets.length <= 1) { alert("프리셋은 최소 1개는 남겨야 해."); return; }

    openModal("프리셋 삭제", `<p class="small">정말 삭제할까요?</p>`, () => {
      saveSnapshot();
      ruleSets = ruleSets.filter(r => r.id !== id);
      saveRuleSets(ruleSets);

      if (!ruleSets.some(r => r.id === ruleSet.id)) {
        ruleSet = ruleSets[0];
        setActiveRuleSetId(ruleSet.id);
      }
      persistAll(); render();
    });
  };
}

function applySettingsFromModal() {
  const hpId = document.getElementById("handsSel")?.value;
  if (hpId && handsPlans.some(h => h.id === hpId)) {
    runtime.roundState.handsPlanId = hpId;
    ruleSet.endCondition.handsPlanId = hpId;
  }

  const startScore = Number(document.getElementById("startScore")?.value);
  const returnScore = Number(document.getElementById("returnScore")?.value);
  if (!Number.isNaN(startScore)) ruleSet.startScore = Math.max(0, Math.trunc(startScore));
  if (!Number.isNaN(returnScore)) ruleSet.returnScore = Math.max(0, Math.trunc(returnScore));

  const okaK = Number(document.getElementById("okaK")?.value);
  const u1 = Number(document.getElementById("u1")?.value);
  const u2 = Number(document.getElementById("u2")?.value);
  const u3 = Number(document.getElementById("u3")?.value);
  const u4 = Number(document.getElementById("u4")?.value);
  if (!Number.isNaN(okaK)) ruleSet.okaK = Math.trunc(okaK);
  ruleSet.umaK = [u1,u2,u3,u4].map(x => Number.isNaN(x) ? 0 : Math.trunc(x));

  const mre = document.getElementById("multiRonEnabled")?.value;
  if (mre === "true") ruleSet.multiRon.enabled = true;
  if (mre === "false") ruleSet.multiRon.enabled = false;

  const rw = document.getElementById("renWin")?.value;
  const rt = document.getElementById("renTenpai")?.value;
  if (rw === "true") ruleSet.renchan.onWin = true;
  if (rw === "false") ruleSet.renchan.onWin = false;
  if (rt === "true") ruleSet.renchan.onTenpai = true;
  if (rt === "false") ruleSet.renchan.onTenpai = false;

  const carry = document.getElementById("potCarry")?.value;
  if (carry === "true") ruleSet.riichiPotCarryOnDraw = true;
  if (carry === "false") ruleSet.riichiPotCarryOnDraw = false;

  persistAll(); render();
}

function openSettlementModal() {
  const initDealer = runtime.meta?.initialDealerIndex ?? 0;
  const okaPts = (ruleSet.okaK || 0) * 1000;
  const umaPtsByRank = (ruleSet.umaK || [0,0,0,0]).map(k => (k || 0) * 1000);

  const ranked = [0,1,2,3]
    .map(i => ({ i, name: runtime.players[i].name, score: runtime.players[i].score }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return seatDistance(initDealer, a.i) - seatDistance(initDealer, b.i);
    });

  function renderTable(unit) {
    const display = (v) => unit === "k" ? fmtK.format(v / 1000) : fmt(v);

    const rows = ranked.map((r, idx) => {
      const umaPts = umaPtsByRank[idx] ?? 0;
      const base = r.score - ruleSet.returnScore;
      const final = (base + okaPts + umaPts) * 2;
      return { rank: idx + 1, name: r.name, score: r.score, base, okaPts, umaPts, final };
    });

    const table = `
      <table>
        <thead>
          <tr>
            <th>순위</th><th>플레이어</th>
            <th class="right">최종점수</th>
            <th class="right">점수-리턴</th>
            <th class="right">오카</th>
            <th class="right">우마</th>
            <th class="right">최종(×2)</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${r.rank}</td>
              <td>${escapeHtml(r.name)}</td>
              <td class="right">${display(r.score)}</td>
              <td class="right">${display(r.base)}</td>
              <td class="right">${display(r.okaPts)}</td>
              <td class="right">${display(r.umaPts)}</td>
              <td class="right"><b>${display(r.final)}</b></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    const target = document.getElementById("settleTable");
    if (target) target.innerHTML = table;
  }

  openModal("📊 최종정산 (표시 단위 토글)", `
    <div class="card">
      <div class="row">
        <div class="field">
          <label>표시 단위</label>
          <select id="displayUnit">
            <option value="points" selected>점수(예: 102000)</option>
            <option value="k">천점표기(예: 102.0)</option>
          </select>
        </div>
        <div class="field">
          <label>타이브레이크</label>
          <input disabled value="처음 친(${escapeHtml(seatName(initDealer))}) 기준 가까운 좌석 우선" />
        </div>
      </div>
      <div class="small">
        공식: { (개인점수 - returnScore) + 오카 + 우마 } × 2<br/>
        returnScore=${fmt(ruleSet.returnScore)},
        오카=+${ruleSet.okaK}K(${fmt(okaPts)}점),
        우마=[${ruleSet.umaK.join(", ")}]K
      </div>
      <hr/>
      <div id="settleTable"></div>
      <p class="small">“천점표기”는 표시만 바뀌고 계산은 원점수(1점 단위)로 유지됨.</p>
    </div>
  `, () => true);

  const sel = document.getElementById("displayUnit");
  const apply = () => renderTable(sel?.value === "k" ? "k" : "points");
  if (sel) sel.addEventListener("change", apply);
  apply();
}

/* ===========================
   init
=========================== */
render();
persistAll();
