(function () {
  var d = window.STB_DEFAULT_DATA;
  if (!d) return;

  // GitHub Pages is a presentation layer. Price and checkout remain authoritative on iTop.
  (d.products || []).forEach(function (p) {
    p.price = 0;
    p.oldPrice = 0;
    p.pricePrefix = '';
  });

  var productUrls = {
    'jotashield-ben-mau': 'https://sontienbao.com/son-jotun-nauy/son-phu-ngoai-that-jotun/jotashield-ben-mau-toan-dien-15l.html',
    'jotashield-sach': 'https://sontienbao.com/son-jotun-nauy/son-phu-ngoai-that-jotun/jotashield-sach-vuot-troi-1l.html',
    'jotashield-phai-mau': 'https://sontienbao.com/son-jotun-nauy/son-phu-ngoai-that-jotun/jotashield-cpm-5l-son-ngoai-that.html',
    'tough-shield-max': 'https://sontienbao.com/son-jotun-nauy/son-phu-ngoai-that-jotun/tough-shield-max-17l-son-phu-ngoai-that.html',
    'waterguard': 'https://sontienbao.com/son-jotun-nauy/son-phu-ngoai-that-jotun/jotun-waterguard-20kg-son-phu-chong-tham.html'
  };
  (d.products || []).forEach(function (p) {
    if (productUrls[p.id]) p.url = productUrls[p.id];
  });

  d.site.quoteUrl = 'https://sontienbao.com/lien-he.html';
  d.site.catalogUrl = 'https://sontienbao.com/san-pham/';
  d.site.colorUrl = 'https://sontienbao.com/bang-mau-son/';
  d.site.priceUrl = 'https://sontienbao.com/bang-gia/';

  // Preview remains noindex until the GitHub version is intentionally promoted.
  d.meta = d.meta || {};
  d.meta.deployment = 'github-pages-preview';
})();
