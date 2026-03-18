#!/usr/bin/env bash
set -euo pipefail

./scripts/check-config.sh
go build -o bin/sensor-panel-ux-server ./cmd/sensor-panel-ux-server
sudo systemctl restart sensor-panel-ux-server
sudo systemctl --no-pager --full status sensor-panel-ux-server

