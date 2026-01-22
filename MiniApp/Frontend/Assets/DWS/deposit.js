import { state, MIN_AMOUNTS } from "../../state.js";
import { renderAssets } from "../assets.js";
import { addHistory } from "../../History/history.js";
import { openOverlay, closeOverlay } from "../../app.js";
import { sortByPriority } from "../../state.js";

export function openDeposit() {
  openOverlay("panel-deposit");
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

  

const currencies = sortByPriority(Object.keys(state.rates));
for (const k of currencies) {
  select.append(new Option(k, k));
}


  confirmBtn.onclick = () => {
    const cur = select.value;
    const val = Number(input.value);

    if (val < MIN_AMOUNTS[cur]) {
      error.textContent = `Minimum: ${MIN_AMOUNTS[cur]} ${cur}`;
      return;
    }

    state.balances[cur] += val;
    addHistory(`Deposit ${val} ${cur}`);
    renderAssets();
    closeOverlay();
  };
}
