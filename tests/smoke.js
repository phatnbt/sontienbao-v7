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
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  const children = node.props && node.props.children;
  return (Array.isArray(children) ? children : [children]).map(elementText).join(' ').replace(/\s+/g, ' ').trim();
}

function findElement(node, predicate) {
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
  const harness = makeContext();
  const files = [
    'default-data.js',
    'v7-content.js',
    'v7-content-overrides.js',
    'synced-products.js',
    'sync-products.js',
    'manual-products.js',
    'manual-product-overrides.js',
    'production-overrides.js',
    'asset-path-fix.js',
    'app.js'
  ];
  files.forEach(file => runFile(harness.context, file));

  const data = harness.context.STB_DEFAULT_DATA;
  assert(data && Array.isArray(data.products), 'catalog must load');
  assert.strictEqual(data.products.length, 163, 'full product catalog must remain available');
  assert(data.products.some(product => Number(product.price) > 0), 'fresh synchronized prices must be visible');
  assert(data.products.some(product => product.calcEligible), 'calculator must have eligible products');
  assert.strictEqual(
    harness.eventListeners.filter(item => item.type === 'click').length,
    0,
    'production layer must not intercept quote buttons'
  );

  const root = harness.getRenderedRoot();
  assert(root, 'React root must render');
  const AppClass = root.props.children.type;
  const app = new AppClass({});
  let instances = [];
  let tree = expand(app.render(), harness.context.React, instances);
  assert(elementText(tree).includes('SƠN CHÍNH HÃNG'), 'storefront content must render');

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

  const header = instances.find(instance => instance.constructor.name === 'Header');
  assert(header, 'header must render');
  let headerInstances = [];
  let headerTree = expand(header.render(), harness.context.React, headerInstances);
  const searchButton = findElement(headerTree, node => node.props && node.props['aria-label'] === 'Tìm sản phẩm');
  searchButton.props.onClick();
  headerInstances = [];
  headerTree = expand(header.render(), harness.context.React, headerInstances);
  assert(findElement(headerTree, node => node.props && node.props['aria-label'] === 'Từ khóa tìm sản phẩm'), 'product search must open');

  const calculator = instances.find(instance => instance.constructor.name === 'Calculator');
  assert(calculator, 'calculator must render');
  const groups = calculator.groups(data, calculator.state.surface);
  const finish = calculator.find(groups.finishes, calculator.state.productId);
  const before = calculator.layer(finish, calculator.state.finishCoats).qty;
  calculator.setState({ area: 250 });
  const after = calculator.layer(finish, calculator.state.finishCoats).qty;
  assert(after > before, 'calculator quantity must react to area changes');

  const colors = instances.find(instance => instance.constructor.name === 'Colors');
  assert(colors, 'color explorer must render');
  colors.copy('S 0502-Y');
  await Promise.resolve();
  assert.deepStrictEqual(harness.clipboardWrites, ['S 0502-Y'], 'color code must be copied');

  app.setState({ quote: true, announcement: { id: 'test' } });
  app.onKeyDown({ key: 'Escape' });
  assert.strictEqual(app.state.quote, false, 'Escape must close quote dialog');
  assert.strictEqual(app.state.announcement, null, 'Escape must close announcement dialog');

  testSeoObserverIsIdempotent();
  console.log('Landing smoke tests passed: catalog, prices, quote, search, calculator, colors, dialogs, SEO pass.');
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
