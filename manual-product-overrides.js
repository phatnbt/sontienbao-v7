(function(){
  var cfg=window.STB_MANUAL_PRODUCTS||{};
  if(!window.STB_DEFAULT_DATA||!Array.isArray(window.STB_DEFAULT_DATA.products))return;
  var products=window.STB_DEFAULT_DATA.products.slice();
  var overrides=cfg.overrides&&typeof cfg.overrides==='object'?cfg.overrides:{};
  var hidden=Array.isArray(cfg.hidden)?cfg.hidden:[];
  var hiddenSet={};hidden.forEach(function(k){hiddenSet[String(k)]=true;});
  function normUrl(u){return String(u||'').trim().replace(/\/$/,'');}
  function keys(p){var out=[];if(p&&p.id)out.push('id:'+p.id);if(p&&p.url)out.push('url:'+normUrl(p.url));return out;}
  function findOverride(p){var ks=keys(p);for(var i=0;i<ks.length;i++){if(overrides[ks[i]])return overrides[ks[i]];}return null;}
  function isHidden(p){var ks=keys(p);for(var i=0;i<ks.length;i++){if(hiddenSet[ks[i]])return true;}return false;}
  products=products.filter(function(p){return !isHidden(p);}).map(function(p){var o=findOverride(p);return o?Object.assign({},p,o,{manualOverride:true}):p;});
  var existing={};products.forEach(function(p){keys(p).forEach(function(k){existing[k]=true;});});
  (Array.isArray(cfg.additions)?cfg.additions:[]).forEach(function(p){if(!p)return;var ks=keys(p),dup=false;for(var i=0;i<ks.length;i++){if(existing[ks[i]]){dup=true;break;}}if(!dup){products.push(Object.assign({enabled:true,featured:true,manualOnly:true},p));ks.forEach(function(k){existing[k]=true;});}});
  window.STB_DEFAULT_DATA.products=products;
})();
