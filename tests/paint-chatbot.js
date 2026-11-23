const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const knowledge = require('../paint-chatbot-knowledge.json');

class Component {
  setState(update) {
    Object.assign(this.state, typeof update === 'function' ? update(this.state) : update);
  }
}

async function main() {
  const requests = [];
  const context = {
    window: {},
    React: { Component, createElement() {} },
    AbortController,
    async fetch(url, options) {
      requests.push({ url, options });
      if (requests.length === 1) return { ok: false };
      return { ok: true, json: async () => knowledge };
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'shopping-tools.js'), 'utf8'), context);
  const { PaintChatbot, findPaintAnswers } = context.window.STB_SHOPPING;
  const ids = prompt => Array.from(findPaintAnswers(prompt, knowledge), match => match.id);
  const seen = new Set();
  for (const topic of knowledge.topics) {
    assert(!seen.has(topic.id), 'topic IDs must be unique');
    seen.add(topic.id);
    assert(topic.sources.length && topic.answer && topic.phrases.length);
    for (const key of topic.sources) assert.equal(new URL(knowledge.sources[key][1]).protocol, 'https:');
    assert(ids(topic.phrases[0]).includes(topic.id), 'every topic must be reachable: ' + topic.id);
  }
  assert.deepEqual(ids('Tuong cu bi bong troc va tham nuoc'), ['seepage', 'peeling']);
  assert.deepEqual(ids('Có cần sơn lót không?'), ['primer']);
  assert.deepEqual(ids('Tường không bị thấm, cần sơn ngoài trời'), ['exterior']);
  assert.deepEqual(ids('Tường mới xây cần mua bao nhiêu lít?'), ['new-wall', 'quantity']);
  assert.deepEqual(ids('Cho tôi biết dự báo thời tiết'), []);
  const chatbot = new PaintChatbot();
  assert.equal(requests.length, 0, 'knowledge is loaded on demand');
  await chatbot.ask('Tường mới xây');
  assert(chatbot.state.error, 'load failure must allow retry');
  await chatbot.ask(chatbot.state.question);
  assert.equal(chatbot.state.turns[0].answers[0].id, 'new-wall');
  await chatbot.ask('Sơn trần');
  assert.equal(chatbot.state.turns[0].answers[0].id, 'ceiling');
  assert.equal(requests.length, 2, 'successful knowledge load must be reused');
  assert(requests.every(request => request.url === 'paint-chatbot-knowledge.json?v=1' && !request.options.body),
    'chat text must not be sent to a server');
  console.log('Paint chatbot checks passed: sources, retrieval, fallback, retry and local queries.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
