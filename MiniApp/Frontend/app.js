console.log("BlinkWallet loaded");

// Imports
import { state } from "./state.js";

import { initAssets, renderAssets } from "./Assets/assets.js";
import { initHome } from "./Home/home.js";
import { initHistory } from "./History/history.js";
import { initSettings } from "./Settings/settings.js";

// UI state
let overlayOpen = false;

// Data
async function loadRates() {
  const res = await fetch("./Currencies/rates.json");
  state.rates = await res.json();

  for (const k in state.rates) {
    if (!(k in state.balances)) {
      state.balances[k] = 0;
    }
  }
}

function applyTelegramUser() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (!tgUser) return;

  const name = (tgUser.first_name ?? "").trim();

  if (name) state.username = name;

  const input = document.getElementById("settings-name");
  if (input && name) input.value = name;
}

// Global UI helpers

function showNav() {
  const nav = document.getElementById("bottom-nav");
  if (!nav) return;

  nav.style.display = "";
  nav.classList.remove("hidden");
}

function hideNav() {
  const nav = document.getElementById("bottom-nav");
  if (!nav) return;

  nav.classList.add("hidden");
  nav.style.display = "none";
}

function showBackBtn() {
  const btn = document.getElementById("back-btn");
  if (!btn) return;

  btn.style.display = "";
  btn.classList.remove("hidden");
}

function hideBackBtn() {
  const btn = document.getElementById("back-btn");
  if (!btn) return;

  btn.classList.add("hidden");
  btn.style.display = "none";
}

function showTotalValue() {
  document.querySelector(".assets-summary")?.classList.remove("hidden");
}

function hideTotalValue() {
  document.querySelector(".assets-summary")?.classList.add("hidden");
}

function hideDwsBalances() {
  document.getElementById("dws-balances")?.classList.add("hidden");

  const list = document.getElementById("dws-balances-list");
  if (list) list.innerHTML = "";
}

// Tabs

function initTabs() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.onclick = () => {
      if (overlayOpen) return;

      document.querySelectorAll(".nav-item")
        .forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab")
        .forEach(t => t.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(btn.dataset.tab)
        ?.classList.add("active");

      hideDwsBalances();
      showNav();

      if (btn.dataset.tab === "assets") {
        showTotalValue();
        renderAssets();
      } else {
        hideTotalValue();
      }
    };
  });
}

function getOverlayPanels() {
  return document.querySelectorAll('section[id^="panel-"]');
}

// Overlays

export function openOverlay(panelId, { showBack = true } = {}) {
  overlayOpen = true;

  hideNav();
  hideTotalValue();
  hideDwsBalances();

  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));

  getOverlayPanels()
    .forEach(p => p.classList.add("hidden"));

  document.getElementById(panelId)
    ?.classList.remove("hidden");

  showBack ? showBackBtn() : hideBackBtn();
}

export function closeOverlay() {
  overlayOpen = false;

  getOverlayPanels()
    .forEach(p => p.classList.add("hidden"));

  hideBackBtn();
  hideDwsBalances();

  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".nav-item")
    .forEach(b => b.classList.remove("active"));

  document.getElementById("assets")
    ?.classList.add("active");
  document.querySelector('[data-tab="assets"]')
    ?.classList.add("active");

  showNav();
  showTotalValue();
  renderAssets();
}

// Boot

document.addEventListener("DOMContentLoaded", async () => {
  await loadRates();
  applyTelegramUser();

  initHome();
  initAssets();
  initHistory();
  initSettings();
  initTabs();

  document.getElementById("back-btn").onclick = closeOverlay;
  document.getElementById("home-more")?.addEventListener("click", () => {
    if (overlayOpen) return;
    const btn = document.querySelector('[data-tab="assets"]');
    btn?.click();
  });

  showNav();
  showTotalValue();
  renderAssets();
});

