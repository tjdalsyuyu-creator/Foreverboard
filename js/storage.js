// js/storage.js v1.6.5
import { LS, SCHEMA_VERSION } from "./constants.js";
import { defaultHandsPlans, ruleSetTemplate, defaultRuntime, deepClone } from "./state.js";

function readJson(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch{
    return fallback;
  }
}
function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

export function ensureSchema(){
  const schema = readJson(LS.SCHEMA, null);
  if(!schema || schema.version !== SCHEMA_VERSION){
    writeJson(LS.SCHEMA, { version: SCHEMA_VERSION, createdAt: Date.now() });
  }
}

export function loadApp(){
  ensureSchema();

  // hands plans
  let handsPlans = readJson(LS.HANDS_PLANS, null);
  if(!Array.isArray(handsPlans) || !handsPlans.length){
    handsPlans = defaultHandsPlans();
    writeJson(LS.HANDS_PLANS, handsPlans);
  }

  // rulesets
  let ruleSets = readJson(LS.RULESETS, null);
  if(!Array.isArray(ruleSets) || !ruleSets.length){
    const base = ruleSetTemplate("작혼룰");
    ruleSets = [base];
    writeJson(LS.RULESETS, ruleSets);
    writeJson(LS.ACTIVE_RULESET_ID, base.id);
  }

  let activeRuleSetId = localStorage.getItem(LS.ACTIVE_RULESET_ID);
  if(!activeRuleSetId || !ruleSets.some(r=>r.id===activeRuleSetId)){
    activeRuleSetId = ruleSets[0].id;
    localStorage.setItem(LS.ACTIVE_RULESET_ID, activeRuleSetId);
  }

  let ruleSet = ruleSets.find(r=>r.id===activeRuleSetId) || ruleSets[0];

  // runtime
  let runtime = readJson(LS.RUNTIME, null);
  if(!runtime || !runtime.players || !runtime.roundState){
    runtime = defaultRuntime(ruleSet, handsPlans);
    writeJson(LS.RUNTIME, stripHistory(runtime));
  } else {
    // migrate
    runtime = migrateRuntime(runtime, ruleSet, handsPlans);
  }
  runtime.history = [];

  return { handsPlans, ruleSets, activeRuleSetId, ruleSet, runtime };
}

export function saveApp(app){
  // keep active id
  localStorage.setItem(LS.ACTIVE_RULESET_ID, app.activeRuleSetId);

  // persist lists
  writeJson(LS.HANDS_PLANS, app.handsPlans);
  writeJson(LS.RULESETS, app.ruleSets);

  // persist runtime without history
  writeJson(LS.RUNTIME, stripHistory(app.runtime));
}

function stripHistory(runtime){
  const { history, ...rest } = runtime;
  return rest;
}

function migrateRuntime(rt, ruleSet, handsPlans){
  // meta
  if(!rt.meta) rt.meta = { initialDealerIndex: rt.roundState?.dealerIndex ?? 0 };
  if(typeof rt.meta.initialDealerIndex !== "number") rt.meta.initialDealerIndex = rt.roundState?.dealerIndex ?? 0;

  // roundState
  if(!rt.roundState) rt.roundState = {};
  if(!rt.roundState.handsPlanId) rt.roundState.handsPlanId = ruleSet.endCondition.handsPlanId || (handsPlans[0]?.id ?? "han-8");
  if(typeof rt.roundState.handIndex !== "number") rt.roundState.handIndex = 0;
  if(typeof rt.roundState.dealerIndex !== "number") rt.roundState.dealerIndex = 0;
  if(typeof rt.roundState.honba !== "number") rt.roundState.honba = 0;
  if(typeof rt.roundState.riichiPot !== "number") rt.roundState.riichiPot = 0;

  // players
  if(!Array.isArray(rt.players) || rt.players.length !== 4){
    return defaultRuntime(ruleSet, handsPlans);
  }
  rt.players = rt.players.map((p,i)=>({
    name: (p && typeof p.name==="string" && p.name.trim()) ? p.name : ["동","남","서","북"][i],
    score: (p && typeof p.score==="number") ? p.score : ruleSet.startScore,
    riichi: (p && typeof p.riichi==="boolean") ? p.riichi : false
  }));

  return rt;
}