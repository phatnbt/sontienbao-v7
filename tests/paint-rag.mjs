import assert from 'node:assert/strict';
import worker, { relatedAdvice, retrieve } from '../paint-rag/worker.mjs';

const origin = 'https://sontienbao-v7.vercel.app';
const headers = { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' };
const request = (question, overrides = {}) => new Request('https://worker.example/ask', {
  method: 'POST', headers, body: JSON.stringify({ question }), ...overrides
});

let generationCalls = 0;
const env = {
  SITE_ORIGIN: origin,
  PAINT_RATE: { limit: async () => ({ success: true }) },
  AI: { run: async (model, options) => {
    generationCalls++;
    assert.match(model, /qwen/);
    assert.match(options.messages[0].content, /phấn hóa/i);
    assert(options.max_completion_tokens <= 480);
    return { response: 'Làm sạch bột phấn và kiểm tra độ khô trước khi chọn lót [1].' };
  } }
};

assert.equal(retrieve('Mat tien bi phan hoa')[0].id, 'chalk');
const chalk = retrieve('Tường bị phấn hóa');
assert.equal(chalk[0].id, 'chalk');
assert(chalk.some(topic => topic.id === 'repaint' && topic.sources.includes('repaint')));
assert.equal(relatedAdvice({ id: 'salt' }, ['salt', 'seepage', 'repaint']).id, 'primer');
assert(!retrieve('Tường bị phấn hóa nhưng không bị thấm').some(topic => topic.id === 'seepage'));
assert.equal(retrieve('Kết quả bóng đá tối nay').length, 0);
const success = await worker.fetch(request('Tường mặt tiền bị phấn hóa'), env);
assert.equal(success.status, 200);
assert.equal(success.headers.get('Access-Control-Allow-Origin'), origin);
assert.match((await success.json()).sources[0].links[0][1], /sherwin-williams/);

assert.equal((await worker.fetch(request('bóng đá tối nay'), env)).status, 422);
assert.equal((await worker.fetch(request('Tường phấn hóa, 0913 712 195'), env)).status, 422);
assert.equal((await worker.fetch(request('x'.repeat(5000)), env)).status, 400);
assert.equal((await worker.fetch(request('phấn hóa', { headers: { ...headers, Origin: 'https://example.org' } }), env)).status, 403);
assert.equal((await worker.fetch(request('phấn hóa'), { ...env, PAINT_RATE: { limit: async () => ({ success: false }) } })).status, 429);
assert.equal(generationCalls, 1, 'invalid or rate limited requests must not reach the model');

const noSources = { ...env, AI: { run: async () => ({ response: 'Tham khảo ở [9].' }) } };
assert.equal((await worker.fetch(request('phấn hóa'), noSources)).status, 422);
const unavailable = { ...env, AI: { run: async () => { throw new Error('quota'); } } };
assert.equal((await worker.fetch(request('phấn hóa'), unavailable)).status, 503);
console.log('Paint RAG passed: bounded request, grounded sources, rate limits and quota fallback.');
