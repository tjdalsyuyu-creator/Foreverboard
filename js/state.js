// js/state.js v1.6.5+ (safe keep exports + add ui.eastSeatPos)
import { DEFAULT_NAMES } from "./constants.js";

export function uuid(){
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function defaultHandsPlans(){
  return [
    { id:"han-8",  name:"반장전(8국) - E1~E4, S1~S4", sequence:["E1","E2","E3","E4","S1","S2","S3","S4"] },
    { id:"han-24", name:"확장(24국) - E,S,W,N + E,S", sequence:[
      "E1","E2","E3","E4","S1","S2","S3","S4",
      "W1","W2","W3","W4","N1","N2","N3","N4",
      "E1","E2","E3","E4","S1","S2","S3","S4"
    ]},
  ];
}

export function ruleSetTemplate(name="작혼룰"){
  return {
    id: uuid(),
    name,
    startScore: 25000,
    returnScore: 30000,
    okaK: 20,
    umaK: [20,10,-10,-20],
    riichiPotCarryOnDraw: true,
    honba: { ronBonusPer: 300, tsumoBonusPerEach: 100 },
    multiRon: { enabled: true },
    renchan: { onWin: true, onTenpai: true },
    endCondition: { handsPlanId: "han-8" },
    options: {
      tobiEnabled: false,
      kiriageMangan: false,
      twoHanShibari: false,
      paoEnabled: false,
      orasDealerContinueEvenIfFirst: false,
    }
  };
}

export function defaultRuntime(ruleSet, handsPlans){
  const hp = handsPlans.find(h=>h.id===ruleSet.endCondition.handsPlanId) || handsPlans[0];
  return {
    players: DEFAULT_NAMES.map(n=>({
      name:n,
      score:ruleSet.startScore,
      riichi:false,
      potCount: 0,          // 자동 촌보(공탁 3회) 카운트(국 단위)
      depositCountHand: 0,  // ✅ 이번 국 공탁 납부(리치/공탁 포함) 횟수
    })),
    roundState: { handsPlanId: hp.id, handIndex:0, dealerIndex:0, honba:0, riichiPot:0 },

    // ✅ 추가: UI 설정(동(East=players[0])의 "화면 위치")
    // 화면 좌석 data-seat 기준: 0=top, 1=right, 2=bottom, 3=left
    ui: { eastSeatPos: 0 },

    meta: { initialDealerIndex: 0, gameEnded:false },
    history: [],
  };
}

export function deepClone(obj){
  return JSON.parse(JSON.stringify(obj));
}

export function pushSnapshot(app){
  const snap = deepClone({
    ruleSet: app.ruleSet,
    ruleSets: app.ruleSets,
    activeRuleSetId: app.activeRuleSetId,
    handsPlans: app.handsPlans,
    runtime: stripHistory(app.runtime),
  });
  app.runtime.history.push(snap);
  if (app.runtime.history.length > 50) app.runtime.history.shift();
}

export function popSnapshot(app){
  const snap = app.runtime.history.pop();
  if (!snap) return false;

  app.handsPlans = snap.handsPlans;
  app.ruleSets = snap.ruleSets;
  app.activeRuleSetId = snap.activeRuleSetId;

  const restored = app.ruleSets.find(r => r.id === app.activeRuleSetId) || app.ruleSets[0];
  app.ruleSet = restored;

  app.runtime = { ...snap.runtime, history: app.runtime.history };
  return true;
}

export function stripHistory(runtime){
  const { history, ...rest } = runtime;
  return rest;
}

export function currentHandsPlan(app){
  const id = app.runtime.roundState.handsPlanId || app.ruleSet.endCondition.handsPlanId;
  return app.handsPlans.find(h=>h.id===id) || app.handsPlans[0];
}

export function currentHandLabel(app){
  const hp = currentHandsPlan(app);
  const idx = app.runtime.roundState.handIndex || 0;
  return hp.sequence[idx] || hp.sequence[hp.sequence.length-1] || "E1";
}

// ✅ tsumo/draw에서 쓰는 export (절대 삭제하면 안 됨)
export function clearRiichiFlags(app){
  for (const p of app.runtime.players) p.riichi = false;
}

export function rotateArray(arr,startIndex){
  const n=arr.length;
  const s=((startIndex%n)+n)%n;
  return arr.slice(s).concat(arr.slice(0,s));
}

export function resetWithEastSelection(app, eastOldIndex){
  app.runtime.players = rotateArray(app.runtime.players, eastOldIndex);

  for (const p of app.runtime.players){
    p.score = app.ruleSet.startScore;
    p.riichi = false;
    p.potCount = 0;
    p.depositCountHand = 0;
  }
  app.runtime.roundState.handIndex = 0;
  app.runtime.roundState.honba = 0;
  app.runtime.roundState.riichiPot = 0;
  app.runtime.roundState.dealerIndex = 0;
  app.runtime.meta.initialDealerIndex = 0;
  app.runtime.meta.gameEnded = false;

  app.runtime.roundState.handsPlanId = app.ruleSet.endCondition.handsPlanId || app.runtime.roundState.handsPlanId;
}

export function dealerAdvance(app){
  app.runtime.roundState.dealerIndex = (app.runtime.roundState.dealerIndex + 1) % 4;
}

export function handAdvance(app){
  app.runtime.roundState.handIndex += 1;
  const hp = currentHandsPlan(app);
  if (app.runtime.roundState.handIndex >= hp.sequence.length) {
    app.runtime.roundState.handIndex = hp.sequence.length - 1;
    app.runtime.meta.gameEnded = true;
  }
}

export function seatDistance(from,to){ return (to-from+4)%4; }
export function orderByNearestFrom(fromSeat, seats){
  return [...seats].sort((a,b)=>seatDistance(fromSeat,a)-seatDistance(fromSeat,b));
}
export function pickNearestFrom(fromSeat, seats){
  const ordered = orderByNearestFrom(fromSeat, seats);
  const filtered = ordered.filter(x=>x!==fromSeat);
  return filtered[0] ?? ordered[0] ?? null;
}
