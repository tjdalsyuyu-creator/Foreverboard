// js/debug.js v1.0
function panel(){
  return document.getElementById("debugPanel");
}
export function dbg(msg){
  const p = panel();
  if(!p) return;
  const t = new Date().toLocaleTimeString();
  p.textContent = `[${t}] ${msg}\n` + p.textContent;
}

export function initGlobalErrorHook(){
  window.addEventListener("error", (e)=>{
    dbg(`❌ error: ${e.message}`);
  });
  window.addEventListener("unhandledrejection", (e)=>{
    dbg(`❌ promise: ${e.reason?.message || e.reason}`);
  });
}