#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', 'analytics.js'), 'utf8');

function boot(measurementId) {
  const listeners = [];
  const scripts = [];
  const window = { STB_ANALYTICS_CONFIG: { measurementId } };
  const document = {
    addEventListener(type, fn) { listeners.push({ type, fn }); },
    createElement() { return {}; },
    head: { appendChild(node) { scripts.push(node); } }
  };
  vm.runInNewContext(source, { window, document, location: { hostname: 'sontienbao-v7.vercel.app' }, Date, encodeURIComponent });
  return { window, listeners, scripts };
}

const disabled = boot('');
assert.strictEqual(disabled.scripts.length, 0, 'tracking must not contact Google without an owner measurement ID');
disabled.window.STB_ANALYTICS.track('quote_open', { context: 'landing', phone: '0913712195' });
assert.strictEqual(disabled.window.dataLayer, undefined, 'disabled tracking must not queue visitor data');

const enabled = boot('G-ABC1234567');
assert.strictEqual(enabled.scripts.length, 1, 'valid GA4 ID must load one tag');
assert(enabled.scripts[0].src.includes('G-ABC1234567'));
enabled.window.STB_ANALYTICS.track('quote_draft', { context: 'calculator', phone: '0913712195' });
const event = enabled.window.dataLayer[enabled.window.dataLayer.length - 1];
assert.strictEqual(event[0], 'event');
assert.strictEqual(event[1], 'quote_draft');
assert.strictEqual(event[2].phone, undefined, 'personal data must not enter GA4 event params');

const click = enabled.listeners.find(item => item.type === 'click');
assert(click, 'contact click listener must be installed');
const link = {
  getAttribute() { return 'tel:0913712195'; },
  closest(selector) { return selector === 'a[href]' ? this : null; }
};
click.fn({ target: link });
const contact = enabled.window.dataLayer[enabled.window.dataLayer.length - 1];
assert.strictEqual(contact[1], 'contact_click');
assert.strictEqual(contact[2].channel, 'phone');
assert.strictEqual(contact[2].placement, 'page');
console.log('Analytics instrumentation tests passed.');
