import json
from pathlib import Path

RATES_FILE = Path("C:/Users/mrgre/OneDrive/Документи/VS_BlinkWallet/BlinkWallet/Rates/rates.json")

class Wallet:
    def __init__(self):
        self.balances = {
            "USDT": 0.0,
            "BTC": 0.0,
            "ETH": 0.0,
            "SOL": 0.0,
            "TRX": 0.0,
            "TON": 0.0,
            "BLINKW": 0.0,
        }

    def _load_rates(self):
        with open(RATES_FILE, "r") as f:
            return json.load(f)

    def deposit(self, currency: str, amount: float):
        self.balances[currency] += amount

    def withdraw(self, currency: str, amount: float):
        if self.balances[currency] < amount:
            raise ValueError("Insufficient balance")
        self.balances[currency] -= amount

    def convert(self, from_cur: str, to_cur: str, amount: float):
        rates = self._load_rates()

        if self.balances[from_cur] < amount:
            raise ValueError("Insufficient balance")

        usd_value = amount * rates[from_cur]
        result = usd_value / rates[to_cur]

        self.balances[from_cur] -= amount
        self.balances[to_cur] += result

        return result
