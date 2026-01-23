import { openOverlay, closeOverlay } from "../../../app.js";

export function showSuccess({ summary }) {
  const summaryEl = document.getElementById("success-summary");
  const closeBtn = document.getElementById("success-close");

  const bottomNav = document.getElementById("bottom-nav");
  const backBtn = document.getElementById("back-btn");

  if (!summaryEl || !closeBtn) {
    console.error("Success overlay elements not found");
    return;
  }

  summaryEl.textContent = summary;

  // 🔥 СИНХРОНІЗАЦІЯ З DEPOSIT (inline-style + class)
  if (bottomNav) {
    bottomNav.style.display = "none";
    bottomNav.classList.add("hidden");
  }

  if (backBtn) {
    backBtn.style.display = "none";
    backBtn.classList.add("hidden");
  }

  openOverlay("panel-success", {
    showBack: false,
    showNav: false
  });

  closeBtn.onclick = () => {
    closeOverlay();
    // ❗ НІЧОГО НЕ ВІДНОВЛЮЄМО ТУТ
    // це робить app.js
  };
}
