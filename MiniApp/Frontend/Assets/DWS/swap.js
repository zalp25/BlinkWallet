import {
  state,
  DECIMALS,
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

let activeField = "from";

export function openSwap() {
  openOverlay("panel-swap");

  // 🔥 глобальний UI — ЯК У DEPOSIT
  const bottomNav = document.getElementById("bottom-nav");
  const backBtn = document.getElementById("back-btn");

  if (bottomNav) bottomNav.style.display = "none";
  if (backBtn) backBtn.style.display = "";

  showDwsBalances();
  initSwap();
}

function initSwap() {
  const fromInput = document.getElementById("swap-from-amount");
  const toInput = document.getElementById("swap-to-amount");
  const fromSelect = document.getElementById("swap-from-currency");
  const toSelect = document.getElementById("swap-to-currency");
  const error = document.getElementById("swap-error");
  const maxBtn = document.getElementById("swap-max");
  const confirmBtn = document.getElementById("confirm-swap");

  fromInput.value = "";
  toInput.value = "";
  error.textContent = "";
  confirmBtn.disabled = true;

  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";

  // TO — всі валюти
  for (const k of sortByPriority(Object.keys(state.rates))) {
    toSelect.append(new Option(k, k));
  }

  // FROM — тільки з балансом
  const available = sortByPriority(
    Object.keys(state.balances).filter(k => state.balances[k] > 0)
  );

  if (!available.length) {
    setError("Insufficient balance");
    fromSelect.append(new Option("No assets", ""));
    fromSelect.disabled = true;
    toSelect.disabled = true;
    maxBtn.disabled = true;
    return;
  }

  for (const k of available) {
    fromSelect.append(new Option(k, k));
  }

  fromInput.oninput = () => {
    sanitize(fromInput);
    activeField = "from";
    recalc();
  };

  toInput.oninput = () => {
    sanitize(toInput);
    activeField = "to";
    recalc();
  };

  fromSelect.onchange = resetAndRecalc;
  toSelect.onchange = resetAndRecalc;

  maxBtn.onclick = () => {
    const cur = fromSelect.value;
    fromInput.value = Math.min(state.balances[cur], MAX_AMOUNTS[cur]);
    activeField = "from";
    recalc();
  };

  confirmBtn.onclick = () => {
    if (!validate()) return;

    const fromCur = fromSelect.value;
    const toCur = toSelect.value;
    const amount = Number(fromInput.value);
    const receive = Number(toInput.value);

    state.balances[fromCur] -= amount;
    state.balances[toCur] = (state.balances[toCur] ?? 0) + receive;

    addHistory(`Swap ${amount} ${fromCur} → ${receive} ${toCur}`);
    renderAssets();

    hideDwsBalances();

    showSuccess({
      summary: `Swap ${amount} ${fromCur} → ${receive} ${toCur}`
    });
  };

  function resetAndRecalc() {
    fromInput.value = "";
    toInput.value = "";
    clearError();
    confirmBtn.disabled = true;
  }

  function recalc() {
    const fromCur = fromSelect.value;
    const toCur = toSelect.value;

    if (!fromCur || !toCur || fromCur === toCur) {
      setError("Select different currencies");
      return;
    }

    const rateFrom = state.rates[fromCur];
    const rateTo = state.rates[toCur];

    const fromVal = Number(fromInput.value);
    const toVal = Number(toInput.value);

    if (activeField === "from" && Number.isFinite(fromVal)) {
      toInput.value = ((fromVal * rateFrom) / rateTo)
        .toFixed(DECIMALS[toCur]);
    }

    if (activeField === "to" && Number.isFinite(toVal)) {
      fromInput.value = ((toVal * rateTo) / rateFrom)
        .toFixed(DECIMALS[fromCur]);
    }

    validate();
  }

  function validate() {
    const cur = fromSelect.value;
    const amount = Number(fromInput.value);

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
      setError(`Maximum per swap: ${MAX_AMOUNTS[cur]} ${cur}`);
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
    confirmBtn.disabled = true;
    fromInput.classList.add("input-error");
  }

  function clearError() {
    error.textContent = "";
    fromInput.classList.remove("input-error");
  }
}

function sanitize(input) {
  input.value = input.value.replace(/[^0-9.]/g, "");
  const parts = input.value.split(".");
  if (parts.length > 2) {
    input.value = parts[0] + "." + parts.slice(1).join("");
  }
}
