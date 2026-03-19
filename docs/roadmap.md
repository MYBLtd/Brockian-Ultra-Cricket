# BUC Roadmap

## Milestone 1 — Browser rendering foundation
- [x] Public repository created and cleaned up
- [x] Renderer-driven browser UI working
- [x] Semantic device profiles in config
- [x] Desktop browser support
- [x] Mobile browser support
- [x] Polling-based live updates
- [x] Refresh status indicator

## Milestone 2 — Multi-screen browser experiences
- [ ] Support multiple screens per device
- [ ] Add a device-level screen set / playlist model
- [ ] Add subtle browser navigation
- [ ] Support optional automatic screen rotation
- [ ] Add play/pause behavior for presentation mode

## Milestone 3 — Passive operational dashboards
- [ ] Support grouped overview screens for sensors and status
- [ ] Support browser-friendly climate overviews
- [ ] Support read-only IoT/device status overviews
- [ ] Prefer grouping by human use context rather than raw metric type

## Milestone 4 — Interactive control surfaces
- [ ] Introduce control-oriented screen types
- [ ] Support direct user interaction
- [ ] Separate passive dashboard assumptions from control-screen architecture
- [ ] Support interaction-aware navigation behavior

## Milestone 5 — Embedded player support
- [ ] Re-evaluate architecture for embedded players after browser V2 is proven
- [ ] Define player-oriented rendering strategy
- [ ] Decide client-side vs server-side rendering boundaries
- [ ] Support kiosk/touch display behavior

## Milestone 6 — Scaled deployment patterns
- [ ] Support multi-device environments cleanly
- [ ] Revisit proxy/cache strategy for shared upstream data sources
- [ ] Reduce unnecessary upstream provider load
- [ ] Improve deployability for real-world installations

## Documentation milestones
- [ ] Keep public docs concise and useful
- [ ] Reintroduce public technical docs when mature enough
- [ ] Publish installation and maintenance guidance when the framework has stabilized

## Guiding principles
- [ ] Keep config semantic, not pixel-based
- [ ] Group screens around human use, not raw data structure
- [ ] Prefer simple solutions unless complexity clearly pays off
- [ ] Let real-world testing drive the next design round
