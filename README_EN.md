# BlinkWallet — Telegram Mini App (database version)

> This README describes the **enhanced version with a database** located in the `local-with-db` branch.
> The `main` branch contains a simplified version without a database (static rates, no ROI/sessions).

---

## Overview

A demo crypto wallet implemented as a Telegram Mini App.
This version includes:

* user **registration/login** with password
* **user tags** for transfers
* **cookie-based sessions** (persistent login)
* **MySQL database storage**
* backend-driven rate updates + 24h ROI calculation

---

## Quick start (local)

### 1) Database (MySQL)

A local MySQL instance is required (Workbench or any alternative).

<img width="527" height="435" alt="image" src="https://github.com/user-attachments/assets/d678003d-0aaa-408f-af0c-c33332371216" />


**Tables schema:**

- `rates`

  <img width="421" height="191" alt="image" src="https://github.com/user-attachments/assets/fd570fac-66b7-4674-9ead-1c644e49b40e" />

- `balances`

<img width="418" height="194" alt="image" src="https://github.com/user-attachments/assets/09b86aa2-a5dc-43fb-b770-80d59089826f" />
  
- `users`

<img width="422" height="153" alt="image" src="https://github.com/user-attachments/assets/cf299d0a-004a-4491-afa6-618c1c7587d5" />
  
- `transfers`

<img width="437" height="166" alt="image" src="https://github.com/user-attachments/assets/8b0d7f30-18b4-40c0-89d3-0ef1eca95daa" />

- `sessions`

<img width="420" height="147" alt="image" src="https://github.com/user-attachments/assets/29fa7f79-8506-43ed-9dda-6539f1aa31d8" />

---

### 2) Start backend server (rates.go)

Local HTTP server responsible for:

* storing exchange rates in DB
* serving `/rates` endpoint
* handling login/registration
* storing balances
* processing transfers

**Run:**

```powershell
cd MiniApp/Frontend/Currencies
$env:MYSQL_DSN="{USER}:{PASSWORD}@tcp({HOST}:{PORT})/{DB_NAME}?parseTime=true&charset=utf8mb4"
go run .\rates.go
```

Server runs on:

```
http://127.0.0.1:8080
```

---

### 3) Start frontend

Open `index.html` using a local server (for example Live Server).

Important to use **127.0.0.1**:

```
http://127.0.0.1:5500
```

---

## Functionality

### 1) Registration / Login

<img width="459" height="695" alt="image" src="https://github.com/user-attachments/assets/4b2760cd-1231-4a13-ac7b-f506b60a0091" />

* On first launch, the auth form opens
* User tag: **3–12 characters**, allowed: `a-z`, digits, `_`, `-`, `.`
* Password is hashed using bcrypt
* Session stored in cookies after login

### 2) Home

<img width="414" height="158" alt="image" src="https://github.com/user-attachments/assets/e400a174-7003-40c2-b437-b681fcc67037" />

<img width="437" height="704" alt="image" src="https://github.com/user-attachments/assets/2509b378-834c-4972-8b0b-974857acf474" />

* Displays market rates (USDT, BTC, ETH, SOL, TON, TRX, BLINK)
* Shows 24h ROI

### 3) Assets

<img width="432" height="317" alt="image" src="https://github.com/user-attachments/assets/89639e81-93bb-4c82-92f8-aa7c852d6af0" />

<img width="437" height="705" alt="image" src="https://github.com/user-attachments/assets/dec958d1-4715-437e-bf2a-61e498cfd90c" />

* Full list of assets and balances
* Total portfolio value in USD
* Deposit / Withdraw / Swap actions

### 4) Deposit / Withdraw / Swap

<img width="438" height="708" alt="image" src="https://github.com/user-attachments/assets/a17c144f-1139-4142-ac52-254b114fc6c6" />

* Deposit and Swap work with local balances and sync with DB
* Withdraw works as a **transfer to another user**
* Requires **To user (tag)** field

### 5) History

<img width="445" height="700" alt="image" src="https://github.com/user-attachments/assets/df773dcc-4cab-4749-955c-027669f1b285" />

* Local transaction history
* Can be moved to database in future versions

### 6) Settings

<img width="443" height="705" alt="image" src="https://github.com/user-attachments/assets/046762d3-2b33-4244-b3cb-3817f135d13d" />

* Basic user settings and profile adjustments

---

## Architecture

* **Frontend:** HTML/CSS/JS
* **Backend:** `rates.go` (Go + MySQL)
* **Authentication:** cookie-based sessions
* **Rates flow:** CoinGecko API → backend → database → frontend

---

## Limitations

* Designed for **local deployment**
* Hosting requires a server capable of running Go + MySQL
* CoinGecko has API rate limits; production version requires caching or another provider

---

## Branch notes

* `main` — simplified demo without database
* `local-with-db` — full version with DB, auth, and transfers
