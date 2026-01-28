import { openOverlay, closeOverlay } from "../../../app.js";

export function showSuccess({ summary }) {
  const summaryEl = document.getElementById("success-summary");
  const closeBtn = document.getElementById("success-close");

  if (!summaryEl || !closeBtn) return;

  summaryEl.textContent = summary;

  openOverlay("panel-success", {
    showBack: false
  });

  closeBtn.onclick = closeOverlay;
}
