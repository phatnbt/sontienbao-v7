const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const adminGate = fs.readFileSync('admin-v2.js', 'utf8');
const adminCore = fs.readFileSync('admin-core.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

assert(adminGate.includes('discardSavedToken();'), 'old browser-stored token must be removed on Admin load');
assert(!adminGate.includes('sessionStorage.setItem(TOKEN_KEY'), 'GitHub token must not be written to sessionStorage');
assert(!adminGate.includes('vault.token='), 'GitHub token must not be saved to localStorage vault');
assert(adminCore.includes('var sessionToken=window.STB_ADMIN_SECURITY'), 'Admin API must use an in-memory token');
assert(!adminCore.includes("sessionStorage.getItem('stb-v7-github-token')"), 'Admin API must not read token from sessionStorage');
assert(!html.includes('chatbot-loader.js'), 'inactive third-party chatbot must not load on public site');
assert(!html.includes('son-tien-bao-chatbot-production.up.railway.app'), 'inactive chatbot origin must not be allowed by CSP');

const start = adminCore.indexOf('async function imageExtension(file)');
const end = adminCore.indexOf('async function uploadFile(file)', start);
assert(start >= 0 && end > start, 'image signature validator must exist');
const imageExtension = vm.runInNewContext('(' + adminCore.slice(start, end).trim() + ')', { Uint8Array, String });
function gateFunction(name) {
  const asyncMarker = 'async function ' + name + '(';
  const marker = adminGate.includes(asyncMarker) ? asyncMarker : 'function ' + name + '(';
  const at = adminGate.indexOf(marker);
  assert(at >= 0, name + ' must exist');
  return adminGate.slice(at, adminGate.indexOf('\n', at));
}
const persisted = [];
const writes = [];
const gate = {
  Uint8Array,
  CHECK: 'gate-check',
  TOKEN_KEY: 'stb-v7-github-token',
  ITERATIONS: 310000,
  currentKey: null,
  currentToken: '',
  crypto: { getRandomValues: bytes => bytes.fill(3) },
  derive: async () => 'derived-key',
  encrypt: async () => ({ iv: 'iv', data: 'ciphertext' }),
  b64: () => 'salt',
  writeVault: vault => persisted.push(vault),
  readVault: () => ({ version: 1, token: { data: 'old-token' }, check: {} }),
  sessionStorage: { setItem: (key, value) => writes.push([key, value]), removeItem: key => writes.push([key, null]) },
  clearFails: () => {}
};
vm.createContext(gate);
vm.runInContext(gateFunction('createVault') + '\n' + gateFunction('takeToken') + '\n' + gateFunction('discardSavedToken'), gate);
function image(bytes, type) {
  return { type, slice: () => ({ arrayBuffer: async () => Uint8Array.from(bytes).buffer }) };
}

Promise.all([
  gate.createVault('test-password', 'example-secret').then(() => {
    assert(!Object.hasOwn(persisted[0], 'token'), 'new vault must not contain a GitHub token');
    assert.equal(gate.takeToken(), 'example-secret', 'new Admin core must receive token once');
    assert.equal(gate.takeToken(), '', 'token transfer must clear the gate copy');
    assert(!writes.some(([, value]) => value === 'example-secret'), 'token must not enter browser storage');
    gate.discardSavedToken();
    assert(!Object.hasOwn(persisted[1], 'token'), 'legacy vault token must be deleted on load');
  }),
  imageExtension(image([137, 80, 78, 71, 13, 10, 26, 10], 'image/png')).then(ext => assert.equal(ext, 'png')),
  imageExtension(image([255, 216, 255, 224], 'image/jpeg')).then(ext => assert.equal(ext, 'jpg')),
  imageExtension(image([60, 115, 118, 103, 32, 111, 110, 108], 'image/png')).then(ext => assert.equal(ext, '')),
  imageExtension(image([137, 80, 78, 71, 13, 10, 26, 10], 'image/jpeg')).then(ext => assert.equal(ext, ''))
]).then(() => console.log('Security checks passed: token storage, CSP and image validation.')).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
