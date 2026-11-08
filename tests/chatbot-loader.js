#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'chatbot-loader.js'), 'utf8');

async function run(healthy) {
  const classes = new Set();
  const scripts = [];
  const styles = [];
  const host = { shadowRoot: { appendChild(node) { styles.push(node); } } };
  const document = {
    readyState: 'complete',
    documentElement: { classList: { add(value) { classes.add(value); }, remove(value) { classes.delete(value); } } },
    getElementById(id) { return id === 'stb-ai-chatbot' && scripts.length ? host : null; },
    createElement(tag) { return { tagName: tag, dataset: {} }; },
    body: { appendChild(node) { scripts.push(node); } }
  };
  const context = {
    document,
    fetch: async () => ({ ok: healthy, json: async () => ({ ok: healthy }) }),
    AbortController,
    setTimeout,
    clearTimeout
  };
  vm.runInNewContext(source, context, { filename: 'chatbot-loader.js' });
  await new Promise(resolve => setImmediate(resolve));
  return { classes, scripts, styles };
}

(async () => {
  const offline = await run(false);
  assert.strictEqual(offline.scripts.length, 0, 'chat widget must stay hidden when backend health fails');
  assert(!offline.classes.has('stb-chat-ready'), 'existing contact controls must remain available offline');

  const online = await run(true);
  assert.strictEqual(online.scripts.length, 1, 'healthy backend must load one widget');
  assert.strictEqual(online.scripts[0].dataset.position, 'right');
  assert(online.scripts[0].src.endsWith('/widget.js'));
  online.scripts[0].onload();
  assert(online.classes.has('stb-chat-ready'), 'contact dock must hide only after widget loads');
  assert(online.styles[0].textContent.includes('.stb-wrap{bottom:86px'), 'mobile launcher must clear the action bar');
  assert(!online.styles[0].textContent.includes('.stb-panel'), 'widget must retain its own responsive panel layout');

  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(html.includes('chatbot-loader.js') && html.includes('connect-src') && html.includes('son-tien-bao-chatbot-production.up.railway.app'), 'page must load the widget and permit the API under CSP');
  console.log('Chatbot loader tests passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
