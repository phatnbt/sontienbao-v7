const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const site = 'https://sontienbao-v7.vercel.app/';
const pages = ['index.html', 'admin.html', 'admin-v2.html', 'admin-v3.html'];

assert(!fs.existsSync(path.join(root, 'CNAME')), 'retired GitHub Pages custom domain must be removed');
for (const file of [...pages, 'admin-route.js', 'production-overrides.js', 'robots.txt', 'sitemap.xml', 'OPEN-ADMIN.bat', 'OPEN-WEBSITE.bat']) {
  assert(!read(file).includes('landing.nguyenbaolam.com'), `${file} still points to the unavailable domain`);
}
assert(read('index.html').includes(`<link rel="canonical" href="${site}"`), 'public canonical must use Vercel');
assert(read('production-overrides.js').includes(`d.seo.canonical = '${site}'`), 'runtime canonical must use Vercel');
assert(read('canonical-route-guard.js').includes(`var SITE = '${site}'`), 'legacy host should redirect to Vercel');

const html = read('index.html');
const bodyScripts = [...html.matchAll(/<script\s+([^>]*src="[^"]+"[^>]*)><\/script>/g)].map(match => match[1]);
assert(bodyScripts.length >= 15, 'expected storefront script chain');
assert(bodyScripts.slice(1).every(attrs => /\bdefer\b/.test(attrs)), 'storefront scripts should download without blocking HTML parsing');

const vercel = JSON.parse(read('vercel.json'));
assert(vercel.headers.some(rule => rule.source === '/assets/:path*' && rule.headers.some(header => header.key === 'Cache-Control' && header.value.includes('max-age=86400'))), 'images should be cached on repeat visits');
assert(!vercel.headers.some(rule => /synced-products|v7-content|index/.test(rule.source)), 'catalog and content should remain fresh');

console.log('Deployment checks passed: Vercel URLs, no retired custom domain, deferred scripts, asset cache.');
