// js/constants.js v1.6.5
export const VERSION = "1.6.5";

export const LS = {
  UI_TOPBAR_HIDDEN: "mjp_ui_topbar_hidden_v1",
  AUTO_HIDE_TOPBAR_IN_FS: "mjp_auto_hide_topbar_in_fs_v1",

  SCHEMA: "mjp_v16_schema",
  RUNTIME: "mjp_v16_runtime",
  RULESETS: "mjp_v16_rulesets",
  ACTIVE_RULESET_ID: "mjp_v16_active_ruleset_id",
  HANDS_PLANS: "mjp_v16_hands_plans",

  // ✅ 추가: 업데이트 팝업 표시 여부(마지막 확인 버전)
  LAST_SEEN_VERSION: "mjp_last_seen_version",
};

export const SCHEMA_VERSION = 2;

export const SEATS = [0,1,2,3];
export const DEFAULT_NAMES = ["동","남","서","북"];

// ✅ 선택: 업데이트 안내 내용(버전 올릴 때 여기만 수정하면 됨)
export const UPDATE_NOTES_HTML = `
  <div class="small" style="line-height:1.6;">
    <div><b>업데이트 안내</b></div>
    <ul style="margin:8px 0 0 18px;">
      <li>최종정산: 공식/중간값 표시 개선</li>
      <li>UI/버그 수정</li>
    </ul>
    <hr/>
    <div style="opacity:.85;">확인을 누르면 이 버전에서는 다시 표시되지 않습니다.</div>
  </div>
`;
