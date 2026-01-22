import { state, DECIMALS, sortByPriority } from "../state.js";
import { openDeposit } from "./DWS/deposit.js";
import { openWithdraw } from "./DWS/withdraw.js";
import { openSwap } from "./DWS/swap.js";

export function initAssets() {
  document.getElementById("open-deposit").onclick = openDeposit;
  document.getElementById("open-withdraw").onclick = openWithdraw;
  document.getElementById("open-swap").onclick = openSwap;
  renderAssets();
}

export function renderAssets() {
  const ul = document.getElementById("assets-list");
  ul.innerHTML = "";

  let total = 0;

  const currencies = sortByPriority(Object.keys(state.rates));

  for (const k of currencies) {
    const bal = state.balances[k] ?? 0;
    const usd = bal * state.rates[k];
    total += usd;

    const li = document.createElement("li");
    li.textContent =
      `${k}: ${bal.toFixed(DECIMALS[k])} ≈ $${usd.toFixed(2)}`;

    ul.appendChild(li);
  }

  document.getElementById("total-usd").textContent =
    `$${total.toFixed(2)}`;
}
