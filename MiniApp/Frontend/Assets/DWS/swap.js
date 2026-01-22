import { state, DECIMALS, MIN_AMOUNTS, sortByPriority } from "../../state.js";
import { renderAssets } from "../assets.js";
import { addHistory } from "../../History/history.js";
import { openOverlay, closeOverlay } from "../../app.js";

let activeField = "from";

export function openSwap() {
  openOverlay("panel-swap");
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

  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";

  // TO — завжди всі валюти
  for (const k of sortByPriority(Object.keys(state.rates))) {
    toSelect.append(new Option(k, k));
  }

  // FROM — тільки з балансом
  const available = sortByPriority(
    Object.keys(state.balances).filter(k => state.balances[k] > 0)
  );

  if (available.length === 0) {
    fromSelect.append(new Option("No assets", ""));
    fromSelect.disabled = true;
    confirmBtn.disabled = true;
    maxBtn.disabled = true;
    return;
  }

  fromSelect.disabled = false;
  confirmBtn.disabled = false;
  maxBtn.disabled = false;

  for (const k of available) {
    fromSelect.append(new Option(k, k));
  }

  fromInput.oninput = () => {
    activeField = "from";
    recalc();
  };

  toInput.oninput = () => {
    activeField = "to";
    recalc();
  };

  fromSelect.onchange = () => recalc();
  toSelect.onchange = () => recalc();

  maxBtn.onclick = () => {
    fromInput.value = state.balances[fromSelect.value];
    activeField = "from";
    recalc();
  };

  confirmBtn.onclick = () => {
    const fromCur = fromSelect.value;
    const toCur = toSelect.value;
    const amount = Number(fromInput.value);

    state.balances[fromCur] -= amount;
    state.balances[toCur] += Number(toInput.value);

    addHistory(
      `Swap ${amount} ${fromCur} → ${toInput.value} ${toCur}`
    );

    renderAssets();
    closeOverlay();
  };

  function recalc() {
    const fromCur = fromSelect.value;
    const toCur = toSelect.value;
    const rateFrom = state.rates[fromCur];
    const rateTo = state.rates[toCur];

    let fromVal = Number(fromInput.value);
    let toVal = Number(toInput.value);

    if (activeField === "from") {
      if (!validate(fromVal, fromCur)) return;
      toInput.value = ((fromVal * rateFrom) / rateTo)
        .toFixed(DECIMALS[toCur]);
    }

    if (activeField === "to") {
      if (!Number.isFinite(toVal) || toVal <= 0) return;
      fromVal = (toVal * rateTo) / rateFrom;
      if (!validate(fromVal, fromCur)) return;
      fromInput.value = fromVal.toFixed(DECIMALS[fromCur]);
    }
  }

  function validate(amount, cur) {
    if (!Number.isFinite(amount) || amount <= 0) {
      error.textContent = "Invalid amount";
      confirmBtn.disabled = true;
      return false;
    }

    if (amount < MIN_AMOUNTS[cur]) {
      error.textContent = `Minimum: ${MIN_AMOUNTS[cur]} ${cur}`;
      confirmBtn.disabled = true;
      return false;
    }

    if (amount > state.balances[cur]) {
      error.textContent = "Insufficient balance";
      confirmBtn.disabled = true;
      return false;
    }

    error.textContent = "";
    confirmBtn.disabled = false;
    return true;
  }
}
