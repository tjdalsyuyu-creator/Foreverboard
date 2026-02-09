// js/main.js v1.6.5
import { loadApp, saveApp } from "./storage.js";
import { getDom } from "./dom.js";
import { render } from "./render.js";
import { bindActions } from "./actions.js";
import { initTopbar } from "./topbar.js";
import { initFullscreen } from "./fullscreen.js";
import { initAutoScale } from "./autoscale.js";

console.log("main.js v1.6.5 loaded");

const app = loadApp();
const dom = getDom();

const rerender = () => {
  saveApp(app);
  render(app, dom);
};

// 초기 렌더
render(app, dom);

// 기능 초기화
bindActions(app, dom, rerender);
initTopbar(dom, rerender);
initFullscreen(dom, rerender);
initAutoScale(dom, rerender);
