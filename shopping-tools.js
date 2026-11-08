(function () {
  'use strict';
  var h = React.createElement;
  var SAVE_KEY = 'stb-v7-saved-estimates';

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
  function score(product, priority, area) {
    var label = text((product.name || '') + ' ' + (product.category || '') + ' ' + (product.description || ''));
    var value = product.image ? 8 : 0;
    if (Number(product.coverage) > 0) value += 12;
    if (priority === 'durable' && /ben mau|chong phai|bao ve|jotashield/.test(label)) value += 30;
    if (priority === 'clean' && /sach|chong bam|de lau|odour/.test(label)) value += 30;
    if (priority === 'value') {
      var planned = estimate(product, area);
      if (planned && planned.cost) value += Math.max(0, 35 - planned.cost / 100000);
    }
    if (product.featured) value += 4;
    return value;
  }
  function estimateContext(products, area, surface) {
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
      area: Math.max(1, Number(area) || 1),
      waste: 10,
      items: items,
      total: items.every(function (item) { return item.cost > 0; }) ? items.reduce(function (sum, item) { return sum + item.cost; }, 0) : 0
    };
  }
  function estimateText(context) {
    var lines = ['YÊU CẦU TƯ VẤN SƠN TIẾN BẢO'];
    if (context.surface) lines.push('Khu vực: ' + context.surface);
    if (context.area) lines.push('Diện tích: ' + context.area + ' m²');
    if (context.waste != null) lines.push('Hao hụt dự kiến: ' + context.waste + '%');
    (context.items || []).forEach(function (item, index) {
      lines.push((index + 1) + '. ' + item.name + ' — ' + (item.quantity ? item.quantity + ' ' + item.unit : 'cần xác nhận lượng') + (item.packs ? ', ' + item.packs : ''));
    });
    lines.push('Chi phí vật tư tham khảo: ' + (Number(context.total) > 0 ? money(context.total) : 'cần báo giá'));
    lines.push('Vui lòng xác nhận sản phẩm, quy cách, giá và giao hàng.');
    return lines.join('\n');
  }
  function savedEstimates() {
    try {
      var data = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]');
      return Array.isArray(data) ? data.slice(0, 5) : [];
    } catch (error) { return []; }
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

  class EstimateActions extends React.Component {
    constructor(props) {
      super(props);
      this.state = { saved: savedEstimates(), status: '', emailDraft: false };
    }
    save() {
      var context = this.props.estimate;
      if (!context) return;
      var entry = { id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), estimate: context };
      var saved = [entry].concat(savedEstimates()).slice(0, 5);
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
        this.setState({ saved: saved, status: 'Đã lưu trên thiết bị này.' });
      } catch (error) { this.setState({ status: 'Trình duyệt chưa cho phép lưu.' }); }
    }
    share(context) {
      var self = this, value = estimateText(context || this.props.estimate);
      if (navigator.share) {
        navigator.share({ title: 'Dự toán sơn Tiến Bảo', text: value }).then(function () {
          self.setState({ status: 'Đã mở bảng chia sẻ.' });
        }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () {
          self.setState({ status: 'Đã sao chép. Bạn có thể dán vào Zalo hoặc email.' });
        }).catch(function () { self.setState({ status: 'Không thể sao chép tự động trên trình duyệt này.' }); });
      } else {
        self.setState({ status: 'Trình duyệt chưa hỗ trợ chia sẻ nhanh.' });
      }
    }
    render() {
      var self = this, context = this.props.estimate, site = this.props.site || {};
      if (!context || !(context.items || []).length) return null;
      return h('div', { className: 'estimate-actions', 'aria-label': 'Lưu và chia sẻ dự toán' },
        h('div', { className: 'estimate-actions-row' },
          h('button', { type: 'button', onClick: function () { self.save(); } }, 'Lưu dự toán'),
          h('button', { type: 'button', onClick: function () { self.share(); } }, 'Chia sẻ / sao chép'),
          h('button', { type: 'button', 'aria-expanded': this.state.emailDraft, onClick: function () { self.setState({ emailDraft: !self.state.emailDraft }); } }, 'Gửi qua email')
        ),
        this.state.emailDraft && h(EmailDraft, { message: estimateText(context), site: site }),
        this.state.status && h('p', { className: 'estimate-status', role: 'status' }, this.state.status),
        this.state.saved.length > 0 && h('details', { className: 'saved-estimates' },
          h('summary', null, 'Dự toán đã lưu (' + this.state.saved.length + ')'),
          this.state.saved.map(function (entry) {
            return h('div', { className: 'saved-estimate', key: entry.id },
              h('span', null, entry.date + ' · ' + entry.estimate.surface + ' · ' + entry.estimate.area + ' m²'),
              h('button', { type: 'button', onClick: function () { self.share(entry.estimate); } }, 'Chia sẻ')
            );
          })
        )
      );
    }
  }

  class ShopAssistant extends React.Component {
    constructor(props) {
      super(props);
      this.state = { surface: 'interior', priority: 'balanced', area: 100, brand: 'all', selected: null };
    }
    choose(id) {
      var state = this.state;
      var current = state.selected ? state.selected.slice() : (this.props.products || []).filter(function (product) {
        return product.enabled !== false && isFinish(product) && matchesSurface(product, state.surface) &&
          (state.brand === 'all' || product.brand === state.brand);
      }).sort(function (a, b) { return score(b, state.priority, state.area) - score(a, state.priority, state.area); }).slice(0, 2).map(function (product) { return product.id; });
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
      }).sort(function (a, b) { return score(b, state.priority, state.area) - score(a, state.priority, state.area); });
      var visible = candidates.slice(0, 6);
      var selectedIds = state.selected === null ? visible.slice(0, 2).map(function (product) { return product.id; }) : state.selected;
      var selected = selectedIds.map(function (id) { return candidates.find(function (product) { return product.id === id; }); }).filter(Boolean);
      var comparison = estimateContext(selected, state.area, state.surface);
      var rows = [
        ['Thương hiệu', function (product) { return product.brand || '—'; }],
        ['Độ phủ', function (product) { return product.coverageLabel || (Number(product.coverage) > 0 ? product.coverage + ' m²/' + unitOf(product) + '/lớp' : 'Cần xác nhận'); }],
        ['Lượng cho 2 lớp + 10% hao hụt', function (product) { var plan = estimate(product, state.area); return plan ? plan.quantity + ' ' + plan.unit : 'Cần xác nhận'; }],
        ['Quy cách gợi ý', function (product) { var plan = estimate(product, state.area); return plan ? plan.packs : 'Cần xác nhận'; }],
        ['Chi phí vật tư tham khảo', function (product) { var plan = estimate(product, state.area); return plan && plan.cost ? money(plan.cost) : 'Liên hệ'; }]
      ];
      return h('section', { className: 'shop-assistant-section', id: 'chon-son', 'aria-labelledby': 'shop-assistant-title' },
        h('div', { className: 'container' },
          h('div', { className: 'shop-assistant-heading' },
            h('span', { className: 'section-kicker' }, 'CHỌN SƠN NHANH'),
            h('h2', { id: 'shop-assistant-title' }, 'Tìm dòng sơn phù hợp với công trình'),
            h('p', null, 'Chọn khu vực, ưu tiên và diện tích. Bạn có thể so sánh tối đa ba sản phẩm trước khi yêu cầu báo giá.')
          ),
          h('div', { className: 'shop-assistant-controls' },
            h('label', null, 'Khu vực', h('select', { value: state.surface, onChange: function (event) { self.setState({ surface: event.target.value, selected: null }); } },
              [['interior', 'Nội thất'], ['exterior', 'Ngoại thất'], ['waterproof', 'Chống thấm'], ['sport', 'Sân thể thao']].map(function (option) { return h('option', { key: option[0], value: option[0] }, option[1]); })
            )),
            h('label', null, 'Ưu tiên', h('select', { value: state.priority, onChange: function (event) { self.setState({ priority: event.target.value, selected: null }); } },
              [['balanced', 'Phù hợp tổng thể'], ['durable', 'Bền màu / bảo vệ'], ['clean', 'Dễ giữ sạch'], ['value', 'Chi phí hợp lý']].map(function (option) { return h('option', { key: option[0], value: option[0] }, option[1]); })
            )),
            h('label', null, 'Diện tích (m²)', h('input', { type: 'number', min: 1, max: 100000, value: state.area, onChange: function (event) { self.setState({ area: event.target.value }); } })),
            h('label', null, 'Thương hiệu', h('select', { value: state.brand, onChange: function (event) { self.setState({ brand: event.target.value, selected: null }); } },
              [h('option', { value: 'all', key: 'all' }, 'Tất cả')].concat(brands.map(function (brand) { return h('option', { key: brand, value: brand }, brand); }))
            ))
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
            h('div', { className: 'shop-compare-heading' }, h('div', null, h('span', { className: 'section-kicker' }, 'SO SÁNH NHANH'), h('h3', { id: 'shop-compare-title' }, selected.length + ' sản phẩm đã chọn')), h('small', null, 'Chi phí ước tính theo cùng diện tích, 2 lớp và 10% hao hụt.')),
            h('div', { className: 'shop-compare-scroll' }, h('table', null,
              h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Tiêu chí'), selected.map(function (product) { return h('th', { scope: 'col', key: product.id }, product.name); }))),
              h('tbody', null, rows.map(function (row) { return h('tr', { key: row[0] }, h('th', { scope: 'row' }, row[0]), selected.map(function (product) { return h('td', { key: product.id }, row[1](product)); })); }))
            )),
            h('div', { className: 'shop-compare-actions' },
              h('button', { type: 'button', className: 'btn btn-red', onClick: function () { props.onQuote(comparison); } }, 'Hỏi giá các sản phẩm đã chọn'),
              h(EstimateActions, { estimate: comparison, site: props.site })
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
        h('div', { className: 'project-gallery-footer' }, h('p', null, 'Ảnh do AI tạo để minh hoạ ý tưởng, không phải công trình Sơn Tiến Bảo đã thi công.'), h('button', { type: 'button', className: 'btn btn-dark', onClick: props.onQuote }, 'Nhờ tư vấn cho công trình của tôi'))
      )
    );
  }

  window.STB_SHOPPING = {
    ShopAssistant: ShopAssistant,
    EstimateActions: EstimateActions,
    EmailDraft: EmailDraft,
    ProjectGallery: ProjectGallery,
    estimate: estimate,
    estimateContext: estimateContext,
    estimateText: estimateText
  };
})();
