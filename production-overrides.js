(function () {
  var d = window.STB_DEFAULT_DATA;
  if (!d) return;

  // GitHub Pages is a presentation layer. If a product was not refreshed from
  // the public iTop storefront, do not show a potentially stale hard-coded price.
  var syncedIds = {};
  (window.STB_SYNCED_PRODUCTS || []).forEach(function (p) {
    if (p && p.id) syncedIds[p.id] = true;
  });
  (d.products || []).forEach(function (p) {
    if (!syncedIds[p.id]) {
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

  // Every generic "Nhận báo giá" CTA on the GitHub landing page should use
  // the real iTop quote/contact flow instead of opening the local demo modal.
  // Capture phase makes this work for React-rendered buttons added later too.
  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest
      ? event.target.closest('a,button,[role="button"]')
      : null;
    if (!target) return;
    var text = (target.textContent || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi-VN');
    if (text.indexOf('nhận báo giá') === -1) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    window.location.href = QUOTE_URL;
  }, true);

  d.meta = d.meta || {};
  d.meta.deployment = 'github-pages-preview';
})();
