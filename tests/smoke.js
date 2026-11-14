#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');

function storage() {
  const values = Object.create(null);
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value) { values[key] = String(value); },
    removeItem(key) { delete values[key]; }
  };
}

function elementText(node) {
  if (node == null || node === false || node === true) return '';
  if (Array.isArray(node)) return node.map(elementText).join(' ');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  const children = node.props && node.props.children;
  return (Array.isArray(children) ? children : [children]).map(elementText).join(' ').replace(/\s+/g, ' ').trim();
}

function findElement(node, predicate) {
  if (Array.isArray(node)) return node.map(child => findElement(child, predicate)).find(Boolean) || null;
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  const children = node.props && node.props.children;
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    const match = findElement(child, predicate);
    if (match) return match;
  }
  return null;
}

function makeContext() {
  const eventListeners = [];
  const localStorage = storage();
  const sessionStorage = storage();
  const clipboardWrites = [];
  const alerts = [];
  let renderedRoot = null;

  class Component {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(update) {
      const next = typeof update === 'function' ? update(this.state, this.props) : update;
      this.state = Object.assign({}, this.state, next || {});
    }
  }

  const React = {
    Component,
    createElement(type, props) {
      const children = Array.prototype.slice.call(arguments, 2);
      const next = Object.assign({}, props || {});
      next.children = children.length < 2 ? children[0] : children;
      return { type, props: next };
    }
  };

  const document = {
    currentScript: { src: 'http://localhost:4173/asset-path-fix.js' },
    readyState: 'complete',
    documentElement: { style: { setProperty() {} }, setAttribute() {}, scrollHeight: 4000 },
    body: { appendChild() {} },
    addEventListener(type, handler, options) { eventListeners.push({ type, handler, options }); },
    removeEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return {}; },
    execCommand(command) { return command === 'copy'; },
    createElement(tag) {
      return {
        tagName: String(tag).toUpperCase(),
        style: {},
        setAttribute() {},
        appendChild() {},
        select() {},
        click() {},
        remove() {}
      };
    }
  };

  const location = {
    href: 'http://localhost:4173/',
    origin: 'http://localhost:4173',
    hostname: 'localhost',
    protocol: 'http:',
    hash: '',
    reload() {}
  };

  const context = {
    console,
    React,
    ReactDOM: { render(node) { renderedRoot = node; } },
    document,
    location,
    localStorage,
    sessionStorage,
    navigator: { clipboard: { writeText(text) { clipboardWrites.push(text); return Promise.resolve(); } } },
    URL,
    URLSearchParams,
    Blob,
    TextEncoder,
    TextDecoder,
    Date,
    Math,
    JSON,
    Array,
    Object,
    Number,
    String,
    Boolean,
    RegExp,
    Promise,
    setTimeout,
    clearTimeout,
    innerHeight: 900,
    scrollY: 0,
    addEventListener() {},
    removeEventListener() {},
    matchMedia() { return { matches: false }; },
    IntersectionObserver: class { observe() {} unobserve() {} },
    FileReader: class {},
    fetch: async function () { return { ok: false, status: 404, text: async function () { return ''; } }; },
    alert(message) { alerts.push(String(message)); }
  };
  context.window = context;
  context.window.localStorage = localStorage;
  context.window.sessionStorage = sessionStorage;
  vm.createContext(context);

  return {
    context,
    eventListeners,
    clipboardWrites,
    alerts,
    getRenderedRoot() { return renderedRoot; }
  };
}

function runFile(context, filename) {
  const source = fs.readFileSync(path.join(projectRoot, filename), 'utf8');
  vm.runInContext(source, context, { filename });
}

function expand(node, React, instances) {
  if (Array.isArray(node)) return node.map(child => expand(child, React, instances));
  if (node == null || node === false || node === true || typeof node !== 'object') return node;
  if (typeof node.type === 'function') {
    if (node.type.prototype instanceof React.Component) {
      const instance = new node.type(node.props);
      instances.push(instance);
      return expand(instance.render(), React, instances);
    }
    return expand(node.type(node.props), React, instances);
  }
  const children = node.props && node.props.children;
  const list = Array.isArray(children) ? children : [children];
  const props = Object.assign({}, node.props, { children: list.map(child => expand(child, React, instances)) });
  return { type: node.type, props };
}

