import { state, DECIMALS, sortByPriority } from "../state.js";
import { openDeposit } from "./DWS/deposit.js";
import { openWithdraw } from "./DWS/withdraw.js";
import { openSwap } from "./DWS/swap.js";

/* =========================================================
   INIT
   ========================================================= */

export function initAssets() {
  document.getElementById("open-deposit").onclick = openDeposit;
  document.getElementById("open-withdraw").onclick = openWithdraw;
  document.getElementById("open-swap").onclick = openSwap;

  showTotalValue();
  renderAssets();
}

/* =========================================================
   TOTAL VALUE (SINGLE RESPONSIBILITY)
   ========================================================= */

export function showTotalValue() {
  const summary = document.querySelector(".assets-summary");
  if (summary) summary.classList.remove("hidden");
}

export function hideTotalValue() {
  const summary = document.querySelector(".assets-summary");
  if (summary) summary.classList.add("hidden");
}

/* =========================================================
   RENDER
   ========================================================= */

export function renderAssets() {
  const ul = document.getElementById("assets-list");
  if (!ul) return;

  ul.innerHTML = "";

  let total = 0;
  const currencies = sortByPriority(Object.keys(state.rates));

  for (const cur of currencies) {
    const bal = state.balances[cur] ?? 0;
    const usd = bal * state.rates[cur];
    total += usd;

    const li = document.createElement("li");
    li.textContent =
      `${cur}: ${bal.toFixed(DECIMALS[cur])} ≈ $${usd.toFixed(2)}`;

    ul.appendChild(li);
  }

  const totalEl = document.getElementById("total-usd");
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

/* =========================================================
   DWS BALANCES (ONLY ITSELF)
   ========================================================= */

export function showDwsBalances() {
  const wrapper = document.getElementById("dws-balances");
  const list = document.getElementById("dws-balances-list");

  if (!wrapper || !list) return;

  wrapper.classList.remove("hidden");
  list.innerHTML = "";

  const currencies = sortByPriority(Object.keys(state.rates));

  for (const cur of currencies) {
    const amount = state.balances[cur] ?? 0;
    const rate = state.rates[cur] ?? 0;
    const usd = (amount * rate).toFixed(2);

    const row = document.createElement("div");
    row.textContent = `${cur}: ${amount} ≈ $${usd}`;
    list.appendChild(row);
  }
}

export function hideDwsBalances() {
  const wrapper = document.getElementById("dws-balances");
  if (wrapper) wrapper.classList.add("hidden");

  const list = document.getElementById("dws-balances-list");
  if (list) list.innerHTML = "";
}
