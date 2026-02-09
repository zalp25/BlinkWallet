Версія README другої покращеної версії з базою даних знаходиться в гілці local-with-db, причина окремої гілки і відсутності БД в main гілці викликана проблемами з хостингом та обмеженням використання API оновлення курсів.

# BlinkWallet — Telegram Mini App демо криптогаманець.
<img width="640" height="360" alt="image" src="https://github.com/user-attachments/assets/5896eade-add2-4137-8c44-c4e257c535e0" />

## Як запустити в Telegram (короткий туторіал)

1. Відкрийте посилання на бота: **@blink_wallet_bot**.
2. Натисніть кнопку **Wallet**.
<img width="713" height="523" alt="image" src="https://github.com/user-attachments/assets/4587a6dc-df59-4dd3-bfc6-c4c58b7f51d7" />

3. Відкриється Mini App з вашим гаманцем.
<img width="454" height="520" alt="image" src="https://github.com/user-attachments/assets/722e5faa-41a6-4338-bb1f-f2a851f8947f" />

> **Примітка:** бот працює тільки у випадку його запуску через термінал, сам сайт, який відкриває бот(як MiniApp) хоститься через Cloudflare, та може бути відкритим напряму через посилання:
> "https://blinkwallet-4rh.pages.dev/"

## Що вміє бот (повний функціонал)

### 1) Home (Головна)
<img width="342" height="473" alt="image" src="https://github.com/user-attachments/assets/230748d1-1696-4147-8671-358744f420ee" />

Вкладка Home надає коротку відомість про баланс користувача, нижче курси конкретних монет:
"USDT", "BTC", "ETH", "SOL", "TON", "TRX", "BLINK"(Тестова монета для тестування процесу додавання нових монет, нові монети додаються легко, необхідно лиш підредагувати функцію fetchRates() в rates.go
Курси зберігаються у статичному JSON. У покращеній версії передбачено автооновлення через backend service, тому для оновлення курсів необхідно пушити нові курси в rates.json на GitHub.
Також через відсутність бази даних не зберігається історія цін криптовалют, тому % змін цін валют та Roi не обраховуються. Вони підготовлено до інтеграції з real-time API.

### 2) Assets (Активи)
<img width="340" height="477" alt="image" src="https://github.com/user-attachments/assets/d1ecce6b-9868-4977-a4a4-dc70aaf69cab" />

Вкладка Assets надає розширені відомості про активи користувача, розписані баланси кожної валюти, їх вартості в $ та загальний баланс, також наявні 3 функціональні кнопки "Deposit", "Withdraw", "Swap".

### 3) Deposit / Withdraw / Swap (DWS)
Кнопка Deposit генерує на балансі користувача активи. Використовуються демо-баланси для тестування UX та логіки.

<img width="345" height="477" alt="image" src="https://github.com/user-attachments/assets/920537d8-2d35-40ff-a76c-bb6c7b4be98a" />

Кнопка Withdraw дозволяє прибрати обрані активи.

<img width="345" height="477" alt="image" src="https://github.com/user-attachments/assets/3f879e3e-d73f-463f-8aad-f1ed3e96cdb0" />

Кнопка Swap дозволяє конверувати активи однієї монети в активи іншої. Можна вводити в будь-яке поле, вартість буде автоматично конвертуватись.

<img width="345" height="477" alt="image" src="https://github.com/user-attachments/assets/7ef8dbf1-dd81-4896-a8ef-4c7391bfa3f8" />

У випадку успішної транзакції з'являється вікно успішної транзакції з її описом:

<img width="345" height="477" alt="image" src="https://github.com/user-attachments/assets/7d492225-23ff-4192-942f-e4397e78c34f" />

Також додана обробка різних вийнятків(замалі/завеликі/неправильні суми або недостатнього балансу):

<img width="516" height="289" alt="image" src="https://github.com/user-attachments/assets/af6311b1-a265-4e84-857c-cc017d091093" />


### 4) History (Історія)
Автоматичне логування депозитів, виводів і свопів.
Відображення дати та часу кожної операції.
<img width="359" height="460" alt="image" src="https://github.com/user-attachments/assets/3228c818-5f73-4d97-aed8-6fb1bff9bbcb" />


### 5) Settings (Налаштування)
Зміна відображуваного імені.
Ліміт довжини імені (до 12 символів).
<img width="359" height="467" alt="image" src="https://github.com/user-attachments/assets/68a31831-bee7-4c54-932e-efbbf205c3dd" />


---

## Принципи роботи та логіка

### Telegram-бот
* Бот написаний на Python та працює на бібліотеці aiogram.
* Бот відправляє користувачу кнопку **Wallet**, яка відкриває Mini App.
* Це стандартний механізм Telegram WebApp, без зайвих переходів.

### Mini App
* Уся логіка працює у фронтенді (HTML/CSS/JS).
* Дані зберігаються **локально** в `localStorage` — це швидко і просто, але не синхронізується між пристроями.
* Курси валют беруться з JSON-файлу і можуть оновлюватися сервісом через API з обмеженнями(в даній версії через статичний хост для оновлення курсів необхідно оновлювати репозиторій).

---

## Фішки реалізації, які використані в коді

Нижче приклади ключових рішень (фрагменти коду). Вони показують, **як реалізовано функціонал**.

### 1) Відкриття Mini App в Telegram

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

### 2) Збереження балансу та історії локально

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

### 3) Валідація депозиту (мін/макс суми)

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

### 4) Перерахунок під час свопу

```js
// MiniApp/Frontend/Assets/DWS/swap.js
if (activeField === "from") {
  toInput.value = ((val * rateFrom) / rateTo).toFixed(DECIMALS[toCur]);
} else {
  fromInput.value = ((val * rateTo) / rateFrom).toFixed(DECIMALS[fromCur]);
}
```

### 5) Акуратне обмеження десяткових знаків у вводі

```js
// MiniApp/Frontend/Assets/DWS/deposit.js
const cleaned = value.replace(/[^0-9.]/g, "");
```

---

## Важливі обмеження поточної версії

* **Немає БД**: усі дані (баланси, історія, ім'я) зберігаються локально.
* **Немає синхронізації** між пристроями.
* **Курси валют** беруться з локального JSON, який сам не оновлюється.
* Повна версія з базою даних знаходиться в гілці **local-with-db**.
