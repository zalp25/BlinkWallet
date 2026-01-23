export const state = {
  rates: {},
  balances: {},
  history: [],
  username: "Alex"
};

export const DECIMALS = {
  USDT: 2,
  TRX: 2,
  TON: 3,
  SOL: 4,
  BLINKW: 4,
  BTC: 6,
  ETH: 6,
  ZALP: 2
};

export const MIN_AMOUNTS = {
  USDT: 5.0,
  BLINKW: 0.05,
  SOL: 0.04,
  ETH: 0.002,
  TON: 3.5,
  TRX: 17,
  BTC: 0.00006,
  ZALP: 10
};

export const MAX_AMOUNTS = {
  USDT: 250_000,
  BTC: 2.5,
  ETH: 75,
  SOL: 2_000,
  TON: 150_000,
  TRX: 2_500_000,
  BLINKW: 2_500,
  ZALP: 1_000
};

export const CURRENCY_PRIORITY = [
  "USDT",
  "BTC",
  "ETH",
  "SOL",
  "TON",
  "TRX",
  "BLINKW",
  "ZALP"
];

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
