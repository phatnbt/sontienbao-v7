(function () {
  'use strict';
  var data = window.STB_DEFAULT_DATA;
  if (!data || !Array.isArray(data.products)) return;

  // Only fill missing coverage for an exact product family with a manufacturer source.
  // Never convert between Kg and L or infer coverage from a different paint line.
  var specs = [
    { brand: 'JOTUN', match: /jotashield sach vuot troi/i, coverage: 11.1, source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotashield-ultra-clean' },
    { brand: 'JOTUN', match: /jotashield ben mau toan dien/i, coverage: 11.1, source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotashield-infinity' },
    { brand: 'JOTUN', match: /tough shield max/i, coverage: 10.8, source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotun-tough-shield-max' },
    { brand: 'JOTUN', match: /majestic dep hoan hao.*bong/i, coverage: 10.5, source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-true-beauty-sheen' },
    { brand: 'JOTUN', match: /majestic dep hoan hao.*mo/i, coverage: 10.5, source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-true-beauty-matt' },
    { brand: 'JOTUN', match: /majestic primer/i, coverage: 9.35, source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-primer' },
    { brand: 'NIPPON', match: /^(?:np |nippon )?easy wash(?: \(|$)/i, coverage: 10, source: 'https://nipponpaint.com.vn/sites/default/files/2025-11/EASY%20WASH%20-%20TDS%20-%20VN.pdf' },
    { brand: 'NIPPON', match: /^(?:np |nippon )?easy wash sealer(?: \(|$)/i, coverage: 10, source: 'https://nipponpaint.com.vn/sites/default/files/2025-06/EASY%20WASH%20SEALER%20%20-%20SPEC%20-%20VNESE.pdf' }
  ];

  data.products.forEach(function (product) {
    if (!product || product.enabled === false || Number(product.coverage) > 0 || product.massOnly) return;
    if (product.measureUnit !== 'L' || !Array.isArray(product.variants) || !product.variants.some(function (size) { return Number(size) > 0; })) return;
    var name = String(product.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd');
    var spec = specs.find(function (item) {
      return item.brand === product.brand && item.match.test(name);
    });
    if (!spec) return;
    product.coverage = spec.coverage;
    product.coverageLabel = spec.coverage + ' m²/L/lớp (theo hãng)';
    product.coverageBasis = 'm2_per_unit';
    product.technicalSource = 'manufacturer';
    product.technicalSourceUrl = spec.source;
    product.calcEligible = true;
    product.badge = 'Có thể tính';
  });
})();
