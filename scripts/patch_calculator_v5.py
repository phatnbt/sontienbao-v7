#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'app.js'
CSS = ROOT / 'styles.css'

app = APP.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')

CALCULATOR = r'''  // CALCULATOR_V5_FULL_CATALOG
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
    allItems(data){
      return this.catalog(data).filter(function(p){return !!(p&&p.enabled!==false&&(p.calculatorOnly===true||p.calcEligible===true||(p.priceBySize&&Object.keys(p.priceBySize).length)));}).sort(function(a,b){return String(a.brand||'').localeCompare(String(b.brand||''),'vi')||String(a.name||'').localeCompare(String(b.name||''),'vi');});
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
    groups(data,surface){var self=this,all=this.catalog(data).filter(function(p){return self.eligible(p)&&self.surfaceMatch(p,surface);});return{all:all,primers:all.filter(function(p){return self.isPrimer(p);}),finishes:all.filter(function(p){return !self.isPrimer(p)&&(p.calculatorRole||'finish')!=='other';})};}
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
        form=h('div',{className:'calc-form calc-form-v3 calc-form-v4 calc-form-v5'},surfacePicker,tabs,commonInputs,pairBanner,showPrimer&&h('div',{className:'calc-product-panel primer-panel'},h('div',{className:'calc-product-title'},h('span',null,'01'),h('div',null,h('b',null,'Sơn lót '+this.surfaceLabel().toLowerCase()),h('small',null,'Ưu tiên cùng thương hiệu với sơn phủ khi có dữ liệu'))),groups.primers.length?h('div',{className:'two'},h('label',null,'Sản phẩm lót',h('select',{value:primer.id||'',onChange:e=>this.setState({primerId:e.target.value})},groups.primers.map(p=>h('option',{value:p.id,key:p.id},(p.brand?p.brand+' • ':'')+p.name+' • '+(p.variants||[]).join('/')+'L'))),h('label',null,'Số lớp lót',h('select',{value:this.state.primerCoats,onChange:e=>this.setState({primerCoats:e.target.value})},[1,2].map(x=>h('option',{value:x,key:x},x+' lớp'))))):h('div',{className:'calc-data-warning'},'Chưa có sơn lót đủ dữ liệu để tính chính xác.')),showFinish&&h('div',{className:'calc-product-panel finish-panel'},h('div',{className:'calc-product-title'},h('span',null,showPrimer?'02':'01'),h('div',null,h('b',null,'Sơn phủ '+this.surfaceLabel().toLowerCase()),h('small',null,'Danh sách lấy từ catalog đã đồng bộ'))),groups.finishes.length?h('div',{className:'two'},h('label',null,'Sản phẩm phủ',h('select',{value:finish.id||'',onChange:e=>this.changeFinish(e.target.value)},groups.finishes.map(p=>h('option',{value:p.id,key:p.id},(p.brand?p.brand+' • ':'')+p.name+' • '+(p.variants||[]).join('/')+'L'))),h('label',null,'Số lớp phủ',h('select',{value:this.state.finishCoats,onChange:e=>this.setState({finishCoats:e.target.value})},[1,2,3].map(x=>h('option',{value:x,key:x},x+' lớp'))))):h('div',{className:'calc-data-warning'},'Chưa có sơn phủ đủ dữ liệu để tính chính xác.')));
        var results=[];if(showPrimer&&groups.primers.length)results.push(this.resultCard('SƠN LÓT',primerR));if(showFinish&&groups.finishes.length)results.push(this.resultCard('SƠN PHỦ',finishR));var totalKnown=(showFinish?finishR.pricing.known:true)&&(showPrimer?primerR.pricing.known:true),totalCost=(showFinish?finishR.pricing.total:0)+(showPrimer?primerR.pricing.total:0);
        result=h('aside',{className:'calc-result calc-result-v3'},h('div',{className:'calc-result-topline'},h('span',{className:'calc-kicker'},mode==='system'?'KẾT QUẢ TOÀN BỘ HỆ SƠN':'KẾT QUẢ DỰ KIẾN'),h('span',{className:'surface-result-chip'},this.surfaceLabel())),h('div',{className:'calc-result-stack'},results),mode==='system'&&h('div',{className:'system-total'},h('div',null,h('span',null,'Tổng chi phí vật tư dự kiến'),h('small',null,'Tính theo giá đúng quy cách sản phẩm hiện có.')),h('strong',{className:totalKnown?'cost-known':'cost-pending'},totalKnown?money(totalCost):'Chưa đủ giá theo quy cách')),h(Btn,{kind:'red',className:'full',onClick:this.props.onQuote},'Nhận báo giá chính xác →'),h('small',{className:'estimate-note'},'Kết quả là ước tính hỗ trợ chọn mua dựa trên diện tích, khu vực sử dụng, quy cách và thông tin sản phẩm hiện có.'));
      }
      return h('section',{className:'calculator-section',id:'calculator'},h('div',{className:'container'},h(SectionHead,{eyebrow:'PAINT CALCULATOR V5',title:'Tính sơn theo toàn bộ catalog sản phẩm',desc:'Tìm sản phẩm theo thương hiệu hoặc dùng chế độ hệ sơn. Giá, quy cách và thông số được đồng bộ tự động từ website chính.'}),h('div',{className:'calculator-shell calculator-shell-v3 calculator-shell-v4 calculator-shell-v5'},form,result)));
    }
  }
'''

pattern = r"  // CALCULATOR_V[45]_[A-Z0-9_]+\n  class Calculator extends React\.Component\{.*?\n  class Colors extends React\.Component\{"
replacement = CALCULATOR + "\n  class Colors extends React.Component{"
app, count = re.subn(pattern, replacement, app, count=1, flags=re.S)
if count != 1:
    raise RuntimeError('Calculator V4/V5 section not found')

CSS_MARKER = '/* CALCULATOR_V5_FULL_CATALOG */'
if CSS_MARKER not in css:
    css += r'''

/* CALCULATOR_V5_FULL_CATALOG */
.calc-mode-tabs-v5{grid-template-columns:repeat(4,minmax(0,1fr))}
.calc-catalog-tools{display:grid;gap:14px;padding:16px;border:1px solid #2e4656;border-radius:16px;background:linear-gradient(145deg,#0a1721,#102538)}
.calc-catalog-tools .full{grid-column:1/-1}.calc-catalog-tools input[type=search]{width:100%}
.calc-product-link{display:inline-flex;margin-top:12px;color:#90c7e8;font-size:10px;font-weight:800;text-decoration:none}.calc-product-link:hover{text-decoration:underline}
.calc-missing-tech{border-color:#665126;background:linear-gradient(145deg,#171b20,#241f13)}.calc-missing-tech p{font-size:10px;line-height:1.55;color:#aeb9c0}
.calculator-shell-v5 select{max-width:100%}
@media(max-width:920px){.calc-mode-tabs-v5{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.calc-mode-tabs-v5{grid-template-columns:1fr}.calc-catalog-tools .two{grid-template-columns:1fr}}
'''

APP.write_text(app, encoding='utf-8')
CSS.write_text(css, encoding='utf-8')
print('Calculator V5 full catalog patch applied')
