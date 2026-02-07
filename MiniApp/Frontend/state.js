export const state = {
  rates: {},
  roi: {},
  balances: {},
  history: [],
  username: "Alex"
};

const STORAGE_KEY = "blinkwallet_state";

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && typeof data === "object") {
      if (data.balances && typeof data.balances === "object") {
        state.balances = data.balances;
      }
      if (Array.isArray(data.history)) {
        state.history = data.history;
      }
      if (typeof data.username === "string") {
        state.username = data.username;
      }
    }
  } catch {
    // ignore corrupted storage
  }
}

export function saveState() {
  const payload = {
    balances: state.balances,
    history: state.history,
    username: state.username
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}


export const DECIMALS = {
  USDT: 2,
  TRX: 2,
  TON: 3,
  SOL: 4,
  BLINK: 4,
  BTC: 6,
  ETH: 6
};

export const MIN_AMOUNTS = {
  USDT: 5.0,
  BLINK: 0.05,
  SOL: 0.04,
  ETH: 0.002,
  TON: 3.5,
  TRX: 17,
  BTC: 0.00006
};

export const MAX_AMOUNTS = {
  USDT: 250_000,
  BTC: 2.5,
  ETH: 75,
  SOL: 2_000,
  TON: 150_000,
  TRX: 2_500_000,
  BLINK: 2_500
};

export const CURRENCY_PRIORITY = [
  "USDT",
  "BTC",
  "ETH",
  "SOL",
  "TON",
  "TRX",
  "BLINK"
];

export const CURRENCY_ICONS = {
  BTC: "bitcoin.png",
  ETH: "ethereum.png",
  SOL: "solana.png",
  TON: "ton.png",
  TRX: "tron.png",
  USDT: "tether.png",
  BLINK: "blink.png"
};

export function sortByPriority(list) {
  return [...list].sort((a, b) => {
    const pa = CURRENCY_PRIORITY.indexOf(a);
    const pb = CURRENCY_PRIORITY.indexOf(b);

    if (pa === -1 && pb === -1) return a.localeCompare(b);
    if (pa === -1) return 1;
    if (pb === -1) return -1;

    return pa - pb;
  });
}
