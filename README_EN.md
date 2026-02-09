The README for the improved version with a database is available in the **local-with-db** branch. The database is not included in the main branch due to hosting limitations and API rate limits for updating exchange rates.

# BlinkWallet — Telegram Mini App demo crypto wallet

<img width="640" height="360" alt="image" src="https://github.com/user-attachments/assets/5896eade-add2-4137-8c44-c4e257c535e0" />

## How to launch in Telegram (quick tutorial)

1. Open the bot link: **@blink_wallet_bot**
2. Press the **Wallet** button

<img width="713" height="523" alt="image" src="https://github.com/user-attachments/assets/4587a6dc-df59-4dd3-bfc6-c4c58b7f51d7" />

3. The Mini App with your wallet will open

<img width="454" height="520" alt="image" src="https://github.com/user-attachments/assets/722e5faa-41a6-4338-bb1f-f2a851f8947f" />

> **Note:** the bot works only when launched via terminal.
> The Mini App website is hosted via Cloudflare and can also be opened directly:
> [https://blinkwallet-4rh.pages.dev/](https://blinkwallet-4rh.pages.dev/)

---

## Features (full functionality)

### 1) Home

<img width="342" height="473" alt="image" src="https://github.com/user-attachments/assets/230748d1-1696-4147-8671-358744f420ee" />

The Home tab provides a brief overview of the user balance and displays market prices for:
"USDT", "BTC", "ETH", "SOL", "TON", "TRX", "BLINK".

BLINK is a test coin used to demonstrate how new assets can be added.
New coins can be added by editing the `fetchRates()` function in `rates.go`.

Rates are stored in a static JSON file.
In the improved version, automatic updates via a backend service are planned.
Currently, to update rates, new values must be pushed to `rates.json` on GitHub.

Due to the absence of a database, price history is not stored, so price change percentages and ROI are not calculated.
These features are prepared for future integration with a real-time API.

---

### 2) Assets

<img width="340" height="477" alt="image" src="https://github.com/user-attachments/assets/d1ecce6b-9868-4977-a4a4-dc70aaf69cab" />

The Assets tab provides extended information about user holdings, including:

* balances of each currency
* USD value per asset
* total portfolio balance

It also includes three functional buttons: **Deposit**, **Withdraw**, **Swap**.

---

### 3) Deposit / Withdraw / Swap (DWS)

The **Deposit** button generates assets on the user balance.
Demo balances are used to test UX and application logic.

<img width="345" height="477" alt="image" src="https://github.com/user-attachments/assets/920537d8-2d35-40ff-a76c-bb6c7b4be98a" />

The **Withdraw** button removes selected assets.

<img width="345" height="477" alt="image" src="https://github.com/user-attachments/assets/3f879e3e-d73f-463f-8aad-f1ed3e96cdb0" />

The **Swap** button allows conversion between different assets.
Values can be entered in either field and will be converted automatically.

<img width="345" height="477" alt="image" src="https://github.com/user-attachments/assets/7ef8dbf1-dd81-4896-a8ef-4c7391bfa3f8" />

After a successful transaction, a confirmation window with transaction details appears:

<img width="345" height="477" alt="image" src="https://github.com/user-attachments/assets/7d492225-23ff-4192-942f-e4397e78c34f" />

Exception handling is implemented for:

* too small amounts
* too large amounts
* invalid inputs
* insufficient balance

<img width="516" height="289" alt="image" src="https://github.com/user-attachments/assets/af6311b1-a265-4e84-857c-cc017d091093" />

---

### 4) History

Automatically logs deposits, withdrawals, and swaps.
Displays date and time for each transaction.

<img width="359" height="460" alt="image" src="https://github.com/user-attachments/assets/3228c818-5f73-4d97-aed8-6fb1bff9bbcb" />

---

### 5) Settings

Allows changing the displayed username.
Username length limit: up to 12 characters.

<img width="359" height="467" alt="image" src="https://github.com/user-attachments/assets/68a31831-bee7-4c54-932e-efbbf205c3dd" />

---

## Architecture and logic

### Telegram bot

* Written in Python using the aiogram library
* Sends a **Wallet** button that opens the Mini App
* Uses the standard Telegram WebApp mechanism

### Mini App

* All logic runs on the frontend (HTML/CSS/JS)
* Data is stored locally in `localStorage` (not synced between devices)
* Exchange rates are loaded from a JSON file and can be updated via API
* In this version, due to static hosting, rate updates require repository updates

---

## Implementation highlights

Below are key code fragments demonstrating core functionality.

### 1) Opening Mini App in Telegram

```python
# Bot/bot.py
@dp.message(CommandStart())
async def start_handler(message: Message):
    keyboard = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="Wallet", web_app=WebAppInfo(url=MINI_APP_URL))]],
        resize_keyboard=True
    )
    await message.answer("Open Mini App:", reply_markup=keyboard)
```

### 2) Saving balances and history locally

```js
// MiniApp/Frontend/state.js
export function saveState() {
  const payload = {
    balances: state.balances,
    history: state.history,
    username: state.username
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
```

### 3) Deposit validation (min/max)

```js
// MiniApp/Frontend/Assets/DWS/deposit.js
if (val < MIN_AMOUNTS[cur]) {
  setError(`Minimum: ${MIN_AMOUNTS[cur]} ${cur}`);
  return false;
}
if (val > MAX_AMOUNTS[cur]) {
  setError(`Maximum per transaction: ${MAX_AMOUNTS[cur]} ${cur}`);
  return false;
}
```

### 4) Swap recalculation

```js
// MiniApp/Frontend/Assets/DWS/swap.js
if (activeField === "from") {
  toInput.value = ((val * rateFrom) / rateTo).toFixed(DECIMALS[toCur]);
} else {
  fromInput.value = ((val * rateTo) / rateFrom).toFixed(DECIMALS[fromCur]);
}
```

### 5) Decimal input restriction

```js
// MiniApp/Frontend/Assets/DWS/deposit.js
const cleaned = value.replace(/[^0-9.]/g, "");
```

---

## Current limitations

* No database: all data (balances, history, username) stored locally
* No synchronization between devices
* Exchange rates stored in static JSON and do not auto-update
* Full version with database available in **local-with-db** branch
