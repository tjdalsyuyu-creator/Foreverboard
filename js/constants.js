// js/constants.js
export const VERSION = "1.6.8";

// ✅ 업데이트 내역만 바꿀 때는 이것만 증가시키면 됨
export const UPDATE_NOTES_ID = "2026-02-10-03";

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

  LAST_SEEN_UPDATE_NOTES_ID: "mjp_last_seen_update_notes_id",
};

export const SCHEMA_VERSION = 2;

export const SEATS = [0, 1, 2, 3];
export const DEFAULT_NAMES = ["동", "남", "서", "북"];

export const RELEASE_NOTES = {
  "1.6.8": {
    title: "업데이트 v1.6.8",
    summary: [
      "세로/가로 UI를 분리하여 겹침/스케일 문제를 구조적으로 해결",
      "가로/전체화면에서 잘림(높이 344px 고정 + overflow hidden) 문제 수정",
      "전체화면 버튼은 항상 가로 UI로 확장 표시",
    ],
    detailsHtml: `
      <ul style="margin:8px 0 0 18px; line-height:1.6;">
        <li><b>UI 모드 분리</b>: ui-portrait / ui-landscape / ui-fs-landscape</li>
        <li><b>가로/전체화면 잘림 수정</b>: tableRoot overflow-y auto + min-height 적용</li>
        <li><b>autoscale 제한</b>: 가로/전체화면에서는 autoscale 비활성화</li>
      </ul>
    `,
  },
};
