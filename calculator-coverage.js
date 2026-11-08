(function () {
  'use strict';
  var data = window.STB_DEFAULT_DATA;
  if (!data || !Array.isArray(data.products)) return;

  // Only fill missing per-coat coverage for an exact product family and package unit.
  // Never convert Kg to L or use a whole-system rate as a per-coat rate.
  var specs = [
    { brand: 'JOTUN', match: /jotashield sach vuot troi/i, coverage: 11.1, source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotashield-ultra-clean' },
    { brand: 'JOTUN', match: /jotashield ben mau toan dien/i, coverage: 11.1, source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotashield-infinity' },
    { brand: 'JOTUN', match: /tough shield max/i, coverage: 10.8, source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotun-tough-shield-max' },
    { brand: 'JOTUN', match: /majestic dep hoan hao.*bong/i, coverage: 10.5, source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-true-beauty-sheen' },
    { brand: 'JOTUN', match: /majestic dep hoan hao.*mo/i, coverage: 10.5, source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-true-beauty-matt' },
    { brand: 'JOTUN', match: /majestic primer/i, coverage: 9.35, source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-primer' },
    { brand: 'NIPPON', match: /^(?:np |nippon )?easy wash(?: \(|$)/i, coverage: 10, source: 'https://nipponpaint.com.vn/sites/default/files/2025-11/EASY%20WASH%20-%20TDS%20-%20VN.pdf' },
    { brand: 'NIPPON', match: /^(?:np |nippon )?easy wash sealer(?: \(|$)/i, coverage: 10, source: 'https://nipponpaint.com.vn/sites/default/files/2025-06/EASY%20WASH%20SEALER%20%20-%20SPEC%20-%20VNESE.pdf' },
    { brand: 'JOTUN', match: /jotaplast \(son phu noi that/i, coverage: 9, source: 'https://www.jotun.com/Datasheets/Download?url=%2FTDS%2FTDS__3754__Jotaplast__Euk__GB.pdf' },
    { brand: 'JOTUN', match: /(?:^| )essence trang tran chuyen dung/i, coverage: 9.5, source: 'https://www.jotun.com/vn-en/decorative/products/interior/all-interior-products/essence-easy-ceiling-vn' },
    { brand: 'JOTUN', match: /majestic bong sang trong/i, coverage: 7.05, source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-sense' },
    { brand: 'JOTUN', match: /son dau jotun gardex premium gloss/i, coverage: 12, source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/gardex-premium-gloss' },
    { brand: 'JOTUN', match: /son chong ri mau (?:do|xam) jotun alkyd primer/i, coverage: 10.4, source: 'https://www.jotun.com/Datasheets/Download?url=%2FTDS%2FTDS__343__Alkydprimer__Eng__US.pdf' },
    { brand: 'NIPPON', match: /^np super matex \(/i, coverage: 12.7, source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/giai-dap-thac-mac-son-1-lit-son-duoc-bao-nhieu-m2' },
    { brand: 'NIPPON', match: /^weathergard plus moi \(/i, coverage: 10, source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/giai-dap-thac-mac-son-1-lit-son-duoc-bao-nhieu-m2' },
    { brand: 'NIPPON', match: /^np hitex 5180 sealer/i, coverage: 12.7, source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/giai-dap-thac-mac-son-1-lit-son-duoc-bao-nhieu-m2' },
    { brand: 'NIPPON', match: /^son chong ri nippon tilac grey primer/i, coverage: 13.8, source: 'https://professional.nipponpaint.com.vn/vi/giai-phap-son-chat-phu-hang-hai/tilac-grey-primer' },
    { brand: 'NIPPON', match: /^son chong ri nippon tilac red oxide primer/i, coverage: 12.2, source: 'https://nipponpaint.com.vn/sites/default/files/2020-10/TILAC%20RED%20OXIDE%20PRIMER%20-%20SPEC%20-%20VNESE.pdf' },
    { brand: 'NIPPON', match: /^np odour-less bong sang trong/i, coverage: 9, source: 'https://nipponpaint.com.vn/sites/default/files/2024-11/240920%20ODOUR-LESS%20B%C3%93NG%20SANG%20TR%E1%BB%8CNG%20-%20SPEC%20-%20VNESE_1.pdf' },
    { brand: 'NIPPON', match: /^np odour-less sieu bong/i, coverage: 12, source: 'https://nipponpaint.com.vn/sites/default/files/2020-05/ODOUR-LESS%20ALL%20IN%201%20SI%C3%8AU%20B%C3%93NG%20-%20SPEC%20-%20VNESE%20.pdf' },
    { brand: 'NIPPON', match: /^np trang tran toan dien/i, coverage: 11, source: 'https://nipponpaint.com.vn/sites/default/files/2025-06/TR%E1%BA%AENG%20TR%E1%BA%A6N%20TO%C3%80N%20DI%E1%BB%86N%20%20-%20SPEC%20-%20VNESE.pdf' },
    { brand: 'NIPPON', match: /^np chong tham wp 200 \(/i, unit: 'Kg', correctPackageUnit: true, coverage: 7, source: 'https://nipponpaint.com.vn/sites/default/files/2026-02/WP%20200%20-%20SPEC%20-%20VNESE.pdf' },
    { brand: 'NIPPON', match: /^np son chong tham wp 200 plus/i, unit: 'Kg', coverage: 7.5, source: 'https://nipponpaint.com.vn/sites/default/files/2025-02/WP%20200%20PLUS%20-%20TDS%20-%20VN.pdf' },
    { brand: 'JOTUN', match: /jotun putty ext \(/i, unit: 'Kg', coverage: 1, source: 'https://www.jotun.com/api-b2b/v1/datasheets/download/merged?selectedFiles=4597' },
    { brand: 'JOTUN', match: /jotun putty int & ext \(/i, unit: 'Kg', coverage: 1, source: 'https://www.jotun.com/api-b2b/v1/datasheets/download/merged?selectedFiles=4599' },
    { brand: 'TERRACO', match: /^terralast white/i, coverage: 8, source: 'https://terraco.com.vn/wp-content/uploads/2024/06/Terralast-VN.pdf' },
    { brand: 'TERRACO', match: /^terrashield white/i, coverage: 6, source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/TERRASHIELD-VN.pdf' },
    { brand: 'TERRACO', match: /^p primer plus textures/i, coverage: 6.25, source: 'https://terraco.com.vn/wp-content/uploads/2024/06/P-PRIMER-PLUS-TEXTURED-VN.pdf' },
    { brand: 'TERRACO', match: /flexipave cushion coat bc/i, unit: 'Kg', coverage: 2, label: '0,5 kg/m²/lớp (theo hãng)', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/FLEXIPAVE-CUSHION-COAT-VN-v2025.pdf' },
    { brand: 'TERRACO', match: /flexipave cushion coat fc/i, unit: 'Kg', coverage: 1 / 0.35, label: '0,35 kg/m²/lớp (theo hãng)', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/FLEXIPAVE-CUSHION-COAT-VN-v2025.pdf' },
    { brand: 'TERRACO', match: /flexipave concrete primer \/t/i, unit: 'Kg', coverage: 10, label: '0,1 kg/m²/lớp (theo hãng)', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/FLEXIPAVE-CONCRETE-PRIMER-VN-v2025.pdf' }
  ];

  data.products.forEach(function (product) {
    if (!product || product.enabled === false) return;
    if (!Array.isArray(product.variants) || !product.variants.some(function (size) { return Number(size) > 0; })) return;
    var name = String(product.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd');
    var spec = specs.find(function (item) {
      return item.brand === product.brand && (item.unit || 'L') === (item.correctPackageUnit ? 'Kg' : product.measureUnit) && item.match.test(name);
    });
    if (!spec) return;
    if (spec.correctPackageUnit) {
      if (!product.massOnly || !/kg/i.test(String(product.unit || ''))) return;
      product.measureUnit = 'Kg';
      product.massOnly = false;
    } else if (product.massOnly || Number(product.coverage) > 0) return;
    product.coverage = spec.coverage;
    product.coverageLabel = spec.label || (spec.coverage + ' m²/' + (spec.unit || 'L') + '/lớp (theo hãng)');
    product.coverageBasis = 'm2_per_unit';
    product.technicalSource = 'manufacturer';
    product.technicalSourceUrl = spec.source;
    product.calcEligible = true;
    product.badge = 'Có thể tính';
  });
})();
