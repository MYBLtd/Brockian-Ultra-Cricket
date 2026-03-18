# api.md

## Purpose
The UX server exposes a small set of HTTP endpoints for three responsibilities:
- inspect normalized sources
- build complete screen models for renderers
- deliver rendered web or bitmap outputs

Home Assistant is the upstream data source. Clients should prefer talking to the UX server rather than directly to Home Assistant.

## Base URL structure

- `/api/*` returns JSON
- `/ui/*` returns HTML shells or rendered web pages
- `/render/*` returns bitmap or image output
- `/assets/*` returns static assets

## Content types

- JSON endpoints: `application/json; charset=utf-8`
- HTML endpoints: `text/html; charset=utf-8`
- Render endpoints: `image/png`

## Error handling principles

- Unknown screen, source, or device: `404`
- Invalid configuration: `500`
- Home Assistant temporarily unavailable:
  - `/api/health` may return `503`
  - `/api/source/*`, `/api/screen/*`, `/api/device/*` should prefer `200` with `status.ok = false` and warnings when graceful degradation is possible

## Endpoint reference

### `GET /api/health`

Purpose: quick operational health check.

Example response:

```json
{
  "ok": true,
  "generated_at": "2026-03-16T11:22:00+01:00",
  "checks": {
    "config_loaded": true,
    "ha_reachable": true,
    "cache_writable": true
  }
}


GET /api/source/{name}

Purpose: inspect one normalized source after HA adaptation.

Example request:
GET /api/source/weather_current

Example response:
{
  "source": "weather_current",
  "type": "ha_entity",
  "entity_id": "sensor.panel_weather_current",
  "generated_at": "2026-03-16T11:22:00+01:00",
  "data": {
    "t": 5.6,
    "feels_like": 3.8,
    "rh": 53,
    "pressure": 989,
    "ws": 14.4,
    "ws_bft": 4,
    "wg": 20.2,
    "wg_bft": 5,
    "wd": 330,
    "wd_label": "NNW",
    "precip": 0.0,
    "updated_at": "2026-03-16T10:42:00+00:00"
  },
  "status": {
    "ok": true,
    "warnings": []
  }
}

Example degraded response:
{
  "source": "weather_current",
  "generated_at": "2026-03-16T11:22:00+01:00",
  "data": null,
  "status": {
    "ok": false,
    "warnings": [
      "Source entity sensor.panel_weather_current not found"
    ]
  }
}


GET /api/screen/{name}

Purpose: return one complete screen model, ready for a web renderer or bitmap renderer.

Optional query parameters:
	•	theme=<theme_name>
	•	mode=web|bitmap|debug

Example request:

GET /api/screen/weather_landscape_main?mode=web

Top-level response shape:
{
  "screen": {
    "name": "weather_landscape_main",
    "title": "Weather Landscape Main",
    "layout": "landscape_split_footer",
    "theme": "dark_default",
    "generated_at": "2026-03-16T11:22:00+01:00",
    "device_mode": "web"
  },
  "layout": {
    "regions": ["left", "right_top", "right_bottom", "footer"]
  },
  "theme": {
    "name": "dark_default",
    "tokens": {
      "surface_1": "#243248",
      "surface_2": "#2f3b52",
      "text_primary": "#ffffff",
      "text_secondary": "#e7edf5",
      "border_soft": "rgba(255,255,255,0.06)",
      "temp_cold_1": "#7cc7ff",
      "temp_cold_2": "#9ed8ff",
      "temp_cool": "#8fe3c2",
      "temp_comfort": "#7cf29a",
      "temp_warm": "#e9d66b",
      "temp_hot": "#d9a066",
      "temp_very_hot": "#cf7b63"
    }
  },
  "regions": {
    "left": [],
    "right_top": [],
    "right_bottom": [],
    "footer": []
  }
}



Component envelope shape inside a region:
{
  "component": "outside_summary_main",
  "type": "outside_summary",
  "source": "weather_current",
  "status": {
    "ok": true,
    "warnings": []
  },
  "data": {},
  "options": {},
  "resolved": {}
}


GET /api/device/{name}

Purpose: return a full screen model already resolved through the device profile.

Example request:
GET /api/device/waveshare_hallway


Response shape:
{
  "device": {
    "name": "office_browser",
    "mode": "web",
    "renderer": "web-desktop",
    "screen": "weather_dashboard_main",
    "theme": "dark_default",
    "orientation": "landscape",
    "resolution": {
      "width": 1920,
      "height": 1080
    },
    "refresh_seconds": 30
  },
  "screen": {
    "name": "climate_landscape_main",
    "title": "Climate Landscape Main",
    "layout": "landscape_split",
    "theme": "dark_default",
    "generated_at": "2026-03-16T11:22:00+01:00",
    "device_mode": "bitmap"
  },
  "layout": {
    "regions": ["left", "right_top", "right_bottom"]
  },
  "theme": {
    "name": "dark_default",
    "tokens": {}
  },
  "regions": {
    "left": [],
    "right_top": [],
    "right_bottom": []
  }
}


GET /ui/screen/{name}

Purpose: browser-facing entry point for one named screen.

Recommended v1 behavior:
	•	return a light HTML shell
	•	shell loads CSS and JS assets
	•	JS fetches /api/screen/{name}?mode=web
	•	JS renders the component tree client-side

GET /ui/device/{name}

Purpose: browser-facing entry point for one device profile.

Recommended v1 behavior:
	•	return a light HTML shell
	•	shell fetches /api/device/{name}
	•	useful for full-screen browsers, TV clients, and debug use

GET /render/screen/{name}.png

Purpose: render a screen as a PNG using explicit screen name.

Optional query parameters:
	•	theme=<theme_name>
	•	width=<int>
	•	height=<int>

Response: image/png

Recommended v1 behavior:
	•	if a component type does not yet support bitmap rendering, draw a placeholder and log a warning instead of failing the full render

GET /render/device/{name}.png

Purpose: render a screen as a PNG resolved through device profile.

Example request:

GET /render/device/waveshare_hallway.png

Response: image/png

Recommended v1 behavior:
	•	device profile determines screen, theme, resolution, and mode
	•	this should be the preferred render endpoint for embedded panel clients

Query parameter policy

Supported in v1:
	•	/api/screen/{name}: theme, mode
	•	/render/screen/{name}.png: theme, width, height
	•	/ui/screen/{name}: theme

Preferred standard path for real clients:
	•	use device profiles rather than lots of query parameter customization

Caching policy

Client side
	•	/api/*: no-store
	•	/ui/*: HTML shell no-store
	•	/assets/*: long cache lifetime
	•	/render/*: may be short-cacheable if desired, but embedded clients will usually control refresh cadence

Server side

Suggested internal TTLs:
	•	weather_current: 30 s
	•	weather_hourly: 60 s
	•	weather_daily: 300 s
	•	indoor_payload: 30 s
	•	screen model cache: 15–30 s

V1 non-goals

Not in scope for v1:
	•	POST actions back to Home Assistant
	•	WebSockets or server push
	•	user-editable config UI
	•	auto-discovery of UI screens
	•	multi-user auth complexity
	•	theme inheritance system

## `docs/config-schema.md`

```md
# config-schema.md

