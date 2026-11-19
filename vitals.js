(function () {
  'use strict';
  var analytics = window.STB_ANALYTICS;
  var debug = /(?:^|[?&])vitals=1(?:&|$)/.test(location.search || '');
  if ((!analytics || !analytics.enabled) && !debug) return;

  var values = {};
  var panel;
  function show() {
    if (!debug) return;
    if (!panel) {
      panel = document.createElement('div');
      panel.setAttribute('role', 'status');
      panel.setAttribute('aria-label', 'Chỉ số tốc độ trên thiết bị này');
      panel.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;max-width:260px;padding:12px 15px;border-radius:10px;background:#102b30;color:#fff;font:13px/1.5 system-ui,sans-serif;box-shadow:0 8px 24px #0003;pointer-events:none';
      document.body.appendChild(panel);
    }
    panel.textContent = 'Thiết bị này · LCP ' + (values.LCP == null ? '…' : (values.LCP / 1000).toFixed(2) + 's') + ' · INP ' + (values.INP == null ? 'chờ thao tác' : Math.round(values.INP) + 'ms') + ' · CLS ' + (values.CLS == null ? '…' : values.CLS.toFixed(3));
  }
  show();
  var script = document.createElement('script');
  script.src = 'vendor/web-vitals.iife.js';
  script.async = true;
  script.onload = function () {
    if (!window.webVitals) return;
    ['LCP', 'INP', 'CLS'].forEach(function (name) {
      window.webVitals['on' + name](function (metric) {
        values[name] = metric.value;
        if (analytics) analytics.recordVital(metric);
        show();
      });
    });
  };
  document.head.appendChild(script);
})();
