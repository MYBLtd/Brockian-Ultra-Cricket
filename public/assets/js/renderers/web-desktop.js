window.SensorPanel = window.SensorPanel || {};
window.SensorPanel.renderers = window.SensorPanel.renderers || {};

(function registerWebDesktop(app) {
  const core = app.core || {};
  const dom = core.dom || {};
  const format = core.format || {};
  const theme = core.theme || {};
  const model = core.model || {};

  const el = dom.el;
  const formatFixed = format.formatFixed;
  const formatInt = format.formatInt;
  const applyThemeTokens = theme.applyThemeTokens;
  const componentTitle = model.componentTitle;
  const SVG_NS = "http://www.w3.org/2000/svg";
  let windLevelStripSeq = 0;

  function gustColorClass(value) {
    const v = Number(value);
    if (!Number.isFinite(v)) return "gust-unknown";
    if (v <= 2) return "gust-0-2";
    if (v <= 3) return "gust-3";
    if (v <= 4) return "gust-4";
    if (v <= 5) return "gust-5";
    if (v <= 6) return "gust-6";
    if (v <= 7) return "gust-7";
    if (v <= 8) return "gust-8";
    return "gust-9plus";
  }

  function barHeightBft(value, maxPx) {
    const v = Number(value);
    if (!Number.isFinite(v)) return 3;
    const px = 4 + (v * 4.2);
    return Math.max(3, Math.min(px, maxPx || 30));
  }

  function pairWindItems(items) {
    const out = [];

    for (let i = 0; i < 48; i += 2) {
      const a = items[i];
      const b = items[i + 1];

      if (!a && !b) {
        out.push({
          hour: "—",
          gust_value: null,
          wind_value: null,
          direction_label: "—"
        });
        continue;
      }

      const base = a || b;
      const hourRaw = base?.hour || "—";
      const hourShort = String(hourRaw).slice(0, 2);

      const gustA = a ? Number(a.gust_value) : NaN;
      const gustB = b ? Number(b.gust_value) : NaN;
      const windA = a ? Number(a.wind_value) : NaN;
      const windB = b ? Number(b.wind_value) : NaN;

      let gustValue = null;
      let windValue = null;

      if (Number.isFinite(gustA) && Number.isFinite(gustB)) {
        gustValue = Math.max(gustA, gustB);
      } else if (Number.isFinite(gustA)) {
        gustValue = gustA;
      } else if (Number.isFinite(gustB)) {
        gustValue = gustB;
      }

      if (Number.isFinite(windA) && Number.isFinite(windB)) {
        windValue = Math.max(windA, windB);
      } else if (Number.isFinite(windA)) {
        windValue = windA;
      } else if (Number.isFinite(windB)) {
        windValue = windB;
      }

      out.push({
        hour: hourShort,
        gust_value: gustValue,
        wind_value: windValue,
        direction_label: base?.direction_label || "—"
      });
    }

    return out;
  }

  function svgEl(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);

    for (const [key, value] of Object.entries(attrs || {})) {
      if (value !== undefined && value !== null) {
        node.setAttribute(key, String(value));
      }
    }

    return node;
  }

  function formatBftValue(value, withUnit) {
    const numeric = Number(value);
    const text = Number.isFinite(numeric) ? String(Math.round(numeric)) : "—";
    return withUnit ? `${text} bft` : text;
  }

  function clampBftLevel(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return Math.max(0, Math.min(11, numeric));
  }

  function bftOffset(value, width) {
    const level = clampBftLevel(value);
    if (level == null) return null;
    return (level / 11) * width;
  }

  function polarPoint(cx, cy, radius, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + Math.cos(rad) * radius,
      y: cy + Math.sin(rad) * radius
    };
  }

  function buildCompassTicks(svg, cx, cy) {
    for (let angle = 0; angle < 360; angle += 10) {
      const isMajor = angle % 30 === 0;
      const outer = polarPoint(cx, cy, 94, angle);
      const inner = polarPoint(cx, cy, isMajor ? 78 : 84, angle);

      svg.appendChild(svgEl("line", {
        x1: outer.x,
        y1: outer.y,
        x2: inner.x,
        y2: inner.y,
        stroke: isMajor ? "#f2eee6" : "rgba(233, 239, 247, 0.42)",
        "stroke-width": isMajor ? 2.6 : 1.2,
        "stroke-linecap": "round"
      }));
    }
  }

  function buildCompassLabels(svg, cx, cy) {
    const labels = [
      { text: "N", angle: 0, radius: 67, size: 18, weight: 800, fill: "#d7d3ca" },
      { text: "O", angle: 90, radius: 67, size: 18, weight: 800 ,fill:  "#d7d3ca"},
      { text: "Z", angle: 180, radius: 67, size: 18, weight: 800,fill:  "#d7d3ca" },
      { text: "W", angle: 270, radius: 67, size: 18, weight: 800,fill:  "#d7d3ca" },
      { text: "NO", angle: 45, radius: 72, size: 12, weight: 500,fill:  "#67d3ca" },
      { text: "ZO", angle: 135, radius: 72, size: 12, weight: 500,fill:  "#67d3ca" },
      { text: "ZW", angle: 225, radius: 72, size: 12, weight: 500,fill:  "#67d3ca" },
      { text: "NW", angle: 315, radius: 72, size: 12, weight: 500,fill:  "#67d3ca" }
    ];

    for (const label of labels) {
      const point = polarPoint(cx, cy, label.radius, label.angle);
      const text = svgEl("text", {
        x: point.x,
        y: point.y,
        fill: label.fill,
        "font-size": label.size,
        "font-weight": label.weight,
        "text-anchor": "middle",
        "dominant-baseline": "central"
      });
      text.textContent = label.text;
      svg.appendChild(text);
    }
  }

  function buildCompassPointer(svg, cx, cy, angleDeg) {
    const pointerGroup = svgEl("g", {
      transform: `rotate(${Number.isFinite(angleDeg) ? angleDeg : 0} ${cx} ${cy})`
    });

    pointerGroup.appendChild(svgEl("path", {
      d: `M ${cx} ${cy - 78} L ${cx + 6} ${cy + 14} L ${cx} ${cy + 3} L ${cx - 6} ${cy + 14} Z`,
      fill: "#b79258"
    }));

    pointerGroup.appendChild(svgEl("path", {
      d: `M ${cx} ${cy - 64} L ${cx + 4.2} ${cy - 4} L ${cx - 4.2} ${cy - 4} Z`,
      fill: "#c7a96b",
      opacity: 0.98
    }));

    svg.appendChild(pointerGroup);
  }

  function buildWindCompassInstrument(component, variant) {
    const compact = variant !== "card";
    const frame = el("div", compact ? "wind-mini wind-mini-compass" : "wind-compass-panel");
    const svg = svgEl("svg", {
      viewBox: "0 0 240 240",
      class: compact ? "wind-compass-svg wind-compass-svg-compact" : "wind-compass-svg"
    });

    const wd = Number(component.data?.wd);
    const wsText = formatBftValue(component.data?.ws_bft, true);
    const wgText = formatBftValue(component.data?.wg_bft, false);
    const cx = 120;
    const cy = 120;

    svg.appendChild(svgEl("circle", {
      cx,
      cy,
      r: 108,
      fill: "#1c2836",
      stroke: "rgba(247, 243, 234, 0.14)",
      "stroke-width": 1.5
    }));

    svg.appendChild(svgEl("circle", {
      cx,
      cy,
      r: 96,
      fill: "#213140",
      stroke: "#bcae92",
      "stroke-width": 3
    }));

    svg.appendChild(svgEl("circle", {
      cx,
      cy,
      r: 88,
      fill: "#273949",
      stroke: "rgba(247, 243, 234, 0.10)",
      "stroke-width": 1.5
    }));

    buildCompassTicks(svg, cx, cy);
    buildCompassLabels(svg, cx, cy);
    buildCompassPointer(svg, cx, cy, wd);

    svg.appendChild(svgEl("circle", {
      cx,
      cy,
      r: 20,
      fill: "#1a222d",
      stroke: "rgba(247, 243, 234, 0.14)",
      "stroke-width": 1.2
    }));
/*
    const valueText = svgEl("text", {
      x: cx,
      y: cy + 32,
      fill: "rgba(230, 236, 244, 0.74)",
      "font-size": compact ? 22 : 24,
      "font-weight": 800,
      "text-anchor": "middle",
      "dominant-baseline": "central"
    });
    valueText.textContent = wsText;
    svg.appendChild(valueText);

    const gustText = svgEl("text", {
      x: cx,
      y: cy - 28,
      fill: "rgba(230, 236, 244, 0.94)",
      "font-size": compact ? 22 : 24,
      "font-weight": 800,
      "text-anchor": "middle",
      "dominant-baseline": "central"
    });
    gustText.textContent = `piek ${wgText}`;
    svg.appendChild(gustText);
*/
    svg.appendChild(svgEl("circle", {
      cx,
      cy,
      r: 8,
      fill: "#10161f",
      stroke: "#d8cfbe",
      "stroke-width": 2
    }));

    frame.appendChild(svg);
    return frame;
  }

  function buildWindLevelStrip(component) {
    const frame = el("div", "wind-level-strip");
    const svg = svgEl("svg", {
      viewBox: "0 0 180 18",
      class: "wind-level-strip-svg",
      "aria-hidden": "true"
    });

    const railX = 4;
    const railY = 6;
    const railWidth = 172;
    const railHeight = 6;
    const gustLevel = clampBftLevel(
      component.data?.wg_bft ?? (component.resolved?.gust_display_unit === "bft" ? component.resolved?.gust_display_value : null)
    );
    const windLevel = clampBftLevel(
      component.data?.ws_bft ?? (component.resolved?.wind_display_unit === "bft" ? component.resolved?.wind_display_value : null)
    );
    const fillLevel = gustLevel != null ? gustLevel : windLevel;
    const fillWidth = bftOffset(fillLevel, railWidth);
    const markerX = bftOffset(windLevel, railWidth);
    const gradientId = `wind-level-strip-gradient-${windLevelStripSeq++}`;

    const defs = svgEl("defs");
    const gradient = svgEl("linearGradient", {
      id: gradientId,
      gradientUnits: "userSpaceOnUse",
      x1: railX,
      y1: railY,
      x2: railX + railWidth,
      y2: railY
    });

    [
      ["0%", "#4b7fc2"],
      ["18.18%", "#4b7fc2"],
      ["27.27%", "#41aaca"],
      ["36.36%", "#54b86c"],
      ["45.45%", "#d2c436"],
      ["54.54%", "#e6882e"],
      ["63.63%", "#d64a4a"],
      ["72.72%", "#d64d99"],
      ["100%", "#9456d6"]
    ].forEach(([offset, color]) => {
      gradient.appendChild(svgEl("stop", {
        offset,
        "stop-color": color
      }));
    });

    defs.appendChild(gradient);
    svg.appendChild(defs);

    svg.appendChild(svgEl("rect", {
      class: "wind-level-rail",
      x: railX,
      y: railY,
      width: railWidth,
      height: railHeight,
      rx: railHeight / 2,
      ry: railHeight / 2
    }));

    if (fillWidth != null && fillWidth > 0) {
      svg.appendChild(svgEl("rect", {
        class: "wind-level-fill",
        x: railX,
        y: railY,
        width: fillWidth,
        height: railHeight,
        rx: railHeight / 2,
        ry: railHeight / 2,
        fill: `url(#${gradientId})`
      }));
    }

    if (markerX != null) {
      svg.appendChild(svgEl("rect", {
        class: "wind-level-marker",
        x: railX + markerX - 1,
        y: 3,
        width: 2,
        height: 12,
        rx: 1,
        ry: 1
      }));
    }

    frame.appendChild(svg);
    return frame;
  }

  function renderOutsideSummary(component) {
    const card = el("section", "card");
    const wrap = el("div", "outside-summary");

    const left = el("div", "outside-main");
    const right = el("div", "outside-side");

    const t = component.data?.t;
    const feels = component.data?.feels_like;
    const precip = component.data?.precip;
    const rh = component.data?.rh;
    const pressure = component.data?.pressure;

    const windValue = component.resolved?.wind_display_value;
    const windUnit = component.resolved?.wind_display_unit || "";
    const gustValue = component.resolved?.gust_display_value;
    const gustUnit = component.resolved?.gust_display_unit || "";

    const temp = el("div", "temp-big", t != null ? `${formatFixed(t, 1)} °C` : "—");
    if (component.resolved?.temperature_color) {
      temp.style.color = component.resolved.temperature_color;
    }

    const sub = el("div", "temp-sub");
    const lines = [];
    lines.push(feels != null ? `Gevoelstemperatuur ${formatFixed(feels, 1)} °C` : "Gevoelstemperatuur onbekend");

    if (windValue != null) lines.push(`Wind ${windValue} ${windUnit}`);
    if (gustValue != null) lines.push(`Windstoten ${gustValue} ${gustUnit}`);
    if (precip != null) lines.push(`Neerslag nu ${formatFixed(precip, 1)} mm`);
    if (rh != null) lines.push(`Luchtvochtigheid ${formatInt(rh)} %`);
    if (pressure != null) lines.push(`Luchtdruk ${formatInt(pressure)} hPa`);

    sub.innerHTML = lines.join("<br>");

    left.appendChild(temp);
    left.appendChild(sub);

    if (component.options?.show_wind_compass !== false) {
      right.appendChild(buildWindCompassInstrument(component, "compact"));
      right.appendChild(buildWindLevelStrip(component));
    }

    wrap.appendChild(left);
    wrap.appendChild(right);
    card.appendChild(wrap);
    return card;
  }

  function renderWindStrip(component) {
    const card = el("section", "card");
    card.appendChild(el("h3", "", "Wind komende 48 uur"));

    const resolvedItems = component.resolved?.items || [];
    const paired = pairWindItems(resolvedItems);

    const wrap = el("div", "wind-matrix");

    const legend = el("div", "wind-matrix-legend");
    legend.appendChild(el("div", "legend-spacer", ""));
    legend.appendChild(el("div", "legend-row-label", "G"));
    legend.appendChild(el("div", "legend-row-label", "C"));
    legend.appendChild(el("div", "legend-spacer", ""));
    wrap.appendChild(legend);

    const cols = el("div", "wind-matrix-cols");

    for (const item of paired) {
      const col = el("div", `wind-matrix-col ${gustColorClass(item.gust_value)}`);

      const gustVal = item.gust_value != null ? String(item.gust_value) : "—";
      col.appendChild(el("div", "wind-matrix-gust-value", gustVal));

      const gustBarRow = el("div", "wind-matrix-bar-row");
      const gustBar = el("div", `wind-matrix-bar ${gustColorClass(item.gust_value)}`);
      gustBar.style.height = `${barHeightBft(item.gust_value, 22)}px`;
      gustBarRow.appendChild(gustBar);
      col.appendChild(gustBarRow);

      const windVal = item.wind_value != null ? String(item.wind_value) : "—";
      col.appendChild(el("div", "wind-matrix-wind-value", windVal));

      const windBarRow = el("div", "wind-matrix-bar-row");
      const windBar = el("div", `wind-matrix-bar wind-bar ${gustColorClass(item.wind_value)}`);
      windBar.style.height = `${barHeightBft(item.wind_value, 12)}px`;
      windBarRow.appendChild(windBar);
      col.appendChild(windBarRow);

      const showHour = Number(item.hour);
      const hourLabel = Number.isFinite(showHour) && showHour % 4 === 0 ? item.hour : "";
      col.appendChild(el("div", "wind-matrix-time", hourLabel));
      cols.appendChild(col);
    }

    wrap.appendChild(cols);
    card.appendChild(wrap);
    return card;
  }

  function renderDailyForecast(component) {
    const card = el("section", "card");
    card.appendChild(el("h3", "", "Verwachting"));

    const items = el("div", "daily-items");
    const resolvedItems = component.resolved?.items || [];
    const windUnit = component.resolved?.display_wind_unit || "bft";

    for (const item of resolvedItems) {
      const box = el("div", "daily-item");
      box.appendChild(el("div", "day", item.day_label || "—"));
      box.appendChild(el("div", "value", `${item.t_min ?? "—"}–${item.t_max ?? "—"} °C`));

      const meta = [];
      if (item.pop != null) meta.push(`Regen ${item.pop}%`);
      if (item.wind_value != null || item.gust_value != null) {
        const wind = item.wind_value != null ? item.wind_value : "—";
        const gust = item.gust_value != null ? item.gust_value : wind;
        meta.push(`Wind ${wind} ${windUnit} / piek ${gust} ${windUnit}`);
      }

      box.appendChild(el("div", "meta", meta.join(" · ")));
      items.appendChild(box);
    }

    card.appendChild(items);
    return card;
  }

  function renderWebEmbed(component) {
    const card = el("section", "card");
    card.appendChild(el("h3", "", componentTitle(component)));

    const url = component.options?.url;
    if (!url) {
      card.appendChild(el("div", "placeholder", "Geen embed URL gevonden"));
      return card;
    }

    const frameWrap = el("div", "embed-wrap");
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.setAttribute("frameborder", "0");
    iframe.className = "embed-frame";

    frameWrap.appendChild(iframe);
    card.appendChild(frameWrap);
    return card;
  }

  function renderIndoorGrid(component) {
    const card = el("section", "card");
    card.appendChild(el("h3", "", "Binnenklimaat"));

    const tiles = component.data?.tiles || [];
    const page = component.options?.page ?? 1;
    const cols = component.options?.columns ?? 4;
    const rows = component.options?.rows ?? 4;

    const grid = el("div", "indoor-grid");
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    const tileMap = new Map();
    for (const tile of tiles) {
      if ((tile.page ?? 1) !== page) continue;
      tileMap.set(`${tile.row}-${tile.col}`, tile);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r}-${c}`;
        const tile = tileMap.get(key);

        const box = el("div", "indoor-tile");
        if (!tile || tile.key === "empty") {
          box.classList.add("indoor-tile-empty");
          grid.appendChild(box);
          continue;
        }

        box.appendChild(el("div", "indoor-label", tile.label || "—"));
        box.appendChild(el("div", "indoor-temp", tile.temp != null ? `${formatFixed(tile.temp, 1)} °C` : "—"));
        box.appendChild(el("div", "indoor-hum", tile.hum != null ? `${formatInt(tile.hum)} %` : "—"));
        grid.appendChild(box);
      }
    }

    card.appendChild(grid);
    return card;
  }

  function renderMapPanel(component) {
    const card = el("section", "card");
    card.appendChild(el("h3", "", "Kaart"));

    let asset = component.data?.map_asset;
    if (!asset) {
      card.appendChild(el("div", "placeholder", "Geen kaart asset gevonden"));
      return card;
    }

    if (asset.startsWith("/local/maps/")) {
      asset = asset.replace("/local/maps/", "/assets/maps/");
    }

    const wrap = el("div", "map-panel-wrap");
    const img = document.createElement("img");
    img.src = asset;
    img.alt = "Region overview map";
    img.className = "map-panel-image";

    wrap.appendChild(img);
    card.appendChild(wrap);
    return card;
  }

  function renderPlaceholder(component) {
    const card = el("section", "card");
    card.appendChild(el("h3", "", componentTitle(component)));
    card.appendChild(el("div", "placeholder", "Nog geen web renderer voor dit componenttype"));
    return card;
  }

  function renderComponent(component) {
    switch (component.type) {
      case "outside_summary":
        return renderOutsideSummary(component);
      case "wind_strip":
        return renderWindStrip(component);
      case "daily_forecast":
        return renderDailyForecast(component);
      case "indoor_grid":
        return renderIndoorGrid(component);
      case "map_panel":
        return renderMapPanel(component);
      case "web_embed":
        return renderWebEmbed(component);
      case "wind_compass":
        return renderWindCompass(component);
      default:
        return renderPlaceholder(component);
    }
  }

function renderWindCompass(component) {
  const card = el("section", "card");
  card.appendChild(el("h3", "", componentTitle(component)));
  card.appendChild(buildWindCompassInstrument(component, "card"));
  return card;
}

  function renderScreen(screenModel, mountNode) {
    mountNode.innerHTML = "";

    applyThemeTokens(screenModel.theme?.tokens || {});

    const screen = el("main", `screen layout-${screenModel.screen.layout}`);
    const regions = screenModel.regions || {};

    for (const [regionName, components] of Object.entries(regions)) {
      const region = el("section", `region region-${regionName}`);
      for (const component of components) {
        region.appendChild(renderComponent(component));
      }
      screen.appendChild(region);
    }

    mountNode.appendChild(screen);
  }

  function renderDevice(deviceModel, mountNode) {
    document.title = `${deviceModel.device.name} - Sensor Panel UX`;
    renderScreen(deviceModel.screen, mountNode);
  }

  app.renderers.webDesktop = {
    renderDevice,
    renderScreen
  };
})(window.SensorPanel);