## Purpose
The UX server uses JSON configuration files instead of YAML.
The configuration model is intentionally split into five parts:
- sources
- components
- screens
- devices
- themes

This keeps the configuration semantically clean and avoids spreading the same decisions across multiple files.

## Directory layout

```text
config/
  sources.json
  components.json
  screens.json
  devices.json
  themes.json

Design rules
	•	Home Assistant is the system of record for data.
	•	UX server configuration defines presentation semantics, not HA business logic.
	•	Layouts are semantic, not pixel-based.
	•	Meaning and defaults belong in config.
	•	Visual output belongs in theme and renderer.
	•	CSS is only the final presentation layer, not the source of semantics.

1. sources.json

Purpose:
	•	define where the UX server gets data from
	•	keep HA-specific entity references in one place

Top-level structure:

{
  "sources": {}
}

Supported v1 source type
	•	ha_entity

Example{
  "sources": {
    "weather_current": {
      "type": "ha_entity",
      "entity_id": "sensor.panel_weather_current"
    },
    "weather_hourly": {
      "type": "ha_entity",
      "entity_id": "sensor.panel_weather_48h"
    },
    "weather_daily": {
      "type": "ha_entity",
      "entity_id": "sensor.panel_weather_daily"
    },
    "indoor_payload": {
      "type": "ha_entity",
      "entity_id": "sensor.panel_indoor_payload"
    },
    "overview_payload": {
      "type": "ha_entity",
      "entity_id": "sensor.panel_overview_payload"
    }
  }
}

Validation rules
	•	source names must be unique
	•	type is required
	•	entity_id is required for ha_entity

2. components.json

Purpose:
	•	define reusable UI building blocks
	•	attach options to sources

Top-level structure:{
  "components": {}
}


Supported v1 component types
	•	outside_summary
	•	indoor_grid
	•	wind_strip
	•	daily_forecast
	•	map_panel
	•	web_embed

Example
{
  "components": {
    "outside_summary_main": {
      "type": "outside_summary",
      "source": "weather_current",
      "options": {
        "temperature_color_mode": "actual",
        "temperature_color_scale": "comfort_default",
        "wind_unit": "bft",
        "show_precip": true,
        "show_pressure": true,
        "show_humidity": true,
        "show_wind_compass": true,
        "show_updated_at": false,
        "layout_variant": "hero_split"
      }
    },
    "wind_strip_main": {
      "type": "wind_strip",
      "source": "weather_hourly",
      "options": {
        "hours": 12,
        "mode": "gusts",
        "unit": "bft",
        "show_direction": true,
        "show_hour": true,
        "show_numeric_secondary": false,
        "style_variant": "panel"
      }
    }
  }
}

Component option defaults agreed for v1

outside_summary
	•	temperature_color_mode = actual
	•	temperature_color_scale = comfort_default
	•	wind_unit = bft
	•	show_precip = true
	•	show_pressure = true
	•	show_humidity = true
	•	show_wind_compass = true
	•	layout_variant = hero_split

wind_strip
	•	mode = gusts
	•	unit = bft
	•	show_direction = true
	•	style_variant = panel

daily_forecast
	•	wind_mode = gust_max
	•	wind_unit = bft
	•	show_precip_probability = true
	•	show_day_label = true
	•	style_variant = cards

indoor_grid
	•	page = 1
	•	columns = 4
	•	rows = 4
	•	show_empty_cells = true
	•	style_variant = panel

map_panel
	•	mode = static_asset
	•	fit = contain
	•	show_location_marker = true
	•	overlay = none
	•	style_variant = panel

Validation rules
	•	component names must be unique
	•	type is required
	•	source is required except for pure static/embed components if later needed
	•	referenced source must exist in sources.json

3. screens.json

Purpose:
	•	define composition of components into named screens

Top-level structure:
{
  "screens": {}
}

Example{
  "screens": {
    "weather_landscape_main": {
      "layout": "landscape_split_footer",
      "title": "Weather Landscape Main",
      "regions": {
        "left": ["outside_summary_main"],
        "right_top": ["map_panel_main"],
        "right_bottom": ["wind_strip_main"],
        "footer": ["daily_forecast_main"]
      }
    },
    "climate_landscape_main": {
      "layout": "landscape_split",
      "title": "Climate Landscape Main",
      "regions": {
        "left": ["outside_summary_main"],
        "right_top": ["indoor_grid_main"],
        "right_bottom": ["wind_strip_main"]
      }
    }
  }
}


Supported v1 layouts
	•	landscape_split
	•	landscape_split_footer
	•	dashboard_two_column_footer

Design rule

Layouts must stay semantic. Do not store pixel coordinates here.
Use region names like:
	•	left
	•	right_top
	•	right_bottom
	•	footer
	•	left_top
	•	left_middle
	•	right_top
	•	right_middle

Validation rules
	•	screen names must be unique
	•	layout is required
	•	regions is required
	•	every referenced component must exist in components.json

4. devices.json

Purpose:
	•	bind a concrete device profile to a screen, theme, orientation, and output mode


Top-level structure:
{
  "devices": {}
}

Example
{
  "devices": {
    "office_browser": {
      "mode": "web",
      "screen": "weather_dashboard_main",
      "theme": "dark_default",
      "orientation": "landscape",
      "resolution": {
        "width": 1920,
        "height": 1080
      },
      "refresh_seconds": 30
    },
    "waveshare_hallway": {
      "mode": "bitmap",
      "screen": "climate_landscape_main",
      "theme": "dark_default",
      "orientation": "landscape",
      "resolution": {
        "width": 800,
        "height": 480
      },
      "refresh_seconds": 60
    }
  }
}

Supported v1 modes
	•	web
	•	bitmap

Validation rules
	•	device names must be unique
	•	mode is required
	•	screen is required
	•	theme is required
	•	referenced screen must exist in screens.json
	•	referenced theme must exist in themes.json
	•	resolution.width and resolution.height must be positive integers

5. themes.json

Purpose:
	•	define resolved visual tokens for renderers
	•	keep semantic style decisions out of renderer code

Top-level structure:
{
  "themes": {}
}

Example
{
  "themes": {
    "dark_default": {
      "tokens": {
        "surface_1": "#243248",
        "surface_2": "#2f3b52",
        "text_primary": "#ffffff",
        "text_secondary": "#e7edf5",
        "border_soft": "rgba(255,255,255,0.06)",
        "temp_cold_1": "#7cc7ff",
        "temp_cold_2": "#9ed8ff",
        "temp_cool": "#8fe3c2",
        "temp_comfort": "#7cf29a",
        "temp_warm": "#e9d66b",
        "temp_hot": "#d9a066",
        "temp_very_hot": "#cf7b63"
      },
      "temperature_scales": {
        "comfort_default": {
          "bands": [
            { "max": 0, "token": "temp_cold_1" },
            { "max": 7, "token": "temp_cold_2" },
            { "max": 14, "token": "temp_cool" },
            { "max": 21, "token": "temp_comfort" },
            { "max": 26, "token": "temp_warm" },
            { "max": 31, "token": "temp_hot" },
            { "max": 999, "token": "temp_very_hot" }
          ]
        }
      }
    }
  }
}



Agreed v1 rule
	•	temperature color mapping is based on actual temperature, not feels_like
	•	semantic default belongs in config and theme
	•	web CSS may still refine final appearance, but CSS is not the source of semantic meaning

Validation rules
	•	theme names must be unique
	•	tokens is required
	•	every temperature scale band token must exist in tokens

Screen model contract

The UX server should assemble one complete screen response for renderers.
Renderers should not need to load raw config files themselves.



Top-level response shape:

{
  "screen": {},
  "layout": {},
  "theme": {},
  "regions": {}
}


Component envelope shape:
{
  "component": "outside_summary_main",
  "type": "outside_summary",
  "source": "weather_current",
  "status": {
    "ok": true,
    "warnings": []
  },
  "data": {},
  "options": {},
  "resolved": {}
}

Source normalization rules

The HA adapter is responsible for:
	•	fetching HA entity state
	•	normalizing JSON-string attributes into objects or arrays
	•	computing missing helper values like Beaufort and 16-point wind labels
	•	attaching updated_at from HA last_updated

Resolved values rule

resolved may contain presentation semantics such as:
	•	temperature_color_token
	•	temperature_color
	•	direction_human
	•	display_wind_unit
	•	display_wind_value

resolved must not contain pixel layout instructions such as:
	•	x
	•	y
	•	font_size
	•	card_width

V1 constraints

V1 deliberately excludes:
	•	actions back to HA
	•	config editor UI
	•	auto-discovery of screens
	•	live push updates
	•	advanced theme inheritance
