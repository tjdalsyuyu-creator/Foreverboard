// js/scoring.js v1.6.5+ (Chombo refund deposits)
import { SEATS } from "./constants.js";

export function ceil100(x){ return Math.ceil(x/100)*100; }
function opt(app){ return app.ruleSet.options || {}; }

export function basicPoints(app, fu, han){
  const o = opt(app);

  if(han >= 13) return 8000;
  if(han >= 11) return 6000;
  if(han >= 8)  return 4000;
  if(han >= 6)  return 3000;
  if(han >= 5)  return 2000;

  if(o.kiriageMangan){
    if((han === 3 && fu >= 60) || (han === 4 && fu >= 30)) return 2000;
  }

  const b = fu * Math.pow(2, 2 + han);
  return Math.min(2000, b);
}

export function ronPay(app, winnerIsDealer, fu, han){
  const b = basicPoints(app, fu, han);
  return ceil100(b * (winnerIsDealer ? 6 : 4));
}

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

export function validateTwoHanShibari(app, han){
  const o = opt(app);
  if(!o.twoHanShibari) return { ok:true };
  if(app.runtime.roundState.honba < 5) return { ok:true };
  if(han >= 2) return { ok:true };
  return { ok:false, message:"2판 묶기: 5본장부터는 2판 이상만 화료 가능합니다." };
}

export function applyPaoIfNeeded({ app, totalPay, loserSeat, paoSeat, isTsumo }){
  const o = opt(app);
  if(!o.paoEnabled) return null;
  if(paoSeat == null) return null;

  if(isTsumo) return [{ from: paoSeat, toPay: totalPay }];
  if(paoSeat === loserSeat) return [{ from: loserSeat, toPay: totalPay }];

  const half1 = Math.floor(totalPay / 2);
  const half2 = totalPay - half1;
  return [
    { from: loserSeat, toPay: half1 },
    { from: paoSeat,  toPay: half2 }
  ];
}

export function transfer(app, from, to, amt){
  app.runtime.players[from].score -= amt;
  app.runtime.players[to].score += amt;
}

export function checkTobiAndEnd(app){
  const o = opt(app);
  if(!o.tobiEnabled) return false;
  const tobi = app.runtime.players.some(p => p.score < 0);
  if(tobi){
    app.runtime.meta.gameEnded = true;
    return true;
  }
  return false;
}

export function applyNagashiMangan(app, winnerSeat){
  const rs = app.runtime.roundState;
  const dealer = rs.dealerIndex;
  const b = 2000;

  if(winnerSeat === dealer){
    const each = ceil100(b * 2) + rs.honba * app.ruleSet.honba.tsumoBonusPerEach;
    for(const i of SEATS){
      if(i === winnerSeat) continue;
      transfer(app, i, winnerSeat, each);
    }
  } else {
    const dealerPay = ceil100(b * 2) + rs.honba * app.ruleSet.honba.tsumoBonusPerEach;
    const childPay  = ceil100(b * 1) + rs.honba * app.ruleSet.honba.tsumoBonusPerEach;
    for(const i of SEATS){
      if(i === winnerSeat) continue;
      transfer(app, i, winnerSeat, (i === dealer) ? dealerPay : childPay);
    }
  }
}

/* ✅ 촌보: 공탁 환불 + 3000x3 지급 + 국 재실행(국/본장/공탁 유지) */
export function applyChombo(app, offenderSeat){
  // 1) 이번 국에서 offender가 낸 공탁(리치/공탁 버튼 포함)을 환불
  const offender = app.runtime.players[offenderSeat];
  const deposits = Math.max(0, offender.depositCountHand || 0);
  const refund = Math.min(app.runtime.roundState.riichiPot, deposits * 1000);

  if(refund > 0){
    app.runtime.roundState.riichiPot -= refund;
    offender.score += refund;
  }

  // 2) 촌보 패널티: 나머지 3명에게 3000씩 지급
  const PAY = 3000;
  for(const i of SEATS){
    if(i === offenderSeat) continue;
    transfer(app, offenderSeat, i, PAY);
  }

  // 3) 국 재실행: 국/본장/공탁 유지, 리치 상태는 해제
  for(const p of app.runtime.players){
    p.riichi = false;
  }

  // 4) 자동촌보 카운트/이번국 납부카운트 초기화(재실행이므로)
  offender.potCount = 0;
  offender.depositCountHand = 0;

  // 5) 토비 체크
  checkTobiAndEnd(app);
}

/* ✅ 국 종료 시 자동촌보 카운트(국 단위) 리셋 */
export function resetPotCountsPerHand(app){
  for(const p of app.runtime.players){
    p.potCount = 0;
    p.depositCountHand = 0;
  }
}