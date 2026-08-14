(function(){
  'use strict';
  var LEGACY_HOSTS = ['new.sontienbao.com'];
  var SITE = 'https://phatnbt.github.io/sontienbao-v7/';
  var ADMIN = SITE + 'admin.html';
  var host = String(location.hostname || '').toLowerCase();
  if (LEGACY_HOSTS.indexOf(host) < 0) return;
  var isAdmin = /(?:^|\/)admin(?:-v[23])?\.html$/i.test(location.pathname) || location.hash.indexOf('#admin') === 0;
  var target = isAdmin ? ADMIN : SITE;
  var hash = location.hash && location.hash !== '#admin' ? location.hash : '';
  var search = location.search || '';
  location.replace(target + search + hash);
})();
