package main

import (
	"log"
	"net/http"
	"os"

	"sensor-panel-ux-server/internal/app"
	"sensor-panel-ux-server/internal/config"
	"sensor-panel-ux-server/internal/ha"
	"sensor-panel-ux-server/internal/httpapi"
)

func main() {
	configDir := getenv("UX_CONFIG_DIR", "./config")
	haURL := getenv("HA_BASE_URL", "http://127.0.0.1:8123")
	haToken := os.Getenv("HA_TOKEN")
	listenAddr := getenv("UX_LISTEN_ADDR", "127.0.0.1:9100")

	cfg, err := config.LoadAll(configDir)
	if err != nil {
		log.Fatalf("config load failed: %v", err)
	}

	haClient := ha.NewClient(haURL, haToken)
	application := app.New(cfg, haClient)

	router := httpapi.Router(application)

	log.Printf("sensor-panel-ux-server listening on %s", listenAddr)
	if err := http.ListenAndServe(listenAddr, router); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func getenv(key, fallback string) string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	return v
}
