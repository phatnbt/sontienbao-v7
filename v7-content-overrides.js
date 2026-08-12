(function(){
  var d=window.STB_DEFAULT_DATA,cfg=window.STB_V7_CONTENT;
  if(!d||!cfg)return;

  function isPlain(v){return v&&typeof v==='object'&&!Array.isArray(v);}
  function merge(base,extra){
    if(Array.isArray(extra))return extra.map(function(x){return isPlain(x)?Object.assign({},x):x;});
    if(!isPlain(extra))return extra===undefined?base:extra;
    var out=isPlain(base)?Object.assign({},base):{};
    Object.keys(extra).forEach(function(k){out[k]=merge(out[k],extra[k]);});
    return out;
  }

  ['site','seo','theme','hero','meta'].forEach(function(k){if(cfg[k])d[k]=merge(d[k],cfg[k]);});
  ['categories','banners','popups','faqs'].forEach(function(k){if(Array.isArray(cfg[k]))d[k]=merge(d[k],cfg[k]);});

  // GitHub Pages public mode must render the repository content source, not an
  // old browser-specific local CMS snapshot from earlier V7 preview builds.
  try{
    ['stb-v7-data','stb-v68-data','stb-v67-data','stb-v66-data','stb-v65-data','stb-v64-data','stb-v62-data'].forEach(function(k){localStorage.removeItem(k);});
  }catch(e){}

  try{
    if(d.seo&&d.seo.description){
      var meta=document.querySelector('meta[name="description"]');
      if(meta)meta.setAttribute('content',d.seo.description);
    }
  }catch(e){}
})();
