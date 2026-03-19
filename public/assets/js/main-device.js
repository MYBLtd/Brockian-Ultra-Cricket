window.SensorPanel = window.SensorPanel || {};

(function bootstrap(app) {
  const api = app.core?.api;
  const model = app.core?.model;
  const webDesktop = app.renderers?.webDesktop;
  const DEFAULT_REFRESH_SECONDS = 300;

  let currentDeviceModel = null;
  let pollTimerId = null;
  let countdownTimerId = null;
  let refreshInFlight = false;
  let hasRenderedOnce = false;
  let lastSuccessfulRefreshAt = null;
  let nextRefreshAt = null;

  function ensureRefreshStatusNode() {
    let statusNode = document.getElementById("refresh-status");

    if (!statusNode) {
      statusNode = document.createElement("div");
      statusNode.id = "refresh-status";
      statusNode.className = "refresh-status";
      document.body.appendChild(statusNode);
    }

    return statusNode;
  }

  function selectRenderer(deviceModel) {
    const rendererName = deviceModel.device?.renderer || (deviceModel.device?.mode === "web" ? "web-desktop" : null);

    if (rendererName === "web-desktop") {
      return webDesktop;
    }

    return null;
  }

  function getRefreshSeconds(deviceModel) {
    const refreshSeconds = Number(deviceModel?.device?.refresh_seconds);
    if (Number.isFinite(refreshSeconds) && refreshSeconds > 0) {
      return refreshSeconds;
    }

    return DEFAULT_REFRESH_SECONDS;
  }

  function formatClockTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "--:--";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  function formatCountdown(msRemaining) {
    const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function updateRefreshStatus() {
    const statusNode = ensureRefreshStatusNode();
    const updatedText = lastSuccessfulRefreshAt ? formatClockTime(lastSuccessfulRefreshAt) : "--:--";
    const countdownText = nextRefreshAt ? formatCountdown(nextRefreshAt.getTime() - Date.now()) : "--:--";

    statusNode.textContent = `Updated ${updatedText} • next refresh in ${countdownText}`;
  }

  function ensureCountdownTimer() {
    if (countdownTimerId != null) {
      return;
    }

    countdownTimerId = window.setInterval(updateRefreshStatus, 1000);
  }

  function setNextRefreshAt(deviceModel) {
    nextRefreshAt = new Date(Date.now() + (getRefreshSeconds(deviceModel) * 1000));
    updateRefreshStatus();
  }

  function scheduleNextPoll(deviceModel, refreshFn) {
    window.clearTimeout(pollTimerId);
    const delayMs = getRefreshSeconds(deviceModel) * 1000;
    nextRefreshAt = new Date(Date.now() + delayMs);
    updateRefreshStatus();
    pollTimerId = window.setTimeout(refreshFn, delayMs);
  }

  async function main() {
    const mountNode = document.getElementById("app");
    const deviceName = model.getDeviceNameFromPath();

    ensureRefreshStatusNode();
    updateRefreshStatus();
    ensureCountdownTimer();

    if (!deviceName) {
      mountNode.innerHTML = '<div class="error">No device name in URL</div>';
      return;
    }

    async function refreshDeviceModel() {
      if (refreshInFlight) {
        return;
      }

      refreshInFlight = true;

      try {
        const nextDeviceModel = await api.fetchDeviceModel(deviceName);
        const renderer = selectRenderer(nextDeviceModel);

        if (!renderer) {
          throw new Error("No browser renderer available for this device");
        }

        currentDeviceModel = nextDeviceModel;
        renderer.renderDevice(currentDeviceModel, mountNode);
        lastSuccessfulRefreshAt = new Date();
        hasRenderedOnce = true;
        updateRefreshStatus();
      } catch (err) {
        if (!hasRenderedOnce) {
          mountNode.innerHTML = `<div class="error">Failed to load device model: ${err.message}</div>`;
          return;
        }

        console.warn(`Failed to refresh device model for ${deviceName}`, err);
      } finally {
        refreshInFlight = false;

        if (hasRenderedOnce) {
          scheduleNextPoll(currentDeviceModel, refreshDeviceModel);
        }
      }
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden || !hasRenderedOnce || refreshInFlight) {
        return;
      }

      window.clearTimeout(pollTimerId);
      setNextRefreshAt(currentDeviceModel);
      refreshDeviceModel();
    });

    await refreshDeviceModel();
  }

  main();
})(window.SensorPanel);
