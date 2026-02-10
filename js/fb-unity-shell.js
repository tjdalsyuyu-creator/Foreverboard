// js/fb-unity-shell.js
(function initUnityShell() {
  const shell = document.getElementById("fbShell");
  const viewport = document.getElementById("fbViewport");
  const app = document.getElementById("fbApp");

  // 버튼 2개(둘 다 동작하게)
  const btnA = document.getElementById("fullscreenBtn");   // 기존 상태바 버튼
  const btnB = document.getElementById("fbFullscreenBtn"); // footer 버튼

  if (!shell || !viewport || !app) {
    console.warn("[fb-unity-shell] missing elements", { shell, viewport, app });
    return;
  }

  // ---------- Fullscreen (cross-browser) ----------
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  async function requestFs() {
    const target = shell; // ✅ documentElement 말고 shell을 풀스크린 타겟으로

    try {
      if (target.requestFullscreen) {
        // navigationUI 옵션은 지원 안 하는 브라우저가 있어 try/catch
        try {
          await target.requestFullscreen({ navigationUI: "hide" });
        } catch {
          await target.requestFullscreen();
        }
        return;
      }
      if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
        return;
      }
      console.warn("[fb-unity-shell] Fullscreen API not supported.");
    } catch (e) {
      console.warn("[fb-unity-shell] requestFullscreen failed:", e);
    }
  }

  async function exitFs() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return;
      }
      if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        return;
      }
    } catch (e) {
      console.warn("[fb-unity-shell] exitFullscreen failed:", e);
    }
  }

  async function toggleFullscreen(e) {
    // 다른 핸들러와 충돌 줄이기
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }
    if (!isFullscreen()) await requestFs();
    else await exitFs();
  }

  if (btnA) btnA.addEventListener("click", toggleFullscreen, { passive: false });
  if (btnB) btnB.addEventListener("click", toggleFullscreen, { passive: false });

  function syncFullscreenClass() {
    const fs = isFullscreen();
    document.body.classList.toggle("fb-fullscreen", fs);
    shell.classList.toggle("fb-fs", fs);
  }

  // ---------- Fit Scale (robust) ----------
  function measureVisualBounds() {
    // 스케일/이동 초기화 상태에서 측정
    const base = app.getBoundingClientRect();

    let minL = base.left;
    let minT = base.top;
    let maxR = base.right;
    let maxB = base.bottom;

    const nodes = app.querySelectorAll("*");
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      if (!r || (!r.width && !r.height)) continue;
      minL = Math.min(minL, r.left);
      minT = Math.min(minT, r.top);
      maxR = Math.max(maxR, r.right);
      maxB = Math.max(maxB, r.bottom);
    }

    const width = Math.max(1, maxR - minL);
    const height = Math.max(1, maxB - minT);

    const offsetX = minL - base.left;
    const offsetY = minT - base.top;

    return { width, height, offsetX, offsetY };
  }

  let rafId = 0;
  function scheduleFit() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      fitScale();
    });
  }

  function fitScale() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    if (!vw || !vh) return;

    // 1) 초기화
    app.style.left = "0px";
    app.style.top = "0px";
    app.style.width = "auto";
    app.style.height = "auto";
    app.style.transform = "translate(0px, 0px) scale(1)";

    // 2) 렌더/레이아웃이 아직 덜 끝났을 수 있어 한 번 더 프레임을 주기도 함
    // 하지만 여기서는 관측(Observer)로 계속 따라가므로 즉시 측정
    const { width, height, offsetX, offsetY } = measureVisualBounds();

    // 3) 축소만 허용 (스크롤/잘림 방지)
    const scale = Math.min(vw / width, vh / height, 1);

    // 4) 가운데 정렬
    const left = Math.max(0, (vw - width * scale) / 2);
    const top = Math.max(0, (vh - height * scale) / 2);

    // 5) 튀어나간 만큼 보정 + 스케일 적용
    app.style.left = `${left}px`;
    app.style.top = `${top}px`;
    app.style.transform = `translate(${-offsetX}px, ${-offsetY}px) scale(${scale})`;
  }

  // ---------- Observers: 렌더 변화/사이즈 변화 따라가기 ----------
  // 앱 내부 UI가 바뀌면(좌석 렌더/상단바 토글 등) bounding이 바뀌므로 다시 계산
  const mo = new MutationObserver(() => scheduleFit());
  mo.observe(app, { childList: true, subtree: true, attributes: true, characterData: true });

  // 요소 크기 변화 추적(모바일 주소창/회전/전체화면 전환 등)
  const ro = new ResizeObserver(() => scheduleFit());
  ro.observe(viewport);
  ro.observe(app);

  window.addEventListener("resize", () => scheduleFit());
  window.addEventListener("orientationchange", () => scheduleFit());

  document.addEventListener("fullscreenchange", () => {
    syncFullscreenClass();
    scheduleFit();
    // 모바일은 한 번 더 튀는 경우가 많아서 딜레이 재계산
    setTimeout(scheduleFit, 120);
  });
  document.addEventListener("webkitfullscreenchange", () => {
    syncFullscreenClass();
    scheduleFit();
    setTimeout(scheduleFit, 120);
  });

  // ---------- Init ----------
  syncFullscreenClass();
  // 초기 로딩 동안 몇 번 더 맞춰줌(초기 렌더 타이밍 차이 흡수)
  scheduleFit();
  setTimeout(scheduleFit, 80);
  setTimeout(scheduleFit, 200);
  setTimeout(scheduleFit, 400);
})();
