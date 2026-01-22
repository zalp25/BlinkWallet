type Rates = Record<string, number>;
type Balances = Record<string, number>;

let rates: Rates = {};
let balances: Balances = {};

async function loadRates() {
  const res = await fetch("./rates.json");
  rates = await res.json();

  Object.keys(rates).forEach(k => balances[k] = 0);

  initSelectors();
  renderBalances();
}

function initSelectors() {
  const selects = ["from", "to", "dw-currency"];

  selects.forEach(id => {
    const el = document.getElementById(id) as HTMLSelectElement;
    el.innerHTML = "";
    Object.keys(rates).forEach(cur =>
      el.add(new Option(cur, cur))
    );
  });
}

function renderBalances() {
  const out = Object.entries(balances)//ТУТ ПОМИЛКА
    .map(([k, v]) => `${k}: ${v.toFixed(6)}`)
    .join("\n");

  document.getElementById("balances")!.textContent = out;
}

function deposit() {
  const amount = Number(
    (document.getElementById("dw-amount") as HTMLInputElement).value
  );
  const cur = (document.getElementById("dw-currency") as HTMLSelectElement).value;

  balances[cur] += amount;
  renderBalances();
}

function withdraw() {
  const amount = Number(
    (document.getElementById("dw-amount") as HTMLInputElement).value
  );
  const cur = (document.getElementById("dw-currency") as HTMLSelectElement).value;

  if (balances[cur] < amount) {
    alert("Not enough balance");
    return;
  }

  balances[cur] -= amount;
  renderBalances();
}

function convert() {
  const amount = Number(
    (document.getElementById("amount") as HTMLInputElement).value
  );
  const from = (document.getElementById("from") as HTMLSelectElement).value;
  const to = (document.getElementById("to") as HTMLSelectElement).value;

  if (balances[from] < amount) {
    alert("Not enough balance");
    return;
  }

  const usd = amount * rates[from];
  const result = usd / rates[to];

  balances[from] -= amount;
  balances[to] += result;

  document.getElementById("result")!.textContent =
    `${amount} ${from} → ${result.toFixed(6)} ${to}`;

  renderBalances();
}

document.getElementById("deposit")!.onclick = deposit;
document.getElementById("withdraw")!.onclick = withdraw;
document.getElementById("convert")!.onclick = convert;

loadRates();
