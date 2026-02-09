// js/main.js v1.6.5
import { loadApp, saveApp } from "./storage.js";
import { getDom } from "./dom.js";
import { render } from "./render.js";
import { bindActions } from "./actions.js";
import { initTopbar } from "./topbar.js";
import { initFullscreen } from "./fullscreen.js";
import { initAutoScale } from "./autoscale.js";

// ✅ 추가 import
import { VERSION, LS, UPDATE_NOTES_HTML } from "./constants.js";
import { openModal } from "./modals/modalBase.js";

console.log("main.js v1.6.5 loaded");

const app = loadApp();
const dom = getDom();

// ✅ 추가: 업데이트 팝업
function maybeShowUpdateNotice() {
  const lastSeen = localStorage.getItem(LS.LAST_SEEN_VERSION);
  if (lastSeen === VERSION) return;

  openModal(
    dom,
    `업데이트 v${VERSION}`,
    UPDATE_NOTES_HTML,
    () => {
      localStorage.setItem(LS.LAST_SEEN_VERSION, VERSION);
      return true;
    }
  );
}

const rerender = () => {
  saveApp(app);
  render(app, dom);
};

// ✅ 초기 렌더 전에/후에 원하는 타이밍 선택 가능
// 보통은 “처음 켰을 때 바로” 느낌을 주려면 렌더 직후가 자연스러움.
render(app, dom);
maybeShowUpdateNotice();

// 기능 초기화
bindActions(app, dom, rerender);
initTopbar(dom, rerender);
initFullscreen(dom, rerender);
initAutoScale(dom, rerender);
