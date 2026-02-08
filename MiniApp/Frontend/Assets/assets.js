import { state, DECIMALS, sortByPriority, CURRENCY_ICONS } from "../state.js";
import { openDeposit } from "./DWS/deposit.js";
import { openWithdraw } from "./DWS/withdraw.js";
import { openSwap } from "./DWS/swap.js";

// Init

export function initAssets() {
  // Actions + initial render.
  document.getElementById("open-deposit").onclick = openDeposit;
  document.getElementById("open-withdraw").onclick = openWithdraw;
  document.getElementById("open-swap").onclick = openSwap;

  showTotalValue();
  renderAssets();
}

// Total value

export function showTotalValue() {
  const summary = document.querySelector(".assets-summary");
  if (summary) summary.classList.remove("hidden");
}

export function hideTotalValue() {
  const summary = document.querySelector(".assets-summary");
  if (summary) summary.classList.add("hidden");
}

// Render

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
    li.className = "currency-card";

    const left = document.createElement("div");
    left.className = "currency-left";
    left.appendChild(buildIcon(cur));

    const mid = document.createElement("div");
    mid.className = "currency-main";

    const code = document.createElement("div");
    code.className = "currency-code";
    code.textContent = cur;

    const label = document.createElement("div");
    label.className = "currency-sub";
    label.textContent = "Balance";

    mid.append(code, label);

    const right = document.createElement("div");
    right.className = "currency-right";

    const amount = document.createElement("div");
    amount.className = "currency-value";
    amount.textContent = formatAmount(bal, DECIMALS[cur]);

    const usdValue = document.createElement("div");
    usdValue.className = "currency-sub";
    usdValue.textContent = `~ $${usd.toFixed(2)}`;

    right.append(amount, usdValue);

    li.append(left, mid, right);

    ul.appendChild(li);
  }

  const totalEl = document.getElementById("total-usd");
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

  const homeTotal = document.getElementById("home-total-usd");
  if (homeTotal) homeTotal.textContent = `$${total.toFixed(2)}`;
}

function buildIcon(symbol) {
  const wrap = document.createElement("div");
  wrap.className = "currency-icon-wrap";

  const img = document.createElement("img");
  img.className = "currency-icon";
  img.alt = `${symbol} icon`;
  img.src = `./Currencies/icons/${CURRENCY_ICONS[symbol] ?? `${symbol.toLowerCase()}.png`}`;

  img.onerror = () => {
    wrap.classList.add("currency-icon-fallback");
    wrap.textContent = symbol.slice(0, 1);
  };

  wrap.appendChild(img);
  return wrap;
}

function formatAmount(value, decimals) {
  if (!Number.isFinite(value)) return "0";
  if (!Number.isFinite(decimals)) return String(value);
  return value.toFixed(decimals);
}

// DWS balances

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
    row.textContent = `${cur}: ${amount} ~ $${usd}`;
    list.appendChild(row);
  }
}

export function hideDwsBalances() {
  const wrapper = document.getElementById("dws-balances");
  if (wrapper) wrapper.classList.add("hidden");

  const list = document.getElementById("dws-balances-list");
  if (list) list.innerHTML = "";
}


