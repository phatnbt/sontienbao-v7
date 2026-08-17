(function () {
  'use strict';

  var COPY = {
    kicker: 'SẢN PHẨM SƠN CHÍNH HÃNG',
    title: 'Sơn Jotun, Terraco, Nippon & Ruby nổi bật',
    description: 'Khám phá các dòng sơn chính hãng cho nội thất, ngoại thất, chống thấm và công trình. Xem công dụng, quy cách và giá tham khảo để chọn sản phẩm phù hợp.'
  };

  function normalize(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function applyFeaturedSeoCopy() {
    var headings = document.querySelectorAll('h2');
    for (var i = 0; i < headings.length; i++) {
      var heading = headings[i];
      var text = normalize(heading.textContent);
      if (text !== 'Những dòng sơn đang được quan tâm' && text !== COPY.title) continue;

      heading.textContent = COPY.title;

      var sectionHead = heading.closest('.section-head');
      if (!sectionHead) continue;

      var kicker = sectionHead.querySelector('.section-kicker');
      if (kicker) kicker.textContent = COPY.kicker;

      var paragraph = sectionHead.querySelector('p');
      if (paragraph) paragraph.textContent = COPY.description;
    }
  }

  function start() {
    applyFeaturedSeoCopy();
    var root = document.getElementById('root') || document.body;
    if (!root || !window.MutationObserver) return;
    new MutationObserver(applyFeaturedSeoCopy).observe(root, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
