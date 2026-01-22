console.log("BlinkWallet loaded");

/* ===== IMPORTS ===== */
import { state } from "./state.js";

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

  // IMPORTANT: всі валюти існують навіть з 0 балансом
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
      // 🔒 блокуємо тільки коли overlay реально відкритий
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

/* ===== OVERLAY CONTROL ===== */
export function openOverlay(panelId) {
  overlayOpen = true;

  // hide tabs
  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));

  // hide all panels
  document.querySelectorAll(".panel")
    .forEach(p => p.classList.add("hidden"));

  // show target panel
  document.getElementById(panelId).classList.remove("hidden");

  // UI
  document.getElementById("bottom-nav").classList.add("hidden");
  document.getElementById("back-btn").classList.remove("hidden");
}

export function closeOverlay() {
  overlayOpen = false;

  // hide all panels
  document.querySelectorAll(".panel")
    .forEach(p => p.classList.add("hidden"));

  // restore UI
  document.getElementById("bottom-nav").classList.remove("hidden");
  document.getElementById("back-btn").classList.add("hidden");

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