function testSeoObserverIsIdempotent() {
  let writes = 0;
  function textNode(initial) {
    let value = initial;
    return {
      get textContent() { return value; },
      set textContent(next) { writes += 1; value = String(next); }
    };
  }
  const kicker = textNode('SẢN PHẨM NỔI BẬT');
  const paragraph = textNode('Nội dung cũ');
  const heading = textNode('Những dòng sơn đang được quan tâm');
  heading.closest = function () {
    return { querySelector(selector) { return selector === '.section-kicker' ? kicker : paragraph; } };
  };
  const context = {
    window: null,
    document: {
      readyState: 'complete',
      querySelectorAll() { return [heading]; },
      getElementById() { return {}; },
      body: {},
      addEventListener() {}
    }
  };
  context.window = context;
  vm.createContext(context);
  runFile(context, 'seo-copy-fix.js');
  const firstPassWrites = writes;
  runFile(context, 'seo-copy-fix.js');
  assert.strictEqual(writes, firstPassWrites, 'SEO pass must not write unchanged content');
}

async function main() {
  const pageHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  assert(!fs.existsSync(path.join(projectRoot, 'CNAME')), 'retired GitHub Pages custom domain must stay removed');
  assert(pageHtml.includes('<link rel="canonical" href="https://sontienbao-v7.vercel.app/"'), 'SEO canonical must use the live Vercel site');
  const harness = makeContext();
  const files = [
    'default-data.js',
    'v7-content.js',
    'v7-content-overrides.js',
    'synced-products.js',
    'sync-products.js',
    'calculator-coverage.js',
    'manual-products.js',
    'manual-product-overrides.js',
    'production-overrides.js',
    'asset-path-fix.js',
    'shopping-tools.js',
    'analytics-config.js',
    'analytics.js',
    'app.js'
  ];
  files.forEach(file => runFile(harness.context, file));

  const data = harness.context.STB_DEFAULT_DATA;
  assert(data && Array.isArray(data.products), 'catalog must load');
  assert.strictEqual(data.products.length, data.meta.catalogFamilies, 'all consolidated catalog families must remain available');
  assert(data.products.length >= 140, 'full synchronized catalog must remain available');
  assert(data.meta.catalogPackages >= data.products.length, 'package-level catalog metadata must remain available');
  const syncMeta = harness.context.STB_SYNC_META || {};
  const syncedAt = Date.parse(syncMeta.generatedAt || '');
  const pricesFresh = syncMeta.status === 'ok' && syncedAt > 0 && Math.abs(Date.now() - syncedAt) < 14 * 86400000;
  if (pricesFresh) {
    assert(data.products.some(product => Number(product.price) > 0), 'fresh synchronized prices must be visible');
  } else {
    assert(data.products.every(product => Number(product.price) === 0), 'expired synchronized prices must be hidden');
  }
  assert(data.products.some(product => product.calcEligible), 'calculator must have eligible products');
  assert.strictEqual(harness.eventListeners.filter(item => item.type === 'click').length, 1, 'analytics must observe contact clicks without intercepting them');
  assert.strictEqual(harness.context.STB_ANALYTICS_CONFIG.measurementId, '', 'GA4 must remain disabled until an owner provides a measurement ID');
  const manufacturerProduct = data.products.find(product => /Jotashield Sạch Vượt Trội/.test(product.name) && product.technicalSource === 'manufacturer');
  assert(manufacturerProduct && manufacturerProduct.coverage === 11.1 && manufacturerProduct.technicalSourceUrl.includes('jotun.com'), 'missing coverage must use a traceable exact-family manufacturer spec');

  const root = harness.getRenderedRoot();
  assert(root, 'React root must render');
  const AppClass = root.props.children.type;
  const app = new AppClass({});
  const originalObserver = harness.context.IntersectionObserver;
  const originalQuery = harness.context.document.querySelectorAll;
  let revealObservers = 0;
  let revealDisconnects = 0;
  const revealNode = { classList: { add() {} } };
  harness.context.IntersectionObserver = class {
    constructor() { revealObservers++; }
    observe() {}
    unobserve() {}
    disconnect() { revealDisconnects++; }
  };
  harness.context.document.querySelectorAll = () => [revealNode];
  app.initReveal();
  app.initReveal();
  assert.strictEqual(revealObservers, 1, 'repeated renders must reuse the reveal observer');
  app.componentWillUnmount();
  assert.strictEqual(revealDisconnects, 1, 'reveal observer must be cleaned up');
  harness.context.IntersectionObserver = originalObserver;
  harness.context.document.querySelectorAll = originalQuery;
  let instances = [];
  let tree = expand(app.render(), harness.context.React, instances);
  assert(elementText(tree).includes('Chọn đúng sơn.') && elementText(tree).includes('Tính lượng sơn'), 'storefront must show the clear product and estimate paths');
  const showcase = findElement(tree, node => node.props && node.props.id === 'products');
  assert(showcase && ['JOTUN', 'NIPPON', 'TERRACO', 'RUBY'].every(brand => elementText(showcase).includes(brand)), 'featured products must represent all four catalog brands');
  assert(!findElement(tree, node => node.props && node.props.className === 'intent-section'), 'storefront should not repeat category navigation above the catalog');

  const assistantSection = findElement(tree, node => node.props && node.props.id === 'chon-son');
  assert(assistantSection && elementText(assistantSection).toLowerCase().includes('so sánh'), 'guided product selection and comparison must render');
  assert(findElement(assistantSection, node => node.props && node.props.className === 'shop-compare-card'), 'comparison must show visual product cards');
  assert(findElement(assistantSection, node => node.props && node.props.className === 'shop-compare-details'), 'detailed comparison must remain available on demand');
  const comparisonTable = findElement(assistantSection, node => node.props && node.props.className === 'shop-compare-scroll');
  assert(comparisonTable && elementText(comparisonTable).includes('Đặc điểm theo nguồn') && elementText(comparisonTable).includes('Lưu ý sử dụng') && elementText(comparisonTable).includes('Nguồn thông tin'), 'comparison must separate benefits, cautions and sources');
  const majesticProfile = harness.context.STB_SHOPPING.comparisonProfile({ name: 'Jotun Majestic Đẹp nguyên bản' });
  assert(majesticProfile && majesticProfile.strengths.includes('Siêu mờ, không phản quang') && majesticProfile.source.includes('jotun.com'), 'Majestic comparison must have a sourced product benefit');
  const jotaplastProfile = harness.context.STB_SHOPPING.comparisonProfile({ name: 'Jotun Jotaplast (Sơn phủ nội thất)' });
  assert(jotaplastProfile && jotaplastProfile.strengths.includes('Dễ thi công') && jotaplastProfile.source.endsWith('/jotaplast'), 'Jotaplast must use its own manufacturer product page');
  assert(harness.context.STB_SHOPPING.comparisonProfile({ name: 'Jotun Majestic đẹp hoàn hảo hảo mờ' }).source.endsWith('/majestic-true-beauty-matt'), 'matt paint must not borrow the gloss source');
  const unknownProfile = harness.context.STB_SHOPPING.comparisonProfile({ name: 'Sản phẩm chưa có tài liệu' });
  assert.strictEqual(unknownProfile, null, 'unknown products must not receive invented technical benefits');
  assert(harness.context.STB_SHOPPING.comparisonProfile({ name: 'Flexipave Coating Smooth' }).source.includes('terraco.com/vn/products/flexipave-coating'), 'sports coating must point to the current manufacturer product page');
  const gallerySection = findElement(tree, node => node.props && node.props.id === 'y-tuong-cong-trinh');
  assert(gallerySection && elementText(gallerySection).includes('ẢNH MINH HOẠ'), 'generated gallery must identify its images as illustrations');
  const galleryQuote = findElement(gallerySection, node => node.type === 'button' && elementText(node).includes('Nhờ tư vấn'));
  galleryQuote.props.onClick({ type: 'click' });
  assert.strictEqual(app.state.quoteContext, null, 'gallery quote must not treat a click event as an estimate');
  app.setState({ quote: false });
  const shoppingAssistant = instances.find(instance => instance.constructor.name === 'ShopAssistant');
  assert(shoppingAssistant, 'shopping assistant must be mounted');
  const auditedCatalog = harness.context.STB_CALCULATOR_PRODUCTS;
  const profiledCatalog = auditedCatalog.filter(product => harness.context.STB_SHOPPING.comparisonProfile(product));
  assert(profiledCatalog.length >= 139, 'comparison must retain sourced coverage across the current 147 product catalog');
  assert(harness.context.STB_SHOPPING.comparisonProfile({ name: 'NP Vatex (Sơn nội thất)' }).source.includes('nipponpaint.com.vn'), 'Vatex must use its own manufacturer page');
  assert(harness.context.STB_SHOPPING.comparisonProfile({ name: 'NP Matex Sealer (Sơn lót Nội thất)' }).source.includes('matex-sealer'), 'Matex Sealer must not inherit Matex finish claims');
  assert(harness.context.STB_SHOPPING.comparisonProfile({ name: 'Jotun Tough Shield Primer' }).source.includes('tough-shield-primer'), 'Tough Shield Primer must use its own primer source');
  assert(harness.context.STB_SHOPPING.comparisonProfile({ name: 'P Primer Plus Textures' }).source.includes('textured-tds.pdf'), 'P Primer Plus Textured must use the matching manufacturer TDS');
  assert(harness.context.STB_SHOPPING.comparisonProfile({ name: 'Penetrating Primer (White)' }).source.includes('white-tds.pdf'), 'Penetrating Primer White must use its own manufacturer TDS');
  assert(harness.context.STB_SHOPPING.comparisonProfile({ name: 'RUBYLUX BỀN ĐẸP BASE A/' }).sourceType === 'retailer', 'Ruby seller claims must be labeled separately from manufacturer facts');
  assert.strictEqual(harness.context.STB_SHOPPING.comparisonProfile({ name: 'RUBYCOAT Sơn chống thấm tường' }), null, 'mismatched RUBYCOAT/RUBYCOAST details must remain unverified');
  assert.strictEqual(harness.context.STB_SHOPPING.comparisonProfile({ name: 'Sơn Rubylast trong White' }), null, 'mismatched Rubylast/Rubyplast details must remain unverified');
  assert.strictEqual(harness.context.STB_SHOPPING.estimate({ name: 'Flexicoat W100 Sơn chống thấm', calculatorRole: 'finish', coverage: 10, unit: '5L', priceBySize: { 5: 100000 } }, 100), null, 'waterproof systems must not use the two-coat wall formula');
  const catalogSearch = findElement(assistantSection, node => node.props && node.props.className === 'shop-product-search');
  assert(catalogSearch, 'comparison must expose a search across all catalog products');
  const catalogSearchInput = findElement(catalogSearch, node => node.type === 'input');
  catalogSearchInput.props.onChange({ target: { value: 'RUBYLUX' } });
  assert(elementText(expand(shoppingAssistant.render(), harness.context.React, [])).includes('RUBYLUX BỀN ĐẸP'), 'Ruby products must be selectable from catalog search');
  catalogSearchInput.props.onChange({ target: { value: 'TERRACO' } });
  const showMore = findElement(shoppingAssistant.render(), node => node.props && node.props.className === 'btn btn-outline shop-show-more');
  assert(showMore, 'a long catalog search must provide a way to reach every matching product');
  showMore.props.onClick();
  assert(shoppingAssistant.state.limit === 48, 'show more must reveal another page of matching products');
  shoppingAssistant.setState({ query: '', selected: null });
  const washablePaint = data.products.find(product => /Essence dễ lau chùi/i.test(product.name) && product.calculatorOnly);
  const ceilingPaint = data.products.find(product => /Essence trắng trần chuyên dụng/i.test(product.name) && product.calculatorOnly);
  assert(washablePaint && ceilingPaint, 'comparison examples must exist in the catalog');
  const ceilingProfile = harness.context.STB_SHOPPING.comparisonProfile(ceilingPaint);
  assert(ceilingProfile && ceilingProfile.strengths.includes('Hạn chế văng bắn khi sơn') && ceilingProfile.source.includes('jotun.com'), 'ceiling paint must show sourced, product-specific benefits');
  shoppingAssistant.setState({ surface: 'interior', selected: [washablePaint.id, ceilingPaint.id] });
  const mixedPurposeTree = expand(shoppingAssistant.render(), harness.context.React, []);
  const mixedPurposeTable = findElement(mixedPurposeTree, node => node.props && node.props.className === 'shop-compare-scroll');
  assert(elementText(mixedPurposeTree).includes('Các sản phẩm phục vụ mục đích khác nhau'), 'wall and ceiling products must be distinguished before price comparison');
  assert(elementText(mixedPurposeTable).includes('Trần nội thất') && elementText(mixedPurposeTable).includes('Tường nội thất'), 'comparison must show each intended application');
  assert(findElement(mixedPurposeTable, node => node.type === 'a' && node.props && node.props.href === ceilingPaint.technicalSourceUrl), 'coverage source must be linked separately from feature and price sources');
  shoppingAssistant.setState({ selected: null });
  const conditionSelect = findElement(assistantSection, node => node.type === 'select' && node.props && node.props.value === 'normal');
  assert(conditionSelect && !elementText(assistantSection).includes('Ưu tiên'), 'wall condition must replace the old priority filter');
  conditionSelect.props.onChange({ target: { value: 'seepage' } });
  assert.strictEqual(shoppingAssistant.state.surface, 'waterproof', 'seepage must switch recommendations to waterproof products');
  const seepageTree = expand(shoppingAssistant.render(), harness.context.React, []);
  assert(elementText(seepageTree).includes('xử lý nguyên nhân thấm'), 'seepage guidance must explain surface preparation');
  assert(findElement(seepageTree, node => node.props && node.props.className === 'shop-condition-advice' && node.props.role === 'note'), 'condition guidance must render');
  assert(harness.context.STB_SHOPPING.estimateText(harness.context.STB_SHOPPING.estimateContext([], 100, 'waterproof', 'seepage')).includes('Tình trạng tường: Thấm nước'), 'quote draft must include the selected condition');
  shoppingAssistant.setState({ surface: 'exterior', area: 180 });
  const exteriorTree = expand(shoppingAssistant.render(), harness.context.React, []);
  assert(elementText(exteriorTree).includes('Ngoại thất'), 'guided selection must react to surface and area');
  assert.strictEqual(harness.context.STB_SHOPPING.estimate({ coverage: 12, coverageLabel: '12 m²/L/lớp', unit: '20Kg', price: 100000 }, 100), null, 'mixed coverage and package units must not produce a misleading estimate');
  assert(!instances.some(instance => instance.constructor.name === 'EstimateActions'), 'saving and sharing estimates must be removed from the landing page');
  const compareActions = findElement(assistantSection, node => node.props && node.props.className === 'shop-compare-actions');
  assert(compareActions && elementText(compareActions).trim() === 'Nhận báo giá', 'comparison must have one clear quote action');
  assert.strictEqual(harness.context.STB_SHOPPING.estimate({ name: 'Flexipave Coating Smooth', coverage: 5, unit: '20Kg', priceBySize: { 20: 100000 } }, 100), null, 'sports systems must not use the wall-paint two-coat estimate');

  const proof = findElement(tree, node => node.props && node.props.id === 've-tien-bao');
  assert(proof && elementText(proof).includes('Chọn sơn dễ hơn'), 'company proof section must render');
  assert(elementText(proof).includes('Sản phẩm') && elementText(proof).includes('Thương hiệu'), 'company proof labels must stay concise');
  const antiFadeImage = findElement(tree, node => node.type === 'img' && node.props && String(node.props.alt || '').includes('Chống Phai Màu'));
  assert(antiFadeImage && antiFadeImage.props.src === 'assets/jotun-jotashield-chong-phai-mau-official.webp', 'featured product must use the clean official image');
  const stats = instances.filter(instance => instance.constructor.name === 'AnimatedStat');
  assert.strictEqual(stats.length, 3, 'company proof must show three animated statistics');
  assert.strictEqual(stats[0].props.value, new Date().getFullYear() - 2005, 'years must derive from the registration year');
  assert(stats[1].props.value > 0 && stats[1].props.value <= data.meta.catalogFamilies, 'product count must derive from the catalog');
  const previousMatchMedia = harness.context.matchMedia;
  harness.context.matchMedia = () => ({ matches: true });
  stats[0].componentDidMount();
  assert.strictEqual(stats[0].state.value, stats[0].props.value, 'reduced motion must show the final statistic');
  harness.context.matchMedia = previousMatchMedia;

  const backToTop = instances.find(instance => instance.constructor.name === 'BackToTop');
  assert(backToTop, 'back-to-top control must render');
  assert.strictEqual(backToTop.render(), false, 'back-to-top control must be hidden near the start');
  harness.context.scrollY = 3200;
  backToTop.onScroll();
  const backButton = backToTop.render();
  assert(backButton && backButton.props['aria-label'] === 'Cuộn về đầu trang', 'back-to-top control must appear near the footer');
  let scrollRequest;
  harness.context.scrollTo = request => { scrollRequest = request; };
  backButton.props.onClick();
  assert.strictEqual(scrollRequest.top, 0, 'back-to-top control must scroll to the beginning');
  harness.context.scrollY = 0;

  const quoteButton = findElement(tree, node => node.type === 'button' && elementText(node) === 'Nhận báo giá');
  assert(quoteButton && typeof quoteButton.props.onClick === 'function', 'quote CTA must be interactive');
  quoteButton.props.onClick();
  assert.strictEqual(app.state.quote, true, 'quote CTA must open the form');
  instances = [];
  tree = expand(app.render(), harness.context.React, instances);
  assert(findElement(tree, node => node.props && node.props['aria-label'] === 'Nhận báo giá Sơn Tiến Bảo'), 'quote dialog must render');

  const quote = instances.find(instance => instance.constructor.name === 'QuoteModal');
  assert(quote, 'quote component must be mounted');
  quote.setState({ name: 'Khách thử', phone: '0913 712 195' });
  quote.submit({ preventDefault() {} });
  assert.strictEqual(quote.state.done, true, 'valid local quote must be saved');
  assert(JSON.parse(harness.context.localStorage.getItem('stb-v7-leads')).length === 1, 'saved lead must be readable');
  const mailQuote = new quote.constructor({ data: quote.props.data, context: { surface: 'Ngoại thất', area: 90, items: [{ id: 'test', name: 'Sơn thử', quantity: 20, unit: 'L' }], total: 0 } });
  const originalHost = harness.context.location.hostname;
  harness.context.location.hostname = 'phatnbt.github.io';
  mailQuote.setState({ name: 'Khách thử', phone: '0913 712 195' });
  mailQuote.submit({ preventDefault() {} });
  assert.strictEqual(mailQuote.state.handoff, 'email', 'published quote must prepare a draft without requiring a local mail app');
  const mailTree = expand(mailQuote.render(), harness.context.React, []);
  const mailDraft = findElement(mailTree, node => node.props && node.props.className === 'email-draft');
  assert(mailDraft && elementText(mailDraft).includes('Mở Gmail') && elementText(mailDraft).includes('Sao chép nội dung'), 'published quote must offer webmail and copy actions');
  assert(mailQuote.message().includes('Sơn thử'), 'email request must include selected paint');
  harness.context.location.hostname = originalHost;

  const header = instances.find(instance => instance.constructor.name === 'Header');
  assert(header, 'header must render');
  let headerInstances = [];
  let headerTree = expand(header.render(), harness.context.React, headerInstances);
  const searchButton = findElement(headerTree, node => node.props && node.props['aria-label'] === 'Tìm sản phẩm');
  searchButton.props.onClick();
  headerInstances = [];
  headerTree = expand(header.render(), harness.context.React, headerInstances);
  assert(findElement(headerTree, node => node.props && node.props['aria-label'] === 'Từ khóa tìm sản phẩm'), 'product search must open');
  const productSearch = headerInstances.find(instance => instance.constructor.name === 'ProductSearch');
  productSearch.setState({ query: 'son lot' });
  const normalizedSearchTree = expand(productSearch.render(), harness.context.React, []);
  assert(findElement(normalizedSearchTree, node => node.props && node.props.className === 'search-product'), 'product search must support Vietnamese queries without diacritics');

  const calculator = instances.find(instance => instance.constructor.name === 'Calculator');
  assert(calculator, 'calculator must render');
  const calculatorProducts = data.products.filter(product => product.calculatorOnly);
  assert(calculatorProducts.length >= 140, 'the synchronized calculator catalog must retain broad product coverage');
  assert(calculatorProducts.filter(product => calculator.eligible(product)).length >= 100, 'verified per-coat coverage must remain available after catalog sync');
  const wp200 = calculatorProducts.find(product => /^NP Chống thấm WP 200 \(/.test(product.name));
  assert(wp200 && wp200.measureUnit === 'Kg' && wp200.coverage === 7 && calculator.eligible(wp200), 'WP 200 must use the manufacturer Kg coverage for the 6Kg package');
  const kgPaint = data.products.find(product => product.measureUnit === 'Kg' && product.coverage > 0 && !product.massOnly && product.calculatorOnly);
  assert(kgPaint && calculator.eligible(kgPaint), 'matching Kg coverage and package units must be calculable');
  assert(calculator.layer(kgPaint, 2).qty > 0, 'matching Kg products must produce a quantity');
  const mixedUnit = data.products.find(product => product.massOnly && product.coverage > 0 && product.calculatorOnly);
  assert(mixedUnit && !calculator.eligible(mixedUnit) && calculator.layer(mixedUnit, 2).qty === 0, 'mixed units must never produce a quantity');
  const noRate = calculatorProducts.find(product => product.brand === 'RUBY' && !calculator.eligible(product) && Array.isArray(product.variants) && product.variants.length);
  assert(noRate && calculator.layer(noRate, 2).qty === 0, 'products without a verified rate must not receive an invented estimate');
  const noPackage = calculatorProducts.find(product => product.brand === 'RUBY' && (!product.variants || !product.variants.length));
  assert(noPackage && !calculator.eligible(noPackage), 'products without a known package must remain uncalculable');
  assert.strictEqual(calculator.allItems(data).length, calculatorProducts.length, 'all current catalog products must appear in the all-products picker');
  calculator.setState({ mode: 'single', singleId: noRate.id });
  let manualTree = expand(calculator.render(), harness.context.React, []);
  assert(findElement(manualTree, node => node.props && node.props.className === 'calc-manual-rate'), 'missing-rate products must show the manual rate field');
  calculator.setState({ manualCoverage: '8' });
  const userRated = calculator.withManualCoverage(noRate);
  assert(calculator.eligible(userRated) && calculator.layer(userRated, 2).qty > 0 && userRated.technicalSource === 'entered', 'a customer-provided rate must allow a calculation for an otherwise unsupported product');
  for (const product of calculatorProducts.filter(product => Array.isArray(product.variants) && product.variants.length)) {
    assert(calculator.eligible(calculator.withManualCoverage(product)), `every current product must calculate when its package-specific rate is known: ${product.name}`);
  }
  calculator.setState({ singleId: noPackage.id });
  const noPackageTree = expand(calculator.render(), harness.context.React, []);
  assert(findElement(noPackageTree, node => node.props && node.props.className === 'calc-manual-unavailable'), 'missing package sizes must ask for confirmation instead of offering a misleading estimate');
  calculator.setState({ singleId: noRate.id });
  manualTree = expand(calculator.render(), harness.context.React, []);
  assert(elementText(manualTree).includes('Định mức bạn nhập'), 'manual rate must be labelled as customer-provided in the result');
  const manualQuoteButton = findElement(manualTree, node => node.type === 'button' && elementText(node) === 'Nhận báo giá chính xác →');
  manualQuoteButton.props.onClick();
  assert(app.state.quoteContext.items.some(item => item.id === noRate.id && item.quantity > 0), 'manual estimate must carry the selected product and quantity into the quote');
  calculator.setState({ manualCoverage: '' });
  const calculatorTree = expand(calculator.render(), harness.context.React, []);
  const calculatorQuoteButton = findElement(calculatorTree, node => node.type === 'button' && elementText(node) === 'Nhận báo giá chính xác →');
  assert(calculatorQuoteButton && calculatorQuoteButton.props.onClick, 'calculator quote action must include a click handler');
  calculatorQuoteButton.props.onClick();
  assert(app.state.quoteContext && app.state.quoteContext.items.length > 0, 'calculator must pass selected products into quote request');
  const groups = calculator.groups(data, calculator.state.surface);
  const finish = calculator.find(groups.finishes, calculator.state.productId);
  const before = calculator.layer(finish, calculator.state.finishCoats).qty;
  calculator.setState({ area: 250 });
  const after = calculator.layer(finish, calculator.state.finishCoats).qty;
  assert(after > before, 'calculator quantity must react to area changes');
  calculator.props.onQuote();
  assert.strictEqual(app.state.quote, true, 'calculator quote action must open the quote flow');
  instances = [];
  tree = expand(app.render(), harness.context.React, instances);
  const calculatorQuote = instances.find(instance => instance.constructor.name === 'QuoteModal');
  assert(calculatorQuote, 'quote dialog must open from the calculator');

  const colors = instances.find(instance => instance.constructor.name === 'Colors');
  assert(colors, 'color explorer must render');
  colors.copy('S 0502-Y');
  await Promise.resolve();
  assert.deepStrictEqual(harness.clipboardWrites, ['S 0502-Y'], 'color code must be copied');

  app.setState({ quote: true, announcement: { id: 'test' } });
  app.onKeyDown({ key: 'Escape' });
  assert.strictEqual(app.state.quote, false, 'Escape must close quote dialog');
  assert.strictEqual(app.state.announcement, null, 'Escape must close announcement dialog');

  const staleHarness = makeContext();
  staleHarness.context.localStorage.setItem('stb-v7-data', JSON.stringify({
    meta: { catalogGeneratedAt: '2020-01-01T00:00:00.000Z' },
    products: [{ id: 'stale-product', name: 'Catalog cũ' }]
  }));
  files.forEach(file => runFile(staleHarness.context, file));
  const staleRoot = staleHarness.getRenderedRoot();
  const StaleAppClass = staleRoot.props.children.type;
  const staleApp = new StaleAppClass({});
  assert.strictEqual(staleApp.state.data.products.length, data.meta.catalogFamilies, 'a newer synchronized catalog must replace stale browser data');
  assert.strictEqual(staleApp.state.data.meta.catalogGeneratedAt, data.meta.catalogGeneratedAt, 'catalog revision must be persisted after migration');

  testSeoObserverIsIdempotent();
  console.log('Landing smoke tests passed: catalog refresh, price freshness, quote dialog, normalized search, calculator, colors, dialogs, SEO pass.');
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
