package httpapi

import (
	"net/http"

	"sensor-panel-ux-server/internal/app"
)

func Router(a *app.App) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", HealthHandler(a))
	mux.HandleFunc("/api/source/", SourceHandler(a))
	mux.HandleFunc("/api/screen/", ScreenHandler(a))
	mux.HandleFunc("/api/device/", DeviceHandler(a))
	return mux
}
