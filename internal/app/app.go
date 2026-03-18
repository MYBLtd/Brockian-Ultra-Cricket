package app

import (
	"sensor-panel-ux-server/internal/config"
	"sensor-panel-ux-server/internal/ha"
)

type App struct {
	Config   *config.AllConfig
	HAClient *ha.Client
}

func New(cfg *config.AllConfig, hc *ha.Client) *App {
	return &App{
		Config:   cfg,
		HAClient: hc,
	}
}
