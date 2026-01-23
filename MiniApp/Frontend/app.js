console.log("BlinkWallet loaded");

/* ===== IMPORTS ===== */
import { state } from "./state.js";
import { hideDwsBalances } from "./Assets/assets.js";

import { initHome } from "./Home/home.js";
import { initAssets } from "./Assets/assets.js";
import { initHistory } from "./History/history.js";
import { initSettings } from "./Settings/settings.js";

/* ===== APP MODE ===== */
let overlayOpen = false;

/* ===== DATA LOAD ===== */
async function loadRates() {
  const res = await fetch("./Backend/rates.json");
  state.rates = await res.json();

  // ensure all currencies exist in balances
  for (const k in state.rates) {
    if (!(k in state.balances)) {
      state.balances[k] = 0;
    }
  }
}

/* ===== TAB NAVIGATION ===== */
function initTabs() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.onclick = () => {
      if (overlayOpen) return;

      document.querySelectorAll(".nav-item")
        .forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab")
        .forEach(t => t.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    };
  });
}

/* =========================================================
   OVERLAY CONTROL — SINGLE SOURCE OF TRUTH
   ========================================================= */

export function openOverlay(panelId, options = {}) {
  const {
    showBack = true,
    showNav = false
  } = options;

  // 🔥 чистимо будь-який попередній DWS-контекст
  hideDwsBalances();

  overlayOpen = true;

  // hide tabs
  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));

  // hide all panels
  document.querySelectorAll(".panel")
    .forEach(p => p.classList.add("hidden"));

  // show target panel
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.remove("hidden");

  const backBtn = document.getElementById("back-btn");
  const bottomNav = document.getElementById("bottom-nav");

  // BACK
  if (showBack) backBtn.classList.remove("hidden");
  else backBtn.classList.add("hidden");

  // NAV (тільки через classList, НЕ display)
  if (showNav) bottomNav.classList.remove("hidden");
  else bottomNav.classList.add("hidden");
}

export function closeOverlay() {
  overlayOpen = false;

  // hide all panels
  document.querySelectorAll(".panel")
    .forEach(p => p.classList.add("hidden"));

  hideDwsBalances();

  const bottomNav = document.getElementById("bottom-nav");
  const backBtn = document.getElementById("back-btn");

  // ⛔ НЕ показуємо nav якщо success ще активний
  const successPanel = document.getElementById("panel-success");
  const successVisible =
    successPanel && !successPanel.classList.contains("hidden");

  if (!successVisible) {
    if (bottomNav) {
      bottomNav.classList.remove("hidden");
      bottomNav.style.display = ""; // 🔥 скидання після deposit
    }
  }

  if (backBtn) backBtn.classList.add("hidden");

  // return to Assets tab
  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));

  document.getElementById("assets").classList.add("active");

  document.querySelectorAll(".nav-item")
    .forEach(b => b.classList.remove("active"));

  document.querySelector('[data-tab="assets"]')
    .classList.add("active");
}

/* ===== APP BOOTSTRAP ===== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadRates();

  initHome();
  initAssets();
  initHistory();
  initSettings();
  initTabs();

  document.getElementById("back-btn").onclick = closeOverlay;
});
