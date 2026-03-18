## `memory.md`

```md
# memory.md

## Project
HA dashboard / sensor panel UX server

## Current architectural position
The project now has a clear split between:
- Home Assistant as the stable data and automation platform
- a separate UX server on a dedicated VM as the presentation layer

The Home Assistant host should stay clean and easy to maintain. Extra scripts, renderers, and UI logic should not run on the HA host.

## Confirmed conclusions

### Home Assistant is good at
- fetching weather data
- aggregating local and external data
- normalizing sensor and weather entities
- exposing a stable internal truth for consumers

### Home Assistant is not the preferred final panel UI engine
It can produce useful dashboards and debug views, but it is not the best place to build the final pixel-precise, appliance-like panel UI that the project wants.

## Data architecture decisions

### Hard split
- HA server delivers data
- UX server consumes HA data and renders output
- clients consume the UX server, not HA directly where avoidable

### UX server hosting choice
- Apache2 is the chosen web server foundation
- JSON is preferred over YAML for UX server config
- root path planned for the UX server project: `/fs01/sensor_panel_ux-server`

### Configuration philosophy
The UX server config is semantic and split into:
- `sources.json`
- `components.json`
- `screens.json`
- `devices.json`
- `themes.json`

Meaning and defaults belong in config.
Visual realization belongs in theme and renderer.
CSS is only the last presentation layer, not the source of semantics.

## UX server model

### Sources
Primary current and forecast data sources in HA:
- `sensor.panel_weather_current`
- `sensor.panel_weather_48h`
- `sensor.panel_weather_daily`
- `sensor.panel_indoor_payload`
- `sensor.panel_overview_payload`

### Components agreed for v1
- `outside_summary`
- `wind_strip`
- `daily_forecast`
- `indoor_grid`
- `map_panel`

### Screens agreed for v1
- `weather_landscape_main`
- `climate_landscape_main`
- `weather_dashboard_main`

### Device profiles agreed for v1 examples
- `office_browser`
- `waveshare_hallway`

## Weather data decisions

### Wind units
- Internally keep both km/h and Beaufort when available or derivable
- UI default should be Beaufort (`bft`)

### Direction labels
- Use 16-point direction labels such as `NNW`

### Daily forecast
- Show gust maximum, not sustained wind maximum, by default

### Temperature color mapping
- Use actual temperature, not feels_like, for semantic temperature coloring
- Theme should define the scale tokens

### Current source split
The normalized current object is intentionally hybrid:
- local MQTT sensors for:
  - temperature
  - humidity
  - barometric pressure
- Open-Meteo current for:
  - wind speed
  - wind gusts
  - wind bearing
  - precipitation now
  - feels_like
- OpenUV for UV-related information

## HA-side normalized entities already established
The project has already established the concept of one normalized HA truth layer.
Important normalized entities include:
- `sensor.panel_weather_current`
- `sensor.panel_weather_48h`
- `sensor.panel_weather_daily`
- `sensor.panel_overview_payload`
- `sensor.panel_indoor_payload`

## Dashboard reality check
A useful interim HA dashboard exists and helps verify:
- current weather values
- Open-Meteo freshness and health
- local sensor values
- Windy embeds
- daily forecast sanity

This dashboard is considered a useful debug and family view, not the final panel UX.

## Windy decision
The project should avoid dependency on abandoned or fragile one-maintainer custom weather map cards when possible.
Official Windy embeds inside HA or the UX server are acceptable for browser-oriented views.

## UX output modes
The UX server is expected to support at least two output modes:
- web output for browsers, TVs, tablets, and debug views
- bitmap or image output for embedded display clients such as Waveshare/ESP32-type screens

These output modes should use the same semantic screen definitions.

## API design decisions
Planned endpoint families:
- `/api/*` for JSON
- `/ui/*` for browser UIs
- `/render/*` for bitmap/image outputs
- `/assets/*` for static resources

The key screen response model contains:
- `screen`
- `layout`
- `theme`
- `regions`

Each component envelope contains:
- `component`
- `type`
- `source`
- `status`
- `data`
- `options`
- `resolved`

## V1 implementation order
1. Config loader
2. HA client
3. entity normalizer
4. source adapters
5. `/api/source/*`
6. theme resolver
7. component adapters
8. screen builder
9. `/api/screen/*`
10. `/api/device/*`
11. web shell
12. bitmap renderer

## Practical 
Initialized a git repository at `/fs01/sensor_panel_ux-server`. Architecture documents and config examples are versioned.

## Confirmed frontend direction

The frontend will not remain a single generic UI script indefinitely.

Confirmed direction:
- one shared frontend core
- multiple renderer implementations
- device profiles remain the authoritative selection point
- renderer selection will become part of `devices.json`

## 48h forecast decision

The hourly wind forecast presentation has moved away from separate dashboard tiles and toward a compact, closed 48h matrix.

Confirmed decisions:
- 24 columns
- 2 hours per column
- gust as primary row
- constant wind as secondary row
- time labels below
- risk-oriented color scale based on gust

## Production data policy

Development data may be fuzzy and useful for exposing unexpected issues.
However, development-grade local sensors are not production decision sources until placement and behavior are validated.

Operational preference:
- professional fetched weather data as primary
- temporary local development sensors as secondary
- later replacement by a correctly installed permanent weather station


# Eerste concrete Codex-doelplan

## Doel
Refactor the current browser frontend from one app.js file into a shared core/ layer plus a web-desktop renderer, while keeping current behavior intact.
Gewenste target-structuur

public/assets/js/
  main-device.js

  core/
    api.js
    dom.js
    format.js
    theme.js
    model.js

  renderers/
    web-desktop.js

Verdeling

core/api.js
    •	fetchJSON(url)

core/dom.js
    •	el(tag, className, text)

core/format.js
    •	formatFixed(value, digits = 1, fallback = "—")
    •	formatInt(value, fallback = "—")

core/theme.js
    •	applyThemeTokens(tokens)

core/model.js
    •	pathParts()
    •	getDeviceNameFromPath()
    •	componentTitle(component, fallback)

renderers/web-desktop.js
    •	alle huidige component renderers:
    •	renderOutsideSummary
    •	renderWindStrip
    •	renderDailyForecast
    •	renderWebEmbed
    •	renderIndoorGrid
    •	renderMapPanel
    •	renderPlaceholder
    •	renderComponent
    •	renderScreen
    •	plus renderer-specifieke helpers:
    •	gustColorClass
    •	barHeightBft
    •	pairWindItems

main-device.js
    •	bootstrap
    •	device name uit URL
    •	model ophalen
    •	renderer kiezen
    •	render starten

## Configwijziging

### Voeg aan devices.json toe:
"renderer": "web-desktop"

voor browserdevices.

## HTML wijziging

### Update public/ui/device/index.html naar:

<script src="/assets/js/core/api.js?v=13"></script>
<script src="/assets/js/core/dom.js?v=13"></script>
<script src="/assets/js/core/format.js?v=13"></script>
<script src="/assets/js/core/theme.js?v=13"></script>
<script src="/assets/js/core/model.js?v=13"></script>
<script src="/assets/js/renderers/web-desktop.js?v=13"></script>
<script src="/assets/js/main-device.js?v=13"></script>

## Behoudsregels voor de refactor

Codex moet:
    •	geen functionele regressie introduceren
    •	dezelfde UI-output behouden voor office_browser
    •	dezelfde API-contracten blijven gebruiken
    •	geen bundler, framework, npm of buildstap toevoegen
    •	plain browser JS houden
    •	globale functies accepteren zolang de structuur schoner wordt

Acceptatiecriteria

Na de refactor moet nog steeds werken:
    •	/ui/device/office_browser
    •	/api/device/office_browser
    •	huidige current weather card
    •	huidige 48h gust matrix
    •	daily forecast
    •	Windy embeds
    •	indoor grid
    •	map panel


Refactor the current browser frontend into a small shared core plus a web-desktop renderer.
Keep behavior unchanged.
Do not introduce a bundler or framework.
Keep plain browser JavaScript.
Move generic utilities into core/, keep presentation logic in renderers/web-desktop.js, and keep bootstrap logic in main-device.js.
Add renderer: "web-desktop" to browser-oriented device profiles in devices.json.
Update public/ui/device/index.html to load the new JS files in order.
Preserve current rendering for outside summary, 48h wind matrix, daily forecast, embeds, indoor grid, and map panel.