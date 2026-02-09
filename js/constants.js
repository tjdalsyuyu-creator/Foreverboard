// js/constants.js
export const VERSION = "1.6.5";

// ✅ 업데이트 내역만 바꿀 때는 이것만 증가시키면 됨
export const UPDATE_NOTES_ID = "2026-02-09-02";

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
};
