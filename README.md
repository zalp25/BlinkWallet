# BlinkWallet — Telegram Mini App (версія з БД)

> Цей README описує **покращену версію з базою даних** у гілці `local-with-db`.
> У гілці `main` — спрощена версія без БД (статичні курси, без ROI/сесій).

---

## Що це
Демо криптогаманець у форматі Telegram Mini App.  
У цій версії:
- **реєстрація/логін** з паролем  
- **теги користувачів** для переказів  
- **сесії через cookie** (логін зберігається)  
- **дані в MySQL**  
- **оновлення курсів** бекендом + ROI за 24 години

---

## Швидкий старт (локально)

### 1) База даних (MySQL)
Потрібна локальна MySQL (Workbench або інше).

<img width="415" height="490" alt="image" src="https://github.com/user-attachments/assets/e7c4084b-769b-486b-81ed-adfa1543d6ab" />

**Схема таблиць:**

- `rates`

  <img width="421" height="191" alt="image" src="https://github.com/user-attachments/assets/fd570fac-66b7-4674-9ead-1c644e49b40e" />

- `balances`

<img width="418" height="194" alt="image" src="https://github.com/user-attachments/assets/09b86aa2-a5dc-43fb-b770-80d59089826f" />
  
- `users`

<img width="422" height="153" alt="image" src="https://github.com/user-attachments/assets/cf299d0a-004a-4491-afa6-618c1c7587d5" />
  
- `transfers`

<img width="437" height="166" alt="image" src="https://github.com/user-attachments/assets/8b0d7f30-18b4-40c0-89d3-0ef1eca95daa" />


> Важливо:
> - `users.user_id` має бути AUTO_INCREMENT  
> - `users.tag` — UNIQUE  
> - `password_hash` — VARCHAR(255)  

---

### 2) Запуск backend‑сервера (rates.go)
Це локальний HTTP‑сервер, який:
- зберігає курси у БД  
- віддає `/rates`  
- обробляє логін/реєстрацію  
- зберігає баланси  
- робить перекази

**Запуск:**
```powershell
cd MiniApp/Frontend/Currencies
$env:MYSQL_DSN="{USER}:{PASSWORD}@tcp({HOST}:{PORT})/{DB_NAME}?parseTime=true&charset=utf8mb4"
go run .\rates.go
```

Сервер слухає: `http://127.0.0.1:8080`

---

### 3) Запуск фронтенду
Необхідно відкрити `index.html` через локальний сервер (наприклад Live Server).  
Важливо використовувати **127.0.0.1**:
```
http://127.0.0.1:5500
```

---

## Функціонал

### 1) Реєстрація / Логін

<img width="459" height="695" alt="image" src="https://github.com/user-attachments/assets/4b2760cd-1231-4a13-ac7b-f506b60a0091" />

- При першому вході відкривається форма
- Тег користувача: **3–12 символів**, дозволені `a-z`, цифри, `_`, `-`, `.`
- Пароль хешується (bcrypt)
- Після логіну сесія зберігається в cookie

### 2) Home
- показує курси (USDT, BTC, ETH, SOL, TON, TRX, BLINK)
- показує ROI за 24 години
  
<img width="437" height="704" alt="image" src="https://github.com/user-attachments/assets/2509b378-834c-4972-8b0b-974857acf474" />


### 3) Assets
- повний список активів і балансів
- загальна вартість у $
- кнопки Deposit / Withdraw / Swap

<img width="437" height="705" alt="image" src="https://github.com/user-attachments/assets/dec958d1-4715-437e-bf2a-61e498cfd90c" />


### 4) Deposit / Withdraw / Swap
- Deposit/Swap працюють з локальними балансами, але синхронізуються в БД
- Withdraw тепер працює як **переказ іншому користувачу**
- потрібне поле **To user (tag)**

<img width="438" height="708" alt="image" src="https://github.com/user-attachments/assets/a17c144f-1139-4142-ac52-254b114fc6c6" />


### 5) History
- локальна історія дій (можна винести в БД у наступній версії)

<img width="445" height="700" alt="image" src="https://github.com/user-attachments/assets/df773dcc-4cab-4749-955c-027669f1b285" />


### 6) Settings

<img width="443" height="705" alt="image" src="https://github.com/user-attachments/assets/046762d3-2b33-4244-b3cb-3817f135d13d" />


---

## Архітектура
- **Frontend:** HTML/CSS/JS  
- **Backend:** `rates.go` (Go + MySQL)  
- **Auth:** cookie‑сесії  
- **Rates:** `rates.go` → CoinGecko API → БД

---

## Обмеження
- Версія розрахована на **локальний запуск**.  
- Для хостингу потрібен сервер, який може виконувати Go + MySQL.  
- CoinGecko має ліміти API — на проді потрібні кешування або інший провайдер.

---

## Примітка про гілки
- `main` — спрощена демо‑версія без БД  
- `local-with-db` — повна версія з БД, логіном і переказами
