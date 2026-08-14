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
      out.technicalSource=s.technicalSource||'website';
    }
    if(gotVariants){
      out.variants=s.variants.map(Number).filter(function(x){return x>0;});
      if(!out.technicalSource)out.technicalSource=s.technicalSource||(gotCoverage?'website':(configuredCoverage?'hybrid':'website-variants'));
    }

    if(s.massOnly===true){
      out.calcEligible=false;
      out.massOnly=true;
    }else if(gotCoverage&&gotVariants){
      out.calcEligible=s.calcEligible!==false;
    }else if(configuredCoverage&&(gotVariants||configuredVariants)){
      out.calcEligible=true;
    }else if(s.calcEligible===true){
      out.calcEligible=true;
    }

    if(s.unit)out.unit=s.unit;
    if(s.measureUnit)out.measureUnit=s.measureUnit;
    if(s.coverageBasis)out.coverageBasis=s.coverageBasis;
    if(s.priceBySize&&typeof s.priceBySize==='object')out.priceBySize=Object.assign({},p.priceBySize||{},s.priceBySize);
    if(Number(s.priceReferenceSize||0)>0)out.priceReferenceSize=Number(s.priceReferenceSize);
    if(s.calculatorRole)out.calculatorRole=s.calculatorRole;
    if(s.calculatorSurface)out.calculatorSurface=s.calculatorSurface;
    if(s.pairKey)out.pairKey=s.pairKey;
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
      measureUnit:p.measureUnit||'',
      coverageBasis:p.coverageBasis||'',
      variants:Array.isArray(p.variants)?p.variants.map(Number).filter(function(x){return x>0;}):[],
      priceBySize:p.priceBySize&&typeof p.priceBySize==='object'?Object.assign({},p.priceBySize):{},
      priceReferenceSize:Number(p.priceReferenceSize||0),
      calcEligible:p.calcEligible===true,
      massOnly:p.massOnly===true,
      technicalSource:p.technicalSource||'',
      calculatorSurface:p.calculatorSurface||'',
      calculatorRole:p.calculatorRole||'',
      pairKey:p.pairKey||'',
      enabled:p.enabled!==false
    });
  });

  calculator.forEach(function(p){
    if(!p)return;
    var idx=base.findIndex(function(x){
      if(!x)return false;
      if(p.id&&x.id===p.id)return true;
      return p.url&&x.url&&String(x.url).replace(/\/$/,'')===String(p.url).replace(/\/$/,'');
    });
    var item={
      id:p.id||('calc-'+Math.random().toString(36).slice(2,9)),
      brand:p.brand||'SƠN TIẾN BẢO',
      name:p.name||'Sản phẩm sơn',
      category:p.category||'Sản phẩm tính sơn',
      description:p.description||'',
      image:p.image||'',
      price:Number(p.price||0),
      oldPrice:Number(p.oldPrice||0),
      pricePrefix:p.pricePrefix||'',
      unit:p.unit||'',
      badge:p.badge||(p.calculatorRole==='primer'?'Sơn lót':'Sản phẩm'),
      featured:false,
      calculatorOnly:true,
      calculatorRole:p.calculatorRole||'other',
      calculatorSurface:p.calculatorSurface||'both',
      pairKey:p.pairKey||'',
      url:p.url||'',
      coverage:Number(p.coverage||0),
      coverageLabel:p.coverageLabel||'',
      measureUnit:p.measureUnit||'',
      coverageBasis:p.coverageBasis||'',
      variants:Array.isArray(p.variants)?p.variants.map(Number).filter(function(x){return x>0;}):[],
      priceBySize:p.priceBySize&&typeof p.priceBySize==='object'?Object.assign({},p.priceBySize):{},
      priceReferenceSize:Number(p.priceReferenceSize||0),
      calcEligible:p.calcEligible===true,
      massOnly:p.massOnly===true,
      technicalSource:p.technicalSource||'website',
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
