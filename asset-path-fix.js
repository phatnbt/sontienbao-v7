(function () {
  'use strict';

  // Resolve every repository-local media path from the directory that actually
  // serves this script. This keeps images working on GitHub Pages, legacy
  // redirects, local previews and nested routes such as #calculator.
  var script = document.currentScript;
  var base = '';
  try {
    base = script && script.src ? new URL('.', script.src).href : new URL('.', location.href).href;
  } catch (e) {
    base = '';
  }

  window.STB_ASSET_BASE = base;

  function localAsset(value) {
    if (!value || typeof value !== 'string') return value;
    if (/^(?:https?:|data:|blob:|file:)/i.test(value)) return value;
    try {
      return new URL(value.replace(/^\/+/, ''), base || location.href).href;
    } catch (e) {
      return value;
    }
  }

  function fixObject(obj) {
    if (!obj || typeof obj !== 'object') return;
    ['image', 'logo', 'cover', 'thumbnail', 'backgroundImage'].forEach(function (key) {
      if (typeof obj[key] === 'string') obj[key] = localAsset(obj[key]);
    });
    if (typeof obj.src === 'string' && !/^(?:https?:|data:|blob:|file:)/i.test(obj.src)) {
      obj.src = localAsset(obj.src);
    }
  }

  function fixData(data) {
    if (!data || typeof data !== 'object') return;
    fixObject(data.site);
    fixObject(data.hero);
    fixObject(data.announcement);
    ['products', 'categories', 'brands', 'banners', 'popups', 'media'].forEach(function (key) {
      var list = data[key];
      if (Array.isArray(list)) list.forEach(fixObject);
    });
  }

  fixData(window.STB_DEFAULT_DATA);
  fixData(window.STB_V7_CONTENT);

  // Also normalize the generated storefront/catalog layers. Remote iTop media
  // URLs are already absolute and are intentionally left unchanged.
  [window.STB_SYNCED_PRODUCTS, window.STB_HOMEPAGE_PRODUCTS, window.STB_CALCULATOR_PRODUCTS].forEach(function (list) {
    if (Array.isArray(list)) list.forEach(fixObject);
  });
})();
