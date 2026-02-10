// js/constants.js
export const VERSION = "1.6.7";

// ✅ 업데이트 내역만 바꿀 때는 이것만 증가시키면 됨
export const UPDATE_NOTES_ID = "2026-02-10-02";

export const LS = {
  UI_TOPBAR_HIDDEN: "mjp_ui_topbar_hidden_v1",
  AUTO_HIDE_TOPBAR_IN_FS: "mjp_auto_hide_topbar_in_fs_v1",

  SCHEMA: "mjp_v16_schema",
  RUNTIME: "mjp_v16_runtime",
  RULESETS: "mjp_v16_rulesets",
  ACTIVE_RULESET_ID: "mjp_v16_active_ruleset_id",
  HANDS_PLANS: "mjp_v16_hands_plans",

  LAST_SEEN_VERSION: "mjp_last_seen_version",
  SKIP_UPDATES_UNTIL: "mjp_skip_updates_until",

  // ✅ “내역이 바뀌었는지” 판단용
  LAST_SEEN_UPDATE_NOTES_ID: "mjp_last_seen_update_notes_id",
};

export const SCHEMA_VERSION = 2;

export const SEATS = [0, 1, 2, 3];
export const DEFAULT_NAMES = ["동", "남", "서", "북"];

// ✅ 업데이트 내역(여기만 수정)
export const RELEASE_NOTES = {
  "1.6.5": {
    title: "업데이트 v1.6.5",
    summary: [
      "최종정산 표: 필요한 열만 남김",
      "오카: 1등만 지급",
      "업데이트: 상단바 버튼으로 언제든 내역 확인",
    ],
    detailsHtml: `
      <ul style="margin:8px 0 0 18px; line-height:1.6;">
        <li><b>최종정산</b>: 열 단순화(요청 포맷에 맞춤)</li>
        <li><b>오카</b>: 1등만 지급하도록 계산 변경</li>
        <li><b>업데이트</b>: 상단바 ‘업데이트’ 버튼 추가</li>
      </ul>
    `,
  },

  "1.6.6": {
    title: "업데이트 v1.6.6",
    summary: [
      "전체화면에서 화면이 겹쳐 보이던 문제 1차 완화",
      "전체화면(가로)에서 autoscale transform 비활성화",
    ],
    detailsHtml: `
      <ul style="margin:8px 0 0 18px; line-height:1.6;">
        <li><b>전체화면 UI 안정화</b>: fullscreen + transform 충돌 완화</li>
        <li><b>가로 전체화면</b>: transform 비활성화</li>
        <li><b>세로 전체화면</b>: 강제가로 UI에서 autoscale 유지</li>
      </ul>
    `,
  },

  "1.6.7": {
    title: "업데이트 v1.6.7",
    summary: [
      "가로모드/전체화면에서 화면이 여러 장 겹쳐 보이는 현상 수정",
      "autoscale transform을 ‘JS가 켤 때만’ 적용하도록 변경",
      "모바일 vh 튐 방지(100dvh) 적용",
    ],
    detailsHtml: `
      <ul style="margin:8px 0 0 18px; line-height:1.6;">
        <li>
          <b>겹침(고스트) 수정</b>:
          autoscale의 transform이 CSS 미디어쿼리로 자동 적용되던 구조를 제거하고,
          JS가 조건을 만족할 때만 transform을 켜도록 변경했습니다.
        </li>
        <li>
          <b>전체화면(가로)</b>:
          transform을 강제로 끄고, 레이아웃은 뷰포트(100vw/100vh) 기준으로 유지합니다.
        </li>
        <li>
          <b>vh 튐 완화</b>:
          모바일 주소창/툴바 변화로 레이아웃이 흔들리는 문제를 줄이기 위해
          100vh 대신 100dvh를 사용합니다.
        </li>
      </ul>
    `,
  },
};
