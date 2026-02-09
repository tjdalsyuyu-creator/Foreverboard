// js/main.js v1.6.5 (debug-wired)
import { initGlobalErrorHook, dbg } from "./debug.js";
import { loadApp, saveApp } from "./storage.js";
import { getDom } from "./dom.js";
import { render } from "./render.js";
import { bindActions } from "./actions.js";
import { initTopbar } from "./topbar.js";
import { initFullscreen } from "./fullscreen.js";
import { initAutoScale } from "./autoscale.js";

initGlobalErrorHook();
dbg("✅ main.js loaded");

const app = loadApp();
dbg("✅ loadApp OK");

const dom = getDom();
dbg(`✅ DOM OK (fullscreenBtn=${!!dom.fullscreenBtn}, topbar=${!!dom.topbar})`);

const rerender = () => {
  saveApp(app);
  render(app, dom);
};

render(app, dom);
dbg("✅ first render OK");

bindActions(app, dom, rerender);
dbg("✅ actions bound");

initTopbar(dom, rerender);
dbg("✅ topbar init");

initAutoScale(dom, rerender);
dbg("✅ autoscale init");

/* ✅ fullscreen 초기화에서 '버튼 클릭 이벤트가 붙었는지'를 디버그로 확인 */
try{
  initFullscreen(dom, rerender);
  dbg("✅ fullscreen init called");
}catch(e){
  dbg(`❌ fullscreen init crashed: ${e.message || e}`);
}