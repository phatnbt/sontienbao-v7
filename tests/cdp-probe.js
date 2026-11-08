#!/usr/bin/env node
'use strict';

// Run with a local server on :4173 and Edge DevTools on :9223.
// `node tests/cdp-probe.js --assert` checks the product card regression in a real browser.
async function main() {
const assertResult = process.argv[2] === '--assert';
const mobile = process.argv[2] === '--mobile';
const cardAssertion = `(()=>{
  const cards=Array.from(document.querySelectorAll('.product-card')).slice(0,6);
  const labels=Array.from(document.querySelectorAll('.proof-stat>span')).map(node=>node.textContent);
  const cleanImage=cards[2]&&cards[2].querySelector('img').getAttribute('src')==='assets/jotun-jotashield-chong-phai-mau-official.webp';
  return cards.length===6&&cleanImage&&labels.includes('Sản phẩm')&&labels.includes('Thương hiệu')&&cards.every(card=>{
    const media=card.querySelector('.product-img'),image=media.querySelector('img'),title=card.querySelector('.product-body h3');
    return image.getBoundingClientRect().height<=media.getBoundingClientRect().height+1&&getComputedStyle(title).color!=='rgb(255, 255, 255)'&&!card.querySelector('.view-product');
  });
})()`;
const expression = process.argv[assertResult || mobile ? 3 : 2] || (assertResult ? cardAssertion : 'document.title');
const tabs = await fetch('http://127.0.0.1:9223/json').then(response => response.json());
const tab = tabs.find(item => item.type === 'page' && item.url.startsWith('http://127.0.0.1:4173/'));
if (!tab) throw new Error('Local landing page tab not found');
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
const send = (id, method, params) => new Promise((resolve, reject) => {
  socket.addEventListener('message', event => {
    const payload = JSON.parse(event.data);
    if (payload.id !== id) return;
    if (payload.error) reject(new Error(payload.error.message));
    else resolve(payload.result);
  });
  socket.send(JSON.stringify({ id, method, params }));
});
if (mobile) await send(1, 'Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
const response = await send(2, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
socket.close();
if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
console.log(JSON.stringify(response.result.value, null, 2));
if (assertResult && response.result.value !== true) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
