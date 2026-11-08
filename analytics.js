(function () {
  'use strict';
  var config = window.STB_ANALYTICS_CONFIG || {};
  var id = String(config.measurementId || '').trim().toUpperCase();
  var enabled = /^G-[A-Z0-9]{6,20}$/.test(id) && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';

  function track(name, details) {
    if (!/^[a-z][a-z0-9_]{1,39}$/.test(name)) return;
    // Event details are deliberately limited to preset UI labels. Never send names,
    // phone numbers, email addresses, quote text, product queries, or full URLs.
    var allowed = ['channel', 'placement', 'context'];
    var params = {};
    allowed.forEach(function (key) {
      var value = details && details[key];
      if (typeof value === 'string' && /^[a-z0-9_-]{1,40}$/.test(value)) params[key] = value;
    });
    if (enabled && typeof window.gtag === 'function') window.gtag('event', name, params);
  }

  function placement(node) {
    if (!node || !node.closest) return 'page';
    if (node.closest('.contact-dock')) return 'contact_dock';
    if (node.closest('.mobile-action-bar')) return 'mobile_bar';
    if (node.closest('.quote-modal')) return 'quote_modal';
    var section = node.closest('section[id],footer,header');
    return section && section.id && /^[a-z0-9_-]{1,40}$/.test(section.id) ? section.id : section && section.tagName ? section.tagName.toLowerCase() : 'page';
  }

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest && event.target.closest('a[href]');
    if (!target) return;
    var href = target.getAttribute('href') || '';
    var channel = '';
    if (/^tel:/i.test(href)) channel = 'phone';
    else if (/^https:\/\/zalo\.me\//i.test(href)) channel = 'zalo';
    else if (/^mailto:/i.test(href)) channel = 'email';
    else if (/^https:\/\/sontienbao\.com\/lien-he\.html/i.test(href)) channel = 'official_form';
    else if (/^https:\/\/mail\.google\.com\/mail\/\?/i.test(href)) channel = 'gmail';
    else if (/^https:\/\/outlook\.live\.com\/mail\//i.test(href)) channel = 'outlook';
    if (channel) track('contact_click', { channel: channel, placement: placement(target) });
  }, true);

  window.STB_ANALYTICS = { track: track };
  if (!enabled) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(script);
})();
