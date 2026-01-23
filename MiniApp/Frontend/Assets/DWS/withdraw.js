import {
  state,
  MIN_AMOUNTS,
  MAX_AMOUNTS,
  sortByPriority
} from "../../state.js";

import {
  renderAssets,
  showDwsBalances,
  hideDwsBalances
} from "../assets.js";

import { addHistory } from "../../History/history.js";
import { openOverlay } from "../../app.js";
import { showSuccess } from "./Success/success.js";

export function openWithdraw() {
  openOverlay("panel-withdraw");

  // 🔥 глобальний UI — як у deposit / swap / success
  const bottomNav = document.getElementById("bottom-nav");
  const backBtn = document.getElementById("back-btn");

  if (bottomNav) bottomNav.style.display = "none";
  if (backBtn) backBtn.style.display = "";

  showDwsBalances();
  initWithdraw();
}

function initWithdraw() {
  const input = document.getElementById("withdraw-amount");
  const select = document.getElementById("withdraw-currency");
  const error = document.getElementById("withdraw-error");
  const maxBtn = document.getElementById("withdraw-max");
  const confirmBtn = document.getElementById("confirm-withdraw");

  input.value = "";
  error.textContent = "";
  select.innerHTML = "";
  confirmBtn.disabled = true;

  // тільки валюти з балансом
  const available = sortByPriority(
    Object.keys(state.balances).filter(k => state.balances[k] > 0)
  );

  if (!available.length) {
    select.append(new Option("No assets", ""));
    setError("Insufficient balance");
    select.disabled = true;
    maxBtn.disabled = true;
    return;
  }

  for (const cur of available) {
    select.append(new Option(cur, cur));
  }

  input.oninput = () => {
    sanitize(input);
    validate();
  };

  select.onchange = () => {
    input.value = "";
    clearError();
    confirmBtn.disabled = true;
  };

  maxBtn.onclick = () => {
    const cur = select.value;
    input.value = Math.min(
      state.balances[cur],
      MAX_AMOUNTS[cur]
    );
    validate();
  };

  confirmBtn.onclick = () => {
    if (!validate()) return;

    const cur = select.value;
    const amount = Number(input.value);

    state.balances[cur] -= amount;

    addHistory(`Withdraw ${amount} ${cur}`);
    renderAssets();

    hideDwsBalances();

    // ✅ ФІНАЛЬНИЙ ЕКРАН
    showSuccess({
      summary: `Withdraw ${amount} ${cur}`
    });
  };

  function validate() {
    const cur = select.value;
    const amount = Number(input.value);

    clearError();

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Invalid amount");
      return false;
    }

    if (amount < MIN_AMOUNTS[cur]) {
      setError(`Minimum: ${MIN_AMOUNTS[cur]} ${cur}`);
      return false;
    }

    if (amount > MAX_AMOUNTS[cur]) {
      setError(`Maximum per transaction: ${MAX_AMOUNTS[cur]} ${cur}`);
      return false;
    }

    if (amount > state.balances[cur]) {
      setError("Insufficient balance");
      return false;
    }

    confirmBtn.disabled = false;
    return true;
  }

  function setError(msg) {
    error.textContent = msg;
    input.classList.add("input-error");
    confirmBtn.disabled = true;
  }

  function clearError() {
    error.textContent = "";
    input.classList.remove("input-error");
  }
}

function sanitize(input) {
  input.value = input.value.replace(/[^0-9.]/g, "");
  const parts = input.value.split(".");
  if (parts.length > 2) {
    input.value = parts[0] + "." + parts.slice(1).join("");
  }
}
