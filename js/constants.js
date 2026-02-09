// js/constants.js
export const VERSION = "1.6.5";

export const LS = {
  UI_TOPBAR_HIDDEN: "mjp_ui_topbar_hidden_v1",
  AUTO_HIDE_TOPBAR_IN_FS: "mjp_auto_hide_topbar_in_fs_v1",

  SCHEMA: "mjp_v16_schema",
  RUNTIME: "mjp_v16_runtime",
  RULESETS: "mjp_v16_rulesets",
  ACTIVE_RULESET_ID: "mjp_v16_active_ruleset_id",
  HANDS_PLANS: "mjp_v16_hands_plans",

  // ✅ 업데이트 팝업(고도화)
  LAST_SEEN_VERSION: "mjp_last_seen_version",
  SKIP_UPDATES_UNTIL: "mjp_skip_updates_until", // 이 버전까지는 업데이트 팝업 스킵
};

export const SCHEMA_VERSION = 2;

export const SEATS = [0, 1, 2, 3];
export const DEFAULT_NAMES = ["동", "남", "서", "북"];

// ✅ 버전별 릴리즈 노트 (VERSION 올릴 때 여기만 추가/수정)
export const RELEASE_NOTES = {
  "1.6.5": {
    title: "업데이트 v1.6.5",
    summary: [
      "최종정산: 공식/중간값/천점(/1000) 표기 강화",
      "촌보/공탁 처리 안정화",
      "UI/버그 수정",
    ],
    detailsHtml: `
      <ul style="margin:8px 0 0 18px; line-height:1.6;">
        <li><b>최종정산</b>: 점수 산출 공식 + 중간값 + /1000 환산 동시 표시</li>
        <li><b>촌보</b>: 공탁 환불 포함 처리 개선</li>
        <li><b>전체화면/스케일</b>: 모바일 가로 최적화 안정화</li>
      </ul>
    `,
  },
};
