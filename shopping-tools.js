(function () {
  'use strict';
  var h = React.createElement;

  function text(value) {
    var result = String(value || '').toLowerCase();
    if (result.normalize) result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return result.replace(/đ/g, 'd');
  }
  function money(value) {
    return Number(value) > 0 ? Number(value).toLocaleString('vi-VN') + 'đ' : 'Liên hệ';
  }
  function unitOf(product) {
    return product.measureUnit === 'Kg' || /kg/i.test(product.unit || '') ? 'Kg' : 'L';
  }
  function isFinish(product) {
    if (product.calculatorRole === 'primer') return false;
    var label = text((product.name || '') + ' ' + (product.category || ''));
    return !/son lot|primer|bot tret|bot ba|dung cu|keo ba/.test(label);
  }
  var COMPARISON_PROFILES = [
    { match: /essence de lau chui/, fit: 'Tường nội thất cần lau chùi thường xuyên', strengths: ['Dễ lau chùi', 'Nhẹ mùi, VOC thấp', 'Bề mặt mờ'], note: 'Chỉ dùng cho khu vực nội thất.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/essence-easy-clean' },
    { match: /majestic dep nguyen ban/, fit: 'Không gian cần bề mặt siêu mờ, màu trung thực', strengths: ['Siêu mờ, không phản quang', 'Dễ lau chùi', 'Kháng khuẩn, chống nấm mốc'], note: 'Chọn khi bề mặt siêu mờ là ưu tiên chính.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-pure-color' },
    { match: /jotashield ben mau toan dien/, fit: 'Mặt tiền cần giữ màu và hạn chế bám bụi', strengths: ['Bền màu', 'Chống bám bụi', 'Dễ thi công'], note: 'Dòng sơn phủ cho tường ngoại thất.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products' },
    { match: /jotashield sach vuot troi/, fit: 'Ngoại thất dễ bám bụi và vệt nước', strengths: ['Chống bám bụi', 'Ngăn vệt bẩn', 'Tự làm sạch khi mưa'], note: 'Tính năng tự làm sạch phụ thuộc điều kiện mưa thực tế.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotashield-ultra-clean' },
    { match: /jotashield chong phai mau/, fit: 'Mặt tiền ưu tiên màu sắc bền lâu', strengths: ['Chống phai màu', 'Giảm nhiệt', 'Ngăn vệt nước'], note: 'Dòng sơn phủ cho tường ngoại thất.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotashield-antifade-colours' },
    { match: /jotashield che phu vet nut/, fit: 'Tường ngoại thất có vết nứt nhỏ', strengths: ['Che phủ vết nứt', 'Chống thấm', 'Kháng tia cực tím'], note: 'Cần kiểm tra tình trạng vết nứt trước khi chọn hệ sơn.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products' },
    { match: /tough shield max/, fit: 'Ngoại thất cần chống rong rêu, nấm mốc', strengths: ['Kháng tia cực tím', 'Chống rong rêu, nấm mốc', 'Che phủ tốt'], note: 'Dòng sơn phủ cho tường ngoại thất.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products' },
    { match: /tough shield/, fit: 'Ngoại thất cần bảo vệ trước thời tiết', strengths: ['Bền với thời tiết', 'Chống rong rêu, nấm mốc', 'Chống bong tróc'], note: 'Dòng sơn phủ cho tường ngoại thất.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products' },
    { match: /waterguard/, fit: 'Tường ngoại thất thường chịu mưa', strengths: ['Chống thấm nước', 'Che phủ vết nứt', 'Chống nấm mốc'], note: 'Kiểm tra tình trạng thấm và bề mặt trước khi thi công.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotun-waterguard' },
    { match: /flexipave.*(?:texture|textured)/, fit: 'Sân thể thao cần bề mặt sần', strengths: ['Lớp phủ Acrylic chịu thời tiết', 'Chống thấm', 'Có thể điều chỉnh độ nhám'], note: 'Cần tính theo hệ Flexipave; định mức lớp trung gian và hoàn thiện khác nhau.', source: 'https://terraco.com.vn/wp-content/uploads/2024/06/FLEXIPAVE-COATING-VN.pdf' },
    { match: /flexipave.*smooth/, fit: 'Sân thể thao cần bề mặt láng', strengths: ['Lớp phủ Acrylic chịu thời tiết', 'Chống thấm', 'Có thể điều chỉnh độ nhám'], note: 'Cần tính theo hệ Flexipave; định mức lớp trung gian và hoàn thiện khác nhau.', source: 'https://terraco.com.vn/wp-content/uploads/2024/06/FLEXIPAVE-COATING-VN.pdf' },
    { match: /matex sac mau diu mat/, fit: 'Nội thất cần bề mặt mờ, dễ dặm vá', strengths: ['Màng sơn phẳng mịn', 'Kháng nấm mốc', 'Mùi nhẹ, VOC thấp'], note: 'Hệ đề nghị có lớp lót trước hai lớp sơn phủ.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/nippon-paint-matex-sac-mau-diu-mat' },
    { match: /(?:np |nippon )matex/, exclude: /super matex|super white/, fit: 'Nội thất cần màng sơn mịn, độ che phủ cao', strengths: ['Độ che phủ cao', 'Màng sơn phẳng mịn', 'Chống rêu, mốc'], note: 'Cần đối chiếu đúng biến thể và hệ sơn lót trước khi thi công.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-nippon-matex' },
    { match: /odour.?less.*(?:crvt|chui rua vuot troi)/, fit: 'Nội thất cần chùi rửa thường xuyên', strengths: ['Dễ chùi rửa', 'Ít bám bẩn', 'Mùi nhẹ'], note: 'Cần xác nhận đúng phiên bản có tính năng kháng khuẩn nếu đây là ưu tiên.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-nippon-odour-less-chui-rua-vuot-troi' },
    { match: /spot.?less[\s-]*plus/, fit: 'Nội thất ưu tiên chống bám bẩn', strengths: ['Chống bám bẩn sinh hoạt', 'Công nghệ ion bạc', 'Dễ chùi rửa'], note: 'Cần xác nhận đúng sản phẩm Spot-less Plus khi chọn mua.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/nippon-paint-spot-less-plus' },
    { match: /odour.?less.*spot.?less/, fit: 'Nội thất dễ dính vết bẩn sinh hoạt', strengths: ['Chống bám bẩn', 'Dễ chùi rửa', 'Mùi nhẹ, VOC thấp'], note: 'Hệ đề nghị có lớp lót trước hai lớp sơn phủ.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-nippon-odour-less-spot-less' }
  ];
  function comparisonProfile(product) {
    var name = text(product.name || '');
    return COMPARISON_PROFILES.find(function (profile) { return profile.match.test(name) && (!profile.exclude || !profile.exclude.test(name)); }) || null;
  }
  var WALL_CONDITIONS = {
    normal: { label: 'Tường đang tốt', advice: 'Làm sạch bề mặt, kiểm tra độ khô và dùng hệ sơn lót, sơn phủ phù hợp.', source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/huong-dan-cach-son-tuong-nha-cu-thay-ao-moi-cho-ngoi-nha-cua-ban' },
    new: { label: 'Tường mới xây', advice: 'Chờ tường đủ khô, kiểm tra độ ẩm và dùng sơn lót phù hợp trước khi sơn phủ.', source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/tam-quan-trong-cua-do-am-tuong-khi-son-nha-do-am-tuong-bao-nhieu-thi-son-duoc' },
    mold: { label: 'Ẩm mốc', advice: 'Tìm và xử lý nguồn ẩm, làm sạch nấm mốc, để tường khô rồi mới sơn lót và sơn phủ. Sơn kháng mốc không thay thế bước xử lý ẩm.', source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/huong-dan-cach-son-tuong-nha-cu-thay-ao-moi-cho-ngoi-nha-cua-ban' },
    seepage: { label: 'Thấm nước', advice: 'Kiểm tra đường nước hoặc vết nứt, xử lý nguyên nhân thấm và khảo sát bề mặt trước khi chọn hệ chống thấm.', source: 'https://professional.nipponpaint.com.vn/vi/van-de-giai-phap' },
    peeling: { label: 'Bong tróc', advice: 'Cạo bỏ lớp sơn bong, xử lý nguyên nhân ẩm nếu có, làm sạch và sơn lót trước lớp phủ mới.', source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/huong-dan-cach-son-tuong-nha-cu-thay-ao-moi-cho-ngoi-nha-cua-ban' },
    stains: { label: 'Dễ bám bẩn', advice: 'Với tường đã khô và ổn định, cân nhắc lớp phủ dễ lau chùi hoặc chống bám bẩn theo khu vực sử dụng.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/essence-easy-clean' }
  };
  function matchesSurface(product, surface) {
    var explicit = product.calculatorSurface;
    var label = text((product.name || '') + ' ' + (product.category || '') + ' ' + (product.description || ''));
    if (surface === 'sport') return explicit === 'sport' || /san the thao|flexipave|san tennis/.test(label);
    if (surface === 'waterproof') return /chong tham|waterguard|waterproof/.test(label);
    if (explicit === surface || explicit === 'both') return true;
    if (explicit && explicit !== 'other') return false;
    if (surface === 'interior') return /noi that|trong nha|majestic|essence/.test(label);
    return /ngoai that|ngoai troi|jotashield|tough shield/.test(label);
  }
  function estimate(product, area) {
    if (/flexipave coating/.test(text(product.name || ''))) return null; // Hệ sân có định mức riêng cho từng lớp.
    var coverage = Number(product.coverage || 0);
    if (!(coverage > 0) || !(Number(area) > 0)) return null;
    var unit = unitOf(product);
    var coverageLabel = text(product.coverageLabel || '');
    if ((unit === 'Kg' && /m²\s*\/\s*l|m2\s*\/\s*l/.test(coverageLabel)) ||
        (unit === 'L' && /m²\s*\/\s*kg|m2\s*\/\s*kg/.test(coverageLabel))) return null;
    var quantity = Number(area) * 2 / coverage * 1.1;
    var prices = product.priceBySize && typeof product.priceBySize === 'object' ? product.priceBySize : {};
    var options = Object.keys(prices).map(function (size) {
      var pack = Number(size), price = Number(prices[size]);
      return pack > 0 && price > 0 ? { size: pack, count: Math.ceil(quantity / pack), price: price } : null;
    }).filter(Boolean);
    if (!options.length && Number(product.price) > 0) {
      var reference = Number(product.priceReferenceSize || (product.variants || [])[0] || 0);
      if (reference > 0) options.push({ size: reference, count: Math.ceil(quantity / reference), price: Number(product.price) });
    }
    options.sort(function (a, b) { return a.count * a.price - b.count * b.price; });
    var best = options[0] || null;
    return {
      quantity: Math.round(quantity * 10) / 10,
      unit: unit,
      packs: best ? best.count + ' × ' + best.size + unit : 'Cần xác nhận quy cách',
      cost: best ? best.count * best.price : 0
    };
  }
  function score(product, condition) {
    var label = text((product.name || '') + ' ' + (product.category || '') + ' ' + (product.description || ''));
    var profile = comparisonProfile(product);
    var strengths = text(profile ? profile.strengths.join(' ') : '');
    var value = product.image ? 8 : 0;
    if (Number(product.coverage) > 0) value += 12;
    if (condition === 'mold' && /chong nam moc|chong rong reu|khang nam moc/.test(strengths)) value += 30;
    if (condition === 'seepage' && /chong tham/.test(strengths)) value += 30;
    if (condition === 'stains' && /de lau chui|de chui rua|chong bam ban|tu lam sach/.test(strengths)) value += 30;
    if (condition === 'seepage' && /waterguard|chong tham/.test(label)) value += 8;
    if (product.featured) value += 4;
    return value;
  }
  function estimateContext(products, area, surface, condition) {
    var items = products.map(function (product) {
      var planned = estimate(product, area);
      return {
        id: product.id,
        name: product.name,
        quantity: planned ? planned.quantity : 0,
        unit: planned ? planned.unit : unitOf(product),
        packs: planned ? planned.packs : '',
        cost: planned ? planned.cost : 0
      };
    });
    return {
      source: 'bo-chon-son',
      surface: surface === 'interior' ? 'Nội thất' : surface === 'exterior' ? 'Ngoại thất' : surface === 'sport' ? 'Sân thể thao' : 'Chống thấm',
      condition: surface === 'sport' ? '' : (WALL_CONDITIONS[condition] || WALL_CONDITIONS.normal).label,
      area: Math.max(1, Number(area) || 1),
      waste: surface === 'sport' ? null : 10,
      items: items,
      total: items.every(function (item) { return item.cost > 0; }) ? items.reduce(function (sum, item) { return sum + item.cost; }, 0) : 0
    };
  }
  function estimateText(context) {
    var lines = ['YÊU CẦU TƯ VẤN SƠN TIẾN BẢO'];
    if (context.surface) lines.push('Khu vực: ' + context.surface);
    if (context.condition) lines.push('Tình trạng tường: ' + context.condition);
    if (context.area) lines.push('Diện tích: ' + context.area + ' m²');
    if (context.waste != null) lines.push('Hao hụt dự kiến: ' + context.waste + '%');
    (context.items || []).forEach(function (item, index) {
      lines.push((index + 1) + '. ' + item.name + ' — ' + (item.quantity ? item.quantity + ' ' + item.unit : 'cần xác nhận lượng') + (item.packs ? ', ' + item.packs : ''));
    });
    lines.push('Chi phí vật tư tham khảo: ' + (Number(context.total) > 0 ? money(context.total) : 'cần báo giá'));
    lines.push('Vui lòng xác nhận sản phẩm, quy cách, giá và giao hàng.');
    return lines.join('\n');
  }
  class EmailDraft extends React.Component {
    constructor(props) { super(props); this.state = { status: '' }; this.field = null; }
    copy() {
      var self = this, value = this.props.message;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () { self.setState({ status: 'Đã sao chép nội dung email.' }); }).catch(function () { self.fallbackCopy(); });
      } else this.fallbackCopy();
    }
    fallbackCopy() {
      if (!this.field) return;
      this.field.select();
      try {
        this.setState({ status: document.execCommand('copy') ? 'Đã sao chép nội dung email.' : 'Hãy chọn và sao chép nội dung bên dưới.' });
      } catch (error) { this.setState({ status: 'Hãy chọn và sao chép nội dung bên dưới.' }); }
    }
    render() {
      var self = this, site = this.props.site || {}, recipient = site.email || 'ctytienbao@gmail.com';
      var subject = 'Yêu cầu báo giá Sơn Tiến Bảo', message = this.props.message || '';
      var query = 'to=' + encodeURIComponent(recipient) + '&subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
      var gmail = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(recipient) + '&su=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
      var outlook = 'https://outlook.live.com/mail/0/deeplink/compose?' + query;
      var mail = 'mailto:' + recipient + '?' + query.replace(/^to=[^&]+&/, '');
      return h('div', { className: 'email-draft', 'aria-label': 'Nội dung email báo giá' },
        h('strong', null, 'Email gửi tới ' + recipient),
        h('p', null, 'Chọn webmail hoặc ứng dụng email, kiểm tra nội dung rồi bấm Gửi. Nếu cửa sổ không mở, hãy sao chép nội dung và dán vào email của bạn.'),
        h('textarea', { readOnly: true, value: message, rows: 6, 'aria-label': 'Nội dung email để sao chép', ref: function (node) { self.field = node; } }),
        h('div', { className: 'email-draft-actions' },
          h('a', { href: gmail, target: '_blank', rel: 'noopener noreferrer' }, 'Mở Gmail ↗'),
          h('a', { href: outlook, target: '_blank', rel: 'noopener noreferrer' }, 'Mở Outlook ↗'),
          h('a', { href: mail }, 'Ứng dụng email'),
          h('button', { type: 'button', onClick: function () { self.copy(); } }, 'Sao chép nội dung')
        ),
        this.state.status && h('small', { role: 'status' }, this.state.status)
      );
    }
  }

  class ShopAssistant extends React.Component {
    constructor(props) {
      super(props);
      this.state = { surface: 'interior', condition: 'normal', area: 100, brand: 'all', selected: null };
    }
    choose(id) {
      var state = this.state;
      var current = state.selected ? state.selected.slice() : (this.props.products || []).filter(function (product) {
        return product.enabled !== false && isFinish(product) && matchesSurface(product, state.surface) &&
          (state.brand === 'all' || product.brand === state.brand);
      }).sort(function (a, b) { return score(b, state.condition) - score(a, state.condition); }).slice(0, 2).map(function (product) { return product.id; });
      var index = current.indexOf(id);
      if (index >= 0) current.splice(index, 1);
      else if (current.length < 3) current.push(id);
      this.setState({ selected: current });
    }
    render() {
      var self = this, props = this.props, state = this.state;
      var brands = Array.from(new Set((props.products || []).map(function (product) { return product.brand; }).filter(Boolean))).sort();
      var candidates = (props.products || []).filter(function (product) {
        return product.enabled !== false && isFinish(product) && matchesSurface(product, state.surface) &&
          (state.brand === 'all' || product.brand === state.brand);
      }).sort(function (a, b) { return score(b, state.condition) - score(a, state.condition); });
      var visible = candidates.slice(0, 6);
      var selectedIds = state.selected === null ? visible.slice(0, 2).map(function (product) { return product.id; }) : state.selected;
      var selected = selectedIds.map(function (id) { return candidates.find(function (product) { return product.id === id; }); }).filter(Boolean);
      var comparison = estimateContext(selected, state.area, state.surface, state.condition);
      var condition = WALL_CONDITIONS[state.condition] || WALL_CONDITIONS.normal;
      var knownCosts = selected.map(function (product) { var plan = estimate(product, state.area); return plan && plan.cost || 0; }).filter(function (cost) { return cost > 0; });
      var lowestCost = knownCosts.length ? Math.min.apply(null, knownCosts) : 0;
      var highestCost = knownCosts.length ? Math.max.apply(null, knownCosts) : 0;
      var rows = [
        ['Thương hiệu', function (product) { return product.brand || '—'; }],
        ['Độ phủ', function (product) { return product.coverageLabel || (Number(product.coverage) > 0 ? product.coverage + ' m²/' + unitOf(product) + '/lớp' : 'Cần xác nhận'); }],
        ['Lượng cho 2 lớp + 10% hao hụt', function (product) { var plan = estimate(product, state.area); return plan ? plan.quantity + ' ' + plan.unit : 'Cần xác nhận'; }],
        ['Quy cách gợi ý', function (product) { var plan = estimate(product, state.area); return plan ? plan.packs : 'Cần xác nhận'; }],
        ['Chi phí vật tư tham khảo', function (product) { var plan = estimate(product, state.area); return plan && plan.cost ? money(plan.cost) : 'Liên hệ'; }],
        ['Phù hợp khi', function (product) { var profile = comparisonProfile(product); return profile ? profile.fit : 'Cần đối chiếu nhu cầu với Tiến Bảo'; }],
        ['Ưu điểm đã xác minh', function (product) { var profile = comparisonProfile(product); return profile ? h('ul', { className: 'shop-compare-list' }, profile.strengths.map(function (item) { return h('li', { key: item }, item); })) : 'Chưa có tài liệu tính năng đã đối chiếu'; }],
        ['Điểm cần cân nhắc', function (product) {
          var profile = comparisonProfile(product), plan = estimate(product, state.area), notes = [];
          if (plan && plan.cost > lowestCost && lowestCost > 0) notes.push('Chi phí ước tính cao hơn lựa chọn thấp nhất ' + money(plan.cost - lowestCost));
          if (!plan || !plan.cost) notes.push('Cần xác nhận định mức hoặc giá theo quy cách');
          if (profile) notes.push(profile.note);
          else notes.push('Chưa có tài liệu tính năng đã kiểm chứng để nhận xét chất lượng');
          return h('ul', { className: 'shop-compare-list' }, notes.map(function (item) { return h('li', { key: item }, item); }));
        }],
        ['Nguồn tham khảo', function (product) {
          var profile = comparisonProfile(product), url = profile ? profile.source : product.url;
          return url ? h('a', { className: 'shop-compare-source', href: url, target: '_blank', rel: 'noopener noreferrer' }, profile ? (product.brand || 'Hãng') + ' chính hãng ↗' : 'Trang sản phẩm Tiến Bảo ↗') : 'Chưa có liên kết nguồn';
        }]
      ];
      return h('section', { className: 'shop-assistant-section', id: 'chon-son', 'aria-labelledby': 'shop-assistant-title' },
        h('div', { className: 'container' },
          h('div', { className: 'shop-assistant-heading' },
            h('span', { className: 'section-kicker' }, 'CHỌN SƠN NHANH'),
            h('h2', { id: 'shop-assistant-title' }, 'Tìm dòng sơn phù hợp với công trình'),
            h('p', null, 'Cho biết khu vực và tình trạng tường để xem cách xử lý, sản phẩm gợi ý và báo giá tham khảo.')
          ),
          h('div', { className: 'shop-assistant-controls' },
            h('label', null, 'Khu vực', h('select', { value: state.surface, onChange: function (event) { self.setState({ surface: event.target.value, condition: event.target.value === 'sport' ? 'normal' : state.condition, selected: null }); } },
              [['interior', 'Nội thất'], ['exterior', 'Ngoại thất'], ['waterproof', 'Chống thấm'], ['sport', 'Sân thể thao']].map(function (option) { return h('option', { key: option[0], value: option[0] }, option[1]); })
            )),
            h('label', null, 'Tình trạng tường', h('select', { value: state.condition, disabled: state.surface === 'sport', onChange: function (event) { var next = event.target.value; self.setState({ condition: next, surface: next === 'seepage' ? 'waterproof' : state.surface, selected: null }); } },
              Object.keys(WALL_CONDITIONS).map(function (key) { return h('option', { key: key, value: key }, WALL_CONDITIONS[key].label); })
            )),
            h('label', null, 'Diện tích (m²)', h('input', { type: 'number', min: 1, max: 100000, value: state.area, onChange: function (event) { self.setState({ area: event.target.value }); } })),
            h('label', null, 'Thương hiệu', h('select', { value: state.brand, onChange: function (event) { self.setState({ brand: event.target.value, selected: null }); } },
              [h('option', { value: 'all', key: 'all' }, 'Tất cả')].concat(brands.map(function (brand) { return h('option', { key: brand, value: brand }, brand); }))
            ))
          ),
          state.surface === 'sport' ? h('p', { className: 'shop-condition-advice' }, 'Sân thể thao dùng hệ sơn riêng. Liên hệ để xác nhận kết cấu bề mặt và định mức từng lớp.') :
            h('div', { className: 'shop-condition-advice', role: 'note' },
              h('span', { className: 'shop-condition-icon', 'aria-hidden': 'true' }, '✓'),
              h('div', null, h('strong', null, condition.label === 'Tường đang tốt' ? 'Chuẩn bị bề mặt' : 'Gợi ý xử lý · ' + condition.label), h('p', null, condition.advice),
                h('a', { href: condition.source, target: '_blank', rel: 'noopener noreferrer' }, 'Xem hướng dẫn của hãng ↗'))
            ),
          h('p', { className: 'shop-result-count', role: 'status' }, candidates.length + ' sản phẩm phù hợp · Hiển thị tối đa 6 gợi ý'),
          visible.length ? h('div', { className: 'shop-recommendations' }, visible.map(function (product) {
            var plan = estimate(product, state.area), active = selected.some(function (item) { return item.id === product.id; });
            return h('article', { className: 'shop-recommendation', key: product.id },
              h('div', { className: 'shop-recommendation-image' }, product.image && h('img', { src: props.resolveImage(product.image), alt: product.name, loading: 'lazy', decoding: 'async' })),
              h('div', { className: 'shop-recommendation-content' },
                h('small', null, product.brand || 'SƠN TIẾN BẢO'),
                h('h3', null, product.name),
                h('p', null, product.category || 'Sản phẩm sơn'),
                h('div', { className: 'shop-recommendation-facts' },
                  h('span', null, 'Độ phủ: ', h('b', null, product.coverageLabel || (product.coverage ? product.coverage + ' m²/' + unitOf(product) + '/lớp' : 'cần xác nhận'))),
                  h('span', null, 'Vật tư dự kiến: ', h('b', null, plan ? plan.quantity + ' ' + plan.unit : 'cần xác nhận')),
                  h('span', null, 'Chi phí: ', h('b', null, plan && plan.cost ? money(plan.cost) : 'cần báo giá'))
                ),
                h('div', { className: 'shop-recommendation-actions' },
                  h('button', { type: 'button', className: active ? 'is-selected' : '', 'aria-pressed': active, onClick: function () { self.choose(product.id); } }, active ? 'Đã chọn so sánh' : 'Thêm so sánh'),
                  h('a', { href: product.url || props.site.catalogUrl, target: '_blank', rel: 'noopener' }, 'Chi tiết ↗')
                )
              )
            );
          })) : h('div', { className: 'shop-empty' }, 'Chưa có sản phẩm khớp bộ lọc. Hãy thử khu vực hoặc thương hiệu khác.'),
          selected.length > 0 && h('div', { className: 'shop-compare', 'aria-labelledby': 'shop-compare-title' },
            h('div', { className: 'shop-compare-heading' }, h('div', null, h('span', { className: 'section-kicker' }, 'SO SÁNH NHANH'), h('h3', { id: 'shop-compare-title' }, selected.length + ' sản phẩm đã chọn')), h('small', null, state.surface === 'sport' ? 'Hệ sơn sân có định mức riêng từng lớp; vui lòng hỏi giá để xác nhận lượng vật tư.' : 'Chi phí ước tính theo cùng diện tích, 2 lớp và 10% hao hụt.')),
            h('div', { className: 'shop-compare-cards' }, selected.map(function (product, index) {
              var plan = estimate(product, state.area), cost = plan && plan.cost || 0;
              return h('article', { className: 'shop-compare-card', key: product.id },
                h('div', { className: 'shop-compare-card-top' },
                  h('span', { className: 'shop-compare-number' }, String(index + 1).padStart(2, '0')),
                  cost > 0 && cost === lowestCost && knownCosts.length > 1 && h('span', { className: 'shop-compare-badge' }, 'Chi phí thấp nhất'),
                  h('button', { type: 'button', 'aria-label': 'Bỏ so sánh ' + product.name, onClick: function () { self.choose(product.id); } }, '×')
                ),
                h('div', { className: 'shop-compare-identity' },
                  h('div', { className: 'shop-compare-photo' }, product.image && h('img', { src: props.resolveImage(product.image), alt: product.name, loading: 'lazy', decoding: 'async' })),
                  h('div', null, h('small', null, product.brand || 'SƠN TIẾN BẢO'), h('h4', null, product.name))
                ),
                h('div', { className: 'shop-compare-price' }, h('small', null, 'Vật tư cho ' + state.area + ' m²'), h('strong', null, cost ? money(cost) : 'Cần báo giá'), cost > 0 && h('span', null, 'Khoảng ' + money(Math.round(cost / Math.max(1, Number(state.area) || 1))) + '/m²')),
                highestCost > 0 && cost > 0 && h('div', { className: 'shop-compare-bar', 'aria-hidden': 'true' }, h('span', { style: { width: Math.max(8, Math.round(cost / highestCost * 100)) + '%' } })),
                h('dl', { className: 'shop-compare-facts' },
                  h('div', null, h('dt', null, 'Độ phủ'), h('dd', null, product.coverageLabel || 'Cần xác nhận')),
                  h('div', null, h('dt', null, 'Lượng dự kiến'), h('dd', null, plan ? plan.quantity + ' ' + plan.unit : 'Cần xác nhận')),
                  h('div', null, h('dt', null, 'Quy cách'), h('dd', null, plan ? plan.packs : 'Cần xác nhận'))
                ),
                h('a', { className: 'shop-compare-detail-link', href: product.url || props.site.catalogUrl, target: '_blank', rel: 'noopener' }, 'Xem sản phẩm ↗')
              );
            })),
            h('details', { className: 'shop-compare-details' },
              h('summary', null, 'Xem bảng thông số chi tiết'),
              h('p', { className: 'shop-compare-source-note' }, 'Ưu điểm lấy từ tài liệu hãng khi có nguồn. Điểm cần cân nhắc gồm chênh lệch chi phí và điều kiện sử dụng; không phải kết luận sản phẩm kém chất lượng.'),
              h('small', { className: 'shop-compare-swipe-hint' }, 'Vuốt ngang để xem thêm sản phẩm →'),
              h('div', { className: 'shop-compare-scroll' }, h('table', null,
                h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Tiêu chí'), selected.map(function (product) { return h('th', { scope: 'col', key: product.id }, product.name); }))),
                h('tbody', null, rows.map(function (row) { return h('tr', { key: row[0] }, h('th', { scope: 'row' }, row[0]), selected.map(function (product) { return h('td', { key: product.id }, row[1](product)); })); }))
              ))
            ),
            h('div', { className: 'shop-compare-actions' },
              h('button', { type: 'button', className: 'btn btn-red', onClick: function () { props.onQuote(comparison); } }, 'Nhận báo giá')
            )
          ),
          h('small', { className: 'shop-data-note' }, 'Lượng và chi phí chỉ là dự kiến từ thông số catalog. Giá, màu và quy cách cần được Tiến Bảo xác nhận trước khi đặt hàng.')
        )
      );
    }
  }

  function ProjectGallery(props) {
    var examples = [
      { name: 'Phòng khách tông ấm', category: 'NỘI THẤT', image: 'assets/inspiration-interior-2026.webp', detail: 'Bề mặt sáng, dễ phối cùng gỗ và ánh sáng tự nhiên.' },
      { name: 'Mặt tiền hiện đại', category: 'NGOẠI THẤT', image: 'assets/inspiration-exterior-2026.webp', detail: 'Gợi ý phối màu sáng và mảng nhấn đậm cho nhà phố.' },
      { name: 'Sân thể thao đa năng', category: 'SÂN THỂ THAO', image: 'assets/inspiration-sport-2026.webp', detail: 'Bề mặt màu rõ, phân khu trực quan cho hoạt động ngoài trời.' }
    ];
    return h('section', { className: 'project-gallery-section', id: 'y-tuong-cong-trinh', 'aria-labelledby': 'project-gallery-title' },
      h('div', { className: 'container' },
        h('div', { className: 'project-gallery-heading' }, h('span', { className: 'section-kicker' }, 'GỢI Ý KHÔNG GIAN'), h('h2', { id: 'project-gallery-title' }, 'Hình dung màu sơn trên từng loại công trình'), h('p', null, 'Ba hình minh hoạ giúp bạn trao đổi về phong cách trước khi chốt sản phẩm và màu thực tế.')),
        h('div', { className: 'project-gallery-grid' }, examples.map(function (example) {
          return h('article', { className: 'project-gallery-card', key: example.name },
            h('img', { src: example.image, alt: 'Ảnh minh hoạ: ' + example.name, loading: 'lazy', decoding: 'async', width: 1536, height: 1024 }),
            h('div', { className: 'project-gallery-copy' }, h('small', null, example.category + ' · ẢNH MINH HOẠ'), h('h3', null, example.name), h('p', null, example.detail))
          );
        })),
        h('div', { className: 'project-gallery-footer' }, h('p', null, 'Ảnh do AI tạo để minh hoạ ý tưởng, không phải công trình Sơn Tiến Bảo đã thi công.'), h('button', { type: 'button', className: 'btn btn-dark', onClick: function () { props.onQuote(); } }, 'Nhờ tư vấn cho công trình của tôi'))
      )
    );
  }

  window.STB_SHOPPING = {
    ShopAssistant: ShopAssistant,
    EmailDraft: EmailDraft,
    ProjectGallery: ProjectGallery,
    estimate: estimate,
    estimateContext: estimateContext,
    estimateText: estimateText,
    comparisonProfile: comparisonProfile
  };
})();
