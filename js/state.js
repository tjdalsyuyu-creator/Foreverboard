// js/state.js v1.6.5+ (add depositCountHand)
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
    { id:"han-8",  name:"반장전(8국) - E1~S4", sequence:["E1","E2","E3","E4","S1","S2","S3","S4"] },
    { id:"han-16", name:"반장전(16국) - E1~W4", sequence:["E1","E2","E3","E4","S1","S2","S3","S4","W1","W2","W3","W4","N1","N2","N3","N4"] },
  ];
}

export function defaultRuleSets(handsPlans){
  const hp8 = handsPlans.find(h=>h.id==="han-8") || handsPlans[0];
  return [
    {
      id:"standard",
      name:"표준 (리턴 30000 / 오카 20000 / 우마 10-5)",
      startScore:25000,
      returnScore:30000,
      oka:20000,
      uma:[10,5,-5,-10],
      settleMultiplier:2,
      endCondition: { handsPlanId: hp8.id },
    },
  ];
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

    // ✅ 추가: UI 설정(동(East)의 "화면 위치")
    // 화면 좌석 data-seat 기준: 0=top, 1=right, 2=bottom, 3=left
    ui: { eastSeatPos: 0 },

    meta: { initialDealerIndex: 0, gameEnded:false },
    history: [],
  };
}

export function currentHandsPlan(app){
  const hpId = app.runtime.roundState.handsPlanId || app.ruleSet.endCondition.handsPlanId;
  return (app.handsPlans || []).find(h=>h.id===hpId) || (app.handsPlans || [])[0];
}

export function currentHandLabel(app){
  const hp = currentHandsPlan(app);
  const idx = app.runtime.roundState.handIndex || 0;
  return hp.sequence[idx] || hp.sequence[hp.sequence.length-1] || "E1";
}

function rotateArray(arr,startIndex){
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
  app.runtime.roundState.handIndex = (app.runtime.roundState.handIndex + 1);
}

export function pushSnapshot(app){
  const snap = JSON.parse(JSON.stringify(app.runtime));
  app.runtime.history = app.runtime.history || [];
  app.runtime.history.push(snap);
  if(app.runtime.history.length > 50) app.runtime.history.shift();
}

export function popSnapshot(app){
  if(!app.runtime.history?.length) return false;
  const prev = app.runtime.history.pop();
  app.runtime = prev;
  return true;
}
