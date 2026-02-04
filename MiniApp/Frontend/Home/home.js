import { state, sortByPriority, CURRENCY_ICONS } from "../state.js";

export function initHome() {
  renderHome();
}

export function renderHome() {
  document.getElementById("username").textContent = state.username ?? "";

  const ul = document.getElementById("prices");
  ul.innerHTML = "";

  const currencies = sortByPriority(Object.keys(state.rates));

  for (const k of currencies) {
    const li = document.createElement("li");
    li.className = "currency-card";

    const left = document.createElement("div");
    left.className = "currency-left";
    left.appendChild(buildIcon(k));

    const mid = document.createElement("div");
    mid.className = "currency-main";

    const code = document.createElement("div");
    code.className = "currency-code";
    code.textContent = k;

    mid.append(code);

    const right = document.createElement("div");
    right.className = "currency-right currency-right-row";

    const price = document.createElement("div");
    price.className = "currency-value";
    price.textContent = formatRate(state.rates[k]);

    const badge = document.createElement("div");
    badge.className = "currency-badge";
    badge.textContent = "-.--%";

    right.append(price, badge);

    li.append(left, mid, right);
    ul.appendChild(li);
  }
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

function formatRate(rate) {
  if (!Number.isFinite(rate)) return "$0.00";
  const decimals = rate >= 1 ? 2 : 6;
  return `$${rate.toFixed(decimals)}`;
}
