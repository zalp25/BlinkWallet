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

export function openDeposit() {
  openOverlay("panel-deposit");

  // 🔥 глобальний UI — як у success
  const bottomNav = document.getElementById("bottom-nav");
  const backBtn = document.getElementById("back-btn");

  if (bottomNav) bottomNav.style.display = "none";
  if (backBtn) backBtn.style.display = "";

  showDwsBalances();
  initDeposit();
}

function initDeposit() {
  const input = document.getElementById("deposit-amount");
  const select = document.getElementById("deposit-currency");
  const error = document.getElementById("deposit-error");
  const confirmBtn = document.getElementById("confirm-deposit");

  input.value = "";
  error.textContent = "";
  select.innerHTML = "";
  confirmBtn.disabled = true;

  const currencies = sortByPriority(Object.keys(state.rates));
  for (const cur of currencies) {
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

  confirmBtn.onclick = () => {
    if (!validate()) return;

    const cur = select.value;
    const val = Number(input.value);

    state.balances[cur] = (state.balances[cur] ?? 0) + val;

    addHistory(`Deposit ${val} ${cur}`);
    renderAssets();

    hideDwsBalances();

    showSuccess({
      summary: `Deposit ${val} ${cur}`
    });
  };

  function validate() {
    const cur = select.value;
    const val = Number(input.value);

    clearError();

    if (!Number.isFinite(val) || val <= 0) {
      setError("Invalid amount");
      return false;
    }

    if (!(cur in MIN_AMOUNTS) || !(cur in MAX_AMOUNTS)) {
      setError("Unsupported currency");
      return false;
    }

    if (val < MIN_AMOUNTS[cur]) {
      setError(`Minimum: ${MIN_AMOUNTS[cur]} ${cur}`);
      return false;
    }

    if (val > MAX_AMOUNTS[cur]) {
      setError(`Maximum per transaction: ${MAX_AMOUNTS[cur]} ${cur}`);
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
