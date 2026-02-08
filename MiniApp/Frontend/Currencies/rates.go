package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

type CoinGeckoResponse map[string]map[string]float64

const (
	outputFile = "rates.json"
	interval   = 300 * time.Second
)

func main() {
	// DB is optional; file fallback always stays.
	log.Println("rates updater started")

	db, err := openDB()
	if err != nil {
		log.Println("db disabled:", err)
	}

	go startServer(db)

	for {
		rates, err := fetchRates()
		if err != nil {
			log.Println("fetch error:", err)
		} else {
			if err := saveRatesToDB(db, rates); err != nil {
				log.Println("db save error:", err)
			}
			if err := saveRates(rates); err != nil {
				log.Println("save error:", err)
			}
			log.Println("rates updated")
		}

		time.Sleep(interval)
	}
}

// Pull external prices and add local assets.
func fetchRates() (map[string]float64, error) {
	rates := map[string]float64{
		"USDT":  1.00,
		"BLINK": 100.00,
	}

	url := "https://api.coingecko.com/api/v3/simple/price" +
		"?ids=bitcoin,ethereum,solana,tron,the-open-network" +
		"&vs_currencies=usd"

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data CoinGeckoResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	rates["BTC"] = data["bitcoin"]["usd"]
	rates["ETH"] = data["ethereum"]["usd"]
	rates["SOL"] = data["solana"]["usd"]
	rates["TRX"] = data["tron"]["usd"]
	rates["TON"] = data["the-open-network"]["usd"]

	return rates, nil
}

// Keep a local JSON snapshot as a fallback.
func saveRates(rates map[string]float64) error {
	tmp := outputFile + ".tmp"

	bytes, err := json.MarshalIndent(rates, "", "  ")
	if err != nil {
		return err
	}

	if err := os.WriteFile(tmp, bytes, 0644); err != nil {
		return err
	}

	return os.Rename(tmp, outputFile)
}

