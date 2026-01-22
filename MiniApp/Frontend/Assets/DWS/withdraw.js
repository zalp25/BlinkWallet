import { state, MIN_AMOUNTS } from "../../state.js";
import { renderAssets } from "../assets.js";
import { addHistory } from "../../History/history.js";
import { openOverlay, closeOverlay } from "../../app.js";

export function openWithdraw() {
  openOverlay("panel-withdraw");
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

  const available = Object.keys(state.balances).filter(k => state.balances[k] > 0);
  if (!available.length) {
    select.append(new Option("No assets", ""));
    confirmBtn.disabled = true;
    return;
  }

  for (const k of available) {
    select.append(new Option(k, k));
  }

  maxBtn.onclick = () => {
    input.value = state.balances[select.value];
  };

  confirmBtn.onclick = () => {
    const cur = select.value;
    const val = Number(input.value);

    if (val < MIN_AMOUNTS[cur]) {
      error.textContent = `Minimum: ${MIN_AMOUNTS[cur]} ${cur}`;
      return;
    }

    if (val > state.balances[cur]) {
      error.textContent = "Insufficient balance";
      return;
    }

    state.balances[cur] -= val;
    addHistory(`Withdraw ${val} ${cur}`);
    renderAssets();
    closeOverlay();
  };
}
