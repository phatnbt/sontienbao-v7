#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sources = [
  'styles.css',
  'production-overrides.css',
  'landing-upgrade.css',
  'visual-refresh.css',
  'luxury-21st.css',
  'commerce-2026.css',
  'shopping-tools.css'
];

function build() {
  return sources.map(file => `/* ${file} */\n${fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n').trimEnd()}\n`).join('\n');
}

if (require.main === module) {
  const target = path.join(root, 'storefront.css');
  fs.writeFileSync(target, build(), 'utf8');
  console.log(`Built ${path.basename(target)} from ${sources.length} stylesheets.`);
}

module.exports = { build, sources };