// Open MySQL connection from env.
func openDB() (*sql.DB, error) {
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		return nil, sql.ErrConnDone
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	db.SetConnMaxLifetime(2 * time.Minute)
	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(5)

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

// Write one snapshot to DB.
func saveRatesToDB(db *sql.DB, rates map[string]float64) error {
	if db == nil {
		return nil
	}

	_, err := db.Exec(
		`INSERT INTO rates
			(upd_date, USDT, BTC, ETH, SOL, TRX, TON, BLINK)
		 VALUES
			(NOW(), ?, ?, ?, ?, ?, ?, ?)`,
		rates["USDT"],
		rates["BTC"],
		rates["ETH"],
		rates["SOL"],
		rates["TRX"],
		rates["TON"],
		rates["BLINK"],
	)
	return err
}

// API: rates, auth, balances, transfers.
func startServer(db *sql.DB) {
	mux := http.NewServeMux()
	mux.HandleFunc("/rates", func(w http.ResponseWriter, r *http.Request) {
		if handlePreflight(w, r) {
			return
		}
		w.Header().Set("content-type", "application/json")
		setOriginHeaders(w, r)

		current, err := loadCurrentRates(db)
		if err != nil {
			if fileRates, ferr := loadRatesFromFile(); ferr == nil {
				_ = json.NewEncoder(w).Encode(map[string]any{
					"current": fileRates,
					"daily":   fileRates,
					"roi":     map[string]float64{},
				})
				return
			}
			http.Error(w, `{"error":"no rates"}`, http.StatusServiceUnavailable)
			return
		}

		daily, err := loadDailyRates(db)
		if err != nil {
			daily = current
		}

		roi := map[string]float64{}
		for k, v := range current {
			if base, ok := daily[k]; ok && base != 0 {
				roi[k] = (v - base) / base * 100
			}
		}

		_ = json.NewEncoder(w).Encode(map[string]any{
			"current": current,
			"daily":   daily,
			"roi":     roi,
		})
	})

	mux.HandleFunc("/user", func(w http.ResponseWriter, r *http.Request) {
		if handlePreflight(w, r) {
			return
		}
		w.Header().Set("content-type", "application/json")
		setOriginHeaders(w, r)

		if db == nil {
			http.Error(w, `{"error":"db disabled"}`, http.StatusServiceUnavailable)
			return
		}

		switch r.Method {
		case http.MethodGet:
			userID := resolveUserID(db, r, getUserID(r))
			user, err := loadUser(db, userID)
			if err == sql.ErrNoRows {
				name := os.Getenv("DEFAULT_NAME")
				if name == "" {
					name = "Alex"
				}
				if err := upsertUser(db, userID, name); err != nil {
					log.Println("user create error:", err)
				}
				user = map[string]any{"user_id": userID, "name": name, "tag": ""}
			} else if err != nil {
				log.Println("user load error:", err)
				http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
				return
			}
			_ = json.NewEncoder(w).Encode(user)
		case http.MethodPost:
			var payload struct {
				UserID int    `json:"user_id"`
				Name   string `json:"name"`
			}
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
				return
			}
			payload.UserID = resolveUserID(db, r, payload.UserID)
			if payload.Name == "" {
				http.Error(w, `{"error":"name required"}`, http.StatusBadRequest)
				return
			}
			if err := upsertUser(db, payload.UserID, payload.Name); err != nil {
				log.Println("user save error:", err)
				http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
				return
			}
			_ = json.NewEncoder(w).Encode(map[string]any{
				"user_id": payload.UserID,
				"name":    payload.Name,
			})
		default:
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/auth/register", func(w http.ResponseWriter, r *http.Request) {
		if handlePreflight(w, r) {
			return
		}
		w.Header().Set("content-type", "application/json")
		setOriginHeaders(w, r)

		if db == nil {
			http.Error(w, `{"error":"db disabled"}`, http.StatusServiceUnavailable)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		var payload struct {
			Name     string `json:"name"`
			Tag      string `json:"tag"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
			return
		}

		name := strings.TrimSpace(payload.Name)
		tag := normalizeTag(payload.Tag)
		password := strings.TrimSpace(payload.Password)

		if name == "" {
			http.Error(w, `{"error":"name required"}`, http.StatusBadRequest)
			return
		}
		if !validTag(tag) {
			http.Error(w, `{"error":"invalid tag"}`, http.StatusBadRequest)
			return
		}
		if len(password) < 6 {
			http.Error(w, `{"error":"password too short"}`, http.StatusBadRequest)
			return
		}

		if existsTag(db, tag) {
			http.Error(w, `{"error":"tag already taken"}`, http.StatusConflict)
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Println("hash error:", err)
			http.Error(w, `{"error":"server error"}`, http.StatusInternalServerError)
			return
		}

		userID, err := createUser(db, name, tag, string(hash))
		if err != nil {
			log.Println("create user error:", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		if err := saveBalances(db, userID, map[string]float64{}); err != nil {
			log.Println("init balances error:", err)
		}

		if err := createSession(w, db, userID); err != nil {
			log.Println("session create error:", err)
		}

		_ = json.NewEncoder(w).Encode(map[string]any{
			"user_id": userID,
			"name":    name,
			"tag":     tag,
		})
	})

	mux.HandleFunc("/auth/login", func(w http.ResponseWriter, r *http.Request) {
		if handlePreflight(w, r) {
			return
		}
		w.Header().Set("content-type", "application/json")
		setOriginHeaders(w, r)

		if db == nil {
			http.Error(w, `{"error":"db disabled"}`, http.StatusServiceUnavailable)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		var payload struct {
			Tag      string `json:"tag"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
			return
		}

		tag := normalizeTag(payload.Tag)
		password := strings.TrimSpace(payload.Password)
		if !validTag(tag) || password == "" {
			http.Error(w, `{"error":"invalid credentials"}`, http.StatusBadRequest)
			return
		}

		user, hash, err := loadUserByTag(db, tag)
		if err == sql.ErrNoRows {
			http.Error(w, `{"error":"invalid credentials"}`, http.StatusUnauthorized)
			return
		}
		if err != nil {
			log.Println("login load error:", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
			http.Error(w, `{"error":"invalid credentials"}`, http.StatusUnauthorized)
			return
		}

		if err := createSession(w, db, user["user_id"].(int)); err != nil {
			log.Println("session create error:", err)
		}

		_ = json.NewEncoder(w).Encode(user)
	})

	mux.HandleFunc("/auth/me", func(w http.ResponseWriter, r *http.Request) {
		if handlePreflight(w, r) {
			return
		}
		w.Header().Set("content-type", "application/json")
		setOriginHeaders(w, r)

		if db == nil {
			http.Error(w, `{"error":"db disabled"}`, http.StatusServiceUnavailable)
			return
		}

		userID, ok := getSessionUserID(db, r)
		if !ok {
			http.Error(w, `{"error":"not authenticated"}`, http.StatusUnauthorized)
			return
		}

		user, err := loadUser(db, userID)
		if err != nil {
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(user)
	})

	mux.HandleFunc("/user/tag", func(w http.ResponseWriter, r *http.Request) {
		if handlePreflight(w, r) {
			return
		}
		w.Header().Set("content-type", "application/json")
		setOriginHeaders(w, r)

		if db == nil {
			http.Error(w, `{"error":"db disabled"}`, http.StatusServiceUnavailable)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		var payload struct {
			UserID int    `json:"user_id"`
			Tag    string `json:"tag"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
			return
		}
		tag := normalizeTag(payload.Tag)
		payload.UserID = resolveUserID(db, r, payload.UserID)
		if payload.UserID <= 0 || !validTag(tag) {
			http.Error(w, `{"error":"invalid tag"}`, http.StatusBadRequest)
			return
		}
		if existsTagExcept(db, tag, payload.UserID) {
			http.Error(w, `{"error":"tag already taken"}`, http.StatusConflict)
			return
		}
		if _, err := db.Exec(`UPDATE users SET tag = ? WHERE user_id = ?`, tag, payload.UserID); err != nil {
			log.Println("tag update error:", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"tag": tag})
	})

	mux.HandleFunc("/user/password", func(w http.ResponseWriter, r *http.Request) {
		if handlePreflight(w, r) {
			return
		}
		w.Header().Set("content-type", "application/json")
		setOriginHeaders(w, r)

		if db == nil {
			http.Error(w, `{"error":"db disabled"}`, http.StatusServiceUnavailable)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		var payload struct {
			UserID   int    `json:"user_id"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
			return
		}
		payload.UserID = resolveUserID(db, r, payload.UserID)
		if payload.UserID <= 0 {
			http.Error(w, `{"error":"invalid user"}`, http.StatusBadRequest)
			return
		}
		if len(strings.TrimSpace(payload.Password)) < 6 {
			http.Error(w, `{"error":"password too short"}`, http.StatusBadRequest)
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Println("hash error:", err)
			http.Error(w, `{"error":"server error"}`, http.StatusInternalServerError)
			return
		}
		if _, err := db.Exec(`UPDATE users SET password_hash = ? WHERE user_id = ?`, string(hash), payload.UserID); err != nil {
			log.Println("password update error:", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"saved": true})
	})

	mux.HandleFunc("/balances", func(w http.ResponseWriter, r *http.Request) {
		if handlePreflight(w, r) {
			return
		}
		w.Header().Set("content-type", "application/json")
		setOriginHeaders(w, r)

		if db == nil {
			http.Error(w, `{"error":"db disabled"}`, http.StatusServiceUnavailable)
			return
		}

		switch r.Method {
		case http.MethodGet:
			userID := resolveUserID(db, r, getUserID(r))
			balances, err := loadBalances(db, userID)
			if err == sql.ErrNoRows {
				balances = map[string]float64{
					"USDT":  0,
					"BTC":   0,
					"ETH":   0,
					"SOL":   0,
					"TRX":   0,
					"TON":   0,
					"BLINK": 0,
				}
			}
			if err != nil && err != sql.ErrNoRows {
				log.Println("balances load error:", err)
				http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
				return
			}
			_ = json.NewEncoder(w).Encode(map[string]any{
				"user_id":  userID,
				"balances": balances,
			})
		case http.MethodPost:
			var payload struct {
				UserID   int                `json:"user_id"`
				Balances map[string]float64 `json:"balances"`
			}
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
				return
			}
			payload.UserID = resolveUserID(db, r, payload.UserID)
			if err := saveBalances(db, payload.UserID, payload.Balances); err != nil {
				log.Println("balances save error:", err)
				http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
				return
			}
			_ = json.NewEncoder(w).Encode(map[string]any{
				"user_id": payload.UserID,
				"saved":   true,
			})
		default:
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/transfer", func(w http.ResponseWriter, r *http.Request) {
		if handlePreflight(w, r) {
			return
		}
		w.Header().Set("content-type", "application/json")
		setOriginHeaders(w, r)

		if db == nil {
			http.Error(w, `{"error":"db disabled"}`, http.StatusServiceUnavailable)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		var payload struct {
			FromUserID int     `json:"from_user_id"`
			ToTag      string  `json:"to_tag"`
			Symbol     string  `json:"symbol"`
			Amount     float64 `json:"amount"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
			return
		}

		tag := normalizeTag(payload.ToTag)
		payload.FromUserID = resolveUserID(db, r, payload.FromUserID)
		if payload.FromUserID <= 0 || !validTag(tag) {
			http.Error(w, `{"error":"invalid recipient"}`, http.StatusBadRequest)
			return
		}
		if payload.Amount <= 0 {
			http.Error(w, `{"error":"invalid amount"}`, http.StatusBadRequest)
			return
		}

		if !validSymbol(payload.Symbol) {
			http.Error(w, `{"error":"unsupported currency"}`, http.StatusBadRequest)
			return
		}

		toUserID, err := getUserIDByTag(db, tag)
		if err == sql.ErrNoRows {
			http.Error(w, `{"error":"recipient not found"}`, http.StatusNotFound)
			return
		}
		if err != nil {
			log.Println("recipient lookup error:", err)
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		tx, err := db.Begin()
		if err != nil {
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		fromBalances, err := loadBalancesTx(tx, payload.FromUserID)
		if err != nil {
			http.Error(w, `{"error":"balance not found"}`, http.StatusNotFound)
			return
		}
		toBalances, err := loadBalancesTx(tx, toUserID)
		if err != nil {
			toBalances = map[string]float64{}
		}

		if fromBalances[payload.Symbol] < payload.Amount {
			http.Error(w, `{"error":"insufficient balance"}`, http.StatusBadRequest)
			return
		}

		fromBalances[payload.Symbol] -= payload.Amount
		toBalances[payload.Symbol] += payload.Amount

		if err := saveBalancesTx(tx, payload.FromUserID, fromBalances); err != nil {
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}
		if err := saveBalancesTx(tx, toUserID, toBalances); err != nil {
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}
		if _, err := tx.Exec(
			`INSERT INTO transfers (from_user_id, to_user_id, symbol, amount, date)
			 VALUES (?, ?, ?, ?, NOW())`,
			payload.FromUserID, toUserID, payload.Symbol, payload.Amount,
		); err != nil {
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		if err := tx.Commit(); err != nil {
			http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
			return
		}

		_ = json.NewEncoder(w).Encode(map[string]any{"saved": true})
	})

	addr := os.Getenv("RATES_ADDR")
	if addr == "" {
		addr = ":8080"
	}

	log.Println("rates server:", addr)
	handler := withCORS(mux)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Println("server error:", err)
	}
}

func loadCurrentRates(db *sql.DB) (map[string]float64, error) {
	if db == nil {
		return nil, sql.ErrConnDone
	}

	row := db.QueryRow(`
		SELECT USDT, BTC, ETH, SOL, TRX, TON, BLINK
		FROM rates
		ORDER BY upd_date DESC
		LIMIT 1
	`)

	return scanRatesRow(row)
}

func loadDailyRates(db *sql.DB) (map[string]float64, error) {
	if db == nil {
		return nil, sql.ErrConnDone
	}

	row := db.QueryRow(`
		SELECT USDT, BTC, ETH, SOL, TRX, TON, BLINK
		FROM rates
		WHERE upd_date <= NOW() - INTERVAL 24 HOUR
		ORDER BY upd_date DESC
		LIMIT 1
	`)

	rates, err := scanRatesRow(row)
	if err == nil {
		return rates, nil
	}

	row = db.QueryRow(`
		SELECT USDT, BTC, ETH, SOL, TRX, TON, BLINK
		FROM rates
		ORDER BY upd_date ASC
		LIMIT 1
	`)
	return scanRatesRow(row)
}

func scanRatesRow(row *sql.Row) (map[string]float64, error) {
	var usdt, btc, eth, sol, trx, ton, blink float64
	if err := row.Scan(&usdt, &btc, &eth, &sol, &trx, &ton, &blink); err != nil {
		return nil, err
	}

	return map[string]float64{
		"USDT":  usdt,
		"BTC":   btc,
		"ETH":   eth,
		"SOL":   sol,
		"TRX":   trx,
		"TON":   ton,
		"BLINK": blink,
	}, nil
}

func loadRatesFromFile() (map[string]float64, error) {
	bytes, err := os.ReadFile(outputFile)
	if err != nil {
		return nil, err
	}

	var rates map[string]float64
	if err := json.Unmarshal(bytes, &rates); err != nil {
		return nil, err
	}

	return rates, nil
}

// CORS helpers.
func handlePreflight(w http.ResponseWriter, r *http.Request) bool {
	if r.Method != http.MethodOptions {
		return false
	}
	setCORSHeaders(w, r)
	w.WriteHeader(http.StatusNoContent)
	return true
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		setCORSHeaders(w, r)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func setCORSHeaders(w http.ResponseWriter, r *http.Request) {
	origin := allowedOrigin(r.Header.Get("Origin"))
	if origin != "" {
		w.Header().Set("access-control-allow-origin", origin)
		w.Header().Set("access-control-allow-credentials", "true")
	}
	w.Header().Set("access-control-allow-methods", "GET,POST,OPTIONS")
	w.Header().Set("access-control-allow-headers", "content-type")
}

func setOriginHeaders(w http.ResponseWriter, r *http.Request) {
	origin := allowedOrigin(r.Header.Get("Origin"))
	if origin != "" {
		w.Header().Set("access-control-allow-origin", origin)
		w.Header().Set("access-control-allow-credentials", "true")
	}
}

func allowedOrigin(origin string) string {
	switch origin {
	case "http://127.0.0.1:5500", "http://localhost:5500":
		return origin
	default:
		return ""
	}
}

// User identity helpers.
func getUserID(r *http.Request) int {
	raw := r.URL.Query().Get("id")
	if raw == "" {
		raw = r.URL.Query().Get("user_id")
	}
	if raw == "" {
		return 1
	}
	id, err := strconv.Atoi(raw)
	if err != nil || id <= 0 {
		return 1
	}
	return id
}

func resolveUserID(db *sql.DB, r *http.Request, fallback int) int {
	if fallback > 0 {
		return fallback
	}
	if db == nil {
		return 0
	}
	if userID, ok := getSessionUserID(db, r); ok {
		return userID
	}
	return 0
}

// Read session cookie and resolve user.
func getSessionUserID(db *sql.DB, r *http.Request) (int, bool) {
	cookie, err := r.Cookie("bw_session")
	if err != nil || cookie.Value == "" {
		return 0, false
	}
	row := db.QueryRow(
		`SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW()`,
		cookie.Value,
	)
	var userID int
	if err := row.Scan(&userID); err != nil {
		return 0, false
	}
	return userID, true
}

// Create a session cookie and DB entry.
func createSession(w http.ResponseWriter, db *sql.DB, userID int) error {
	token, err := newToken(32)
	if err != nil {
		return err
	}
	_, err = db.Exec(
		`INSERT INTO sessions (token, user_id, created_at, expires_at)
		 VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))`,
		token, userID,
	)
	if err != nil {
		return err
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "bw_session",
		Value:    token,
		Path:     "/",
		MaxAge:   60 * 60 * 24 * 30,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	return nil
}

func newToken(bytesCount int) (string, error) {
	buf := make([]byte, bytesCount)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}
func loadUser(db *sql.DB, userID int) (map[string]any, error) {
	row := db.QueryRow(`SELECT user_id, name, tag FROM users WHERE user_id = ?`, userID)
	var id int
	var name string
	var tag sql.NullString
	if err := row.Scan(&id, &name, &tag); err != nil {
		return nil, err
	}
	return map[string]any{"user_id": id, "name": name, "tag": tag.String}, nil
}

func upsertUser(db *sql.DB, userID int, name string) error {
	_, err := db.Exec(
		`INSERT INTO users (user_id, name, create_date)
		 VALUES (?, ?, NOW())
		 ON DUPLICATE KEY UPDATE name = VALUES(name)`,
		userID, name,
	)
	return err
}

func loadBalances(db *sql.DB, userID int) (map[string]float64, error) {
	row := db.QueryRow(`
		SELECT USDT_balance, BTC_balance, ETH_balance, SOL_balance, TRX_balance, TON_balance, BLINK_balance
		FROM balances
		WHERE user_id = ?
		ORDER BY upd_date DESC
		LIMIT 1
	`, userID)

	var usdt, btc, eth, sol, trx, ton, blink float64
	if err := row.Scan(&usdt, &btc, &eth, &sol, &trx, &ton, &blink); err != nil {
		return nil, err
	}

	return map[string]float64{
		"USDT":  usdt,
		"BTC":   btc,
		"ETH":   eth,
		"SOL":   sol,
		"TRX":   trx,
		"TON":   ton,
		"BLINK": blink,
	}, nil
}

func saveBalances(db *sql.DB, userID int, balances map[string]float64) error {
	get := func(key string) float64 {
		if balances == nil {
			return 0
		}
		if v, ok := balances[key]; ok {
			return v
		}
		return 0
	}

	_, err := db.Exec(
		`INSERT INTO balances
			(user_id, upd_date, USDT_balance, BTC_balance, ETH_balance, SOL_balance, TRX_balance, TON_balance, BLINK_balance)
		 VALUES
			(?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
		userID,
		get("USDT"),
		get("BTC"),
		get("ETH"),
		get("SOL"),
		get("TRX"),
		get("TON"),
		get("BLINK"),
	)
	return err
}

func loadUserByTag(db *sql.DB, tag string) (map[string]any, string, error) {
	row := db.QueryRow(`SELECT user_id, name, tag, password_hash FROM users WHERE tag = ?`, tag)
	var id int
	var name, storedTag, hash string
	if err := row.Scan(&id, &name, &storedTag, &hash); err != nil {
		return nil, "", err
	}
	return map[string]any{"user_id": id, "name": name, "tag": storedTag}, hash, nil
}

func getUserIDByTag(db *sql.DB, tag string) (int, error) {
	row := db.QueryRow(`SELECT user_id FROM users WHERE tag = ?`, tag)
	var id int
	if err := row.Scan(&id); err != nil {
		return 0, err
	}
	return id, nil
}

func createUser(db *sql.DB, name, tag, hash string) (int, error) {
	res, err := db.Exec(
		`INSERT INTO users (name, tag, password_hash, create_date)
		 VALUES (?, ?, ?, NOW())`,
		name, tag, hash,
	)
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return int(id), nil
}

func existsTag(db *sql.DB, tag string) bool {
	row := db.QueryRow(`SELECT 1 FROM users WHERE tag = ? LIMIT 1`, tag)
	var tmp int
	return row.Scan(&tmp) == nil
}

func existsTagExcept(db *sql.DB, tag string, userID int) bool {
	row := db.QueryRow(`SELECT 1 FROM users WHERE tag = ? AND user_id <> ? LIMIT 1`, tag, userID)
	var tmp int
	return row.Scan(&tmp) == nil
}

func normalizeTag(tag string) string {
	return strings.ToLower(strings.TrimSpace(tag))
}

func validTag(tag string) bool {
	if len(tag) < 3 || len(tag) > 12 {
		return false
	}
	for _, r := range tag {
		if r >= 'a' && r <= 'z' {
			continue
		}
		if r >= '0' && r <= '9' {
			continue
		}
		if r == '_' || r == '-' || r == '.' {
			continue
		}
		return false
	}
	return true
}

func validSymbol(symbol string) bool {
	switch symbol {
	case "USDT", "BTC", "ETH", "SOL", "TRX", "TON", "BLINK":
		return true
	default:
		return false
	}
}

func loadBalancesTx(tx *sql.Tx, userID int) (map[string]float64, error) {
	row := tx.QueryRow(`
		SELECT USDT_balance, BTC_balance, ETH_balance, SOL_balance, TRX_balance, TON_balance, BLINK_balance
		FROM balances
		WHERE user_id = ?
		ORDER BY upd_date DESC
		LIMIT 1
	`, userID)
	var usdt, btc, eth, sol, trx, ton, blink float64
	if err := row.Scan(&usdt, &btc, &eth, &sol, &trx, &ton, &blink); err != nil {
		return nil, err
	}
	return map[string]float64{
		"USDT":  usdt,
		"BTC":   btc,
		"ETH":   eth,
		"SOL":   sol,
		"TRX":   trx,
		"TON":   ton,
		"BLINK": blink,
	}, nil
}

func saveBalancesTx(tx *sql.Tx, userID int, balances map[string]float64) error {
	get := func(key string) float64 {
		if balances == nil {
			return 0
		}
		if v, ok := balances[key]; ok {
			return v
		}
		return 0
	}

	_, err := tx.Exec(
		`INSERT INTO balances
			(user_id, upd_date, USDT_balance, BTC_balance, ETH_balance, SOL_balance, TRX_balance, TON_balance, BLINK_balance)
		 VALUES
			(?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
		userID,
		get("USDT"),
		get("BTC"),
		get("ETH"),
		get("SOL"),
		get("TRX"),
		get("TON"),
		get("BLINK"),
	)
	return err
}
