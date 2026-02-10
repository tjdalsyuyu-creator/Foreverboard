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

  function measureVisualBounds() {
    // scale/position 초기화 상태에서 측정해야 정확함
    const baseRect = app.getBoundingClientRect();

    let minL = baseRect.left;
    let minT = baseRect.top;
    let maxR = baseRect.right;
    let maxB = baseRect.bottom;

    // ⚠️ 전체 스캔(요소 수가 많지 않아 충분히 가능)
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

    // app의 (0,0) 기준에서 얼마나 튀어나갔는지 오프셋
    const offsetX = minL - baseRect.left;
    const offsetY = minT - baseRect.top;

    return { width, height, offsetX, offsetY };
  }

  function fitScale() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    if (!vw || !vh) return;

    // 1) 초기화(측정 정확도를 위해)
    app.style.left = "0px";
    app.style.top = "0px";
    app.style.transform = "translate(0px, 0px) scale(1)";
    app.style.width = "auto";
    app.style.height = "auto";

    // 2) 실제 보이는 전체 영역 측정(absolute 튀어나감 포함)
    const { width, height, offsetX, offsetY } = measureVisualBounds();

    // 3) 스케일(축소만 허용)
    const scale = Math.min(vw / width, vh / height, 1);

    // 4) 가운데 정렬 위치 계산
    const left = Math.max(0, (vw - width * scale) / 2);
    const top = Math.max(0, (vh - height * scale) / 2);

    // 5) offset 보정: 튀어나간 만큼 안쪽으로 translate해서 “전체 박스”가 fit 되게
    // offsetX/Y는 px 단위(스케일 전), translate도 스케일 전 기준으로 걸어야 함
    app.style.left = `${left}px`;
    app.style.top = `${top}px`;
    app.style.transform = `translate(${-offsetX}px, ${-offsetY}px) scale(${scale})`;

    // 디버그 필요하면 아래 콘솔
    // console.log({ vw, vh, width, height, offsetX, offsetY, scale, left, top })
