(function(){
  'use strict';
  var h = React.createElement;
  var DATA_KEY='stb-v7-data';
  var LEGACY_KEYS=['stb-v68-data','stb-v67-data','stb-v66-data','stb-v65-data','stb-v64-data','stb-v62-data'];
  var LEADS_KEY='stb-v7-leads';
  var SESSION_KEY='stb-v7-admin';
  var ANNOUNCE_KEY='stb-v7-announcement';
  var DEFAULT=window.STB_DEFAULT_DATA;
  var MEMORY_STORAGE={local:{},session:{}};
  function storageGet(kind,key){try{return window[kind+'Storage'].getItem(key);}catch(e){return Object.prototype.hasOwnProperty.call(MEMORY_STORAGE[kind],key)?MEMORY_STORAGE[kind][key]:null;}}
  function storageSet(kind,key,val){try{window[kind+'Storage'].setItem(key,String(val));}catch(e){MEMORY_STORAGE[kind][key]=String(val);}}
  function storageRemove(kind,key){try{window[kind+'Storage'].removeItem(key);}catch(e){delete MEMORY_STORAGE[kind][key];}}

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function isPlain(v){return v&&typeof v==='object'&&!Array.isArray(v);}
  function mergeSafe(base,extra){
    if(Array.isArray(base)) return Array.isArray(extra)?extra.filter(function(x){return x&&typeof x==='object'}):clone(base);
    if(!isPlain(base)) return (extra===undefined||extra===null)?base:extra;
    var out=clone(base);
    if(!isPlain(extra)) return out;
    Object.keys(extra).forEach(function(k){
      if(k in base) out[k]=mergeSafe(base[k],extra[k]);
      else if(extra[k]!==undefined) out[k]=extra[k];
    });
    return out;
  }
  function normalizeData(raw){
    var d=mergeSafe(DEFAULT,raw||{});
    ['site','seo','theme','hero','calculator','announcement','admin','meta'].forEach(function(k){if(!isPlain(d[k]))d[k]=clone(DEFAULT[k]||{});});
    ['products','categories','brands','faqs','colors','banners','popups','media','activityLogs'].forEach(function(k){d[k]=Array.isArray(d[k])?d[k].filter(Boolean):clone(DEFAULT[k]||[]);});
    d.colors=d.colors.map(function(x,i){return mergeSafe({id:'color-'+i,code:'',name:'',hex:'#cccccc',group:'Khác',enabled:true},x||{});});
    d.popups=d.popups.map(function(x,i){return mergeSafe({id:'popup-'+i,name:'Popup',template:'announcement',enabled:true,status:'draft',eyebrow:'THÔNG BÁO',title:'Thông báo mới',body:'',highlight:'',image:'',ctaLabel:'Xem chi tiết',ctaUrl:'#',secondaryLabel:'Để sau',frequency:'session',delay:1200,startAt:'',endAt:'',position:'center',width:760,animation:'rise'},x||{});});
    return d;
  }
  function loadData(){
    try{
      var raw=storageGet('local',DATA_KEY);
      if(!raw){for(var i=0;i<LEGACY_KEYS.length;i++){raw=storageGet('local',LEGACY_KEYS[i]);if(raw)break;}}
      var parsed=raw?JSON.parse(raw):{};
      var normalized=normalizeData(parsed);
      storageSet('local',DATA_KEY,JSON.stringify(normalized));
      return normalized;
    }catch(e){console.warn('STB data recovery:',e);return normalizeData({});}
  }
  function saveData(d){var safe=normalizeData(d);storageSet('local',DATA_KEY,JSON.stringify(safe));}
  function loadLeads(){try{return JSON.parse(storageGet('local',LEADS_KEY)||'[]')}catch(e){return []}}
  function saveLeads(x){storageSet('local',LEADS_KEY,JSON.stringify(x));}
  function money(n){n=Number(n||0);return n?n.toLocaleString('vi-VN')+'đ':'Liên hệ';}
  function asset(src){if(!src)return ''; if(/^(https?:|data:|blob:)/.test(src))return src; return String(src).replace(/^\//,'');}
  function scrollToId(id){var el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth'});}
  function uid(prefix){return (prefix||'item')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);}
  function setTheme(data){var t=(data&&isPlain(data.theme))?data.theme:{};var preset=getTemplatePreset(t.template||'premium-navy');var palette=Object.assign({},preset&&preset.colors||{},t);Object.keys(palette).forEach(function(k){if(typeof palette[k]==='string'&&palette[k])document.documentElement.style.setProperty('--'+k,palette[k]);});document.documentElement.setAttribute('data-template',t.template||'premium-navy');document.title=(data&&data.seo&&data.seo.title)||'Sơn Tiến Bảo';}
  function download(name,text,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},300);}
  function fileToData(file,cb){var r=new FileReader();r.onload=function(){cb(r.result)};r.readAsDataURL(file);}
  function cx(){return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');}
  function itopApi(){return window.STB_ITOP||null;}
  function isLocalPreview(){return location.hostname==='127.0.0.1'||location.hostname==='localhost'||location.protocol==='file:';}
  function shouldUseITopAdmin(){var a=itopApi();return !!(a&&a.isITopOrigin&&a.isITopOrigin());}
  function goRealAdmin(){location.href='https://sontienbao.com/admin';}
  function A(props){return h('a',props,props.children);}
  function Btn(props){var p=Object.assign({},props);delete p.children;delete p.kind;return h('button',Object.assign({type:'button'},p,{className:cx('btn','magnetic',props.kind&&'btn-'+props.kind,props.className)}),props.children);}
  function Icon(props){return h('span',{className:cx('ico',props.className),'aria-hidden':'true'},props.children||'→');}
  function SectionHead(props){return h('div',{className:'section-head'},h('div',null,h('span',{className:'section-kicker'},props.eyebrow),h('h2',null,props.title),props.desc&&h('p',null,props.desc)),props.action||null);}
  function Reveal(props){return h('div',{className:cx('reveal',props.className)},props.children);}
  var FALLBACK_IMAGE='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="%230b1721"/><path d="M300 520l150-170 110 110 100-120 240 220H300z" fill="%23263b4a"/><circle cx="760" cy="260" r="62" fill="%23d72620" opacity=".7"/><text x="600" y="680" text-anchor="middle" fill="%23a9bac5" font-size="34" font-family="Arial">Sơn Tiến Bảo</text></svg>');
  class SmartImage extends React.Component{
    constructor(p){super(p);this.state={failed:false};}
    render(){var p=this.props,src=(this.state.failed||!p.src)?FALLBACK_IMAGE:asset(p.src);return h('img',{className:cx('smart-image',p.className),src:src,srcSet:src===FALLBACK_IMAGE?undefined:(p.srcSet||undefined),sizes:p.sizes||undefined,alt:p.alt||'',width:p.width||undefined,height:p.height||undefined,loading:p.loading||'lazy',decoding:p.decoding||'async',fetchPriority:p.fetchPriority||undefined,onError:()=>this.setState({failed:true})});}
  }
  function nowIso(){return new Date().toISOString();}
  function popupIsActive(p){if(!p||p.enabled===false||p.status==='draft'||p.status==='expired')return false;var now=Date.now(),start=p.startAt?Date.parse(p.startAt):0,end=p.endAt?Date.parse(p.endAt):0;if(start&&now<start)return false;if(end&&now>end)return false;return true;}
  function activePopup(data){var arr=(data&&Array.isArray(data.popups))?data.popups:[];for(var i=0;i<arr.length;i++)if(popupIsActive(arr[i]))return arr[i];return data&&data.announcement||null;}

  var SWATCHES=[['S 0502-Y','#e9e2d5'],['S 2005-Y20R','#c9b6a0'],['S 3010-B10G','#8da1a4'],['S 4010-G30Y','#879487'],['S 3020-Y70R','#b7866c'],['S 5005-R80B','#6f7680'],['S 7020-R90B','#314659'],['S 4040-Y90R','#a95546']];

  var TEMPLATE_PRESETS=[
    {id:'premium-navy',name:'Premium Navy',tag:'Mạnh về bán hàng',description:'Hero đậm, sang, phù hợp sơn cao cấp và landing conversion.',cover:'linear-gradient(135deg,#06111a,#173a5b)',colors:{primary:'#d72620',primaryDark:'#a91513',navy:'#07131f',navy2:'#0c2135',ink:'#101820',paper:'#f7f5f2',surface:'#ffffff',muted:'#6f7780',accent:'#f5c24b'}},
    {id:'light-boutique',name:'Light Boutique',tag:'Nhẹ và tinh tế',description:'Sạch, sáng, thiên về bảng màu và không gian nội thất.',cover:'linear-gradient(135deg,#f6efe6,#d7e4ea)',colors:{primary:'#d65a2e',primaryDark:'#aa4320',navy:'#f7f2eb',navy2:'#efe6da',ink:'#1a242d',paper:'#fbf8f3',surface:'#ffffff',muted:'#6d747c',accent:'#b78b62'}},
    {id:'graphite-glass',name:'Graphite Glass',tag:'Hiện đại công trình',description:'Nền tối kính mờ, hợp công trình, ngoại thất và công nghiệp.',cover:'linear-gradient(135deg,#0d1117,#36404b)',colors:{primary:'#f14635',primaryDark:'#bc281b',navy:'#0b1218',navy2:'#141d26',ink:'#eef3f8',paper:'#0b1218',surface:'#111a23',muted:'#8fa1af',accent:'#58b7ff'}},
    {id:'sandstone-studio',name:'Sandstone Studio',tag:'Lifestyle / màu sắc',description:'Tông beige studio cho nhóm nội thất, phối màu và cảm hứng.',cover:'linear-gradient(135deg,#f5ede2,#cbb8a0)',colors:{primary:'#c55a35',primaryDark:'#944126',navy:'#f0e8dc',navy2:'#f9f6f0',ink:'#13202b',paper:'#f5efe7',surface:'#fffdfa',muted:'#7a756e',accent:'#6e8b89'}},
    {id:'neo-commerce',name:'Neo Commerce',tag:'Đậm CTA / khuyến mãi',description:'Nhấn mạnh ưu đãi, thẻ giá và popup khuyến mãi mạnh hơn.',cover:'linear-gradient(135deg,#07131f,#081d39 55%,#d72620)',colors:{primary:'#ff3b30',primaryDark:'#d12118',navy:'#08131f',navy2:'#10243b',ink:'#0d1720',paper:'#f4f7fb',surface:'#ffffff',muted:'#627080',accent:'#ffbf47'}}
  ];
  function getTemplatePreset(id){for(var i=0;i<TEMPLATE_PRESETS.length;i++)if(TEMPLATE_PRESETS[i].id===id)return TEMPLATE_PRESETS[i];return TEMPLATE_PRESETS[0];}

  var POPUP_TEMPLATES=[
    {id:'flash-sale',name:'Flash Sale',style:'spotlight',eyebrow:'FLASH SALE',title:'Ưu đãi giới hạn',highlight:'Giá tốt trong thời gian giới hạn',animation:'rise'},
    {id:'voucher',name:'Voucher',style:'compact',eyebrow:'VOUCHER',title:'Nhận ưu đãi cho đơn hàng',highlight:'Liên hệ để kiểm tra điều kiện áp dụng',animation:'scale'},
    {id:'new-product',name:'New Product',style:'modal',eyebrow:'SẢN PHẨM MỚI',title:'Khám phá dòng sơn mới',highlight:'Xem thông tin sản phẩm và quy cách',animation:'slide'},
    {id:'announcement',name:'Announcement',style:'compact',eyebrow:'THÔNG BÁO',title:'Cập nhật từ Sơn Tiến Bảo',highlight:'Thông tin mới dành cho khách hàng',animation:'fade'},
    {id:'season',name:'Season Promotion',style:'spotlight',eyebrow:'ƯU ĐÃI THEO MÙA',title:'Làm mới không gian đúng thời điểm',highlight:'Ưu đãi có thể thay đổi theo chương trình hiện hành',animation:'rise'},
    {id:'premium-minimal',name:'Premium Minimal',style:'modal',eyebrow:'TIẾN BẢO SELECT',title:'Giải pháp sơn được đề xuất',highlight:'Tư vấn theo diện tích và nhu cầu thực tế',animation:'scale'}
  ];
  function getPopupTemplate(id){for(var i=0;i<POPUP_TEMPLATES.length;i++)if(POPUP_TEMPLATES[i].id===id)return POPUP_TEMPLATES[i];return POPUP_TEMPLATES[0];}

  class ErrorBoundary extends React.Component{
    constructor(p){super(p);this.state={error:null};}
    componentDidCatch(error,info){console.error('STB render error',error,info);this.setState({error:error});}
    reset(){try{storageRemove('local',DATA_KEY);LEGACY_KEYS.forEach(function(k){storageRemove('local',k)});storageRemove('session',SESSION_KEY);storageRemove('session',ANNOUNCE_KEY);}catch(e){} location.reload();}
    render(){if(!this.state.error)return this.props.children;return h('div',{className:'fatal-screen'},h('div',{className:'fatal-card'},h('img',{src:'assets/logo-tien-bao.png',alt:'Tiến Bảo'}),h('span',{className:'section-kicker'},'SAFE RECOVERY'),h('h1',null,'Dữ liệu cũ không tương thích'),h('p',null,'Website đã chặn lỗi để không hiển thị màn hình trắng. Hãy khôi phục dữ liệu mẫu rồi nhập lại backup JSON nếu cần.'),h('code',null,String(this.state.error&&this.state.error.message||this.state.error)),h(Btn,{kind:'red',onClick:this.reset.bind(this)},'Khôi phục và tải lại')));}
  }

  class App extends React.Component{
    constructor(p){super(p);this.state={data:loadData(),quote:false,menu:false,admin:location.hash.indexOf('#admin')===0,version:0,boot:false,announcement:null};this.onHash=this.onHash.bind(this);this.onScroll=this.onScroll.bind(this);this.onPointerMove=this.onPointerMove.bind(this);this.onPointerOut=this.onPointerOut.bind(this);this.onKeyDown=this.onKeyDown.bind(this);}
    componentDidMount(){if(this.state.admin&&!shouldUseITopAdmin()&&!isLocalPreview()){goRealAdmin();return;}setTheme(this.state.data);window.addEventListener('hashchange',this.onHash);window.addEventListener('scroll',this.onScroll,{passive:true});document.addEventListener('pointermove',this.onPointerMove,{passive:true});document.addEventListener('pointerout',this.onPointerOut,{passive:true});document.addEventListener('keydown',this.onKeyDown);this.initReveal();this.onScroll();var self=this,api=itopApi();if(api&&api.syncPublicProducts&&!this.state.admin){api.syncPublicProducts(this.state.data.products||[]).then(function(products){if(!products||!products.length)return;var d=clone(self.state.data);d.products=products;self.setState({data:d,version:self.state.version+1});}).catch(function(){})}setTimeout(function(){self.scheduleAnnouncement();},900);}
    componentDidUpdate(){setTheme(this.state.data);this.initReveal();}
    componentWillUnmount(){window.removeEventListener('hashchange',this.onHash);window.removeEventListener('scroll',this.onScroll);document.removeEventListener('pointermove',this.onPointerMove);document.removeEventListener('pointerout',this.onPointerOut);document.removeEventListener('keydown',this.onKeyDown);}
    onScroll(){var y=window.scrollY||0;var max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);var prog=Math.max(0,Math.min(1,y/max));var bar=document.querySelector('.scroll-progress i');if(bar)bar.style.transform='scaleX('+prog+')';var header=document.querySelector('.site-header');if(header)header.classList.toggle('is-compact',y>60);var visual=document.querySelector('.hero-visual');if(visual&&y<innerHeight*1.15)visual.style.transform='translate3d(0,'+(y*0.025)+'px,0)';}
    scheduleAnnouncement(){var a=activePopup(this.state.data);if(!a||a.enabled===false||this.state.admin)return;var freq=a.frequency||'session';var key=ANNOUNCE_KEY+'-'+(a.id||'default');if(freq!=='everyVisit'){var seen=freq==='once'?storageGet('local',key):storageGet('session',key);if(seen)return;}var self=this;setTimeout(function(){if(!self.state.quote&&!self.state.admin)self.setState({announcement:a});},Math.max(200,Number(a.delay||900)));}
    closeAnnouncement(){var a=this.state.announcement||{};var freq=(a.frequency||'session'),key=ANNOUNCE_KEY+'-'+(a.id||'default');if(freq==='once')storageSet('local',key,'1');else if(freq==='session')storageSet('session',key,'1');this.setState({announcement:null});}
    onHash(){var wantsAdmin=location.hash.indexOf('#admin')===0;if(wantsAdmin&&!shouldUseITopAdmin()&&!isLocalPreview()){goRealAdmin();return;}this.setState({admin:wantsAdmin,announcement:null});}
    onKeyDown(e){if(e.key==='Escape'&&(this.state.quote||this.state.announcement))this.setState({quote:false,announcement:null});}
    onPointerMove(e){if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var spot=e.target&&e.target.closest?e.target.closest('.mouse-spotlight'):null;if(spot){var r=spot.getBoundingClientRect();spot.style.setProperty('--mx',(e.clientX-r.left)+'px');spot.style.setProperty('--my',(e.clientY-r.top)+'px');}var mag=e.target&&e.target.closest?e.target.closest('.magnetic'):null;if(mag){var b=mag.getBoundingClientRect(),dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2);mag.style.transform='translate3d('+(dx*.08)+'px,'+(dy*.08)+'px,0)';}}
    onPointerOut(e){var mag=e.target&&e.target.closest?e.target.closest('.magnetic'):null;if(mag&&(!e.relatedTarget||!mag.contains(e.relatedTarget)))mag.style.transform='';}
    initReveal(){var els=document.querySelectorAll('.reveal:not(.seen)');if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('seen')});return;}var io=new IntersectionObserver(function(entries){entries.forEach(function(x){if(x.isIntersecting){x.target.classList.add('seen');io.unobserve(x.target);}})},{threshold:.08});els.forEach(function(e){io.observe(e)});}
    updateData(d){saveData(d);this.setState({data:clone(d),version:this.state.version+1});}
    render(){var page=this.state.admin?h(Admin,{data:this.state.data,onSave:this.updateData.bind(this)}):h(Storefront,{data:this.state.data,onQuote:()=>this.setState({quote:true,announcement:null}),quote:this.state.quote,onCloseQuote:()=>this.setState({quote:false}),version:this.state.version});return h('div',{className:'app-root'},page,this.state.boot&&!this.state.admin&&h(BootOverlay),this.state.announcement&&!this.state.admin&&h(AnnouncementModal,{data:this.state.announcement,onClose:this.closeAnnouncement.bind(this)}));}
  }

  function Storefront(props){var d=props.data, products=(d.products||[]).filter(function(x){return x.enabled!==false}), featured=products.filter(function(x){return x.featured}).slice(0,6), cats=(d.categories||[]).filter(function(x){return x.enabled!==false}).slice(0,6), brands=(d.brands||[]).filter(function(x){return x.enabled!==false});return h('div',{className:'store'},
    h('a',{className:'skip-link',href:'#main-content'},'Bỏ qua điều hướng'),
    h('div',{className:'scroll-progress'},h('i')),
    h(Header,{data:d,products:products,onQuote:props.onQuote}),
    h('main',{id:'main-content'},
    h(Hero,{data:d,onQuote:props.onQuote}),
    h(BrandStrip,{brands:brands}),
    h(IntentNavigator,{onQuote:props.onQuote}),
    h(PromoBanners,{items:d.banners||[]}),
    h(KineticMarquee),
    h(Categories,{items:cats}),
    h(Products,{items:featured.length?featured:products.slice(0,6),url:d.site.catalogUrl}),
    h(Solutions,{data:d}),
    h(BuyingJourney,{onQuote:props.onQuote}),
    h(Calculator,{data:d,onQuote:props.onQuote}),
    h(Colors,{data:d}),
    h(Faq,{items:(d.faqs||[]).filter(function(x){return x.enabled!==false})}),
    h(FinalCta,{data:d,onQuote:props.onQuote})),
    h(Footer,{data:d}),
    h(ContactDock,{data:d,onQuote:props.onQuote}),
    h(MobileActionBar,{data:d,onQuote:props.onQuote}),
    props.quote&&h(QuoteModal,{data:d,onClose:props.onCloseQuote})
  );}

  class Header extends React.Component{
    constructor(p){super(p);this.state={menu:false,search:false};this.closeOnEscape=this.closeOnEscape.bind(this);}
    componentDidMount(){document.addEventListener('keydown',this.closeOnEscape);}
    componentWillUnmount(){document.removeEventListener('keydown',this.closeOnEscape);}
    closeOnEscape(e){if(e.key==='Escape')this.setState({menu:false,search:false});}
    go(id){this.setState({menu:false});scrollToId(id);}
    quote(){this.setState({menu:false});this.props.onQuote();}
    render(){var d=this.props.data,nav=[['Sản phẩm','products'],['Bảng màu','colors'],['Tính lượng sơn','calculator'],['FAQ','faq']];return h('div',{className:'header-layer'},
      h('header',{className:'site-header'},h('div',{className:'header-inner'},
        h('a',{className:'brand-lockup',href:'#top','aria-label':'Sơn Tiến Bảo - Trang chủ'},h('img',{src:asset(d.site.logo),alt:'Logo Sơn Tiến Bảo'}),h('span',null,h('b',null,'SƠN TIẾN BẢO'),h('small',null,'Sơn chính hãng'))),
        h('nav',{className:'desktop-nav','aria-label':'Điều hướng chính'},nav.map(x=>h('button',{key:x[0],onClick:()=>this.go(x[1])},x[0])),h('a',{href:d.site.priceUrl},'Bảng giá')),
        h('div',{className:'header-actions'},
          h('button',{className:'round-btn search-trigger',onClick:()=>this.setState({search:true}),title:'Tìm sản phẩm','aria-label':'Tìm sản phẩm'},'⌕'),
          h(Btn,{kind:'red',className:'header-quote',onClick:()=>this.quote()},'Nhận báo giá'),
          h('button',{className:'menu-trigger',onClick:()=>this.setState({menu:!this.state.menu}),'aria-expanded':this.state.menu,'aria-label':this.state.menu?'Đóng menu':'Mở menu'},this.state.menu?'×':'☰')
        )
      )),
      this.state.menu&&h('div',{className:'mobile-menu'},h('div',{className:'mobile-menu-panel'},h('span',{className:'section-kicker'},'ĐIỀU HƯỚNG'),nav.map(x=>h('button',{key:x[0],onClick:()=>this.go(x[1])},x[0],h('span',null,'→'))),h('a',{href:d.site.priceUrl},'Bảng giá',h('span',null,'↗')),h(Btn,{kind:'red',onClick:()=>this.quote()},'Nhận báo giá'))),
      this.state.search&&h(ProductSearch,{items:this.props.products||[],catalogUrl:d.site.catalogUrl,onClose:()=>this.setState({search:false})})
    );}
  }

  class ProductSearch extends React.Component{
    constructor(p){super(p);this.state={query:''};}
    render(){var q=this.state.query.trim().toLowerCase();var matches=(this.props.items||[]).filter(function(x){return ((x.name||'')+' '+(x.brand||'')+' '+(x.category||'')+' '+(x.description||'')).toLowerCase().indexOf(q)>=0;}).slice(0,8);return h('div',{className:'search-backdrop',onMouseDown:e=>{if(e.target===e.currentTarget)this.props.onClose();}},
      h('section',{className:'product-search-dialog',role:'dialog','aria-modal':'true','aria-labelledby':'product-search-title'},
        h('div',{className:'search-dialog-head'},h('div',null,h('span',{className:'section-kicker'},'TÌM NHANH'),h('h2',{id:'product-search-title'},'Bạn đang cần loại sơn nào?')),h('button',{className:'search-close',onClick:this.props.onClose,'aria-label':'Đóng tìm kiếm'},'×')),
        h('label',{className:'search-input-wrap'},h('span',null,'⌕'),h('input',{autoFocus:true,value:this.state.query,placeholder:'Nhập tên, thương hiệu hoặc nhu cầu…','aria-label':'Từ khóa tìm sản phẩm',onChange:e=>this.setState({query:e.target.value})})),
        h('div',{className:'search-results'},matches.length?matches.map(function(x){return h('a',{className:'search-product',key:x.id,href:x.url},h(SmartImage,{src:x.image,alt:x.name,width:88,height:88}),h('div',null,h('small',null,(x.brand||'Sơn Tiến Bảo')+' · '+(x.category||'Sản phẩm')),h('b',null,x.name),h('span',null,(x.pricePrefix?x.pricePrefix+' ':'')+money(x.price))),h('i',null,'→'));}):h('div',{className:'search-empty'},h('b',null,'Chưa tìm thấy sản phẩm phù hợp'),h('p',null,'Thử tên thương hiệu, loại bề mặt hoặc mở toàn bộ danh mục.'))),
        h('a',{className:'search-all-link',href:this.props.catalogUrl},'Xem toàn bộ sản phẩm ',h('span',null,'↗'))
      )
    );}
  }

  function IntentNavigator(p){var cards=[
    {icon:'⌂',title:'Sơn nhà mới',desc:'Chọn hệ sơn theo nội thất và ngoại thất.',action:function(){scrollToId('categories');}},
    {icon:'↻',title:'Sơn sửa lại',desc:'Tìm giải pháp theo tình trạng bề mặt.',action:function(){scrollToId('products');}},
    {icon:'◐',title:'Chọn màu',desc:'Tìm và lưu mã màu cho không gian.',action:function(){scrollToId('colors');}},
    {icon:'≈',title:'Tính chi phí',desc:'Ước tính lượng sơn trước khi mua.',action:function(){scrollToId('calculator');}}
  ];return h('section',{className:'intent-section','aria-label':'Chọn nhu cầu'},h('div',{className:'container intent-shell'},h('div',{className:'intent-intro'},h('span',{className:'section-kicker'},'BẮT ĐẦU NHANH'),h('h2',null,'Bạn đang cần làm gì?'),h('p',null,'Chọn đúng nhu cầu để đi thẳng tới phần hữu ích nhất.')),h('div',{className:'intent-grid'},cards.map(function(x){return h('button',{key:x.title,onClick:x.action},h('span',{className:'intent-icon'},x.icon),h('span',{className:'intent-copy'},h('b',null,x.title),h('small',null,x.desc)),h('i',null,'→'));})),h(Btn,{kind:'red',className:'intent-quote',onClick:p.onQuote},'Tư vấn riêng')));}

  function BuyingJourney(p){var steps=[
    ['01','Xác định nhu cầu','Chọn bề mặt, không gian và mức hoàn thiện mong muốn.'],
    ['02','Tính lượng sơn','Ước tính theo diện tích, số lớp và độ phủ sản phẩm.'],
    ['03','Nhận tư vấn','Đối chiếu hệ sơn, quy cách thùng và màu phù hợp.'],
    ['04','Chốt báo giá','Xác nhận sản phẩm, số lượng và phương án giao nhận.']
  ];return h('section',{className:'journey-section',id:'journey'},h('div',{className:'container'},h(SectionHead,{eyebrow:'QUY TRÌNH RÕ RÀNG',title:'Từ nhu cầu đến báo giá trong một luồng',desc:'Không cần tự ghép từng sản phẩm. Landing page dẫn bạn qua các bước cần thiết để chọn đúng và hạn chế mua dư.'}),h('div',{className:'journey-grid'},steps.map(function(x,i){return h(Reveal,{key:x[0],className:'journey-card'},h('span',{className:'journey-number'},x[0]),h('div',{className:'journey-line'},h('i')),h('h3',null,x[1]),h('p',null,x[2]),i===2&&h('button',{onClick:p.onQuote},'Mở form tư vấn →'));})),h('div',{className:'journey-cta'},h('p',null,h('b',null,'Đã có diện tích? '),'Dùng công cụ tính lượng sơn để có số liệu trước khi nhận báo giá.'),h(Btn,{kind:'dark',onClick:function(){scrollToId('calculator')}},'Tính lượng sơn ngay'))));}

  function ContactDock(p){var d=p.data.site;return h('aside',{className:'contact-dock','aria-label':'Liên hệ nhanh'},h('a',{href:'tel:'+d.hotline,'aria-label':'Gọi '+d.hotlineDisplay},h('span',null,'☎'),h('b',null,'Gọi ngay')),h('a',{href:'https://zalo.me/'+d.zalo,target:'_blank',rel:'noopener','aria-label':'Chat Zalo'},h('span',null,'Z'),h('b',null,'Zalo')),h('button',{onClick:p.onQuote,'aria-label':'Nhận báo giá'},h('span',null,'✦'),h('b',null,'Báo giá')));}

  function MobileActionBar(p){var d=p.data.site;return h('nav',{className:'mobile-action-bar','aria-label':'Liên hệ nhanh trên điện thoại'},h('a',{href:'tel:'+d.hotline},h('span',null,'☎'),h('b',null,'Gọi tư vấn')),h('button',{onClick:p.onQuote},h('span',null,'✦'),h('b',null,'Nhận báo giá')));}

  function Hero(p){
    var d=p.data,trust=d.hero.trust||[];
    return h('section',{className:'hero hero-v64',id:'top'},
      h('div',{className:'hero-ambient hero-ambient-a'}),h('div',{className:'hero-ambient hero-ambient-b'}),
      h('div',{className:'hero-grid container'},
        h('div',{className:'hero-copy hero-sequence'},
          h('div',{className:'eyebrow'},h('i',null),d.hero.eyebrow),
          h('h1',null,d.hero.title,h('br'),h('em',null,d.hero.titleAccent)),
          h('p',{className:'hero-lead'},d.hero.lead),
          h('div',{className:'hero-actions'},h(Btn,{kind:'red',onClick:function(){scrollToId('calculator')}},'Tính lượng sơn ngay ',h(Icon,null,'→')),h(Btn,{kind:'glass',onClick:function(){scrollToId('products')}},'Khám phá sản phẩm ',h(Icon,null,'→'))),
          h('div',{className:'trust-row'},trust.map(function(x,i){return h('div',{className:'trust-item',key:i},h('span',{className:'trust-mark'},i%2?'◇':'✓'),h('b',null,x.value),h('small',null,x.label));})),
          h('button',{className:'scroll-cue',onClick:function(){scrollToId('categories')}},h('span',null,'Cuộn để khám phá'),h('i',null,'↓'))
        ),
        h('div',{className:'hero-visual hero-sequence-stage mouse-spotlight'},h(SmartImage,{src:d.hero.image,alt:'Không gian kiến trúc và sản phẩm sơn',width:1600,height:900,loading:'eager',fetchPriority:'high'}),h('div',{className:'hero-visual-shine'}),h('div',{className:'hero-lab'},h('b',null,'COLOR LAB'),h('small',null,'Chọn màu · Tính lượng · Báo giá')),h('div',{className:'hero-proof-card'},h('span',{className:'proof-icon'},'✓'),h('div',null,h('b',null,'Chọn sơn có cơ sở'),h('small',null,'Theo bề mặt · độ phủ · quy cách'))))
      )
    );
  }

  function KineticMarquee(){var items=['SƠN CHÍNH HÃNG','JOTUN','TERRACO','NIPPON','RUBY PAINT','TƯ VẤN MÀU','TÍNH LƯỢNG SƠN','BÁO GIÁ NHANH'];var content=items.concat(items).map(function(x,i){return h('span',{className:'marquee-unit',key:i},h('span',null,x),h('b',null,'✦'));});return h('div',{className:'kinetic-marquee','aria-hidden':'true'},h('div',{className:'kinetic-track'},content));}

  function BootOverlay(){return h('div',{className:'boot-overlay'},h('div',{className:'boot-inner'},h('span',{className:'boot-code'},'STB / COLOR COMMERCE'),h('h2',null,'Khởi động hệ thống'),h('div',{className:'boot-line'},h('i')),h('small',null,'Tìm đúng sơn · Chọn đúng màu · Tính đúng lượng')));}

  function AnnouncementModal(p){var a=p.data||{};var mode=a.style||'modal';return h('div',{className:cx('announce-backdrop','mode-'+mode),onMouseDown:function(e){if(e.target===e.currentTarget)p.onClose();}},h('section',{className:cx('announce-card','style-'+mode,a.template&&'tpl-'+a.template,a.animation&&'anim-'+a.animation),style:{maxWidth:(Number(a.width||0)>0?Number(a.width)+'px':undefined)},role:'dialog','aria-modal':'true','aria-label':a.title||'Thông báo'},h('button',{className:'announce-close',onClick:p.onClose,'aria-label':'Đóng'},'×'),h('div',{className:'announce-media'},h('img',{src:asset(a.image||'assets/jotun-ben-mau-toan-dien-hq.webp'),alt:''}),h('span',null,a.eyebrow||'THÔNG BÁO')),h('div',{className:'announce-copy'},h('span',{className:'section-kicker'},a.eyebrow||'THÔNG BÁO'),h('h2',null,a.title||'Thông báo mới'),h('p',null,a.body||''),a.highlight&&h('div',{className:'announce-highlight'},a.highlight),h('div',{className:'announce-actions'},h('a',{className:'btn btn-red',href:a.ctaUrl||'#'},a.ctaLabel||'Xem chi tiết',' →'),h('button',{className:'btn btn-outline',onClick:p.onClose},a.secondaryLabel||'Để sau')),h('small',null,'Giá và tình trạng sản phẩm có thể thay đổi theo thời điểm.'))));}

  function BrandStrip(p){return h('section',{className:'brand-strip'},h('div',{className:'container brand-wrap'},h('span',{className:'brand-caption'},'THƯƠNG HIỆU ĐỐI TÁC'),h('div',{className:'brand-row'},p.brands.map(function(b){return h('a',{href:b.url,key:b.id},h('img',{src:asset(b.logo),alt:b.name}))}))));}

  function PromoBanners(p){var now=Date.now(),items=(p.items||[]).filter(function(x){if(x.enabled===false)return false;var st=x.startAt?Date.parse(x.startAt):0,en=x.endAt?Date.parse(x.endAt):0;return (!st||now>=st)&&(!en||now<=en);}).sort(function(a,b){return Number(a.order||0)-Number(b.order||0);}).slice(0,2);if(!items.length)return null;return h('section',{className:'promo-banners'},h('div',{className:'container promo-banner-grid'},items.map(function(b){return h('a',{key:b.id,className:'promo-banner mouse-spotlight beam-card',href:b.ctaUrl||'#'},h('div',{className:'promo-banner-copy'},h('span',{className:'section-kicker'},'TIẾN BẢO / GIẢI PHÁP'),h('h3',null,b.title),h('p',null,b.subtitle),h('span',{className:'promo-banner-cta'},b.ctaLabel||'Khám phá',' →')),b.image&&h(SmartImage,{src:b.image,alt:b.title,width:900,height:600,loading:'lazy'}));})));}

  function Categories(p){return h('section',{className:'section light-section',id:'categories'},h('div',{className:'container'},h(SectionHead,{eyebrow:'DANH MỤC SẢN PHẨM',title:'Chọn đúng nhóm sơn ngay từ đầu',desc:'Hình ảnh trực quan, nội dung gọn và đường dẫn thẳng tới danh mục phù hợp.'}),h('div',{className:'category-grid'},p.items.map(function(c,i){return h(Reveal,{key:c.id},h('a',{className:'category-card mouse-spotlight beam-card',href:c.url},h('div',{className:'cat-photo'},h(SmartImage,{src:c.image,alt:c.name,width:1200,height:800,loading:'lazy'}),h('span',{className:'cat-num'},'0'+(i+1))),h('div',{className:'cat-body'},h('h3',null,c.name),h('p',null,c.description),h('span',{className:'circle-arrow'},'→'))))}))));}

  function Products(p){return h('section',{className:'section products-section',id:'products'},h('div',{className:'container'},h(SectionHead,{eyebrow:'SẢN PHẨM NỔI BẬT',title:'Những dòng sơn đang được quan tâm',desc:'Giá, hình ảnh và đường dẫn có thể chỉnh trực tiếp trong Admin.',action:h('a',{className:'text-link',href:p.url},'Xem tất cả sản phẩm →')}),h('div',{className:'product-grid'},p.items.map(function(x,i){return h(ProductCard,{p:x,key:x.id,index:i})}))));}
  function ProductCard(o){var p=o.p,discount=p.oldPrice&&p.price?Math.round((1-p.price/p.oldPrice)*100):0;return h(Reveal,null,h('a',{className:'product-card mouse-spotlight beam-card',href:p.url},h('div',{className:'product-img'},p.badge&&h('span',{className:'badge'},p.badge),discount>0&&h('span',{className:'discount'},'-'+discount+'%'),h(SmartImage,{src:p.image,alt:p.name,width:720,height:620,loading:'lazy'}),h('span',{className:'view-product'},'Xem sản phẩm →')),h('div',{className:'product-body'},h('small',null,p.brand),h('h3',null,p.name),h('p',null,p.category),h('div',{className:'price'},h('strong',null,(p.pricePrefix?p.pricePrefix+' ':'')+money(p.price)),p.oldPrice>p.price&&h('del',null,money(p.oldPrice))))));}

  function Solutions(p){
    return h('section',{className:'solutions'},
      h('div',{className:'container solution-grid'},
        h(Reveal,{className:'solution-copy'},
          h('span',{className:'section-kicker light'},'GIẢI PHÁP SƠN TOÀN DIỆN'),
          h('h2',null,'Không gian đẹp hơn bắt đầu từ lựa chọn đúng.'),
          h('p',null,'Từ bề mặt đến màu sắc, từ độ phủ đến quy cách thùng — tất cả được gom thành một luồng mua hàng rõ ràng.'),
          h('ul',null,
            h('li',null,'✓ Chọn theo nhu cầu và bề mặt'),
            h('li',null,'✓ Tính theo độ phủ riêng của từng sản phẩm'),
            h('li',null,'✓ Gợi ý quy cách mua ít dư hơn')
          ),
          h(Btn,{kind:'white',onClick:function(){scrollToId('calculator')}},'Bắt đầu tính lượng sơn →')
        ),
        h(Reveal,{className:'solution-photo mouse-spotlight beam-card'},
          h(SmartImage,{src:p.data.hero.image,alt:'Giải pháp sơn Tiến Bảo',width:1400,height:900,loading:'lazy'}),
          h('div',{className:'paint-ring'},h('b',null,'BỀN MÀU'),h('span',null,'×'),h('b',null,'ĐÚNG LƯỢNG'))
        )
      )
    );
  }

  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  // CALCULATOR_V5_FULL_CATALOG
  class Calculator extends React.Component{
    constructor(p){
      super(p);
      var surface=this.firstSurface(p.data);
      var groups=this.groups(p.data,surface);
      var finish=groups.finishes[0]||{};
      var primer=this.bestPrimer(groups.primers,finish,surface)||groups.primers[0]||{};
      var all=this.allItems(p.data),single=all[0]||{};
      this.state={surface:surface,mode:'system',area:125,primerCoats:1,finishCoats:Number(p.data.calculator.defaultCoats||2),waste:Number(p.data.calculator.defaultWaste||10),primerId:primer.id,productId:finish.id,singleId:single.id,singleQuery:'',singleBrand:'all',color:SWATCHES[0][0]};
    }
    catalog(data){
      var map={},order=[];
      function add(p,prefer){if(!p||!p.id)return;if(!map[p.id]){map[p.id]=Object.assign({},p);order.push(p.id);}else map[p.id]=prefer?Object.assign({},map[p.id],p):Object.assign({},p,map[p.id]);}
      ((DEFAULT&&DEFAULT.products)||[]).forEach(function(p){add(p,false);});
      ((data&&data.products)||[]).forEach(function(p){add(p,true);});
      return order.map(function(id){return map[id];});
    }
    calcItems(data){
      var all=this.catalog(data);
      var verified=all.filter(function(p){return !!(p&&p.calculatorOnly===true&&String(p.id||'').indexOf('calc-family-')===0);});
      return verified.length?verified:all;
    }
    allItems(data){
      return this.calcItems(data).filter(function(p){return !!(p&&p.enabled!==false&&(p.calculatorOnly===true||p.calcEligible===true||(p.priceBySize&&Object.keys(p.priceBySize).length)));}).sort(function(a,b){return String(a.brand||'').localeCompare(String(b.brand||''),'vi')||String(a.name||'').localeCompare(String(b.name||''),'vi');});
    }
    unitOf(p){if(!p)return 'L';if(p.measureUnit==='Kg'||p.measureUnit==='L')return p.measureUnit;var u=String(p.unit||'').toLowerCase();return u.indexOf('kg')>=0?'Kg':'L';}
    isPrimer(p){if(!p)return false;if(p.calculatorRole==='primer')return true;if(p.calculatorRole==='finish')return false;var text=((p.name||'')+' '+(p.category||'')).toLowerCase();return text.indexOf('primer')>=0||text.indexOf('sơn lót')>=0||text.indexOf('son lot')>=0;}
    inferSurface(p){
      if(!p)return 'both';
      if(['interior','exterior','both','sport','other'].indexOf(p.calculatorSurface)>=0)return p.calculatorSurface;
      var text=((p.name||'')+' '+(p.category||'')+' '+(p.description||'')).toLowerCase();
      if(text.indexOf('sân thể thao')>=0||text.indexOf('flexipave')>=0)return 'sport';
      var interior=text.indexOf('nội thất')>=0||text.indexOf('noi that')>=0||text.indexOf('trong nhà')>=0;
      var exterior=text.indexOf('ngoại thất')>=0||text.indexOf('ngoai that')>=0||text.indexOf('ngoài trời')>=0;
      if(interior&&exterior)return 'both';if(exterior)return 'exterior';if(interior)return 'interior';
      if(text.indexOf('jotashield')>=0||text.indexOf('tough shield')>=0||text.indexOf('chống thấm')>=0)return 'exterior';
      if(text.indexOf('majestic')>=0||text.indexOf('essence')>=0)return 'interior';return 'both';
    }
    pairKey(p){
      if(!p)return 'paint';if(p.pairKey)return p.pairKey;
      var text=((p.name||'')+' '+(p.category||'')).toLowerCase();
      if(text.indexOf('jotashield')>=0)return 'jotun:jotashield';if(text.indexOf('tough shield')>=0)return 'jotun:tough-shield';if(text.indexOf('majestic')>=0)return 'jotun:majestic';if(text.indexOf('essence')>=0)return 'jotun:essence';if(text.indexOf('ultra')>=0)return 'jotun:ultra';
      return String(p.brand||'paint').toLowerCase().replace(/[^a-z0-9]+/g,'-');
    }
    eligible(p){return !!(p&&p.enabled!==false&&this.unitOf(p)==='L'&&Number(p.coverage||0)>0&&Array.isArray(p.variants)&&p.variants.some(function(x){return Number(x)>0;}));}
    surfaceMatch(p,surface){var s=this.inferSurface(p);return s==='both'||s===surface;}
    groups(data,surface){var self=this,all=this.calcItems(data).filter(function(p){return self.eligible(p)&&self.surfaceMatch(p,surface);});return{all:all,primers:all.filter(function(p){return self.isPrimer(p);}),finishes:all.filter(function(p){return !self.isPrimer(p)&&(p.calculatorRole||'finish')!=='other';})};}
    firstSurface(data){var interior=this.groups(data,'interior');if(interior.finishes.length&&interior.primers.length)return 'interior';return 'exterior';}
    find(items,id){return (items||[]).find(function(x){return x.id===id;})||(items||[])[0]||{};}
    bestPrimer(primers,finish,surface){
      if(!primers||!primers.length)return null;var self=this,fk=this.pairKey(finish),fb=String(finish&&finish.brand||'').toLowerCase();
      return primers.slice().sort(function(a,b){function score(p){var pk=self.pairKey(p),ps=self.inferSurface(p),pb=String(p.brand||'').toLowerCase(),s=0;if(pk===fk)s+=130;if(pb&&fb&&pb===fb)s+=100;if(ps===surface)s+=25;if(ps==='both')s+=15;if(p.technicalSource==='website'||p.technicalSource==='iTop')s+=3;return s;}return score(b)-score(a);})[0];
    }
    changeSurface(surface){var groups=this.groups(this.props.data,surface),finish=groups.finishes[0]||{},primer=this.bestPrimer(groups.primers,finish,surface)||groups.primers[0]||{};this.setState({surface:surface,productId:finish.id,primerId:primer.id});}
    changeFinish(id){var groups=this.groups(this.props.data,this.state.surface),finish=this.find(groups.finishes,id),primer=this.bestPrimer(groups.primers,finish,this.state.surface)||groups.primers[0]||{};this.setState({productId:finish.id,primerId:primer.id});}
    sizeKey(size){var n=Number(size);return Number.isInteger(n)?String(n):String(n).replace(/0+$/,'').replace(/\.$/,'');}
    priceForSize(p,size){if(!p)return 0;var map=p.priceBySize&&typeof p.priceBySize==='object'?p.priceBySize:{},key=this.sizeKey(size),direct=Number(map[key]||0);if(direct>0)return direct;var ref=Number(p.priceReferenceSize||0),price=Number(p.price||0);if(price>0&&ref>0&&Math.abs(ref-Number(size))<.001)return price;if(price>0&&Array.isArray(p.variants)&&p.variants.length===1&&Math.abs(Number(p.variants[0])-Number(size))<.001)return price;return 0;}
    pack(qty,p){
      var self=this,map=p&&p.priceBySize&&typeof p.priceBySize==='object'?p.priceBySize:{},priced=Object.keys(map).filter(function(k){return Number(map[k]||0)>0;}).map(Number).filter(function(x){return x>0&&isFinite(x);});
      var sizes=(priced.length?priced:((p&&p.variants)||[]).map(Number)).filter(function(x){return x>0&&isFinite(x);}).filter(function(x,i,a){return a.indexOf(x)===i;}).sort(function(a,b){return b-a;});
      if(!sizes.length||!(qty>0))return [];
      var target=Number(qty),best=null,minSize=sizes[sizes.length-1],maxCans=Math.min(180,Math.ceil(target/minSize)+4);
      function better(a,b){if(!b)return true;for(var i=0;i<a.length;i++){if(a[i]<b[i])return true;if(a[i]>b[i])return false;}return false;}
      function walk(i,total,counts,cans){
        if(cans>maxCans)return;
        if(total>=target){var cost=0,known=true;for(var j=0;j<sizes.length;j++){if(!counts[j])continue;var u=self.priceForSize(p,sizes[j]);if(!u)known=false;else cost+=u*counts[j];}var score=known?[0,cost,total-target,cans]:[1,total-target,cans,0];if(!best||better(score,best.score))best={score:score,counts:counts.slice()};return;}
        if(i>=sizes.length)return;var s=sizes[i],need=Math.min(maxCans-cans,Math.ceil((target-total)/s)+1);for(var q=0;q<=need;q++){counts[i]=q;walk(i+1,total+q*s,counts,cans+q);}counts[i]=0;
      }
      walk(0,0,new Array(sizes.length).fill(0),0);if(!best)return [];
      return sizes.map(function(s,i){return[s,best.counts[i]||0];}).filter(function(x){return x[1]>0;});
    }
    packCost(p,packs){var self=this,total=0,known=true,parts=[];(packs||[]).forEach(function(x){var unit=self.priceForSize(p,x[0]);if(!unit)known=false;else total+=unit*x[1];parts.push({size:x[0],qty:x[1],unit:unit,subtotal:unit?unit*x[1]:0});});return{known:!!(parts.length&&known),total:total,parts:parts};}
    layer(p,coats){var cov=Number(p&&p.coverage||0),area=Math.max(0,Number(this.state.area)||0),n=Math.max(1,Number(coats)||1),waste=Math.max(0,Number(this.state.waste)||0),qty=cov?area*n/cov*(1+waste/100):0,packs=this.pack(qty,p),pricing=this.packCost(p,packs);return{p:p||{},cov:cov,qty:qty,packs:packs,pricing:pricing,coats:n,unit:this.unitOf(p)};}
    sourceLabel(p){if(!p)return '—';if(p.technicalSource==='website'||p.technicalSource==='iTop')return 'Dữ liệu sản phẩm';if(p.technicalSource==='hybrid')return 'Quy cách & độ phủ';return 'Thông số sản phẩm';}
    surfaceLabel(){return this.state.surface==='interior'?'Nội thất':'Ngoại thất';}
    resultCard(label,r){
      var p=r.p||{},unit=r.unit||'L',self=this;
      if(!(r.cov>0))return h('div',{className:'calc-layer-card calc-missing-tech'},h('div',{className:'calc-layer-head'},h('span',null,label),h('b',null,'Chưa đủ thông số')),h('h3',null,p.name||'Chưa chọn sản phẩm'),h('p',null,'Website đã lấy được sản phẩm và giá, nhưng chưa có độ phủ/định mức đủ rõ để tính lượng chính xác.'),h('div',{className:'calc-cost-line'},h('span',null,'Giá đang có'),h('strong',{className:'cost-known'},Number(p.price||0)>0?money(p.price):'Liên hệ')),p.url&&h('a',{className:'calc-product-link',href:p.url,target:'_blank',rel:'noopener'},'Xem sản phẩm trên website chính ↗'));
      return h('div',{className:'calc-layer-card'},h('div',{className:'calc-layer-head'},h('span',null,label),h('b',null,r.qty.toFixed(1)+' '+unit)),h('h3',null,p.name||'Chưa có sản phẩm phù hợp'),h('div',{className:'calc-mini-grid'},h('div',null,h('small',null,'Số lớp'),h('strong',null,r.coats)),h('div',null,h('small',null,'Độ phủ / định mức'),h('strong',null,p.coverageLabel||((r.cov||0)+' m²/'+unit+'/lớp'))),h('div',null,h('small',null,'Nguồn'),h('strong',null,self.sourceLabel(p)))),h('div',{className:'pack-box pack-box-v3'},h('span',null,'Quy cách gợi ý'),r.pricing.parts.length?r.pricing.parts.map(function(x){return h('div',{className:'pack-chip-v3',key:x.size},h('b',null,x.qty+' × '+x.size+unit),h('small',null,x.unit?money(x.unit)+' / thùng':'Chưa có giá đúng quy cách'));}):h('small',null,'Chưa có quy cách phù hợp')),h('div',{className:'calc-cost-line'},h('span',null,'Chi phí dự kiến'),h('strong',{className:r.pricing.known?'cost-known':'cost-pending'},r.pricing.known?money(r.pricing.total):'Đang cập nhật giá theo quy cách')),p.url&&h('a',{className:'calc-product-link',href:p.url,target:'_blank',rel:'noopener'},'Xem chi tiết sản phẩm ↗'));
    }
    singleItems(data){
      var q=String(this.state.singleQuery||'').toLowerCase().trim(),brand=this.state.singleBrand;
      return this.allItems(data).filter(function(p){if(brand!=='all'&&String(p.brand||'')!==brand)return false;if(!q)return true;var hay=((p.brand||'')+' '+(p.name||'')+' '+(p.category||'')).toLowerCase();return hay.indexOf(q)>=0;});
    }
    render(){
      var mode=this.state.mode,surface=this.state.surface,groups=this.groups(this.props.data,surface),finish=this.find(groups.finishes,this.state.productId),primer=this.find(groups.primers,this.state.primerId),recommended=this.bestPrimer(groups.primers,finish,surface)||{},isAutoPair=!!(primer.id&&recommended.id&&primer.id===recommended.id),finishR=this.layer(finish,this.state.finishCoats),primerR=this.layer(primer,this.state.primerCoats);
      var all=this.allItems(this.props.data),brands=Array.from(new Set(all.map(function(p){return p.brand;}).filter(Boolean))).sort(),singleItems=this.singleItems(this.props.data),single=this.find(singleItems,this.state.singleId),singleR=this.layer(single,this.state.finishCoats);
      var tabs=h('div',{className:'calc-mode-tabs calc-mode-tabs-v5'},[['system','Toàn bộ hệ sơn','Lót + phủ + chi phí'],['finish','Sơn phủ','Tính lớp hoàn thiện'],['primer','Sơn lót','Tính lớp nền'],['single','Tất cả sản phẩm','Tìm và tính từng sản phẩm']].map(x=>h('button',{type:'button',key:x[0],className:mode===x[0]?'active':'',onClick:()=>this.setState({mode:x[0]})},h('b',null,x[1]),h('small',null,x[2]))));
      var commonInputs=h('div',{className:'two'},h('label',null,'Diện tích cần sơn',h('div',{className:'input-suffix'},h('input',{type:'number',min:1,value:this.state.area,onChange:e=>this.setState({area:e.target.value})}),h('span',null,'m²'))),h('label',null,'Hao hụt dự kiến',h('div',{className:'input-suffix'},h('input',{type:'number',min:0,max:50,value:this.state.waste,onChange:e=>this.setState({waste:e.target.value})}),h('span',null,'%'))));
      var form,result;
      if(mode==='single'){
        form=h('div',{className:'calc-form calc-form-v3 calc-form-v4 calc-form-v5'},tabs,h('div',{className:'calc-catalog-tools'},h('div',{className:'calc-product-title'},h('span',null,'★'),h('div',null,h('b',null,'Tìm sản phẩm trên toàn bộ catalog'),h('small',null,all.length+' sản phẩm đã được đồng bộ vào công cụ'))),h('div',{className:'two'},h('label',null,'Thương hiệu',h('select',{value:this.state.singleBrand,onChange:e=>this.setState({singleBrand:e.target.value,singleId:''})},[h('option',{value:'all',key:'all'},'Tất cả thương hiệu')].concat(brands.map(b=>h('option',{value:b,key:b},b))))),h('label',null,'Tìm theo tên sản phẩm',h('input',{type:'search',placeholder:'Ví dụ: Jotashield, Nippon, Rubysen...',value:this.state.singleQuery,onChange:e=>this.setState({singleQuery:e.target.value,singleId:''})}))),h('label',{className:'full'},'Sản phẩm',h('select',{value:single.id||'',onChange:e=>this.setState({singleId:e.target.value})},singleItems.map(p=>h('option',{value:p.id,key:p.id},(p.brand?p.brand+' • ':'')+p.name+(p.calcEligible?'':' • chỉ có giá')))))),commonInputs,h('label',null,'Số lớp',h('select',{value:this.state.finishCoats,onChange:e=>this.setState({finishCoats:e.target.value})},[1,2,3].map(x=>h('option',{value:x,key:x},x+' lớp')))));
        result=h('aside',{className:'calc-result calc-result-v3'},h('div',{className:'calc-result-topline'},h('span',{className:'calc-kicker'},'TÍNH SẢN PHẨM BẤT KỲ'),h('span',{className:'surface-result-chip'},single.brand||'Catalog')),h('div',{className:'calc-result-stack'},single.id?this.resultCard('SẢN PHẨM',singleR):h('div',{className:'calc-data-warning'},'Không tìm thấy sản phẩm phù hợp bộ lọc.')),h(Btn,{kind:'red',className:'full',onClick:this.props.onQuote},'Nhận báo giá chính xác →'),h('small',{className:'estimate-note'},'Giá và quy cách được đồng bộ từ website chính. Lượng vật tư chỉ được tính khi sản phẩm có thông số độ phủ hoặc định mức rõ ràng.'));
      }else{
        var showFinish=mode!=='primer',showPrimer=mode!=='finish';
        var surfacePicker=h('div',{className:'calc-surface-block'},h('div',{className:'calc-surface-copy'},h('span',null,'BƯỚC 1'),h('div',null,h('b',null,'Bạn đang sơn khu vực nào?'),h('small',null,'Hệ sơn tự lọc theo nội thất hoặc ngoại thất.'))),h('div',{className:'calc-surface-selector'},h('button',{type:'button','aria-pressed':surface==='interior',className:surface==='interior'?'active':'',onClick:()=>this.changeSurface('interior')},h('span',null,'⌂'),h('div',null,h('b',null,'Nội thất'),h('small',null,'Phòng khách, phòng ngủ, căn hộ'))),h('button',{type:'button','aria-pressed':surface==='exterior',className:surface==='exterior'?'active':'',onClick:()=>this.changeSurface('exterior')},h('span',null,'▰'),h('div',null,h('b',null,'Ngoại thất'),h('small',null,'Mặt tiền, tường ngoài trời')))));
        var pairBanner=mode==='system'&&primer.id&&finish.id?h('div',{className:'calc-auto-pair '+(isAutoPair?'is-auto':'is-custom')},h('div',{className:'calc-auto-icon'},isAutoPair?'✓':'↻'),h('div',{className:'calc-auto-copy'},h('small',null,isAutoPair?'HỆ ĐƯỢC GHÉP TỰ ĐỘNG':'HỆ ĐÃ TÙY CHỈNH'),h('b',null,(primer.name||'Sơn lót')+'  +  '+(finish.name||'Sơn phủ')),h('span',null,isAutoPair?'Ưu tiên cùng thương hiệu/dòng sản phẩm và đúng khu vực.':'Bạn đã thay đổi sơn lót so với gợi ý.')),!isAutoPair&&h('button',{type:'button',onClick:()=>this.setState({primerId:recommended.id})},'Dùng gợi ý')):null;
        var primerPanel=null,finishPanel=null;
        if(showPrimer){
          primerPanel=h('div',{className:'calc-product-panel primer-panel'},
            h('div',{className:'calc-product-title'},h('span',null,'01'),h('div',null,h('b',null,'Sơn lót '+this.surfaceLabel().toLowerCase()),h('small',null,'Ưu tiên cùng thương hiệu với sơn phủ khi có dữ liệu'))),
            groups.primers.length
              ? h('div',{className:'two'},
                  h('label',null,'Sản phẩm lót',h('select',{value:primer.id||'',onChange:e=>this.setState({primerId:e.target.value})},groups.primers.map(p=>h('option',{value:p.id,key:p.id},(p.brand?p.brand+' • ':'')+p.name+' • '+(p.variants||[]).join('/')+'L')))),
                  h('label',null,'Số lớp lót',h('select',{value:this.state.primerCoats,onChange:e=>this.setState({primerCoats:e.target.value})},[1,2].map(x=>h('option',{value:x,key:x},x+' lớp'))))
                )
              : h('div',{className:'calc-data-warning'},'Chưa có sơn lót đủ dữ liệu để tính chính xác.')
          );
        }
        if(showFinish){
          finishPanel=h('div',{className:'calc-product-panel finish-panel'},
            h('div',{className:'calc-product-title'},h('span',null,showPrimer?'02':'01'),h('div',null,h('b',null,'Sơn phủ '+this.surfaceLabel().toLowerCase()),h('small',null,'Danh sách lấy từ catalog đã đồng bộ'))),
            groups.finishes.length
              ? h('div',{className:'two'},
                  h('label',null,'Sản phẩm phủ',h('select',{value:finish.id||'',onChange:e=>this.changeFinish(e.target.value)},groups.finishes.map(p=>h('option',{value:p.id,key:p.id},(p.brand?p.brand+' • ':'')+p.name+' • '+(p.variants||[]).join('/')+'L')))),
                  h('label',null,'Số lớp phủ',h('select',{value:this.state.finishCoats,onChange:e=>this.setState({finishCoats:e.target.value})},[1,2,3].map(x=>h('option',{value:x,key:x},x+' lớp'))))
                )
              : h('div',{className:'calc-data-warning'},'Chưa có sơn phủ đủ dữ liệu để tính chính xác.')
          );
        }
        form=h('div',{className:'calc-form calc-form-v3 calc-form-v4 calc-form-v5'},surfacePicker,tabs,commonInputs,pairBanner,primerPanel,finishPanel);
        var results=[];if(showPrimer&&groups.primers.length)results.push(this.resultCard('SƠN LÓT',primerR));if(showFinish&&groups.finishes.length)results.push(this.resultCard('SƠN PHỦ',finishR));var totalKnown=(showFinish?finishR.pricing.known:true)&&(showPrimer?primerR.pricing.known:true),totalCost=(showFinish?finishR.pricing.total:0)+(showPrimer?primerR.pricing.total:0);
        result=h('aside',{className:'calc-result calc-result-v3'},h('div',{className:'calc-result-topline'},h('span',{className:'calc-kicker'},mode==='system'?'KẾT QUẢ TOÀN BỘ HỆ SƠN':'KẾT QUẢ DỰ KIẾN'),h('span',{className:'surface-result-chip'},this.surfaceLabel())),h('div',{className:'calc-result-stack'},results),mode==='system'&&h('div',{className:'system-total'},h('div',null,h('span',null,'Tổng chi phí vật tư dự kiến'),h('small',null,'Tính theo giá đúng quy cách sản phẩm hiện có.')),h('strong',{className:totalKnown?'cost-known':'cost-pending'},totalKnown?money(totalCost):'Chưa đủ giá theo quy cách')),h(Btn,{kind:'red',className:'full',onClick:this.props.onQuote},'Nhận báo giá chính xác →'),h('small',{className:'estimate-note'},'Kết quả là ước tính hỗ trợ chọn mua dựa trên diện tích, khu vực sử dụng, quy cách và thông tin sản phẩm hiện có.'));
      }
      return h('section',{className:'calculator-section',id:'calculator'},h('div',{className:'container'},h(SectionHead,{eyebrow:'PAINT CALCULATOR V5',title:'Tính sơn theo toàn bộ catalog sản phẩm',desc:'Tìm sản phẩm theo thương hiệu hoặc dùng chế độ hệ sơn. Giá, quy cách và thông số được đồng bộ tự động từ website chính.'}),h('div',{className:'calculator-shell calculator-shell-v3 calculator-shell-v4 calculator-shell-v5'},form,result)));
    }
  }

  class Colors extends React.Component{
    constructor(p){super(p);this.state={search:'',group:'Tất cả',copied:''};}
    copy(code){if(!code)return;var self=this,done=function(){self.setState({copied:code});setTimeout(function(){self.setState({copied:''});},1100);},fallback=function(){try{var input=document.createElement('textarea');input.value=code;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();var ok=document.execCommand&&document.execCommand('copy');input.remove();if(ok)done();}catch(e){}};if(navigator.clipboard&&navigator.clipboard.writeText){try{var result=navigator.clipboard.writeText(code);if(result&&result.then)result.then(done).catch(fallback);else done();}catch(e){fallback();}}else fallback();}
    render(){var all=(this.props.data.colors||[]).filter(function(x){return x.enabled!==false});var groups=['Tất cả'];all.forEach(function(x){if(x.group&&groups.indexOf(x.group)<0)groups.push(x.group);});var q=this.state.search.trim().toLowerCase(),group=this.state.group;var items=all.filter(function(x){var ok=group==='Tất cả'||x.group===group;var text=((x.code||'')+' '+(x.name||'')).toLowerCase();return ok&&(!q||text.indexOf(q)>=0);}).slice(0,12);return h('section',{className:'colors-section',id:'colors'},h('div',{className:'container color-grid'},h(Reveal,{className:'color-copy'},h('span',{className:'section-kicker'},'COLOR DISCOVERY'),h('h2',null,'Màu sắc không chỉ để chọn. Màu sắc là cách hình dung không gian.'),h('p',null,'Tìm theo mã hoặc tên màu, lọc theo nhóm và copy mã trước khi mở bảng màu chính thức.'),h('div',{className:'color-tools'},h('input',{className:'color-search',placeholder:'Tìm mã màu, ví dụ S 1515-R40B',value:this.state.search,onChange:e=>this.setState({search:e.target.value})}),h('div',{className:'color-tabs'},groups.slice(0,7).map(g=>h('button',{type:'button',key:g,className:this.state.group===g?'active':'',onClick:()=>this.setState({group:g})},g)))),h('div',{className:'big-swatches color-explorer-grid'},items.map(c=>h('div',{className:'color-card mouse-spotlight',key:c.id||c.code,style:{background:c.hex||'#ccc'}},h('div',{className:'color-card-meta'},h('span',{className:'color-name'},c.name||c.group||'Màu sơn'),h('b',{className:'color-code'},c.code||'—')),h('div',{className:'color-card-actions'},h('button',{type:'button',onClick:()=>this.copy(c.code)},this.state.copied===c.code?'Đã copy':'Copy'),h('a',{href:this.props.data.site.colorUrl},'Xem →'))))),h('a',{className:'btn btn-dark magnetic',href:this.props.data.site.colorUrl},'Khám phá toàn bộ bảng màu →')),h(Reveal,{className:'color-room mouse-spotlight beam-card'},h('picture',null,h('source',{srcSet:'assets/color-room-v681-clean-768.webp 768w, assets/color-room-v681-clean.webp 1448w',sizes:'(max-width: 900px) 100vw, 52vw',type:'image/webp'}),h(SmartImage,{src:'assets/color-room-v681-clean.jpg',alt:'Không gian nội thất tham khảo với sơn Jotun',width:1448,height:1086,loading:'lazy'})),h('div',{className:'room-label'},h('b',null,'Không gian tham khảo'),h('span',null,'Màu hiển thị trên màn hình có thể khác màu thực tế.')))));}
  }

  function Faq(p){
    return h('section',{className:'section faq-section',id:'faq'},
      h('div',{className:'container'},
        h(SectionHead,{eyebrow:'FAQ',title:'Câu hỏi thường gặp'}),
        h('div',{className:'faq-list'},p.items.map(function(x){return h('details',{key:x.id},h('summary',null,x.question,h('span',null,'+')),h('p',null,x.answer));}))
      )
    );
  }
  function FinalCta(p){
    return h('section',{className:'final-cta'},
      h('div',{className:'container final-inner'},
        h('div',null,h('span',{className:'section-kicker light'},'CẦN TƯ VẤN?'),h('h2',null,'Chưa chắc nên chọn loại sơn nào?'),h('p',null,'Cho Tiến Bảo biết diện tích và nhu cầu, hệ thống sẽ giúp bạn đi từ lựa chọn đến báo giá.')),
        h('div',{className:'final-actions'},h(Btn,{kind:'red',onClick:function(){scrollToId('calculator')}},'Tính lượng sơn'),h(Btn,{kind:'white',onClick:p.onQuote},'Nhận báo giá'))
      )
    );
  }
  function Footer(p){
    var d=p.data.site;
    return h('footer',null,
      h('div',{className:'container footer-grid'},
        h('div',{className:'foot-brand'},h('img',{src:asset(d.logo)}),h('b',null,d.name),h('p',null,d.company)),
        h('div',null,h('h4',null,'Khám phá'),h('a',{href:d.catalogUrl},'Sản phẩm'),h('a',{href:d.colorUrl},'Bảng màu'),h('a',{href:d.priceUrl},'Bảng giá')),
        h('div',null,h('h4',null,'Liên hệ'),h('a',{href:'tel:'+d.hotline},'Hotline: '+d.hotlineDisplay),h('a',{href:'https://zalo.me/'+d.zalo,target:'_blank',rel:'noopener'},'Zalo tư vấn'),h('a',{href:'mailto:'+d.email},d.email),h('p',null,d.address))
      ),
      h('div',{className:'copyright'},'© 2026 Sơn Tiến Bảo • Tư vấn lựa chọn sơn cho nhà ở và công trình')
    );
  }

  class QuoteModal extends React.Component{
    constructor(p){super(p);this.state={name:'',phone:'',location:'',note:'',done:false};}
    submit(e){e.preventDefault();var phone=this.state.phone.replace(/[\s().-]/g,'');if(!this.state.name.trim()||!phone)return alert('Vui lòng nhập họ tên và số điện thoại.');if(!/^(?:0\d{9,10}|\+?84\d{9})$/.test(phone))return alert('Số điện thoại chưa đúng định dạng Việt Nam.');var a=itopApi();if(a&&a.isITopOrigin&&a.isITopOrigin()){var target=this.props.data.site.quoteUrl||'/lien-he.html';try{var u=new URL(target,location.origin);u.searchParams.set('name',this.state.name.trim());u.searchParams.set('phone',phone);if(this.state.location)u.searchParams.set('location',this.state.location.trim());if(this.state.note)u.searchParams.set('note',this.state.note.trim());u.searchParams.set('source','landing-v7');location.href=u.pathname+u.search;return;}catch(err){location.href=target;return;}}if(!isLocalPreview()){var target=this.props.data.site.quoteUrl||'https://sontienbao.com/lien-he.html';try{var u=new URL(target,'https://sontienbao.com/');u.searchParams.set('name',this.state.name.trim());u.searchParams.set('phone',phone);if(this.state.location)u.searchParams.set('location',this.state.location.trim());if(this.state.note)u.searchParams.set('note',this.state.note.trim());u.searchParams.set('source','landing-v7-github');location.href=u.toString();return;}catch(err){location.href='https://sontienbao.com/lien-he.html';return;}}var leads=loadLeads();leads.unshift({id:uid('lead'),name:this.state.name.trim(),phone:phone,location:this.state.location.trim(),note:this.state.note.trim(),status:'Mới',createdAt:new Date().toISOString(),source:'local-preview'});saveLeads(leads);this.setState({done:true});}
    render(){
      var content;
      if(this.state.done){
        content=h('div',{className:'success-state'},h('div',{className:'success-check'},'✓'),h('h2',null,'Đã lưu yêu cầu báo giá'),h('p',null,'Yêu cầu đã được lưu vào Admin trên trình duyệt này.'),h('a',{className:'btn btn-red',href:'tel:'+this.props.data.site.hotline},'Gọi Tiến Bảo'));
      } else {
        content=h('form',{onSubmit:this.submit.bind(this)},
          h('span',{className:'section-kicker'},'BÁO GIÁ'),h('h2',null,'Nhận báo giá nhanh'),h('p',null,'Chỉ cần thông tin liên hệ. Bạn không phải nhập lại toàn bộ calculator.'),
          h('label',null,'Họ tên *',h('input',{name:'name',autoComplete:'name',required:true,value:this.state.name,onChange:e=>this.setState({name:e.target.value})})),
          h('label',null,'Số điện thoại *',h('input',{name:'phone',type:'tel',inputMode:'tel',autoComplete:'tel',required:true,value:this.state.phone,onChange:e=>this.setState({phone:e.target.value})})),
          h('label',null,'Tỉnh / Thành phố',h('input',{name:'location',autoComplete:'address-level1',value:this.state.location,onChange:e=>this.setState({location:e.target.value})})),
          h('label',null,'Ghi chú',h('textarea',{rows:3,value:this.state.note,onChange:e=>this.setState({note:e.target.value})})),
          h(Btn,{kind:'red',className:'full',type:'submit'},'Gửi yêu cầu báo giá')
        );
      }
      return h('div',{className:'modal-backdrop',onMouseDown:e=>{if(e.target===e.currentTarget)this.props.onClose();}},h('div',{className:'quote-modal',role:'dialog','aria-modal':'true','aria-label':'Nhận báo giá Sơn Tiến Bảo'},h('button',{className:'modal-x',onClick:this.props.onClose,'aria-label':'Đóng form báo giá'},'×'),content));
    }
  }

  class Admin extends React.Component{
    constructor(p){super(p);this.state={authLoading:true,logged:false,authMode:'checking',authMessage:'',authUser:null,tab:'dashboard',data:normalizeData(p.data),edit:null,editType:null,leads:loadLeads(),toast:'',query:''};}
    componentDidMount(){var self=this,a=itopApi();if(!a){this.setState({authLoading:false,logged:false,authMode:'unavailable',authMessage:'iTop Adapter chưa được tải.'});return;}a.getSession().then(function(res){self.setState({authLoading:false,logged:!!(res&&res.authenticated),authMode:res&&res.mode||'unknown',authMessage:res&&res.message||'',authUser:res&&res.user||null});}).catch(function(err){self.setState({authLoading:false,logged:false,authMode:'error',authMessage:String(err&&err.message||err)});});}
    login(e){if(e)e.preventDefault();var a=itopApi();if(!a)return;if(a.isLocal&&a.isLocal()){this.setState({logged:true,authMode:'local-preview',authUser:{name:'Local Preview'},authMessage:''});return;}location.href=a.adminHome||'/admin';}
    retryAuth(){this.setState({authLoading:true,authMessage:''});this.componentDidMount();}
    notify(t){this.setState({toast:t});setTimeout(()=>this.setState({toast:''}),1800);}
    persist(d,msg){var safe=normalizeData(d);safe.activityLogs.unshift({id:uid('log'),action:'content_update',detail:msg||'Cập nhật nội dung',createdAt:nowIso()});safe.activityLogs=safe.activityLogs.slice(0,120);saveData(safe);this.setState({data:clone(safe)});this.props.onSave(safe);this.notify(msg||'Đã lưu');}
    openEdit(type,item){this.setState({editType:type,edit:clone(item)});}
    closeEdit(){this.setState({edit:null,editType:null});}
    saveEdit(item){var d=clone(this.state.data),type=this.state.editType;if(type==='product'){var i=d.products.findIndex(x=>x.id===item.id);if(i<0)d.products.unshift(item);else d.products[i]=item;}if(type==='category'){var j=d.categories.findIndex(x=>x.id===item.id);if(j<0)d.categories.push(item);else d.categories[j]=item;}if(type==='brand'){var k=d.brands.findIndex(x=>x.id===item.id);if(k<0)d.brands.push(item);else d.brands[k]=item;}if(type==='faq'){var f=d.faqs.findIndex(x=>x.id===item.id);if(f<0)d.faqs.push(item);else d.faqs[f]=item;}if(type==='color'){var c=d.colors.findIndex(x=>x.id===item.id);if(c<0)d.colors.unshift(item);else d.colors[c]=item;}if(type==='banner'){var b=d.banners.findIndex(x=>x.id===item.id);if(b<0)d.banners.unshift(item);else d.banners[b]=item;}this.persist(d,'Đã lưu '+type);this.closeEdit();}
    remove(type,id){if(!confirm('Xóa mục này?'))return;var d=clone(this.state.data);var key={product:'products',category:'categories',brand:'brands',faq:'faqs',color:'colors',banner:'banners'}[type];if(!key)return;d[key]=(d[key]||[]).filter(x=>x.id!==id);this.persist(d,'Đã xóa '+type);}
    exportData(){download('sontienbao-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(this.state.data,null,2));}
    importData(file){if(!file)return;var r=new FileReader();r.onload=()=>{try{var d=JSON.parse(r.result);if(!d.products||!d.categories)throw 0;this.persist(d,'Đã nhập dữ liệu');}catch(e){alert('File JSON không hợp lệ')}};r.readAsText(file);}
    reset(){if(confirm('Khôi phục dữ liệu mẫu và xóa các chỉnh sửa local?')){storageRemove('local',DATA_KEY);LEGACY_KEYS.forEach(function(k){storageRemove('local',k)});var d=normalizeData({});this.persist(d,'Đã khôi phục dữ liệu mẫu');}}
    render(){if(this.state.authLoading)return h(AdminAuthLoading);if(!this.state.logged)return h(AdminLogin,{mode:this.state.authMode,message:this.state.authMessage,onSubmit:this.login.bind(this),onRetry:this.retryAuth.bind(this)});var d=this.state.data;var notice=(this.state.leads||[]).filter(function(x){return x.status==='Mới';}).length+(d.popups||[]).filter(function(x){return popupIsActive(x);}).length;var self=this;return h('div',{className:'admin-shell'},h(AdminSidebar,{tab:this.state.tab,onTab:t=>this.setState({tab:t,query:''}),onLogout:function(){var a=itopApi();if(self.state.authMode==='itop-live'&&a){location.href=a.logoutUrl||'/admin/logout';return;}self.setState({logged:false,authUser:null});}}),h('main',{className:'admin-main'},h(AdminTop,{tab:this.state.tab,query:this.state.query,onQuery:q=>this.setState({query:q}),onTab:t=>this.setState({tab:t,query:''}),notifications:notice,user:{email:this.state.authMode==='itop-live'?'iTop Admin':'Local Preview'}}),this.state.query&&h(AdminGlobalSearch,{data:d,leads:this.state.leads,query:this.state.query,onNavigate:t=>this.setState({tab:t,query:''})}),this.renderTab(),this.state.edit&&h(EditModal,{type:this.state.editType,item:this.state.edit,onClose:this.closeEdit.bind(this),onSave:this.saveEdit.bind(this)}),this.state.toast&&h('div',{className:'toast'},this.state.toast)),h('a',{className:'preview-fab',href:'index.html'},'↗ Xem website'));
    }
    renderTab(){
      var t=this.state.tab,d=this.state.data,live=this.state.authMode==='itop-live';
      if(t==='dashboard')return h('div',null,h(ITopConnectionCard,{mode:this.state.authMode,message:this.state.authMessage}),h(Dashboard,{data:d,leads:this.state.leads,onProduct:()=>this.setState({tab:'products'})}));
      if(t==='products')return live?h(ITopProductManager):h(AdminList,{title:'Sản phẩm • Local Preview',items:d.products||[],type:'product',onAdd:()=>this.openEdit('product',{id:uid('product'),brand:'JOTUN',name:'Sản phẩm mới',category:'Sơn',description:'',image:'assets/jotun-ben-mau-toan-dien.jpg',price:0,oldPrice:0,pricePrefix:'Từ',unit:'',badge:'',featured:true,url:d.site.catalogUrl,coverage:0,coverageLabel:'',variants:[],enabled:true}),onEdit:this.openEdit.bind(this,'product'),onDelete:this.remove.bind(this,'product')});
      if(t==='colors')return live?h(ITopColorManager):h(ColorManager,{items:d.colors||[],onAdd:()=>this.openEdit('color',{id:uid('color'),code:'S 0000-N',name:'Màu mới',hex:'#cccccc',group:'Khác',enabled:true}),onEdit:this.openEdit.bind(this,'color'),onDelete:this.remove.bind(this,'color')});
      if(t==='categories')return h(AdminList,{title:'Danh mục Landing',items:d.categories||[],type:'category',onAdd:()=>this.openEdit('category',{id:uid('cat'),name:'Danh mục mới',description:'',image:'assets/category-1.jpg',url:d.site.catalogUrl,enabled:true}),onEdit:this.openEdit.bind(this,'category'),onDelete:this.remove.bind(this,'category')});
      if(t==='brands')return h(AdminList,{title:'Thương hiệu Landing',items:d.brands||[],type:'brand',onAdd:()=>this.openEdit('brand',{id:uid('brand'),name:'Thương hiệu mới',logo:'assets/logo-jotun.png',url:'https://sontienbao.com/',enabled:true}),onEdit:this.openEdit.bind(this,'brand'),onDelete:this.remove.bind(this,'brand')});
      if(t==='media')return live?h(ITopMediaManager):h(MediaManager,{items:d.media||[],onChange:items=>{var x=clone(d);x.media=items;this.persist(x,'Đã cập nhật Media Library')}});
      if(t==='banners')return h(AdminList,{title:'Banner Landing • cấu hình frontend',items:d.banners||[],type:'banner',onAdd:()=>this.openEdit('banner',{id:uid('banner'),title:'Banner mới',subtitle:'Mô tả chương trình hoặc công cụ.',image:'assets/color-room-v68.webp',ctaLabel:'Xem chi tiết',ctaUrl:'#',order:1,startAt:'',endAt:'',enabled:true}),onEdit:this.openEdit.bind(this,'banner'),onDelete:this.remove.bind(this,'banner')});
      if(t==='popups')return h(PopupManager,{items:d.popups||[],onChange:items=>{var x=clone(d);x.popups=items;this.persist(x,'Đã cập nhật Popup Manager')}});
      if(t==='faq')return h(AdminList,{title:'FAQ',items:d.faqs||[],type:'faq',onAdd:()=>this.openEdit('faq',{id:uid('faq'),question:'Câu hỏi mới',answer:'Câu trả lời',enabled:true}),onEdit:this.openEdit.bind(this,'faq'),onDelete:this.remove.bind(this,'faq')});
      if(t==='leads')return h(Leads,{items:this.state.leads,onChange:items=>{saveLeads(items);this.setState({leads:items})}});
      if(t==='hero')return h(SettingsEditor,{title:'Hero / Trang chủ',sections:[['hero',d.hero]],onSave:obj=>{var x=clone(d);x.hero=obj.hero;this.persist(x,'Đã cập nhật Hero')}});
      if(t==='templates')return h(TemplateStudio,{data:d,onApply:(theme,msg)=>{var x=clone(d);x.theme=mergeSafe(DEFAULT.theme,theme);this.persist(x,msg||'Đã áp dụng template')}});
      if(t==='activity')return h(ActivityManager,{items:d.activityLogs||[],onClear:()=>{var x=clone(d);x.activityLogs=[];this.persist(x,'Đã xóa Activity Logs')}});
      if(t==='settings')return h(SettingsEditor,{title:'Liên hệ, SEO & giao diện',sections:[['site',d.site],['seo',d.seo],['theme',d.theme],['calculator',d.calculator]],onSave:obj=>{var x=clone(d);['site','seo','theme','calculator'].forEach(k=>x[k]=obj[k]);this.persist(x,'Đã cập nhật cài đặt')}});
      if(t==='security')return h(SecuritySettings,{mode:this.state.authMode});
      if(t==='backup')return h('section',{className:'admin-card backup-card'},h('h2',null,'Sao lưu cấu hình Landing'),h('p',null,'Sản phẩm/ảnh live nằm trong iTop. File JSON này chỉ sao lưu cấu hình giao diện Landing đang chỉnh.'),h('div',{className:'backup-actions'},h(Btn,{kind:'red',onClick:this.exportData.bind(this)},'Xuất JSON'),h('label',{className:'btn btn-dark'},'Nhập JSON',h('input',{type:'file',accept:'.json',hidden:true,onChange:e=>this.importData(e.target.files[0])})),h(Btn,{kind:'outline',onClick:this.reset.bind(this)},'Khôi phục dữ liệu mẫu')));
      return null;
    }
  }

  function AdminAuthLoading(){return h('div',{className:'admin-login'},h('div',{className:'login-card'},h('img',{src:'assets/logo-tien-bao.png'}),h('span',{className:'section-kicker'},'ITOP SESSION'),h('h1',null,'Đang kiểm tra phiên iTop'),h('p',null,'Admin V7 sử dụng chính cookie/session của iTop hiện tại, không cần Supabase hay server mới.'),h('div',{className:'auth-spinner'})));}
  function AdminLogin(p){var live=p.mode==='itop-live'||p.mode==='cross-origin';return h('div',{className:'admin-login'},h('div',{className:'login-card mouse-spotlight'},h('img',{src:'assets/logo-tien-bao.png'}),h('span',{className:'section-kicker'},'ITOP NATIVE AUTH'),h('h1',null,'Cần phiên đăng nhập iTop'),h('p',null,'Admin mới không lưu mật khẩu riêng. Khi chạy trên sontienbao.com, nó dùng trực tiếp phiên đăng nhập iTop của bạn.'),p.message&&h('div',{className:'auth-config-warning'},h('b',null,'Trạng thái'),h('span',null,p.message)),h('form',{onSubmit:p.onSubmit},h(Btn,{kind:'red',className:'full',type:'submit'},live?'Mở iTop để đăng nhập →':'Mở Admin Preview →'),h(Btn,{kind:'outline',className:'full',type:'button',onClick:p.onRetry},'Kiểm tra lại phiên')),h('small',null,'Để Product/Color/Media ghi trực tiếp iTop, hãy upload V7 vào cùng domain sontienbao.com.'),h('a',{href:'index.html'},'← Quay lại website')));}
  function AdminSidebar(p){var items=[['dashboard','Tổng quan','⌂'],['products','Sản phẩm','▣'],['colors','Bảng màu','◉'],['categories','Danh mục','⌘'],['brands','Thương hiệu','◇'],['media','Media Library','▤'],['banners','Banner Manager','▰'],['popups','Popup Manager','◆'],['hero','Hero / Trang chủ','✦'],['templates','Template Studio','◫'],['faq','FAQ','?'],['leads','Yêu cầu báo giá','☏'],['activity','Activity Logs','≡'],['settings','Liên hệ & SEO','⚙'],['security','Bảo mật & mật khẩu','◈'],['backup','Sao lưu dữ liệu','⇅']];return h('aside',{className:'admin-side'},h('div',{className:'admin-brand'},h('img',{src:'assets/logo-tien-bao.png'}),h('div',null,h('b',null,'Sơn Tiến Bảo'),h('small',null,'iTop Native Studio'))),h('nav',{className:'admin-nav-scroll'},items.map(function(x){return h('button',{key:x[0],className:p.tab===x[0]?'active':'',onClick:function(){p.onTab(x[0]);}},h('span',null,x[2]),h('b',null,x[1]));})),h('div',{className:'admin-side-footer'},h('button',{className:'logout',onClick:p.onLogout},'↪ ',h('b',null,'Đăng xuất'))));}
  function AdminTop(p){var tabs=[['dashboard','Dashboard'],['products','Sản phẩm'],['colors','Bảng màu'],['categories','Danh mục'],['media','Media'],['banners','Banner'],['popups','Popup'],['templates','Template'],['leads','Leads'],['settings','Cài đặt'],['security','Bảo mật']];var email=p.user&&p.user.email||'iTop Admin';return h('header',{className:'admin-top'},h('div',null,h('h1',null,p.tab==='dashboard'?'Dashboard':'Quản lý '+p.tab),h('p',null,'Sơn Tiến Bảo • Content Studio V7 • iTop Native'),h('select',{className:'admin-mobile-nav',value:p.tab,onChange:e=>p.onTab(e.target.value)},tabs.map(function(x){return h('option',{key:x[0],value:x[0]},x[1]);}))),h('div',{className:'admin-top-actions'},h('label',{className:'admin-search'},'⌕',h('input',{value:p.query||'',placeholder:'Tìm sản phẩm, màu, lead, popup…',onChange:e=>p.onQuery(e.target.value)})),h('button',{className:'admin-bell',title:'Thông báo'},'♢',p.notifications>0&&h('b',null,p.notifications)),h('div',{className:'admin-user'},h('span',{className:'avatar'},String(email).slice(0,1).toUpperCase()),h('span',null,h('b',null,'Admin'),h('small',null,email)))));}
  function Dashboard(p){var d=p.data||{},products=d.products||[],colors=d.colors||[],popups=d.popups||[],media=d.media||[],leads=p.leads||[],logs=d.activityLogs||[];var active=popups.filter(function(x){return popupIsActive(x);}).length,newLeads=leads.filter(function(x){return x.status==='Mới';}).length;var brands={};products.forEach(function(x){brands[x.brand||'Khác']=(brands[x.brand||'Khác']||0)+1;});var brandRows=Object.keys(brands).map(function(k){return [k,brands[k]];}).sort(function(a,b){return b[1]-a[1];});return h('div',{className:'dashboard'},h('div',{className:'stat-grid'},h(Stat,{label:'Tổng sản phẩm',value:products.length,delta:'CRUD trong CMS'}),h(Stat,{label:'Màu đang quản lý',value:colors.length,delta:'Color Explorer'}),h(Stat,{label:'Lead mới',value:newLeads,delta:'chờ xử lý'}),h(Stat,{label:'Popup đang chạy',value:active,delta:popups.length+' tổng popup'})),h('div',{className:'dash-grid'},h('section',{className:'admin-card span2'},h('div',{className:'card-head'},h('div',null,h('h2',null,'Sản phẩm mới nhất'),h('p',null,'Dữ liệu đang được website sử dụng.')),h(Btn,{kind:'red',onClick:p.onProduct},'+ Quản lý')),h('table',null,h('thead',null,h('tr',null,h('th',null,'Sản phẩm'),h('th',null,'Danh mục'),h('th',null,'Giá'),h('th',null,'Trạng thái'))),h('tbody',null,products.slice(0,6).map(function(x){return h('tr',{key:x.id},h('td',null,h('div',{className:'mini-prod'},h(SmartImage,{src:x.image,alt:x.name,width:56,height:56}),h('span',null,x.name))),h('td',null,x.category),h('td',null,money(x.price)),h('td',null,h('span',{className:cx('status',x.enabled!==false?'green':'gray')},x.enabled!==false?'Hiển thị':'Ẩn')));})))),h('section',{className:'admin-card'},h('h2',null,'Cơ cấu sản phẩm'),brandRows.length?brandRows.slice(0,6).map(function(x){var pct=Math.round(x[1]/Math.max(1,products.length)*100);return h('div',{className:'metric-row',key:x[0]},h('span',null,x[0]),h('div',{className:'metric-bar'},h('i',{style:{width:pct+'%'}})),h('b',null,x[1]));}):h('div',{className:'empty'},'Chưa có dữ liệu')),h('section',{className:'admin-card'},h('h2',null,'Hệ thống nội dung'),h('div',{className:'quick-metrics'},h('div',null,h('strong',null,media.length),h('span',null,'Media')),h('div',null,h('strong',null,(d.banners||[]).length),h('span',null,'Banner')),h('div',null,h('strong',null,(d.categories||[]).length),h('span',null,'Danh mục')),h('div',null,h('strong',null,leads.length),h('span',null,'Leads')))),h('section',{className:'admin-card span2'},h('h2',null,'Hoạt động gần đây'),logs.length?h('div',{className:'activity-list'},logs.slice(0,7).map(function(x){return h('div',{className:'activity',key:x.id},h('span',{className:'avatar sm'},'•'),h('div',null,h('b',null,x.detail||x.action),h('small',null,new Date(x.createdAt).toLocaleString('vi-VN'))));})):h('div',{className:'empty'},'Chưa có hoạt động'))));}
  function Stat(p){return h('div',{className:'stat-card'},h('small',null,p.label),h('strong',null,p.value),h('span',null,p.delta));}
  function AdminList(p){var items=Array.isArray(p.items)?p.items:[];return h('section',{className:'admin-card list-card'},h('div',{className:'card-head'},h('div',null,h('h2',null,p.title),h('p',null,'Thêm, sửa, xóa và thay đổi trạng thái hiển thị.')),h(Btn,{kind:'red',onClick:p.onAdd},'+ Thêm mới')),items.length?h('div',{className:'admin-list'},items.map(function(x){var img=x.image||x.logo;return h('div',{className:'admin-row',key:x.id},img&&h(SmartImage,{src:img,alt:x.name||x.title||'',width:52,height:52}),h('div',{className:'row-main'},h('b',null,x.name||x.title||x.question),h('small',null,x.category||x.description||x.subtitle||x.url||'')),p.type==='product'&&h('strong',{className:'row-price'},money(x.price)),p.type==='banner'&&h('strong',{className:'row-price'},'#'+Number(x.order||0)),h('span',{className:cx('status',x.enabled!==false?'green':'gray')},x.enabled!==false?'Hiển thị':'Ẩn'),h('div',{className:'row-actions'},h('button',{onClick:()=>p.onEdit(x)},'✎'),h('button',{onClick:()=>p.onDelete(x.id)},'⌫')));})):h('div',{className:'empty'},'Chưa có dữ liệu.'));}
  function Leads(p){function change(id,status){var a=clone(p.items),x=a.find(l=>l.id===id);if(x)x.status=status;p.onChange(a);}function del(id){if(!confirm('Xóa yêu cầu này?'))return;p.onChange(p.items.filter(x=>x.id!==id));}return h('section',{className:'admin-card list-card'},h('div',{className:'card-head'},h('div',null,h('h2',null,'Yêu cầu báo giá'),h('p',null,'Lead local chỉ dùng cho Live Server preview. Khi chạy cùng sontienbao.com, form chuyển sang trang liên hệ iTop hiện tại.'))),p.items.length?h('div',{className:'admin-list'},p.items.map(x=>h('div',{className:'lead-row',key:x.id},h('div',{className:'row-main'},h('b',null,x.name+' • '+x.phone),h('small',null,(x.location||'Chưa có địa điểm')+' • '+new Date(x.createdAt).toLocaleString('vi-VN')),x.note&&h('p',null,x.note)),h('select',{value:x.status,onChange:e=>change(x.id,e.target.value)},['Mới','Đã liên hệ','Đang xử lý','Hoàn tất'].map(s=>h('option',{key:s},s))),h('button',{className:'danger-icon',onClick:()=>del(x.id)},'⌫')))):h('div',{className:'empty'},'Chưa có yêu cầu báo giá.'));
  }


  function SecuritySettings(p){var api=itopApi(),live=p.mode==='itop-live';return h('section',{className:'security-page'},h('div',{className:'admin-card security-card'},h('div',{className:'card-head'},h('div',null,h('span',{className:'section-kicker'},'ITOP SECURITY'),h('h2',null,'Tài khoản & mật khẩu iTop'),h('p',null,'Không tạo tài khoản/mật khẩu thứ hai. Bảo mật được quản lý bằng module Tài khoản có sẵn của iTop.')),h('span',{className:'security-shield'},'◈')),live?h('div',null,h('p',{className:'security-note'},'Bạn đang dùng phiên iTop Live. Mở trang Tài khoản để đổi thông tin/mật khẩu theo cơ chế sẵn có của CMS.'),h('a',{className:'btn btn-red',href:api&&api.profileUrl||'/admin/profile',target:'_blank'},'Mở Tài khoản iTop →'),h('iframe',{className:'itop-profile-frame',src:api&&api.profileUrl||'/admin/profile',title:'Tài khoản iTop'})):h('div',{className:'security-local-note'},h('b',null,'Local Preview'),h('span',null,'Chức năng mật khẩu thật chỉ hoạt động sau khi upload cùng domain sontienbao.com.'))),h('aside',{className:'admin-card security-tips'},h('h2',null,'Kiến trúc V7'),h('ul',null,h('li',null,'Không dùng Supabase.'),h('li',null,'Không lưu mật khẩu trong localStorage.'),h('li',null,'Dùng cookie/session hiện tại của iTop.'),h('li',null,'Product/Color/Media thao tác trên endpoint iTop cùng domain.'))));}

  function AdminGlobalSearch(p){var q=(p.query||'').trim().toLowerCase();if(!q)return null;var rows=[];function add(type,tab,label,sub){var text=(label+' '+(sub||'')).toLowerCase();if(text.indexOf(q)>=0)rows.push({type:type,tab:tab,label:label,sub:sub||''});}(p.data.products||[]).forEach(function(x){add('Sản phẩm','products',x.name,x.category);});(p.data.colors||[]).forEach(function(x){add('Màu','colors',x.code,x.name);});(p.leads||[]).forEach(function(x){add('Lead','leads',x.name,x.phone);});(p.data.popups||[]).forEach(function(x){add('Popup','popups',x.title,x.name);});(p.data.banners||[]).forEach(function(x){add('Banner','banners',x.title,x.subtitle);});return h('div',{className:'global-search-panel'},h('div',{className:'global-search-head'},h('b',null,'Kết quả tìm kiếm'),h('span',null,rows.length+' kết quả')),rows.length?rows.slice(0,12).map(function(x,i){return h('button',{key:i,onClick:function(){p.onNavigate(x.tab);}},h('span',{className:'search-type'},x.type),h('div',null,h('b',null,x.label),h('small',null,x.sub)),'→');}):h('div',{className:'empty'},'Không tìm thấy dữ liệu phù hợp.'));}

  function ITopConnectionCard(p){var live=p.mode==='itop-live',local=p.mode==='local-preview';return h('section',{className:'admin-card itop-connection-card'},h('div',{className:'card-head'},h('div',null,h('span',{className:'section-kicker'},'DATA SOURCE'),h('h2',null,live?'iTop Live đang kết nối':(local?'Local Preview':'iTop chưa kết nối')),h('p',null,live?'Sản phẩm, bảng màu và Media dùng trực tiếp backend hiện tại của sontienbao.com. Không có database thứ hai.':(p.message||'Local Preview không ghi vào iTop.'))),h('span',{className:cx('status',live?'green':'gray')},live?'LIVE':'PREVIEW')),live&&h('div',{className:'itop-quick-links'},h('a',{className:'btn btn-dark',href:'/admin/product',target:'_blank'},'Sản phẩm iTop ↗'),h('a',{className:'btn btn-outline',href:'/admin/profile',target:'_blank'},'Tài khoản iTop ↗')));}

  class ITopQuickEdit extends React.Component{
    constructor(p){super(p);var x=p.item||{};this.state={title:x.title||'',code:x.code||'',price:Number(x.price||0),price_sale:Number(x.sale_price||x.price_sale||0),is_published:String(x.is_published)!=='0',busy:false,error:''};}
    save(e){e.preventDefault();var self=this,a=itopApi();this.setState({busy:true,error:''});a.updateProduct(this.props.item.id,{title:this.state.title,code:this.state.code,price:Number(this.state.price||0),price_sale:Number(this.state.price_sale||0),is_published:this.state.is_published}).then(function(){self.setState({busy:false});self.props.onSaved();}).catch(function(err){self.setState({busy:false,error:String(err&&err.message||err)});});}
    render(){return h('div',{className:'modal-backdrop'},h('form',{className:'edit-modal itop-quick-edit',onSubmit:this.save.bind(this)},h('div',{className:'modal-head'},h('div',null,h('span',{className:'section-kicker'},'ITOP LIVE'),h('h2',null,'Sửa nhanh sản phẩm #'+this.props.item.id)),h('button',{type:'button',onClick:this.props.onClose},'×')),h('div',{className:'form-grid'},h('label',null,'Tên sản phẩm',h('input',{value:this.state.title,onChange:e=>this.setState({title:e.target.value})})),h('label',null,'Mã sản phẩm',h('input',{value:this.state.code,onChange:e=>this.setState({code:e.target.value})})),h('label',null,'Giá bán',h('input',{type:'number',value:this.state.price,onChange:e=>this.setState({price:e.target.value})})),h('label',null,'Giá khuyến mãi',h('input',{type:'number',value:this.state.price_sale,onChange:e=>this.setState({price_sale:e.target.value})}))),h('label',{className:'setting-check'},h('input',{type:'checkbox',checked:this.state.is_published,onChange:e=>this.setState({is_published:e.target.checked})}),' Hiển thị sản phẩm'),this.state.error&&h('div',{className:'security-message error'},this.state.error),h('div',{className:'modal-actions'},h(Btn,{kind:'outline',type:'button',onClick:this.props.onClose},'Hủy'),h(Btn,{kind:'red',type:'submit',disabled:this.state.busy},this.state.busy?'Đang lưu…':'Lưu trực tiếp iTop'))));}
  }

  class ITopProductManager extends React.Component{
    constructor(p){super(p);this.state={query:'',catId:'',items:[],total:0,loading:true,error:'',edit:null};}
    componentDidMount(){this.search();}
    search(){var self=this,a=itopApi();this.setState({loading:true,error:''});a.searchProducts(this.state.query,this.state.catId,0,30).then(function(r){self.setState({items:r.items,total:r.recordsFiltered,loading:false});}).catch(function(e){self.setState({error:String(e.message||e),loading:false});});}
    remove(x){if(!confirm('Xóa sản phẩm #'+x.id+' khỏi iTop?'))return;var self=this;itopApi().deleteProduct(x.id).then(function(){self.search();}).catch(function(e){self.setState({error:e.message});});}
    move(x,d){var self=this;itopApi().moveProduct(x.id,d).then(function(){self.search();}).catch(function(e){self.setState({error:e.message});});}
    duplicate(x){var self=this;itopApi().duplicateProduct(x.id).then(function(){self.search();}).catch(function(e){self.setState({error:e.message});});}
    render(){var a=itopApi();return h('section',{className:'admin-card itop-live-manager'},h('div',{className:'card-head'},h('div',null,h('span',{className:'section-kicker'},'ITOP LIVE'),h('h2',null,'Sản phẩm iTop'),h('p',null,'Tìm kiếm và sửa trực tiếp dữ liệu sản phẩm hiện tại.')),h('a',{className:'btn btn-red',href:(a&&a.productCreateUrl||'/admin/product/create'),target:'_blank'},'+ Tạo sản phẩm iTop')),h('div',{className:'manager-toolbar'},h('input',{placeholder:'Tên hoặc mã sản phẩm…',value:this.state.query,onChange:e=>this.setState({query:e.target.value})}),h('input',{placeholder:'ID danh mục (tuỳ chọn)',value:this.state.catId,onChange:e=>this.setState({catId:e.target.value})}),h(Btn,{kind:'dark',onClick:this.search.bind(this)},'Tìm iTop'),h('span',null,this.state.total+' kết quả')),this.state.error&&h('div',{className:'security-message error'},this.state.error),this.state.loading?h('div',{className:'empty'},'Đang tải dữ liệu iTop…'):h('div',{className:'admin-list'},this.state.items.map(x=>h('div',{className:'admin-row itop-row',key:x.id},x.thumbnail&&x.thumbnail.img_path&&h('img',{src:x.thumbnail.img_path,alt:''}),h('div',{className:'row-main'},h('b',null,'#'+x.id+' • '+(x.code||'')),h('small',null,x.title||x.description&&x.description.title||'')),h('strong',{className:'row-price'},x.sale_price_formated&&x.sale_price_formated!=='0đ'?x.sale_price_formated:(x.price_formated||money(x.price))),h('span',{className:cx('status',String(x.is_published)==='1'?'green':'gray')},String(x.is_published)==='1'?'Hiển thị':'Ẩn'),h('div',{className:'row-actions wide'},h('button',{title:'Sửa nhanh',onClick:()=>this.setState({edit:x})},'✎'),h('a',{title:'Mở iTop gốc',href:x.route_edit||('/admin/product/'+x.id+'/edit'),target:'_blank'},'↗'),h('button',{title:'Lên',onClick:()=>this.move(x,'up')},'↑'),h('button',{title:'Xuống',onClick:()=>this.move(x,'down')},'↓'),h('button',{title:'Nhân bản',onClick:()=>this.duplicate(x)},'⧉'),h('button',{title:'Xóa',onClick:()=>this.remove(x)},'⌫'))))),this.state.edit&&h(ITopQuickEdit,{item:this.state.edit,onClose:()=>this.setState({edit:null}),onSaved:()=>{this.setState({edit:null});this.search();}}));}
  }

  class ITopColorManager extends React.Component{
    constructor(p){super(p);this.state={query:'',items:[],total:0,loading:true,error:''};}
    componentDidMount(){this.search();}
    search(){var self=this,a=itopApi(),cat=(a&&a.config&&a.config.colorCategoryId)||'151';this.setState({loading:true,error:''});a.searchProducts(this.state.query,cat,0,60).then(function(r){self.setState({items:r.items,total:r.recordsFiltered,loading:false});}).catch(function(e){self.setState({error:e.message,loading:false});});}
    render(){var cat=(itopApi().config&&itopApi().config.colorCategoryId)||'151';return h('section',{className:'admin-card color-manager'},h('div',{className:'card-head'},h('div',null,h('span',{className:'section-kicker'},'ITOP COLOR PRODUCTS'),h('h2',null,'Bảng màu iTop • danh mục '+cat),h('p',null,'Mã màu được đọc trực tiếp từ sản phẩm iTop; không tạo database màu thứ hai.')),h('a',{className:'btn btn-red',href:'/admin/product/create?cat_id='+encodeURIComponent(cat),target:'_blank'},'+ Tạo mã màu')),h('div',{className:'manager-toolbar'},h('input',{placeholder:'Tìm mã màu, ví dụ S 1515-R40B…',value:this.state.query,onChange:e=>this.setState({query:e.target.value})}),h(Btn,{kind:'dark',onClick:this.search.bind(this)},'Tìm iTop'),h('span',null,this.state.total+' sản phẩm màu')),this.state.error&&h('div',{className:'security-message error'},this.state.error),this.state.loading?h('div',{className:'empty'},'Đang tải màu iTop…'):h('div',{className:'color-admin-grid'},this.state.items.map(x=>h('a',{className:'color-admin-card',key:x.id,href:x.route_edit||('/admin/product/'+x.id+'/edit'),target:'_blank'},x.thumbnail&&x.thumbnail.img_path?h('img',{className:'itop-color-thumb',src:x.thumbnail.img_path,alt:x.code||''}):h('div',{className:'color-chip'}),h('div',{className:'row-main'},h('b',null,x.code||('ID '+x.id)),h('small',null,x.title||x.description&&x.description.title||'')),h('span',{className:'status green'},'Sửa iTop ↗')))));}
  }

  class ITopMediaManager extends React.Component{
    constructor(p){super(p);this.state={items:[],loading:true,error:'',uploading:false};}
    componentDidMount(){this.load();}
    load(){var self=this;this.setState({loading:true,error:''});itopApi().listMedia(1,40).then(function(items){self.setState({items:items,loading:false});}).catch(function(e){self.setState({error:e.message,loading:false});});}
    upload(files){var self=this,list=Array.prototype.slice.call(files||[]);if(!list.length)return;this.setState({uploading:true,error:''});(async function(){try{for(var i=0;i<list.length;i++)await itopApi().uploadMedia(list[i]);self.setState({uploading:false});self.load();}catch(e){self.setState({uploading:false,error:e.message});}})();}
    render(){return h('section',{className:'admin-card media-manager'},h('div',{className:'card-head'},h('div',null,h('span',{className:'section-kicker'},'ITOP MEDIA'),h('h2',null,'Media Library iTop'),h('p',null,'Upload và xem ảnh trực tiếp từ Media hiện tại của iTop.')),h('label',{className:'btn btn-red'},this.state.uploading?'Đang upload…':'Upload ảnh',h('input',{type:'file',accept:'image/*',multiple:true,hidden:true,disabled:this.state.uploading,onChange:e=>this.upload(e.target.files)}))),this.state.error&&h('div',{className:'security-message error'},this.state.error),this.state.loading?h('div',{className:'empty'},'Đang tải Media iTop…'):h('div',{className:'media-grid'},this.state.items.map(x=>h('div',{className:'media-card',key:x.id},h('img',{src:x.thumb||x.thumbnail||x.full_url||((x.url&&/^https?:/.test(x.url))?x.url:('https://media.loveitopcdn.com/41744/thumb/150x150/'+String(x.url||'').replace(/^\//,'' )+'?zc=1')),alt:x.title||''}),h('b',null,x.title||x.caption||('Media #'+x.id)),h('small',null,x.url||''),h('button',{onClick:function(){navigator.clipboard&&navigator.clipboard.writeText(x.url||'');}},'Copy URL')))));}
  }

  class ColorManager extends React.Component{
    constructor(p){super(p);this.state={search:'',group:'Tất cả'};}
    render(){
      var items=this.props.items||[],groups=['Tất cả'];
      items.forEach(function(x){if(x.group&&groups.indexOf(x.group)<0)groups.push(x.group);});
      var q=this.state.search.toLowerCase(),g=this.state.group;
      var filtered=items.filter(function(x){return (g==='Tất cả'||x.group===g)&&(!q||((x.code||'')+' '+(x.name||'')).toLowerCase().indexOf(q)>=0);});
      var header=h('div',{className:'card-head'},h('div',null,h('h2',null,'Quản lý bảng màu'),h('p',null,'Tìm mã màu, lọc nhóm, thêm/sửa/xóa và đồng bộ trực tiếp với Color Explorer.')),h(Btn,{kind:'red',onClick:this.props.onAdd},'+ Thêm màu'));
      var toolbar=h('div',{className:'manager-toolbar'},h('input',{placeholder:'Tìm mã hoặc tên màu…',value:this.state.search,onChange:e=>this.setState({search:e.target.value})}),h('select',{value:this.state.group,onChange:e=>this.setState({group:e.target.value})},groups.map(function(x){return h('option',{key:x},x);})),h('span',null,filtered.length+' màu'));
      var content=filtered.length?h('div',{className:'color-admin-grid'},filtered.map(x=>h('div',{className:'color-admin-card',key:x.id},h('div',{className:'color-chip',style:{background:x.hex}}),h('div',{className:'row-main'},h('b',null,x.code),h('small',null,(x.name||'')+' • '+(x.group||'Khác'))),h('span',{className:cx('status',x.enabled!==false?'green':'gray')},x.enabled!==false?'Hiển thị':'Ẩn'),h('div',{className:'row-actions'},h('button',{onClick:()=>this.props.onEdit(x)},'✎'),h('button',{onClick:()=>this.props.onDelete(x.id)},'⌫'))))):h('div',{className:'empty'},'Không có màu phù hợp.');
      return h('section',{className:'admin-card color-manager'},header,toolbar,content);
    }
  }

  class MediaManager extends React.Component{
    constructor(p){super(p);this.state={search:'',error:'',copied:''};}
    upload(files){
      var self=this,valid=[];
      Array.prototype.slice.call(files||[]).forEach(function(f){
        if(!/^image\/(jpeg|png|webp|avif)$/.test(f.type)){self.setState({error:'Chỉ hỗ trợ JPG, PNG, WEBP, AVIF.'});return;}
        if(f.size>2*1024*1024){self.setState({error:'Ảnh '+f.name+' vượt quá 2MB trong chế độ local.'});return;}
        valid.push(f);
      });
      if(!valid.length)return;
      var base=clone(this.props.items||[]),pending=valid.length;
      valid.forEach(function(f){fileToData(f,function(url){base.unshift({id:uid('media'),name:f.name,url:url,type:f.type,size:f.size,createdAt:nowIso()});pending--;if(pending===0){self.setState({error:''});self.props.onChange(base);}});});
    }
    copy(url){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url);this.setState({copied:url});var self=this;setTimeout(function(){self.setState({copied:''});},1000);}
    remove(id){if(!confirm('Xóa ảnh khỏi Media Library?'))return;this.props.onChange((this.props.items||[]).filter(function(x){return x.id!==id;}));}
    render(){
      var q=this.state.search.toLowerCase();
      var items=(this.props.items||[]).filter(function(x){return !q||(x.name||'').toLowerCase().indexOf(q)>=0;});
      var upload=h('label',{className:'btn btn-red'},'+ Upload ảnh',h('input',{type:'file',accept:'image/jpeg,image/png,image/webp,image/avif',multiple:true,hidden:true,onChange:e=>this.upload(e.target.files)}));
      var header=h('div',{className:'card-head'},h('div',null,h('h2',null,'Media Library'),h('p',null,'Upload, preview, tìm kiếm, copy URL và xóa ảnh. File local được lưu dạng Data URL.')),upload);
      var toolbar=h('div',{className:'manager-toolbar'},h('input',{placeholder:'Tìm tên file…',value:this.state.search,onChange:e=>this.setState({search:e.target.value})}),h('span',null,items.length+' media'));
      var cards=items.map(x=>h('div',{className:'media-card',key:x.id},h(SmartImage,{src:x.url,alt:x.name,width:420,height:300}),h('div',{className:'media-meta'},h('b',null,x.name),h('small',null,x.type||'image'),h('div',{className:'media-actions'},h('button',{onClick:()=>this.copy(x.url)},this.state.copied===x.url?'Đã copy':'Copy URL'),h('button',{onClick:()=>this.remove(x.id)},'Xóa')))));
      var content=items.length?h('div',{className:'media-grid'},cards):h('div',{className:'empty'},'Chưa có media.');
      return h('section',{className:'admin-card media-manager'},header,toolbar,this.state.error&&h('div',{className:'manager-error'},this.state.error),content);
    }
  }

  class PopupManager extends React.Component{
    constructor(p){super(p);var items=clone(p.items||[]);this.state={items:items,selected:items[0]&&items[0].id,preview:null};}
    current(){var id=this.state.selected;return this.state.items.find(function(x){return x.id===id;})||this.state.items[0]||null;}
    set(k,v){var items=clone(this.state.items),id=this.state.selected,x=items.find(function(a){return a.id===id;});if(!x)return;x[k]=v;this.setState({items:items});}
    applyTemplate(id){var t=getPopupTemplate(id),items=clone(this.state.items),x=items.find(a=>a.id===this.state.selected);if(!x)return;Object.keys(t).forEach(function(k){if(k!=='id'&&k!=='name')x[k]=t[k];});x.template=id;this.setState({items:items});}
    add(){var t=POPUP_TEMPLATES[0],x={id:uid('popup'),name:'Popup mới',template:t.id,enabled:true,status:'draft',eyebrow:t.eyebrow,title:t.title,body:'Nhập nội dung chương trình hoặc thông báo.',highlight:t.highlight,image:'assets/jotun-ben-mau-toan-dien-hq.webp',ctaLabel:'Xem chi tiết',ctaUrl:'#',secondaryLabel:'Để sau',frequency:'session',delay:1200,startAt:'',endAt:'',position:'center',width:760,animation:t.animation,style:t.style};var items=clone(this.state.items);items.unshift(x);this.setState({items:items,selected:x.id});}
    duplicate(){var cur=this.current();if(!cur)return;var x=clone(cur);x.id=uid('popup');x.name=(x.name||'Popup')+' bản sao';x.status='draft';var items=clone(this.state.items);items.unshift(x);this.setState({items:items,selected:x.id});}
    remove(){var id=this.state.selected;if(!id||!confirm('Xóa popup này?'))return;var items=this.state.items.filter(function(x){return x.id!==id;});this.setState({items:items,selected:items[0]&&items[0].id});}
    save(){this.props.onChange(clone(this.state.items));}
    image(file){if(!file||!/^image\//.test(file.type)||file.size>2*1024*1024)return;var self=this;fileToData(file,function(url){self.set('image',url);});}
    render(){
      var cur=this.current();
      var header=h('div',{className:'card-head'},h('div',null,h('h2',null,'Popup / Promotion Manager'),h('p',null,'Tạo, duplicate, preview, lên lịch, bật/tắt và chọn 6 template popup.')),h('div',{className:'head-actions'},h(Btn,{kind:'outline',onClick:()=>this.add()},'+ Tạo popup'),h(Btn,{kind:'red',onClick:()=>this.save()},'Lưu tất cả')));
      var list=this.state.items.length?this.state.items.map(x=>h('button',{key:x.id,className:this.state.selected===x.id?'active':'',onClick:()=>this.setState({selected:x.id})},h('b',null,x.name||x.title),h('small',null,(x.status||'draft')+' • '+getPopupTemplate(x.template).name),h('span',{className:cx('status',popupIsActive(x)?'green':'gray')},popupIsActive(x)?'Đang chạy':'Không chạy'))):[h('div',{className:'empty',key:'empty'},'Chưa có popup')];
      var editor=h('div',{className:'empty'},'Chọn hoặc tạo popup để chỉnh sửa.');
      if(cur){
        var templateStrip=h('div',{className:'popup-template-strip'},POPUP_TEMPLATES.map(t=>h('button',{key:t.id,className:cur.template===t.id?'active':'',onClick:()=>this.applyTemplate(t.id)},t.name)));
        var actions=h('div',{className:'popup-editor-actions'},h(Btn,{kind:'dark',onClick:()=>this.setState({preview:clone(cur)})},'Preview'),h(Btn,{kind:'outline',onClick:()=>this.duplicate()},'Duplicate'),h(Btn,{kind:'outline',onClick:()=>this.remove()},'Xóa'));
        var form=h('div',{className:'form-grid'},
          h('label',null,'Tên quản trị',h('input',{value:cur.name||'',onChange:e=>this.set('name',e.target.value)})),
          h('label',null,'Trạng thái',h('select',{value:cur.status||'draft',onChange:e=>this.set('status',e.target.value)},['draft','published','scheduled','expired'].map(x=>h('option',{key:x,value:x},x)))),
          h('label',null,'Eyebrow',h('input',{value:cur.eyebrow||'',onChange:e=>this.set('eyebrow',e.target.value)})),
          h('label',null,'Tiêu đề',h('input',{value:cur.title||'',onChange:e=>this.set('title',e.target.value)})),
          h('label',{className:'wide'},'Nội dung',h('textarea',{rows:4,value:cur.body||'',onChange:e=>this.set('body',e.target.value)})),
          h('label',{className:'wide'},'Dòng nhấn mạnh',h('input',{value:cur.highlight||'',onChange:e=>this.set('highlight',e.target.value)})),
          h('label',null,'CTA',h('input',{value:cur.ctaLabel||'',onChange:e=>this.set('ctaLabel',e.target.value)})),
          h('label',null,'CTA URL',h('input',{value:cur.ctaUrl||'',onChange:e=>this.set('ctaUrl',e.target.value)})),
          h('label',null,'Tần suất',h('select',{value:cur.frequency||'session',onChange:e=>this.set('frequency',e.target.value)},h('option',{value:'session'},'Mỗi phiên'),h('option',{value:'once'},'Một lần'),h('option',{value:'everyVisit'},'Mỗi lần tải'))),
          h('label',null,'Delay ms',h('input',{type:'number',value:Number(cur.delay||1200),onChange:e=>this.set('delay',Number(e.target.value||0))})),
          h('label',null,'Bắt đầu',h('input',{type:'datetime-local',value:cur.startAt||'',onChange:e=>this.set('startAt',e.target.value)})),
          h('label',null,'Kết thúc',h('input',{type:'datetime-local',value:cur.endAt||'',onChange:e=>this.set('endAt',e.target.value)})),
          h('label',null,'Chiều rộng',h('input',{type:'number',value:Number(cur.width||760),onChange:e=>this.set('width',Number(e.target.value||760))})),
          h('label',null,h('input',{type:'checkbox',checked:cur.enabled!==false,onChange:e=>this.set('enabled',e.target.checked)}),' Bật popup'),
          h('div',{className:'image-editor wide'},h(SmartImage,{src:cur.image,alt:cur.title,width:360,height:240}),h('label',{className:'btn btn-dark'},'Thay ảnh',h('input',{type:'file',accept:'image/*',hidden:true,onChange:e=>this.image(e.target.files[0])})))
        );
        editor=h('div',{className:'popup-editor'},templateStrip,actions,form);
      }
      return h('section',{className:'admin-card popup-manager'},header,h('div',{className:'popup-manager-grid'},h('aside',{className:'popup-list'},list),editor),this.state.preview&&h(AnnouncementModal,{data:this.state.preview,onClose:()=>this.setState({preview:null})}));
    }
  }

  function ActivityManager(p){
    var items=p.items||[];
    var header=h('div',{className:'card-head'},h('div',null,h('h2',null,'Activity Logs'),h('p',null,'Lịch sử thay đổi trong Local CMS để dễ theo dõi thao tác.')),items.length&&h(Btn,{kind:'outline',onClick:p.onClear},'Xóa log'));
    var content=items.length?h('div',{className:'activity-table'},items.map(function(x){return h('div',{className:'activity-row',key:x.id},h('span',{className:'activity-dot'}),h('div',null,h('b',null,x.detail||x.action),h('small',null,x.action+' • '+new Date(x.createdAt).toLocaleString('vi-VN'))));})):h('div',{className:'empty'},'Chưa có activity log.');
    return h('section',{className:'admin-card activity-manager'},header,content);
  }

  function TemplateStudio(p){
    var current=(p.data.theme&&p.data.theme.template)||'premium-navy';
    return h('section',{className:'admin-card template-studio'},
      h('div',{className:'card-head'},
        h('div',null,
          h('h2',null,'Template Studio'),
          h('p',null,'Chọn một trong 5 template có sẵn để đổi giao diện landing page ngay lập tức.')
        ),
        h('span',{className:'status green'},'Đang dùng: '+getTemplatePreset(current).name)
      ),
      h('div',{className:'template-grid-admin'},
        TEMPLATE_PRESETS.map(function(t){
          return h('div',{className:cx('template-card-admin',current===t.id&&'active'),key:t.id},
            h('div',{className:'template-cover',style:{background:t.cover}},h('span',{className:'template-pill'},t.tag)),
            h('div',{className:'template-copy'},
              h('h3',null,t.name),
              h('p',null,t.description),
              h('div',{className:'template-swatches-mini'},['primary','navy2','paper','accent'].map(function(k){
                return h('i',{key:k,style:{background:t.colors[k]}});
              }))
            ),
            h('div',{className:'template-actions-admin'},
              h(Btn,{kind:current===t.id?'dark':'outline',onClick:function(){p.onApply(Object.assign({},p.data.theme||{},t.colors,{template:t.id}),'Đã áp dụng template '+t.name)}},current===t.id?'Đang dùng':'Áp dụng')
            )
          );
        })
      )
    );
  }

  class EditModal extends React.Component{
    constructor(p){super(p);this.state={item:clone(p.item)};}
    set(k,v){var x=clone(this.state.item);x[k]=v;this.setState({item:x});}
    image(file){if(!file)return;fileToData(file,url=>this.set(this.props.type==='brand'?'logo':'image',url));}
    save(e){e.preventDefault();var x=clone(this.state.item);if('price' in x)x.price=Number(x.price||0);if('oldPrice' in x)x.oldPrice=Number(x.oldPrice||0);if('coverage' in x)x.coverage=Number(x.coverage||0);if('order' in x)x.order=Number(x.order||0);if('variants' in x&&typeof x.variants==='string')x.variants=x.variants.split(',').map(Number).filter(Boolean);this.props.onSave(x);}
    render(){var x=this.state.item,t=this.props.type,imgKey=t==='brand'?'logo':'image';var fields=t==='product'?[['name','Tên sản phẩm'],['brand','Thương hiệu'],['category','Danh mục'],['description','Mô tả'],['price','Giá bán','number'],['oldPrice','Giá niêm yết','number'],['badge','Badge'],['coverage','Độ phủ m²/L/lớp','number'],['variants','Quy cách, cách nhau dấu phẩy'],['url','URL sản phẩm']]:t==='category'?[['name','Tên danh mục'],['description','Mô tả'],['url','URL']]:t==='brand'?[['name','Tên thương hiệu'],['url','URL']]:t==='color'?[['code','Mã màu'],['name','Tên màu'],['hex','Mã HEX'],['group','Nhóm màu']]:t==='banner'?[['title','Tiêu đề'],['subtitle','Mô tả'],['ctaLabel','Nhãn CTA'],['ctaUrl','CTA URL'],['order','Thứ tự','number'],['startAt','Bắt đầu'],['endAt','Kết thúc']]:[['question','Câu hỏi'],['answer','Câu trả lời']];return h('div',{className:'modal-backdrop'},h('form',{className:'edit-modal',onSubmit:this.save.bind(this)},h('div',{className:'modal-head'},h('div',null,h('span',{className:'section-kicker'},'EDITOR'),h('h2',null,'Chỉnh sửa '+t)),h('button',{type:'button',onClick:this.props.onClose},'×')),(t==='product'||t==='category'||t==='brand'||t==='banner')&&h('div',{className:'image-editor'},h('img',{src:asset(x[imgKey])}),h('label',{className:'btn btn-dark'},'Thay hình ảnh',h('input',{type:'file',accept:'image/*',hidden:true,onChange:e=>this.image(e.target.files[0])}))),h('div',{className:'form-grid'},fields.map(f=>h('label',{key:f[0],className:f[0]==='description'||f[0]==='answer'?'wide':''},f[1],f[0]==='description'||f[0]==='answer'?h('textarea',{rows:4,value:x[f[0]]||'',onChange:e=>this.set(f[0],e.target.value)}):h('input',{type:f[2]||'text',value:Array.isArray(x[f[0]])?x[f[0]].join(', '):(x[f[0]]==null?'':x[f[0]]),onChange:e=>this.set(f[0],e.target.value)})))),h('div',{className:'toggle-row'},h('label',null,h('input',{type:'checkbox',checked:x.enabled!==false,onChange:e=>this.set('enabled',e.target.checked)}),' Hiển thị'),t==='product'&&h('label',null,h('input',{type:'checkbox',checked:!!x.featured,onChange:e=>this.set('featured',e.target.checked)}),' Nổi bật')),h('div',{className:'modal-actions'},h(Btn,{kind:'outline',type:'button',onClick:this.props.onClose},'Hủy'),h(Btn,{kind:'red',type:'submit'},'Lưu thay đổi'))));}
  }

  class SettingsEditor extends React.Component{
    constructor(p){
      super(p);
      var obj={};
      p.sections.forEach(function(x){obj[x[0]]=isPlain(x[1])?clone(x[1]):{};});
      this.state={obj:obj};
    }
    set(section,key,val){var o=clone(this.state.obj);if(!isPlain(o[section]))o[section]={};o[section][key]=val;this.setState({obj:o});}
    image(section,key,file){if(!file)return;fileToData(file,url=>this.set(section,key,url));}
    renderField(name,k,o){
      var value=o[k];
      if(k==='image'||k==='logo'){
        return h('label',{key:k},k,h('div',{className:'setting-image'},h('img',{src:asset(value)}),h('label',{className:'btn btn-dark'},'Upload',h('input',{type:'file',accept:'image/*',hidden:true,onChange:e=>this.image(name,k,e.target.files[0])}))));
      }
      if(typeof value==='boolean'){
        return h('label',{key:k,className:'setting-check'},h('input',{type:'checkbox',checked:value,onChange:e=>this.set(name,k,e.target.checked)}),' '+k);
      }
      if(k==='frequency'){
        return h('label',{key:k},k,h('select',{value:value||'session',onChange:e=>this.set(name,k,e.target.value)},h('option',{value:'session'},'Mỗi tab / phiên'),h('option',{value:'once'},'Chỉ một lần'),h('option',{value:'everyVisit'},'Mỗi lần tải trang')));
      }
      if(k==='expiresAt'){
        return h('label',{key:k},k,h('input',{type:'date',value:value||'',onChange:e=>this.set(name,k,e.target.value)}));
      }
      if(typeof value==='number'){
        return h('label',{key:k},k,h('input',{type:'number',value:value,onChange:e=>this.set(name,k,Number(e.target.value||0))}));
      }
      if(k.toLowerCase().indexOf('color')>=0||/^#/.test(String(value))){
        return h('label',{key:k},k,h('div',{className:'color-input'},h('input',{type:'color',value:value,onChange:e=>this.set(name,k,e.target.value)}),h('input',{value:value,onChange:e=>this.set(name,k,e.target.value)})));
      }
      return h('label',{key:k},k,h('input',{value:value==null?'':value,onChange:e=>this.set(name,k,e.target.value)}));
    }
    render(){
      var blocks=this.props.sections.map(pair=>{
        var name=pair[0],o=isPlain(this.state.obj[name])?this.state.obj[name]:{};
        var fields=Object.keys(o).filter(k=>typeof o[k]!=='object').map(k=>this.renderField(name,k,o));
        return h('fieldset',{key:name},h('legend',null,name.toUpperCase()),fields);
      });
      return h('section',{className:'admin-card settings-card'},
        h('div',{className:'card-head'},
          h('div',null,h('h2',null,this.props.title),h('p',null,'Chỉnh nội dung trực tiếp. Những giá trị phức tạp có thể backup bằng JSON.')),
          h(Btn,{kind:'red',onClick:()=>this.props.onSave(this.state.obj)},'Lưu thay đổi')
        ),
        blocks
      );
    }
  }

  ReactDOM.render(h(ErrorBoundary,null,h(App)),document.getElementById('root'));
})();
