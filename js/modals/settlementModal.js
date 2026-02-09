// js/modals/settlementModal.js
import { openModal } from "./modalBase.js";

function fmt(n) {
  return Number(n).toLocaleString("ko-KR");
}
function fmtK(n) {
  // /1000 환산(1자리 소수)
  return (Number(n) / 1000).toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function openSettlementModal(app, dom) {
  const initDealer = app.runtime.meta.initialDealerIndex;

  const returnScore = app.ruleSet.returnScore;      // 예: 30000
  const oka = app.ruleSet.okaK * 1000;              // 예: 20K => 20000
  const uma = app.ruleSet.umaK.map((v) => v * 1000);

  // 점수 내림차순, 동점이면 "처음 친" 기준 가까운 좌석 우선
  const ranked = [0, 1, 2, 3]
    .map((i) => ({ i, score: app.runtime.players[i].score }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.i - initDealer + 4) % 4 - (b.i - initDealer + 4) % 4;
    });

  const formula = `{ (점수 - 리턴) + 오카 + 우마 } × 2`;
  const ruleSummary = `
    <div class="small" style="opacity:.9; line-height:1.5; margin-bottom:10px;">
      <div><b>공식</b>: ${formula}</div>
      <div>
        리턴=${fmt(returnScore)} (${fmtK(returnScore)}),
        오카=+${app.ruleSet.okaK}K (${fmt(oka)} / ${fmtK(oka)}),
        우마=[${app.ruleSet.umaK.join(", ")}]K
      </div>
      <div>동점 타이브레이크: “처음 친”(${app.runtime.players[initDealer].name}) 기준 가까운 좌석 우선</div>
    </div>
  `;

  const table = `
    <table>
      <thead>
        <tr>
          <th>순위</th>
          <th>플레이어</th>
          <th class="right">점수</th>
          <th class="right">점수(/1000)</th>
          <th class="right">점수-리턴</th>
          <th class="right">(-리턴)/1000</th>
          <th class="right">오카</th>
          <th class="right">오카(/1000)</th>
          <th class="right">우마</th>
          <th class="right">우마(/1000)</th>
          <th class="right">중간합</th>
          <th class="right">중간합(/1000)</th>
          <th class="right">최종(×2)</th>
          <th class="right">최종(/1000)</th>
        </tr>
      </thead>
      <tbody>
        ${ranked
          .map((r, idx) => {
            const name = app.runtime.players[r.i].name;

            const score = r.score;
            const base = score - returnScore;          // (점수 - 리턴)
            const umaPts = uma[idx] ?? 0;              // 랭크별 우마
            const subtotal = base + oka + umaPts;      // 중간합
            const final = subtotal * 2;                // 최종

            return `
              <tr>
                <td>${idx + 1}</td>
                <td>${name}</td>

                <td class="right">${fmt(score)}</td>
                <td class="right">${fmtK(score)}</td>

                <td class="right">${fmt(base)}</td>
                <td class="right">${fmtK(base)}</td>

                <td class="right">${fmt(oka)}</td>
                <td class="right">${fmtK(oka)}</td>

                <td class="right">${fmt(umaPts)}</td>
                <td class="right">${fmtK(umaPts)}</td>

                <td class="right">${fmt(subtotal)}</td>
                <td class="right">${fmtK(subtotal)}</td>

                <td class="right"><b>${fmt(final)}</b></td>
                <td class="right"><b>${fmtK(final)}</b></td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;

  openModal(dom, "최종정산", `${ruleSummary}${table}`, () => true);
}
