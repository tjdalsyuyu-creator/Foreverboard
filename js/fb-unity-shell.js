// js/fb-unity-shell.js
(function initUnityShell() {
  const shell = document.getElementById("fbShell");
  const btn = document.getElementById("fbFullscreenBtn");

  if (!shell || !btn) return;

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        // 전체 문서 전체화면(가장 호환 좋음)
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (e) {
      console.warn("[fb-unity-shell] fullscreen failed:", e);
    }
  }

  btn.addEventListener("click", toggleFullscreen);

  document.addEventListener("fullscreenchange", () => {
    shell.classList.toggle("fb-fs", !!document.fullscreenElement);
  });
})();
