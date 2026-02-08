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

export function openDeposit() {
  openOverlay("panel-deposit");
  showDwsBalances();
  initDeposit();
}

function initDeposit() {
  // Simple local top-up + sync to backend.
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
    sanitize(input, DECIMALS[select.value]);
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
    saveState();
    if (state.loggedIn && state.userId) {
      saveRemoteBalances(state.userId, state.balances);
    }

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

