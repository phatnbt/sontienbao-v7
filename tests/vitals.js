#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'vitals.js'), 'utf8');

function run(search, enabled, hostname) {
  const scripts = [], panels = [], callbacks = {}, reported = [];
  const window = { STB_ANALYTICS: { enabled, recordVital(metric) { reported.push(metric); } } };
  const document = {
    createElement(tag) { return { tag, style: {}, setAttribute() {} }; },
    head: { appendChild(node) { scripts.push(node); } },
    body: { appendChild(node) { panels.push(node); } }
  };
  vm.runInNewContext(source, { window, document, location: { search, hostname: hostname || 'localhost' } });
  const vitalsScript = scripts.find(script => script.src === 'vendor/web-vitals.iife.js');
  if (vitalsScript) {
    window.webVitals = { onLCP(fn) { callbacks.LCP = fn; }, onINP(fn) { callbacks.INP = fn; }, onCLS(fn) { callbacks.CLS = fn; } };
    vitalsScript.onload();
  }
  return { scripts, panels, callbacks, reported };
}

const ordinary = run('', false);
assert.strictEqual(ordinary.scripts.length, 0, 'no GA4 must add no measurement payload for regular visitors');
const debug = run('?vitals=1', false);
assert.strictEqual(debug.scripts.length, 1, 'debug mode must load the local Web Vitals library');
debug.callbacks.LCP({ name: 'LCP', value: 2500, rating: 'good' });
assert(debug.panels[0].textContent.includes('2.50s'), 'local diagnostics must show measured LCP');
const active = run('', true);
active.callbacks.INP({ name: 'INP', value: 125, rating: 'good' });
assert.strictEqual(active.reported.length, 1, 'enabled analytics must receive real interaction metrics');
assert.strictEqual(active.panels.length, 0, 'normal visitors must not see a diagnostic panel');
const vercel = run('', false, 'sontienbao-v7.vercel.app');
assert(vercel.scripts.some(script => script.src === '/_vercel/speed-insights/script.js'), 'production visitors must load first-party Speed Insights');
assert(!vercel.scripts.some(script => script.src === 'vendor/web-vitals.iife.js'), 'Speed Insights alone should not load a second Web Vitals library');
console.log('Web Vitals loading and diagnostics tests passed.');
