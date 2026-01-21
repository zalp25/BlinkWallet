const tg = (window as any).Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}


console.log("BlinkWallet loaded");

/* ---------- TYPES ---------- */
type Rates = Record<string, number>;
type Balances = Record<string, number>;

interface HistoryItem {
  time: string;
  text: string;
}

/* ---------- STATE ---------- */
let rates: Rates = {};
let balances: Balances = {};
let txHistory: HistoryItem[] = [];

const username: string = "Sasha";

/* ---------- DECIMAL RULES ---------- */
const DECIMALS: Record<string, number> = {
  USDT: 2,
  TRX: 2,
  TON: 3,
  SOL: 4,
  BLINKW: 4,
  BTC: 6,
  ETH: 6,
};

/* ---------- UTILS ---------- */
function isValidAmount(currency: string, value: string): boolean {
  const d = DECIMALS[currency] ?? 6;
  const parts = value.toString().split(".");
  return parts.length === 1 || parts[1].length <= d;
}

function markInvalid(input: HTMLInputElement, invalid: boolean): void {
  input.classList.toggle("invalid", invalid);
}

function showPanel(id: string): void {
  ["panel-deposit", "panel-withdraw", "panel-swap"].forEach(p => {
    document.getElementById(p)?.classList.add("hidden");
  });
  document.getElementById(id)?.classList.remove("hidden");
}

/* ---------- LOAD ---------- */
async function loadRates(): Promise<void> {
  const res = await fetch("./Rates/rates.json");
  rates = await res.json();

  for (const k in rates) {
    balances[k] = 0;
  }

  initSelectors();
  renderHome();
  renderAssets();
  renderHistory();
}

function initSelectors(): void {
  ["deposit-currency", "withdraw-currency", "swap-from", "swap-to"].forEach(id => {
    const select = document.getElementById(id) as HTMLSelectElement;
    select.innerHTML = "";

    for (const k in rates) {
      const option = document.createElement("option");
      option.value = k;
      option.textContent = k;
      select.appendChild(option);
    }
  });
}

/* ---------- HOME ---------- */
function renderHome(): void {
  document.getElementById("username")!.textContent = username;

  const ul = document.getElementById("prices")!;
  ul.innerHTML = "";

  for (const k in rates) {
    const li = document.createElement("li");
    li.textContent = `${k}: $${rates[k]}`;
    ul.appendChild(li);
  }
}

/* ---------- ASSETS ---------- */
function renderAssets(): void {
  const ul = document.getElementById("assets-list")!;
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

  document.getElementById("total-usd")!.textContent = `$${total.toFixed(2)}`;
}

/* ---------- HISTORY ---------- */
function addHistory(text: string): void {
  txHistory.unshift({
    time: new Date().toLocaleString(),
    text,
  });
  renderHistory();
}

function renderHistory(): void {
  const ul = document.getElementById("history-list")!;
  ul.innerHTML = "";

  txHistory.forEach(h => {
    const li = document.createElement("li");
    li.textContent = `[${h.time}] ${h.text}`;
    ul.appendChild(li);
  });
}

/* ---------- DOM READY ---------- */
document.addEventListener("DOMContentLoaded", () => {

  /* ---------- PANELS ---------- */
  (document.getElementById("open-deposit") as HTMLButtonElement).onclick =
    () => showPanel("panel-deposit");

  (document.getElementById("open-withdraw") as HTMLButtonElement).onclick =
    () => showPanel("panel-withdraw");

  (document.getElementById("open-swap") as HTMLButtonElement).onclick =
    () => showPanel("panel-swap");

  /* ---------- DEPOSIT ---------- */
  (document.getElementById("confirm-deposit") as HTMLButtonElement).onclick = () => {
    const cur = (document.getElementById("deposit-currency") as HTMLSelectElement).value;
    const input = document.getElementById("deposit-amount") as HTMLInputElement;
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
  (document.getElementById("withdraw-max") as HTMLButtonElement).onclick = () => {
    const cur = (document.getElementById("withdraw-currency") as HTMLSelectElement).value;
    (document.getElementById("withdraw-amount") as HTMLInputElement).value =
      String(balances[cur]);
  };

  (document.getElementById("withdraw-amount") as HTMLInputElement).oninput = e => {
    const input = e.target as HTMLInputElement;
    const cur = (document.getElementById("withdraw-currency") as HTMLSelectElement).value;

    markInvalid(
      input,
      Number(input.value) > balances[cur] ||
      !isValidAmount(cur, input.value)
    );
  };

  (document.getElementById("confirm-withdraw") as HTMLButtonElement).onclick = () => {
    const cur = (document.getElementById("withdraw-currency") as HTMLSelectElement).value;
    const input = document.getElementById("withdraw-amount") as HTMLInputElement;

    if (input.classList.contains("invalid")) return;

    balances[cur] -= Number(input.value);
    addHistory(`Withdraw ${input.value} ${cur}`);
    renderAssets();
  };

  /* ---------- SWAP ---------- */
  (document.getElementById("swap-max") as HTMLButtonElement).onclick = () => {
    const cur = (document.getElementById("swap-from") as HTMLSelectElement).value;
    (document.getElementById("swap-amount") as HTMLInputElement).value =
      String(balances[cur]);
  };

  (document.getElementById("swap-amount") as HTMLInputElement).oninput = e => {
    const input = e.target as HTMLInputElement;
    const cur = (document.getElementById("swap-from") as HTMLSelectElement).value;

    markInvalid(
      input,
      Number(input.value) > balances[cur] ||
      !isValidAmount(cur, input.value)
    );
  };

  (document.getElementById("confirm-swap") as HTMLButtonElement).onclick = () => {
    const from = (document.getElementById("swap-from") as HTMLSelectElement).value;
    const to = (document.getElementById("swap-to") as HTMLSelectElement).value;
    const input = document.getElementById("swap-amount") as HTMLInputElement;

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
  document.querySelectorAll<HTMLButtonElement>(".nav-item").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".nav-item")
        .forEach(b => b.classList.remove("active"));

      document.querySelectorAll(".tab")
        .forEach(t => t.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(btn.dataset.tab!)?.classList.add("active");
    };
  });

  /* ---------- START ---------- */
  loadRates();
});
