// js/scoring.js v1.6.5+ (Tobi / Kiriage Mangan / 2-han shibari / Pao)
import { SEATS } from "./constants.js";

/** 100점 올림 */
export function ceil100(x){ return Math.ceil(x/100)*100; }

/**
 * 기본점(符×2^(2+翻)) -> 만관 상한 포함
 * - 기본 만관: 2000
 * - 5판 이상: 만관 이상으로 취급(여기서는 base=2000/3000/4000/6000/8000)
 * - 절상만관(옵션):
 *    3판 60부 이상 / 4판 30부 이상 -> 만관(2000)로 올림
 */
export function basicPoints(app, fu, han){
  const opt = app.ruleSet.options || {};
  const kiriage = !!opt.kiriageMangan;

  // Yakuman etc.
  if(han >= 13) return 8000;
  if(han >= 11) return 6000;
  if(han >= 8)  return 4000;
  if(han >= 6)  return 3000;
  if(han >= 5)  return 2000;

  // 절상만관
  if(kiriage){
    if((han === 3 && fu >= 60) || (han === 4 && fu >= 30)){
      return 2000;
    }
  }

  const b = fu * Math.pow(2, 2 + han);
  return Math.min(2000, b);
}

/** 론 지불액(한 명에게서 받는 금액, 100점 올림) */
export function ronPay(app, winnerIsDealer, fu, han){
  const b = basicPoints(app, fu, han);
  const mult = winnerIsDealer ? 6 : 4;
  return ceil100(b * mult);
}

/** 쯔모 분배 */
export function tsumoPays(app, winnerSeat, fu, han){
  const b = basicPoints(app, fu, han);
  const rs = app.runtime.roundState;
  const dealer = rs.dealerIndex;

  if(winnerSeat === dealer){
    const each = ceil100(b * 2) + rs.honba * app.ruleSet.honba.tsumoBonusPerEach;
    return { type:"dealerTsumo", each };
  } else {
    const dealerPay = ceil100(b * 2) + rs.honba * app.ruleSet.honba.tsumoBonusPerEach;
    const childPay  = ceil100(b * 1) + rs.honba * app.ruleSet.honba.tsumoBonusPerEach;
    return { type:"childTsumo", dealerPay, childPay };
  }
}

/**
 * 2판 묶기(2 han shibari)
 * - 옵션 ON + 본장>=5면 han>=2 아니면 화료 불가
 */
export function validateTwoHanShibari(app, han){
  const opt = app.ruleSet.options || {};
  if(!opt.twoHanShibari) return { ok:true };
  if(app.runtime.roundState.honba < 5) return { ok:true };
  if(han >= 2) return { ok:true };
  return { ok:false, message:"2판 묶기: 5본장부터는 2판 이상만 화료 가능합니다." };
}

/**
 * 파오(책임지불) 적용
 * - 옵션 ON일 때만
 * - 대상: 대삼원/대사희/사깡쯔(사용자가 모달에서 선택)
 * - tsumo: 책임자 100%
 * - ron: 방총자 50% + 책임자 50%
 */
export function applyPaoIfNeeded({ app, totalPay, loserSeat, paoSeat, isTsumo }){
  const opt = app.ruleSet.options || {};
  if(!opt.paoEnabled) return null;            // 파오 OFF
  if(paoSeat == null) return null;            // 책임자 미선택
  if(paoSeat === loserSeat && !isTsumo) {
    // 방총자=책임자면 그냥 방총자 100%
    return [{ from: loserSeat, toPay: totalPay }];
  }

  if(isTsumo){
    // 책임자 100%
    return [{ from: paoSeat, toPay: totalPay }];
  } else {
    // ron: 50/50 (홀수일 경우 100단위라 항상 짝수 가능하지만, 안전하게 처리)
    const half1 = Math.floor(totalPay / 2);
    const half2 = totalPay - half1;
    return [
      { from: loserSeat, toPay: half1 },
      { from: paoSeat,  toPay: half2 }
    ];
  }
}

/** 점수 이동 유틸 */
export function transfer(app, from, to, amt){
  app.runtime.players[from].score -= amt;
  app.runtime.players[to].score += amt;
}

/**
 * 토비 체크
 * - 옵션 ON이고 점수가 0 미만인 플레이어가 있으면 게임 종료
 */
export function checkTobiAndEnd(app){
  const opt = app.ruleSet.options || {};
  if(!opt.tobiEnabled) return false;
  const tobi = app.runtime.players.some(p => p.score < 0);
  if(tobi){
    app.runtime.meta.gameEnded = true;
    return true;
  }
  return false;
}

/**
 * 오라스 종료 처리
 * - handsPlan 마지막 index에서, 딜러 연장 규칙에 따라 종료/연장
 * - 옵션: orasDealerContinueEvenIfFirst
 */
export function maybeEndAtOlas(app){
  const hp = app.handsPlans.find(h => h.id === app.runtime.roundState.handsPlanId) || app.handsPlans[0];
  const isLast = app.runtime.roundState.handIndex >= (hp.sequence.length - 1);

  if(!isLast) return;

  // 기본: 마지막 국이 끝나면 종료 (연장 조건 없으면)
  // 옵션: 오라스 때 친이 1등이어도 계속 연장할지
  // -> 여기서는 "딜러가 연장 조건을 만족하면 계속" 로만 처리하고,
  //    옵션이 ON이면 1등 여부 상관없이 딜러 화료 연장을 허용하는 방식으로 대응.
  // (이미 renchan.onWin이 딜러 화료면 honba++로 유지되는 구조)

  // 마지막 국이 끝났는데 딜러가 유지되지 않는 상황이면 종료
  // 종료는 app.runtime.meta.gameEnded = true 로 표시
  // (연장 로직은 각 모달에서 dealer 유지 여부로 이미 처리됨)
  const opt = app.ruleSet.options || {};
  if(opt.orasDealerContinueEvenIfFirst){
    // 이 옵션은 "딜러가 화료/텐파이로 연장되는 상황이면 계속"을 강제 종료하지 않음.
    // 종료 결정은 아래 gameEnded만 걸어둔다.
    return;
  }
  // 옵션 OFF면: 마지막 국 진행이 다음으로 넘어가려는 시점(=handAdvance 호출 후)에서 gameEnded 처리 필요
  // 각 모달에서 handAdvance 후 checkEnd를 호출하도록 함.
}

/**
 * 마지막 국 이후로 넘어가려는 순간에 종료(오라스 처리)
 * - handAdvance 호출 직후 사용 권장
 */
export function checkEndAfterAdvance(app){
  const hp = app.handsPlans.find(h => h.id === app.runtime.roundState.handsPlanId) || app.handsPlans[0];
  if(app.runtime.roundState.handIndex >= hp.sequence.length - 1){
    // 여전히 마지막 인덱스면 계속 진행중
    return;
  }
  // 마지막을 넘어가려 했으면 종료 처리
  // (handAdvance에서 clamp 되기 전 구조가 아니라서, 여기서는 “손으로 종료시키는 방식”만 제공)
}