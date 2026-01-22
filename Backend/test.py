from wallet import Wallet

w = Wallet()

w.deposit("USDT", 100)
print("Before:", w.balances)

btc = w.convert("USDT", "BTC", 100)
print("Bought BTC:", btc)

print("After:", w.balances)
