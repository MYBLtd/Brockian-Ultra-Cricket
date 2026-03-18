window.SensorPanel = window.SensorPanel || {};

(function bootstrap(app) {
  const api = app.core?.api;
  const model = app.core?.model;
  const webDesktop = app.renderers?.webDesktop;

  function selectRenderer(deviceModel) {
    const rendererName = deviceModel.device?.renderer || (deviceModel.device?.mode === "web" ? "web-desktop" : null);

    if (rendererName === "web-desktop") {
      return webDesktop;
    }

    return null;
  }

  async function main() {
    const mountNode = document.getElementById("app");
    const deviceName = model.getDeviceNameFromPath();

    if (!deviceName) {
      mountNode.innerHTML = '<div class="error">No device name in URL</div>';
      return;
    }

    try {
      const deviceModel = await api.fetchDeviceModel(deviceName);
      const renderer = selectRenderer(deviceModel);

      if (!renderer) {
        mountNode.innerHTML = '<div class="error">No browser renderer available for this device</div>';
        return;
      }

      renderer.renderDevice(deviceModel, mountNode);
    } catch (err) {
      mountNode.innerHTML = `<div class="error">Failed to load device model: ${err.message}</div>`;
    }
  }

  main();
})(window.SensorPanel);
