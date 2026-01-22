export const state = {
  rates: {},
  balances: {},
  history: [],
  username: "Sasha"
};

export const DECIMALS = {
  USDT: 2,
  TRX: 2,
  TON: 3,
  SOL: 4,
  BLINKW: 4,
  BTC: 6,
  ETH: 6
};

export const MIN_AMOUNTS = {
  USDT: 5.0,
  BLINKW: 0.05,
  SOL: 0.04,
  ETH: 0.002,
  TON: 3.5,
  TRX: 17,
  BTC: 0.00006,
};

export const CURRENCY_PRIORITY = [
  "USDT",
  "BTC",
  "ETH",
  "SOL",
  "TON",
  "TRX",
  "BLINKW",
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
