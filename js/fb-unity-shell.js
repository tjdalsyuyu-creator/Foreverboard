// js/fb-unity-shell.js
(function initUnityShell() {
  const shell = document.getElementById("fbShell");
  const viewport = document.getElementById("fbViewport");
  const app = document.getElementById("fbApp");
  const btnA = document.getElementById("fullscreenBtn");   // 기존 버튼
  const btnB = document.getElementById("fbFullscreenBtn"); // footer 버튼(선택)

  if (!shell || !viewport || !app) return;

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
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

  function setFullscreenClass() {
    document.body.classList.toggle("fb-fullscreen", !!document.fullscreenElement);
  }

  function fitScale() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    const aw = app.scrollWidth;
    const ah = app.scrollHeight;

    if (!vw || !vh || !aw || !ah) return;

    // 화면에 딱 맞게(스크롤 없게) 축소만 허용
    const scale = Math.min(vw / aw, vh / ah, 1);

    app.style.transform = `scale(${scale})`;
    app.style.width = `${aw}px`;
    app.style.height = `${ah}px`;
  }

  document.addEventListener("fullscreenchange", () => {
    shell.classList.toggle("fb-fs", !!document.fullscreenElement);
    setFullscreenClass();
    fitScale();
    setTimeout(fitScale, 50);
  });

  window.addEventListener("resize", () => {
    fitScale();
    setTimeout(fitScale, 50);
  });

  setFullscreenClass();
  fitScale();
  setTimeout(fitScale, 50);
})();
