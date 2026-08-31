(function () {
  var d = window.STB_DEFAULT_DATA;
  if (!d) return;

  // GitHub Pages is a presentation layer. Only show prices that belong to the
  // latest healthy iTop export. The final catalog is consolidated into
  // `calc-family-*` records, so checking STB_SYNCED_PRODUCTS IDs alone used to
  // hide every valid storefront price after consolidation.
  var syncedKeys = {};
  function productKey(p) {
    if (!p) return [];
    var keys = [];
    if (p.id) keys.push('id:' + p.id);
    if (p.url) keys.push('url:' + String(p.url).replace(/\/$/, ''));
    return keys;
  }
  [window.STB_SYNCED_PRODUCTS, window.STB_HOMEPAGE_PRODUCTS, window.STB_CALCULATOR_PRODUCTS].forEach(function (list) {
    (Array.isArray(list) ? list : []).forEach(function (p) {
      productKey(p).forEach(function (key) { syncedKeys[key] = true; });
    });
  });
  var meta = window.STB_SYNC_META || {};
  var generatedAt = Date.parse(meta.generatedAt || '');
  var exportIsFresh = meta.status === 'ok' && generatedAt > 0 && Math.abs(Date.now() - generatedAt) < 14 * 86400000;
  (d.products || []).forEach(function (p) {
    var isSynced = productKey(p).some(function (key) { return syncedKeys[key]; });
    if (!exportIsFresh || !isSynced) {
      p.price = 0;
      p.oldPrice = 0;
      p.pricePrefix = '';
    }
  });

  var productUrls = {
    'jotashield-ben-mau': 'https://sontienbao.com/son-jotun-nauy/son-phu-ngoai-that-jotun/jotashield-ben-mau-toan-dien-15l.html',
    'jotashield-sach': 'https://sontienbao.com/son-jotun-nauy/son-phu-ngoai-that-jotun/jotashield-sach-vuot-troi-1l.html',
    'jotashield-phai-mau': 'https://sontienbao.com/son-jotun-nauy/son-phu-ngoai-that-jotun/jotashield-cpm-5l-son-ngoai-that.html',
    'tough-shield-max': 'https://sontienbao.com/son-jotun-nauy/son-phu-ngoai-that-jotun/tough-shield-max-17l-son-phu-ngoai-that.html',
    'waterguard': 'https://sontienbao.com/son-jotun-nauy/son-phu-ngoai-that-jotun/jotun-waterguard-20kg-son-phu-chong-tham.html'
  };
  (d.products || []).forEach(function (p) {
    if (productUrls[p.id] && !p.url) p.url = productUrls[p.id];
  });

  var QUOTE_URL = 'https://sontienbao.com/lien-he.html';
  d.site.quoteUrl = QUOTE_URL;
  d.site.catalogUrl = 'https://sontienbao.com/san-pham/';
  d.site.colorUrl = 'https://sontienbao.com/bang-mau-son/';
  d.site.priceUrl = 'https://sontienbao.com/bang-gia/';

  // Quote CTAs are handled by React so they can open the complete form first.
  // QuoteModal redirects to the real iTop contact flow only after validation.

  d.meta = d.meta || {};
  d.meta.deployment = 'github-pages-preview';
})();
