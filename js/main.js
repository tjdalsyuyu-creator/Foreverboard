// js/main.js v1.6.5
import { loadApp, saveApp } from "./storage.js";
import { getDom } from "./dom.js";
import { render } from "./render.js";
import { bindActions } from "./actions.js";
import { initTopbar } from "./topbar.js";
import { initFullscreen } from "./fullscreen.js";
import { initAutoScale } from "./autoscale.js";

import { VERSION, LS, RELEASE_NOTES } from "./constants.js";
import { openModal } from "./modals/modalBase.js";

console.log("main.js v1.6.5 loaded");

function parseSemver(v) {
  return String(v || "0.0.0")
    .split(".")
    .map((x) => parseInt(x, 10) || 0)
    .slice(0, 3)
    .concat([0, 0, 0])
    .slice(0, 3);
}

function cmpSemver(a, b) {
  const A = parseSemver(a);
  const B = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (A[i] !== B[i]) return A[i] > B[i] ? 1 : -1;
  }
  return 0;
}

function buildUpdateHtml(note, version) {
  const summaryLis = (note?.summary || [])
    .map((t) => `<li>${t}</li>`)
    .join("");

  return `
    <div class="small" style="line-height:1.6;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div><b>${note?.title || `업데이트 v${version}`}</b></div>
        <button type="button" class="btn small" id="toggleUpdateDetailBtn">자세히 보기</button>
      </div>

      <div style="margin-top:8px; opacity:.95;">
        <ul style="margin:0 0 0 18px;">${summaryLis}</ul>
      </div>

      <div id="updateDetailBox" style="display:none; margin-top:10px;">
        <hr/>
        ${note?.detailsHtml || "<div style='opacity:.85;'>상세 내역이 없습니다.</div>"}
      </div>

      <hr/>
      <label style="display:flex; gap:8px; align-items:center;">
        <input type="checkbox" id="skipUpdateUntilChk" />
        <span>다시 보지 않기 (v${version}까지)</span>
      </label>
      <div style="opacity:.75; margin-top:6px;">
        * 확인을 누르면 ‘마지막 확인 버전’이 업데이트됩니다.
      </div>
    </div>
  `;
}

function wireUpdateModalToggles() {
  const btn = document.getElementById("toggleUpdateDetailBtn");
  const box = document.getElementById("updateDetailBox");
  if (btn && box) {
    btn.addEventListener("click", () => {
      const open = box.style.display !== "none";
      box.style.display = open ? "none" : "block";
      btn.textContent = open ? "자세히 보기" : "간단히 보기";
    });
  }
}

function openUpdateNotesModal(dom, { markSeen = true } = {}) {
  const note = RELEASE_NOTES[VERSION] || {
    title: `업데이트 v${VERSION}`,
    summary: ["변경 사항이 반영되었습니다."],
    detailsHtml: "",
  };

  openModal(dom, "업데이트", buildUpdateHtml(note, VERSION), () => {
    const chk = document.getElementById("skipUpdateUntilChk");
    if (chk?.checked) {
      localStorage.setItem(LS.SKIP_UPDATES_UNTIL, VERSION);
    } else {
      localStorage.removeItem(LS.SKIP_UPDATES_UNTIL);
    }

    if (markSeen) {
      localStorage.setItem(LS.LAST_SEEN_VERSION, VERSION);
    }
    return true;
  });

  wireUpdateModalToggles();
}

function maybeShowUpdateNotice(dom) {
  const skipUntil = localStorage.getItem(LS.SKIP_UPDATES_UNTIL);
  if (skipUntil && cmpSemver(VERSION, skipUntil) <= 0) return;

  const lastSeen = localStorage.getItem(LS.LAST_SEEN_VERSION) || "0.0.0";
  if (cmpSemver(VERSION, lastSeen) <= 0) return;

  openUpdateNotesModal(dom, { markSeen: true });
}

const app = loadApp();
const dom = getDom();

const rerender = () => {
  saveApp(app);
  render(app, dom);
};

// 초기 렌더
render(app, dom);

// ✅ 자동 업데이트 팝업(새 버전일 때만)
maybeShowUpdateNotice(dom);

// ✅ 상단바 “업데이트” 버튼: 언제든 열기
if (dom.updatesBtn) {
  dom.updatesBtn.addEventListener("click", () => {
    openUpdateNotesModal(dom, { markSeen: true });
  });
}

// 기능 초기화
bindActions(app, dom, rerender);
initTopbar(dom, rerender);
initFullscreen(dom, rerender);
initAutoScale(dom, rerender);
