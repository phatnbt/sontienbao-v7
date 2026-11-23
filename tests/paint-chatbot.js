const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const knowledge = require('../paint-chatbot-knowledge.json');

class Component {
  constructor(props) { this.props = props; }
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
    URL,
    async fetch(url, options) {
      requests.push({ url, options });
      if (requests.length === 1) return { ok: false };
      return { ok: true, json: async () => knowledge };
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'shopping-tools.js'), 'utf8'), context);
  const { PaintChatbot, findPaintAnswers, paintConversation } = context.window.STB_SHOPPING;
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
  assert(ids('Phong thuy tuoi 1990 thieu sang').includes('color-light'));
  assert.equal(ids('Mau son tuoi 1990')[0], 'color-feng');
  assert.equal(ids('Menh Moc son mau gi')[0], 'color-moc');
  assert.deepEqual(ids('Phối màu tường với sàn gỗ'), ['color-coordination']);
  assert.equal(ids('Tuong co bot trang ket tinh')[0], 'salt');
  assert.equal(ids('Son xogn gap mua')[0], 'rain', 'a single unambiguous typo should still retrieve a known topic');
  assert.equal(ids('Nhà vệ sinh tầng trên bị thấm')[0], 'bathroom');
  assert.equal(ids('Cửa sắt bị gỉ sét')[0], 'metal');
  assert.equal(ids('Dặm sơn bị lệch màu')[0], 'touchup');
  const follow = (question, previous) => paintConversation(question, knowledge, previous);
  const area = follow('Tường 80 m² cần bao nhiêu lít?');
  assert.match(area.response, /mấy lớp/);
  const coats = follow('2 lớp', area);
  assert.match(coats.response, /80 m² và 2 lớp/);
  const calculated = follow('Độ phủ 10 m²/lít/lớp', coats);
  assert.match(calculated.response, /16 lít/);
  assert.match(follow('hao hụt 10%', calculated).response, /17,6 lít/);
  assert.match(follow('Khoảng 90 - 100 m²', calculated).response, /khoảng diện tích/);
  assert.match(follow('Độ phủ 8 đến 10 m²/lít/lớp', calculated).response, /Bạn cho mình định mức/);
  assert.match(follow('Cần bao nhiêu lít?', follow('Tường nội thất rộng 80 m²')).response, /80 m²/);
  assert.match(follow('Diện tích sàn 90 m²', calculated).response, /Diện tích sàn chưa đủ/);
  assert.match(follow('Sân pickleball 100 m², 2 lớp, 10 m²/lít/lớp cần bao nhiêu lít?').response, /từng lớp/);
  const anotherProject = follow('Công trình khác cần bao nhiêu lít?', calculated);
  assert.match(anotherProject.response, /tổng diện tích/);
  const mold = follow('Tường bị ẩm mốc');
  assert(follow('Ngoài trời', mold).ids.includes('mold'));
  assert(!follow('Sơn sân tennis', mold).ids.includes('mold'));
  const products = [
    { id: 'p100', name: 'Sơn Nippon WP 100', brand: 'NIPPON', url: 'https://sontienbao.com/wp-100-5l.html' },
    { id: 'p200', name: 'Sơn Nippon WP 200', brand: 'NIPPON', url: 'https://sontienbao.com/wp-200-5l.html' },
    { id: 'p200-other', name: 'Nippon WP 200', brand: 'NIPPON', url: 'https://sontienbao.com/wp-200-5l.html' }
  ];
  const matches = context.window.STB_SHOPPING.searchCatalog(products, 'WP200 Nippon 5 L');
  assert.equal(matches.length, 1, 'search must preserve exact numeric and pack tokens and deduplicate the link');
  assert.equal(matches[0].href, products[1].url);
  assert.equal(context.window.STB_SHOPPING.catalogLink('https://sontienbao.com.example.com/wp-200.html'), '');
  assert.equal(context.window.STB_SHOPPING.searchCatalog(products, 'WP200 15L').length, 0);
  const chatbot = new PaintChatbot({ products });
  assert.equal(requests.length, 0, 'knowledge is loaded on demand');
  await chatbot.ask('Tường mới xây');
  assert(chatbot.state.error, 'load failure must allow retry');
  await chatbot.ask(chatbot.state.question);
  assert.equal(chatbot.state.turns[0].answers[0].id, 'new-wall');
  await chatbot.ask('Sơn trần');
  assert.equal(chatbot.state.turns[0].answers[0].id, 'ceiling');
  await chatbot.ask('WP200 5 L giá bao nhiêu?');
  assert.equal(chatbot.state.turns[0].products[0].href, products[1].url);
  assert.equal(requests.length, 2, 'successful knowledge load must be reused');
  assert(requests.every(request => request.url === 'paint-chatbot-knowledge.json?v=3' && !request.options.body),
    'chat text must not be sent to a server');
  console.log('Paint chatbot checks passed: sources, retrieval, fallback, retry and local queries.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
