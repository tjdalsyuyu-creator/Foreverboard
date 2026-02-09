// js/modals/modalBase.js v1.6.5
import { pushSnapshot } from "../state.js";

export function openModal(dom, title, bodyHtml, onOk){
  dom.modalTitle.textContent = title;
  dom.modalBody.innerHTML = bodyHtml;
  dom.modalOk.onclick = (e) => {
    e.preventDefault();
    const ok = onOk?.();
    if(ok !== false) dom.modal.close("ok");
  };
  dom.modal.showModal();
}

// 이름/점수 수정
export function openEditModal(app, dom, seat, onDone){
  const p = app.runtime.players[seat];
  openModal(dom, "이름/점수 수정", `
    <div class="field"><label>이름</label><input id="name" value="${p.name}"/></div>
    <div class="field"><label>점수</label><input id="score" type="number" value="${p.score}"/></div>
  `, ()=>{
    pushSnapshot(app);
    const name = (document.getElementById("name").value||"").trim() || p.name;
    const score = Number(document.getElementById("score").value);
    p.name = name;
    if(!Number.isNaN(score)) p.score = score;
    onDone?.();
  });
}

// reset modal 용 raw
openEditModal.raw = (dom, title, html, onOk) => openModal(dom, title, html, onOk);