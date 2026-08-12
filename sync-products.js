(function(){
  var synced=Array.isArray(window.STB_SYNCED_PRODUCTS)?window.STB_SYNCED_PRODUCTS:[];
  var homepage=Array.isArray(window.STB_HOMEPAGE_PRODUCTS)?window.STB_HOMEPAGE_PRODUCTS:[];
  if(!window.STB_DEFAULT_DATA||!Array.isArray(window.STB_DEFAULT_DATA.products))return;

  var base=window.STB_DEFAULT_DATA.products;
  var byId={};
  synced.forEach(function(p){if(p&&p.id)byId[p.id]=p;});

  base=base.map(function(p){
    var s=byId[p.id];
    if(!s)return p;
    return Object.assign({},p,{
      name:s.name||p.name,
      image:s.image||p.image,
      url:s.url||p.url,
      price:Number(s.price||0),
      oldPrice:Number(s.oldPrice||0),
      pricePrefix:s.pricePrefix||p.pricePrefix||'',
      unit:s.unit||p.unit||''
    });
  });

  // Add products currently promoted on the iTop storefront without overwriting
  // Calculator technical data. Newly discovered items intentionally have no
  // coverage/variants, so the Calculator uses its clearly-labelled estimate.
  var seenUrl={};
  base.forEach(function(p){if(p&&p.url)seenUrl[String(p.url).replace(/\/$/,'')]=true;});
  homepage.forEach(function(p){
    if(!p||!p.url)return;
    var key=String(p.url).replace(/\/$/,'');
    if(seenUrl[key]){
      // Mark matching existing product as featured and refresh storefront fields.
      base=base.map(function(x){
        if(!x||!x.url||String(x.url).replace(/\/$/,'')!==key)return x;
        return Object.assign({},x,{
          featured:true,
          name:p.name||x.name,
          brand:p.brand||x.brand,
          category:p.category||x.category,
          image:p.image||x.image,
          price:Number(p.price||x.price||0),
          oldPrice:Number(p.oldPrice||0),
          url:p.url
        });
      });
      return;
    }
    seenUrl[key]=true;
    base.push({
      id:p.id||('itop-'+Math.random().toString(36).slice(2,9)),
      brand:p.brand||'SƠN TIẾN BẢO',
      name:p.name||'Sản phẩm Sơn Tiến Bảo',
      category:p.category||'Sản phẩm nổi bật',
      description:'',
      image:p.image||'',
      price:Number(p.price||0),
      oldPrice:Number(p.oldPrice||0),
      pricePrefix:p.pricePrefix||'',
      unit:p.unit||'',
      badge:'',
      featured:true,
      storefrontOnly:true,
      url:p.url,
      coverage:0,
      coverageLabel:'',
      variants:[],
      enabled:p.enabled!==false
    });
  });

  // Homepage order controls featured priority. Existing featured products remain
  // available as fallback when iTop does not expose enough cards.
  if(homepage.length){
    var order={};
    homepage.forEach(function(p,i){if(p&&p.url)order[String(p.url).replace(/\/$/,'')]=i;});
    base.sort(function(a,b){
      var au=a&&a.url?String(a.url).replace(/\/$/,''):'';
      var bu=b&&b.url?String(b.url).replace(/\/$/,''):'';
      var ai=Object.prototype.hasOwnProperty.call(order,au)?order[au]:9999;
      var bi=Object.prototype.hasOwnProperty.call(order,bu)?order[bu]:9999;
      return ai-bi;
    });
  }

  window.STB_DEFAULT_DATA.products=base;
})();
