(function(){
  var synced=Array.isArray(window.STB_SYNCED_PRODUCTS)?window.STB_SYNCED_PRODUCTS:[];
  var homepage=Array.isArray(window.STB_HOMEPAGE_PRODUCTS)?window.STB_HOMEPAGE_PRODUCTS:[];
  var calculator=Array.isArray(window.STB_CALCULATOR_PRODUCTS)?window.STB_CALCULATOR_PRODUCTS:[];
  if(!window.STB_DEFAULT_DATA||!Array.isArray(window.STB_DEFAULT_DATA.products))return;

  var base=window.STB_DEFAULT_DATA.products;
  var byId={};
  synced.forEach(function(p){if(p&&p.id)byId[p.id]=p;});

  function mergeTechnical(p,s){
    var out={};
    var gotCoverage=Number(s.coverage||0)>0;
    var gotVariants=Array.isArray(s.variants)&&s.variants.length>0;
    var configuredCoverage=Number(p.coverage||0)>0;
    var configuredVariants=Array.isArray(p.variants)&&p.variants.length>0;

    if(gotCoverage){
      out.coverage=Number(s.coverage);
      out.coverageLabel=s.coverageLabel||p.coverageLabel||'';
      out.technicalSource='iTop';
    }
    if(gotVariants){
      out.variants=s.variants.map(Number).filter(function(x){return x>0;});
      if(gotCoverage)out.technicalSource='iTop';
      else if(configuredCoverage)out.technicalSource='hybrid';
      else out.technicalSource='iTop-variants';
    }

    if(s.massOnly===true){
      out.calcEligible=false;
      out.massOnly=true;
    }else if(gotCoverage&&gotVariants){
      out.calcEligible=true;
    }else if(configuredCoverage&&(gotVariants||configuredVariants)){
      out.calcEligible=true;
    }else if(s.calcEligible===true){
      out.calcEligible=true;
    }

    if(s.unit)out.unit=s.unit;
    if(s.priceBySize&&typeof s.priceBySize==='object')out.priceBySize=Object.assign({},p.priceBySize||{},s.priceBySize);
    if(Number(s.priceReferenceSize||0)>0)out.priceReferenceSize=Number(s.priceReferenceSize);
    if(s.calculatorRole)out.calculatorRole=s.calculatorRole;
    if(s.calculatorOnly===true)out.calculatorOnly=true;
    return out;
  }

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
    },mergeTechnical(p,s));
  });

  var seenUrl={};
  base.forEach(function(p){if(p&&p.url)seenUrl[String(p.url).replace(/\/$/,'')]=true;});
  homepage.forEach(function(p){
    if(!p||!p.url)return;
    var key=String(p.url).replace(/\/$/,'');
    if(seenUrl[key]){
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
          pricePrefix:p.pricePrefix||x.pricePrefix||'',
          url:p.url
        },mergeTechnical(x,p));
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
      coverage:Number(p.coverage||0),
      coverageLabel:p.coverageLabel||'',
      variants:Array.isArray(p.variants)?p.variants.map(Number).filter(function(x){return x>0;}):[],
      priceBySize:p.priceBySize&&typeof p.priceBySize==='object'?Object.assign({},p.priceBySize):{},
      priceReferenceSize:Number(p.priceReferenceSize||0),
      calcEligible:p.calcEligible===true,
      massOnly:p.massOnly===true,
      technicalSource:p.technicalSource||'',
      enabled:p.enabled!==false
    });
  });

  // Products used only by the calculator are merged after storefront discovery so
  // they never occupy a homepage featured slot. They still retain live iTop URLs,
  // technical data and exact per-size prices where the source exposes them.
  calculator.forEach(function(p){
    if(!p)return;
    var idx=base.findIndex(function(x){
      if(!x)return false;
      if(p.id&&x.id===p.id)return true;
      return p.url&&x.url&&String(x.url).replace(/\/$/,'')===String(p.url).replace(/\/$/,'');
    });
    var item={
      id:p.id||('calc-'+Math.random().toString(36).slice(2,9)),
      brand:p.brand||'JOTUN',
      name:p.name||'Sơn lót',
      category:p.category||'Sơn lót',
      description:p.description||'',
      image:p.image||'',
      price:Number(p.price||0),
      oldPrice:Number(p.oldPrice||0),
      pricePrefix:p.pricePrefix||'',
      unit:p.unit||'',
      badge:p.badge||'Sơn lót',
      featured:false,
      calculatorOnly:true,
      calculatorRole:p.calculatorRole||'primer',
      url:p.url||'',
      coverage:Number(p.coverage||0),
      coverageLabel:p.coverageLabel||'',
      variants:Array.isArray(p.variants)?p.variants.map(Number).filter(function(x){return x>0;}):[],
      priceBySize:p.priceBySize&&typeof p.priceBySize==='object'?Object.assign({},p.priceBySize):{},
      priceReferenceSize:Number(p.priceReferenceSize||0),
      calcEligible:p.calcEligible===true,
      massOnly:p.massOnly===true,
      technicalSource:p.technicalSource||'iTop',
      enabled:p.enabled!==false
    };
    if(idx>=0)base[idx]=Object.assign({},base[idx],item,{featured:base[idx].featured===true});
    else base.push(item);
  });

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
