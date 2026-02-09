console.log("BlinkWallet loaded");

// Imports
import { state, loadState, saveState } from "./state.js";
import { saveRemoteBalances } from "./api.js";
import { initAuth, requireAuth, trySessionLogin } from "./auth.js";
import {
  showNav,
  hideNav,
  showBackBtn,
  hideBackBtn,
  showTotalValue,
  hideTotalValue
} from "./ui.js";

import { initAssets, renderAssets } from "./Assets/assets.js";
import { initHome, renderHome } from "./Home/home.js";
import { initHistory } from "./History/history.js";
import { initSettings } from "./Settings/settings.js";

// UI state
let overlayOpen = false;

// Data loading
async function loadRates() {
  const sources = ["http://localhost:8080/rates", "./Currencies/rates.json"];

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

// Prefill name from Telegram if available.
function applyTelegramUser() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  webApp.ready();

  const tgUser = webApp.initDataUnsafe?.user;
  if (!tgUser) return;

  const name = (tgUser.first_name ?? "").trim();
  if (!name) return;

  if (state.loggedIn) return;
  const regInput = document.getElementById("register-name");
  if (regInput && !regInput.value.trim()) {
    regInput.value = name;
  }
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
      if (!state.loggedIn) {
        requireAuth();
        return;
      }

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
  initAuth();
  const hasSession = await trySessionLogin();
  if (!hasSession) {
    requireAuth();
  }
  initTabs();

  applyTelegramUser();

  document.getElementById("back-btn").onclick = closeOverlay;
  document.getElementById("home-more")?.addEventListener("click", () => {
    if (overlayOpen) return;
    const btn = document.querySelector('[data-tab="assets"]');
    btn?.click();
  });

  if (!state.loggedIn) {
    requireAuth();
  } else {
    showNav();
    showTotalValue();
    renderAssets();
  }

  saveState();

  setInterval(() => {
    if (!state.loggedIn || !state.userId) return;
    saveRemoteBalances(state.userId, state.balances);
  }, 30000);
});

