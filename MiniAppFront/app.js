console.log("BlinkWallet loaded");

let rates = {};
let balances = {};
let history = [];
const username = "Sasha";

/* DECIMAL RULES */
const DECIMALS = {
  USDT: 2,
  TRX: 2,
  TON: 3,
  SOL: 4,
  BLINKW: 4,
  BTC: 6,
  ETH: 6
};

/* ---------- UTILS ---------- */
function isValidAmount(currency, value) {
  const d = DECIMALS[currency] ?? 6;
  const p = value.toString().split(".");
  return p.length === 1 || p[1].length <= d;
}

function markInvalid(input, invalid) {
  input.classList.toggle("invalid", invalid);
}

function showPanel(id) {
  ["panel-deposit", "panel-withdraw", "panel-swap"]
    .forEach(p => document.getElementById(p).classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* ---------- LOAD ---------- */
async function loadRates() {
  const res = await fetch("./Rates/rates.json");
  rates = await res.json();

  for (const k in rates) balances[k] = 0;

  initSelectors();
  renderHome();
  renderAssets();
  renderHistory();
}

function initSelectors() {
  ["deposit-currency", "withdraw-currency", "swap-from", "swap-to"]
    .forEach(id => {
      const s = document.getElementById(id);
      s.innerHTML = "";
      for (const k in rates) {
        const o = document.createElement("option");
        o.value = k;
        o.textContent = k;
        s.appendChild(o);
      }
    });
}

/* ---------- HOME ---------- */
function renderHome() {
  document.getElementById("username").textContent = username;
  const ul = document.getElementById("prices");
  ul.innerHTML = "";
  for (const k in rates) {
    const li = document.createElement("li");
    li.textContent = `${k}: $${rates[k]}`;
    ul.appendChild(li);
  }
}

/* ---------- ASSETS ---------- */
function renderAssets() {
  const ul = document.getElementById("assets-list");
  ul.innerHTML = "";
  let total = 0;

  for (const k in balances) {
    if (balances[k] === 0) continue;
    const usd = balances[k] * rates[k];
    total += usd;

    const li = document.createElement("li");
    li.textContent =
      `${k}: ${balances[k].toFixed(DECIMALS[k])} ≈ $${usd.toFixed(2)}`;
    ul.appendChild(li);
  }

  document.getElementById("total-usd").textContent =
    `$${total.toFixed(2)}`;
}

/* ---------- HISTORY ---------- */
function addHistory(text) {
  history.unshift({
    time: new Date().toLocaleString(),
    text
  });
  renderHistory();
}

function renderHistory() {
  const ul = document.getElementById("history-list");
  ul.innerHTML = "";
  history.forEach(h => {
    const li = document.createElement("li");
    li.textContent = `[${h.time}] ${h.text}`;
    ul.appendChild(li);
  });
}

/* ---------- DOM READY ---------- */
document.addEventListener("DOMContentLoaded", () => {

  /* ---------- PANELS ---------- */
  document.getElementById("open-deposit").onclick =
    () => showPanel("panel-deposit");

  document.getElementById("open-withdraw").onclick =
    () => showPanel("panel-withdraw");

  document.getElementById("open-swap").onclick =
    () => showPanel("panel-swap");

  /* ---------- DEPOSIT ---------- */
  document.getElementById("confirm-deposit").onclick = () => {
    const cur = document.getElementById("deposit-currency").value;
    const input = document.getElementById("deposit-amount");
    const amount = Number(input.value);

    if (!isValidAmount(cur, input.value)) {
      markInvalid(input, true);
      return;
    }

    balances[cur] += amount;
    addHistory(`Deposit ${amount} ${cur}`);
    renderAssets();
  };

  /* ---------- WITHDRAW ---------- */
  document.getElementById("withdraw-max").onclick = () => {
    const cur = document.getElementById("withdraw-currency").value;
    document.getElementById("withdraw-amount").value = balances[cur];
  };

  document.getElementById("withdraw-amount").oninput = e => {
    const input = e.target;
    const cur = document.getElementById("withdraw-currency").value;
    markInvalid(input,
      Number(input.value) > balances[cur] ||
      !isValidAmount(cur, input.value)
    );
  };

  document.getElementById("confirm-withdraw").onclick = () => {
    const cur = document.getElementById("withdraw-currency").value;
    const input = document.getElementById("withdraw-amount");
    if (input.classList.contains("invalid")) return;

    balances[cur] -= Number(input.value);
    addHistory(`Withdraw ${input.value} ${cur}`);
    renderAssets();
  };

  /* ---------- SWAP ---------- */
  document.getElementById("swap-max").onclick = () => {
    const cur = document.getElementById("swap-from").value;
    document.getElementById("swap-amount").value = balances[cur];
  };

  document.getElementById("swap-amount").oninput = e => {
    const input = e.target;
    const cur = document.getElementById("swap-from").value;
    markInvalid(input,
      Number(input.value) > balances[cur] ||
      !isValidAmount(cur, input.value)
    );
  };

  document.getElementById("confirm-swap").onclick = () => {
    const from = document.getElementById("swap-from").value;
    const to = document.getElementById("swap-to").value;
    const input = document.getElementById("swap-amount");
    if (input.classList.contains("invalid")) return;

    const amount = Number(input.value);
    const usd = amount * rates[from];
    const result = usd / rates[to];

    balances[from] -= amount;
    balances[to] += result;

    addHistory(
      `Swap ${amount} ${from} → ${result.toFixed(DECIMALS[to])} ${to}`
    );

    renderAssets();
  };

  /* ---------- TABS ---------- */
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".nav-item")
        .forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab")
        .forEach(t => t.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    };
  });

  /* ---------- START ---------- */
  loadRates();

});
