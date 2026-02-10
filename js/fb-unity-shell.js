// js/fb-unity-shell.js
(function initUnityShell() {
  const shell = document.getElementById("fbShell");
  const btnA = document.getElementById("fullscreenBtn");   // 기존 버튼
  const btnB = document.getElementById("fbFullscreenBtn"); // footer 버튼(선택)

  if (!shell) return;

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        // 전체 문서 전체화면(호환성 최고)
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (e) {
      console.warn("[fb-unity-shell] fullscreen failed:", e);
    }
  }

  if (btnA) btnA.addEventListener("click", toggleFullscreen);
  if (btnB) btnB.addEventListener("click", toggleFullscreen);

  document.addEventListener("fullscreenchange", () => {
    shell.classList.toggle("fb-fs", !!document.fullscreenElement);
  });
})();
