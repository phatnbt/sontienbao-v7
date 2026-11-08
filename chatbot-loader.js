(function () {
  'use strict';

  var apiBase = 'https://son-tien-bao-chatbot-production.up.railway.app';
  var healthTimeout;

  async function start() {
    if (document.getElementById('stb-ai-chatbot')) return;
    var controller = new AbortController();
    healthTimeout = setTimeout(function () { controller.abort(); }, 5000);
    try {
      var response = await fetch(apiBase + '/health', { signal: controller.signal, cache: 'no-store' });
      if (!response.ok || !(await response.json()).ok) return;
    } catch (error) {
      return; // Keep the existing phone, Zalo and quote controls when chat is unavailable.
    } finally {
      clearTimeout(healthTimeout);
    }

    var script = document.createElement('script');
    script.src = apiBase + '/widget.js';
    script.dataset.apiBase = apiBase;
    script.dataset.position = 'right';
    script.onload = function () {
      var host = document.getElementById('stb-ai-chatbot');
      if (!host || !host.shadowRoot) return;
      var placement = document.createElement('style');
      placement.textContent = '@media(max-width:620px){.stb-wrap{bottom:86px!important}.stb-panel{bottom:76px!important;height:min(640px,calc(100dvh - 176px))!important}}';
      host.shadowRoot.appendChild(placement);
      document.documentElement.classList.add('stb-chat-ready');
    };
    script.onerror = function () { document.documentElement.classList.remove('stb-chat-ready'); };
    document.body.appendChild(script);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
