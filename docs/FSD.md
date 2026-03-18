## Nieuwe docs/FSD.md

```md
# Functional Specification Document (FSD)
## sensor_panel_ux-server

## 1. Purpose and Scope

### 1.1 Purpose
The purpose of the UX server is to provide a dedicated presentation layer on top of Home Assistant for:

- browser-based dashboards
- panel-style interfaces
- bitmap/image-based embedded display clients

The UX server exists because Home Assistant is suitable as a data and automation platform, but is not the preferred final engine for appliance-like, pixel-conscious panel UX.

### 1.2 Scope
In scope for v1:

- JSON-based semantic presentation configuration
- source normalization from Home Assistant
- complete screen model assembly
- device profile resolution
- browser-facing HTML shell rendering
- bitmap rendering foundation
- graceful degradation when data is missing or temporarily invalid

Out of scope for v1:

- POST actions back to Home Assistant
- multi-user authentication complexity
- config editor UI
- WebSocket or server-push infrastructure
- automatic UI discovery
- advanced theme inheritance

---

## 2. System Overview

### 2.1 Logical split

#### Home Assistant
Responsible for:

- external weather fetches
- local sensor ingestion
- normalized weather and sensor entities
- IoT state and services

#### UX server
Responsible for:

- semantic screen composition
- theme resolution
- renderer-specific presentation logic
- browser UI delivery
- bitmap/image rendering
- device profile resolution

#### Clients
Expected to be simple consumers:

- browsers load `/ui/*`
- embedded devices fetch `/render/*`
- debugging tools and integrations use `/api/*`

### 2.2 Data flow
1. Home Assistant fetches and normalizes source data
2. UX server reads normalized HA entities
3. UX server adapts these entities into normalized source objects
4. UX server assembles screen and device models
5. Renderers transform screen/device models into concrete UI output

---

## 3. Functional Requirements

### 3.1 Source inspection
The system shall expose normalized sources through `/api/source/{name}`.

### 3.2 Screen model assembly
The system shall assemble complete screen models through `/api/screen/{name}`.

### 3.3 Device profile resolution
The system shall resolve concrete device profiles through `/api/device/{name}`.

### 3.4 Browser UI
The system shall provide lightweight browser entry points under `/ui/*`.

### 3.5 Bitmap rendering
The system shall support bitmap or image-oriented output under `/render/*`.

### 3.6 Graceful degradation
If a source or component cannot be fully resolved, the UX server shall prefer partial output with warnings rather than full failure where practical.

### 3.90 Visuele elementen
Nieuwe visuele componenten die zowel browser- als embedded-output nodig hebben, krijgen bij voorkeur een renderer-onafhankelijk model en een renderpad dat server-side gegenereerd kan worden.

### 3.91 ECharts voor gauges
Wind_compass wordt ontworpen als server-renderable component, met ECharts gauge/polar-capabilities als voorkeursbasis. \
Dit geeft de meeste kans op een lange termijn ondersteuning 

### 3.92

### 3.7 Weather-specific requirements
The system shall support:

- current weather presentation
- hourly wind/gust forecast presentation
- daily forecast presentation
- map/embed presentation
- indoor climate grid presentation

### 3.8 Wind presentation
The system shall prioritize gust/risk visibility in forecast presentation.
Beaufort shall be the default UI wind unit.

### 3.9 Device-led rendering
Real clients should be addressed through device profiles, not through extensive query-parameter customization.

---

## 4. Architecture

### 4.1 Configuration architecture
Presentation semantics shall be split into:

- `sources.json`
- `components.json`
- `screens.json`
- `devices.json`
- `themes.json`

### 4.2 Screen model architecture
Renderers shall consume a unified screen model with:

- `screen`
- `layout`
- `theme`
- `regions`

Each component shall be represented as an envelope containing:

- `component`
- `type`
- `source`
- `status`
- `data`
- `options`
- `resolved`

### 4.3 Frontend architecture
The frontend shall evolve toward:

- a shared `core/` layer
- multiple renderer implementations under `renderers/`

The frontend shall not rely indefinitely on one monolithic generic UI file.

### 4.4 Device architecture
`devices.json` remains the authoritative selection point for:

- screen
- theme
- mode
- orientation
- resolution
- refresh cadence
- renderer

### 4.5 Renderer strategy
The architecture shall support multiple renderers over time, for example:

- `web-desktop`
- `web-compact`
- `bitmap-panel`

Renderers may differ in layout density, component treatment, and interaction assumptions, while consuming the same semantic screen model.

---

## 5. APIs

### 5.1 API families

- `/api/*` returns JSON
- `/ui/*` returns HTML shells or rendered browser output
- `/render/*` returns image output
- `/assets/*` returns static assets

### 5.2 Core endpoints

- `GET /api/health`
- `GET /api/source/{name}`
- `GET /api/screen/{name}`
- `GET /api/device/{name}`
- `GET /ui/screen/{name}`
- `GET /ui/device/{name}`
- `GET /render/screen/{name}.png`
- `GET /render/device/{name}.png`

### 5.3 API responsibility rule
Clients should prefer `/api/device/{name}` and `/render/device/{name}.png` over manual screen/theme selection.

---

## 6. Protocol Descriptions

### 6.1 JSON configuration protocol
All UX server configuration shall be JSON-based.
Configuration is semantic, not pixel-based.

### 6.2 Source normalization protocol
The HA adapter shall be responsible for:

- fetching entity state
- normalizing JSON-string attributes
- computing helper values such as Beaufort and direction labels where required
- attaching freshness metadata

### 6.3 Screen model protocol
Screen models shall be renderer-neutral and must not contain pixel placement instructions.

### 6.4 Renderer protocol
Renderers are responsible for:

- HTML or bitmap realization
- component-specific visual treatment
- interaction assumptions
- density and hierarchy decisions

Renderers are not responsible for source fetching or semantic screen assembly.

### 6.5 Caching protocol
Suggested v1 cache behavior:

- `/api/*`: no-store client-side
- `/ui/*`: no-store client-side
- `/assets/*`: long-lived cache
- `/render/*`: implementation-dependent short cache allowed

---

## 7. Current Implementation Position

The current implementation already demonstrates:

- normalized source inspection
- screen assembly
- device profile resolution
- a browser UI shell
- Windy embeds
- current, hourly, and daily weather presentation
- a first risk-oriented 48h gust matrix

This confirms the architectural split between Home Assistant and the UX server.