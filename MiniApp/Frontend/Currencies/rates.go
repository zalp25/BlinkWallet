package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

type CoinGeckoResponse map[string]map[string]float64

const (
	outputFile = "rates.json"
	interval   = 5 * time.Second
)

func main() {
	log.Println("rates updater started")

	for {
		rates, err := fetchRates()
		if err != nil {
			log.Println("fetch error:", err)
		} else if err := saveRates(rates); err != nil {
			log.Println("save error:", err)
		} else {
			log.Println("rates updated")
		}

		time.Sleep(interval)
	}
}

func fetchRates() (map[string]float64, error) {
	rates := map[string]float64{
		"USDT":   1.00,
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
