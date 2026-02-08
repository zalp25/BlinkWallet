import {
  state,
  DECIMALS,
  MIN_AMOUNTS,
  MAX_AMOUNTS,
  sortByPriority,
  saveState
} from "../../state.js";
import { saveRemoteBalances } from "../../api.js";

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
  showDwsBalances();
  initSwap();
}

function initSwap() {
  // Swap uses current rates and updates balances.
  const fromInput = document.getElementById("swap-from-amount");
  const toInput = document.getElementById("swap-to-amount");
  const fromSelect = document.getElementById("swap-from-currency");
  const toSelect = document.getElementById("swap-to-currency");
  const error = document.getElementById("swap-error");
  const maxBtn = document.getElementById("swap-max");
  const confirmBtn = document.getElementById("confirm-swap");

  // Reset form state
  fromInput.value = "";
  toInput.value = "";
  error.textContent = "";
  confirmBtn.disabled = true;

  fromSelect.disabled = false;
  toSelect.disabled = false;
  maxBtn.disabled = false;

  const allCurrencies = sortByPriority(
    Array.from(
      new Set([
        ...Object.keys(state.rates),
        ...Object.keys(state.balances),
        ...Object.keys(DECIMALS)
      ])
    )
  );
  const available = sortByPriority(
    Object.keys(state.balances).filter(k => state.balances[k] > 0)
  );

  if (!available.length) {
    setError("Insufficient balance");
    fromSelect.innerHTML = '<option value="">No assets</option>';
    fromSelect.disabled = true;
    toSelect.disabled = false;
    maxBtn.disabled = true;
    fillSelect(toSelect, allCurrencies);
    return;
  }
  function fillSelect(selectEl, currencies) {
    selectEl.innerHTML = currencies
      .map(cur => `<option value="${cur}">${cur}</option>`)
      .join("");
  }

  fillSelect(fromSelect, available);
  fillSelect(toSelect, allCurrencies);

  // Keep from/to different
  function validateSelection() {
    if (fromSelect.value === toSelect.value) {
      const otherOption = [...toSelect.options].find(opt => opt.value !== fromSelect.value);
      if (otherOption) {
        toSelect.value = otherOption.value;
      }
    }
  }
  validateSelection();

  // Events
  fromSelect.onchange = () => {
    validateSelection();
    resetInputs();
  };

  toSelect.onchange = () => {
    if (toSelect.value === fromSelect.value) {
      const otherFrom = [...fromSelect.options].find(opt => opt.value !== toSelect.value);
      if (otherFrom) fromSelect.value = otherFrom.value;
    }
    resetInputs();
  };

  fromInput.oninput = () => {
    sanitize(fromInput, DECIMALS[fromSelect.value]);
    activeField = "from";
    recalc();
  };

  toInput.oninput = () => {
    sanitize(toInput, DECIMALS[toSelect.value]);
    activeField = "to";
    recalc();
  };

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
    saveState();
    if (state.loggedIn && state.userId) {
      saveRemoteBalances(state.userId, state.balances);
    }

    addHistory(`Swap ${amount} ${fromCur} -> ${receive} ${toCur}`);
    renderAssets();
    hideDwsBalances();
    showSuccess({ summary: `Swap ${amount} ${fromCur} -> ${receive} ${toCur}` });
  };

  // Helpers
  function resetInputs() {
    fromInput.value = "";
    toInput.value = "";
    clearError();
    confirmBtn.disabled = true;
  }

  function recalc() {
    const fromCur = fromSelect.value;
    const toCur = toSelect.value;
    const rateFrom = state.rates[fromCur];
    const rateTo = state.rates[toCur];
    const val = activeField === "from" ? Number(fromInput.value) : Number(toInput.value);

    if (!val || val <= 0) {
      confirmBtn.disabled = true;
      return;
    }

    if (activeField === "from") {
      toInput.value = ((val * rateFrom) / rateTo).toFixed(DECIMALS[toCur]);
    } else {
      fromInput.value = ((val * rateTo) / rateFrom).toFixed(DECIMALS[fromCur]);
    }
    validate();
  }

  function validate() {
    const cur = fromSelect.value;
    const amount = Number(fromInput.value);
    clearError();

    if (!amount || amount <= 0) return false;
    if (amount < MIN_AMOUNTS[cur]) {
      setError(`Min: ${MIN_AMOUNTS[cur]} ${cur}`);
      return false;
    }
    if (amount > MAX_AMOUNTS[cur]) {
      setError(`Max: ${MAX_AMOUNTS[cur]} ${cur}`);
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

function sanitize(input, maxDecimals) {
  const raw = input.value;
  const caret = input.selectionStart ?? raw.length;
  const rawBefore = raw.slice(0, caret);

  const sanitizeValue = value => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    let next = cleaned;

    if (parts.length > 2) {
      next = parts[0] + "." + parts.slice(1).join("");
    }

    if (Number.isFinite(maxDecimals) && maxDecimals >= 0) {
      const dotIndex = next.indexOf(".");
      if (dotIndex !== -1) {
        const head = next.slice(0, dotIndex);
        const tail = next.slice(dotIndex + 1, dotIndex + 1 + maxDecimals);
        next = head + "." + tail;
      }
    }

    return next;
  };

  const nextValue = sanitizeValue(raw);
  const nextBefore = sanitizeValue(rawBefore);

  input.value = nextValue;
  const nextCaret = Math.min(nextBefore.length, nextValue.length);
  input.setSelectionRange(nextCaret, nextCaret);
}


