console.log("BlinkWallet loaded");

// Imports
import { state, loadState, saveState } from "./state.js";

import { initAssets, renderAssets } from "./Assets/assets.js";
import { initHome, renderHome } from "./Home/home.js";
import { initHistory } from "./History/history.js";
import { initSettings } from "./Settings/settings.js";

// UI state
let overlayOpen = false;

// Data
async function loadRates() {
  const sources = [
    "https://blinkwallet2.mr-sasha-if.workers.dev/rates",
    "./Currencies/rates.json"
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();

      if (data && data.current) {
        state.rates = data.current;
        state.roi = data.roi ?? {};
        return;
      }

      if (data && typeof data === "object") {
        state.rates = data;
        state.roi = {};
        return;
      }
    } catch {
      // try next source
    }
  }

  for (const k in state.rates) {
    if (!(k in state.balances)) {
      state.balances[k] = 0;
    }
  }

  saveState();
}

function applyTelegramUser() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  webApp.ready();

  const tgUser = webApp.initDataUnsafe?.user;
  if (!tgUser) return;

  const name = (tgUser.first_name ?? "").trim();
  if (!name) return;

  state.username = name;

  const input = document.getElementById("settings-name");
  if (input) input.value = name;
  renderHome();
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
  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const nav = document.getElementById("bottom-nav");

  const updateNavIndicator = () => {
    const activeIndex = navItems.findIndex(item => item.classList.contains("active"));
    if (nav) nav.style.setProperty("--nav-active-index", Math.max(activeIndex, 0));
  };

  navItems.forEach(btn => {
    btn.onclick = () => {
      if (overlayOpen) return;

      navItems.forEach(b => b.classList.remove("active"));
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

      updateNavIndicator();
    };
  });

  updateNavIndicator();
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
  loadState();
  await loadRates();

  initHome();
  initAssets();
  initHistory();
  initSettings();
  initTabs();

  applyTelegramUser();

  document.getElementById("back-btn").onclick = closeOverlay;
  document.getElementById("home-more")?.addEventListener("click", () => {
    if (overlayOpen) return;
    const btn = document.querySelector('[data-tab="assets"]');
    btn?.click();
  });

  showNav();
  showTotalValue();
  renderAssets();

  saveState();
});

