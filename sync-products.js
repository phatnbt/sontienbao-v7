(function(){
  var synced=Array.isArray(window.STB_SYNCED_PRODUCTS)?window.STB_SYNCED_PRODUCTS:[];
  if(!synced.length||!window.STB_DEFAULT_DATA||!Array.isArray(window.STB_DEFAULT_DATA.products))return;
  var byId={};synced.forEach(function(p){if(p&&p.id)byId[p.id]=p;});
  window.STB_DEFAULT_DATA.products=window.STB_DEFAULT_DATA.products.map(function(p){
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
})();
