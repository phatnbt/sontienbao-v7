#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'app.js'
CSS = ROOT / 'styles.css'

app = APP.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')
changed_app = False
changed_css = False

MARKER = 'CALCULATOR_V4_SURFACE_PAIRING'

CALCULATOR = r'''  // CALCULATOR_V4_SURFACE_PAIRING
  class Calculator extends React.Component{
    constructor(p){
      super(p);
      var surface=this.firstSurface(p.data);
      var groups=this.groups(p.data,surface);
      var finish=groups.finishes[0]||{};
      var primer=this.bestPrimer(groups.primers,finish,surface)||groups.primers[0]||{};
      this.state={
        surface:surface,
        mode:'system',
        area:125,
        primerCoats:1,
        finishCoats:Number(p.data.calculator.defaultCoats||2),
        waste:Number(p.data.calculator.defaultWaste||10),
        primerId:primer.id,
        productId:finish.id,
        color:SWATCHES[0][0]
      };
    }
    catalog(data){
      var map={},order=[];
      function add(p,prefer){
        if(!p||!p.id)return;
        if(!map[p.id]){map[p.id]=Object.assign({},p);order.push(p.id);}
        else map[p.id]=prefer?Object.assign({},map[p.id],p):Object.assign({},p,map[p.id]);
      }
      ((DEFAULT&&DEFAULT.products)||[]).forEach(function(p){add(p,false);});
      ((data&&data.products)||[]).forEach(function(p){add(p,true);});
      return order.map(function(id){return map[id];});
    }
    isPrimer(p){
      if(!p)return false;
      if(p.calculatorRole==='primer')return true;
      if(p.calculatorRole==='finish')return false;
      var text=((p.name||'')+' '+(p.category||'')).toLowerCase();
      return text.indexOf('primer')>=0||text.indexOf('sơn lót')>=0||text.indexOf('son lot')>=0;
    }
    inferSurface(p){
      if(!p)return 'both';
      if(p.calculatorSurface==='interior'||p.calculatorSurface==='exterior'||p.calculatorSurface==='both')return p.calculatorSurface;
      var text=((p.name||'')+' '+(p.category||'')+' '+(p.description||'')).toLowerCase();
      var interior=text.indexOf('nội thất')>=0||text.indexOf('noi that')>=0;
      var exterior=text.indexOf('ngoại thất')>=0||text.indexOf('ngoai that')>=0;
      if(interior&&exterior)return 'both';
      if(exterior)return 'exterior';
      if(interior)return 'interior';
      if(text.indexOf('jotashield')>=0||text.indexOf('tough shield')>=0)return 'exterior';
      if(text.indexOf('majestic')>=0||text.indexOf('essence')>=0)return 'interior';
      return 'both';
    }
    pairKey(p){
      if(!p)return 'jotun';
      if(p.pairKey)return p.pairKey;
      var text=((p.name||'')+' '+(p.category||'')).toLowerCase();
      if(text.indexOf('jotashield')>=0)return 'jotashield';
      if(text.indexOf('tough shield')>=0)return 'tough-shield';
      if(text.indexOf('majestic')>=0)return 'majestic';
      if(text.indexOf('essence')>=0)return 'essence';
      if(text.indexOf('ultra')>=0)return 'ultra';
      return 'jotun';
    }
    eligible(p){
      return !!(p&&p.enabled!==false&&p.massOnly!==true&&Number(p.coverage||0)>0&&Array.isArray(p.variants)&&p.variants.some(function(x){return Number(x)>0;}));
    }
    surfaceMatch(p,surface){
      var s=this.inferSurface(p);
      return s==='both'||s===surface;
    }
    groups(data,surface){
      var self=this,all=this.catalog(data).filter(function(p){return self.eligible(p)&&self.surfaceMatch(p,surface);});
      return {
        all:all,
        primers:all.filter(function(p){return self.isPrimer(p);}),
        finishes:all.filter(function(p){return !self.isPrimer(p);})
      };
    }
    firstSurface(data){
      var interior=this.groups(data,'interior');
      if(interior.finishes.length&&interior.primers.length)return 'interior';
      return 'exterior';
    }
    find(items,id){return items.find(function(x){return x.id===id;})||items[0]||{};}
    bestPrimer(primers,finish,surface){
      if(!primers||!primers.length)return null;
      var self=this,fk=this.pairKey(finish);
      var fallback={
        'jotashield':['jotashield','ultra','tough-shield'],
        'tough-shield':['tough-shield','jotashield','ultra'],
        'majestic':['majestic','ultra','essence'],
        'essence':['essence','ultra','majestic'],
        'ultra':['ultra','essence','jotashield']
      };
      var order=fallback[fk]||[fk,'ultra','essence','jotashield','tough-shield'];
      return primers.slice().sort(function(a,b){
        function score(p){
          var pk=self.pairKey(p),ps=self.inferSurface(p),s=0,idx=order.indexOf(pk);
          if(pk===fk)s+=120;
          if(idx>=0)s+=70-idx*12;
          if(ps===surface)s+=25;
          if(ps==='both')s+=15;
          if((p.brand||'').toLowerCase()===(finish.brand||'').toLowerCase())s+=5;
          if(p.technicalSource==='iTop')s+=3;
          return s;
        }
        return score(b)-score(a);
      })[0];
    }
    changeSurface(surface){
      var groups=this.groups(this.props.data,surface);
      var finish=groups.finishes[0]||{};
      var primer=this.bestPrimer(groups.primers,finish,surface)||groups.primers[0]||{};
      this.setState({surface:surface,productId:finish.id,primerId:primer.id});
    }
    changeFinish(id){
      var groups=this.groups(this.props.data,this.state.surface);
      var finish=this.find(groups.finishes,id);
      var primer=this.bestPrimer(groups.primers,finish,this.state.surface)||groups.primers[0]||{};
      this.setState({productId:finish.id,primerId:primer.id});
    }
    layer(p,coats){
      var cov=Number(p&&p.coverage||0);
      var area=Math.max(0,Number(this.state.area)||0);
      var n=Math.max(1,Number(coats)||1);
      var waste=Math.max(0,Number(this.state.waste)||0);
      var lit=cov?area*n/cov*(1+waste/100):0;
      var packs=this.pack(lit,p&&p.variants);
      var pricing=this.packCost(p,packs);
      return {p:p||{},cov:cov,lit:lit,packs:packs,pricing:pricing,coats:n};
    }
    pack(lit,vars){
      var sizes=(vars||[]).map(Number).filter(function(x){return x>0&&isFinite(x);}).filter(function(x,i,a){return a.indexOf(x)===i;}).sort(function(a,b){return b-a;});
      if(!sizes.length||!(lit>0))return [];
      var target=Number(lit),best=null,minSize=sizes[sizes.length-1],maxCans=Math.min(100,Math.ceil(target/minSize)+3);
      function score(total,cans){return (total-target)*100000+cans;}
      function walk(i,total,counts,cans){
        if(cans>maxCans)return;
        if(total>=target){var sc=score(total,cans);if(!best||sc<best.score)best={score:sc,total:total,counts:counts.slice()};return;}
        if(i>=sizes.length)return;
        var s=sizes[i],need=Math.min(maxCans-cans,Math.ceil((target-total)/s)+1);
        for(var q=0;q<=need;q++){counts[i]=q;walk(i+1,total+q*s,counts,cans+q);}
        counts[i]=0;
      }
      walk(0,0,new Array(sizes.length).fill(0),0);
      if(!best)return [];
      return sizes.map(function(s,i){return [s,best.counts[i]||0];}).filter(function(x){return x[1]>0;});
    }
    sizeKey(size){var n=Number(size);return Number.isInteger(n)?String(n):String(n).replace(/0+$/,'').replace(/\.$/,'');}
    priceForSize(p,size){
      if(!p)return 0;
      var map=p.priceBySize&&typeof p.priceBySize==='object'?p.priceBySize:{};
      var key=this.sizeKey(size),direct=Number(map[key]||0);
      if(direct>0)return direct;
      var ref=Number(p.priceReferenceSize||0),price=Number(p.price||0);
      if(price>0&&ref>0&&Math.abs(ref-Number(size))<.001)return price;
      if(price>0&&Array.isArray(p.variants)&&p.variants.length===1&&Math.abs(Number(p.variants[0])-Number(size))<.001)return price;
      return 0;
    }
    packCost(p,packs){
      var self=this,total=0,known=true,parts=[];
      (packs||[]).forEach(function(x){
        var unit=self.priceForSize(p,x[0]);
        if(!unit)known=false;
        else total+=unit*x[1];
        parts.push({size:x[0],qty:x[1],unit:unit,subtotal:unit?unit*x[1]:0});
      });
      return {known:!!(parts.length&&known),total:total,parts:parts};
    }
    sourceLabel(p){
      if(!p)return '—';
      if(p.technicalSource==='iTop')return 'iTop đồng bộ';
      if(p.technicalSource==='hybrid')return 'Dung tích iTop • độ phủ V7';
      if(p.technicalSource==='iTop-variants')return 'Dung tích iTop';
      return 'Cấu hình kỹ thuật V7';
    }
    surfaceLabel(){return this.state.surface==='interior'?'Nội thất':'Ngoại thất';}
    resultCard(label,r){
      var p=r.p||{};
      return h('div',{className:'calc-layer-card'},
        h('div',{className:'calc-layer-head'},
          h('span',null,label+' • '+this.surfaceLabel()),
          h('b',null,r.lit.toFixed(1)+' L')
        ),
        h('h3',null,p.name||'Chưa có sản phẩm phù hợp'),
        h('div',{className:'calc-mini-grid'},
          h('div',null,h('small',null,'Số lớp'),h('strong',null,r.coats)),
          h('div',null,h('small',null,'Độ phủ'),h('strong',null,p.coverageLabel||((r.cov||0)+' m²/L/lớp'))),
          h('div',null,h('small',null,'Nguồn'),h('strong',null,this.sourceLabel(p)))
        ),
        h('div',{className:'pack-box pack-box-v3'},
          h('span',null,'Quy cách gợi ý'),
          r.pricing.parts.length?r.pricing.parts.map(function(x){return h('div',{className:'pack-chip-v3',key:x.size},h('b',null,x.qty+' × '+x.size+'L'),h('small',null,x.unit?money(x.unit)+' / thùng':'Chưa có giá đúng quy cách'));}):h('small',null,'Chưa có quy cách phù hợp')
        ),
        h('div',{className:'calc-cost-line'},
          h('span',null,'Chi phí dự kiến'),
          h('strong',{className:r.pricing.known?'cost-known':'cost-pending'},r.pricing.known?money(r.pricing.total):'Đang cập nhật giá theo dung tích')
        )
      );
    }
    render(){
      var surface=this.state.surface,groups=this.groups(this.props.data,surface),mode=this.state.mode;
      var finish=this.find(groups.finishes,this.state.productId);
      var primer=this.find(groups.primers,this.state.primerId);
      var recommended=this.bestPrimer(groups.primers,finish,surface)||{};
      var isAutoPair=!!(primer.id&&recommended.id&&primer.id===recommended.id);
      var finishR=this.layer(finish,this.state.finishCoats);
      var primerR=this.layer(primer,this.state.primerCoats);
      var showFinish=mode!=='primer',showPrimer=mode!=='finish';
      var totalLit=(showFinish?finishR.lit:0)+(showPrimer?primerR.lit:0);
      var totalKnown=(showFinish?finishR.pricing.known:true)&&(showPrimer?primerR.pricing.known:true);
      var totalCost=(showFinish?finishR.pricing.total:0)+(showPrimer?primerR.pricing.total:0);

      var surfacePicker=h('div',{className:'calc-surface-block'},
        h('div',{className:'calc-surface-copy'},h('span',null,'BƯỚC 1'),h('div',null,h('b',null,'Bạn đang sơn khu vực nào?'),h('small',null,'Chỉ hiển thị hệ sơn phù hợp với bề mặt đã chọn.'))),
        h('div',{className:'calc-surface-selector'},
          h('button',{type:'button','aria-pressed':surface==='interior',className:surface==='interior'?'active':'',onClick:()=>this.changeSurface('interior')},h('span',null,'⌂'),h('div',null,h('b',null,'Nội thất'),h('small',null,'Phòng khách, phòng ngủ, căn hộ'))),
          h('button',{type:'button','aria-pressed':surface==='exterior',className:surface==='exterior'?'active':'',onClick:()=>this.changeSurface('exterior')},h('span',null,'▰'),h('div',null,h('b',null,'Ngoại thất'),h('small',null,'Mặt tiền, tường ngoài trời')))
        )
      );

      var tabs=h('div',{className:'calc-mode-tabs'},
        [['finish','Sơn phủ','Tính lớp hoàn thiện'],['primer','Sơn lót','Tính lớp nền'],['system','Toàn bộ hệ sơn','Lót + phủ + chi phí']].map(x=>h('button',{type:'button',key:x[0],className:mode===x[0]?'active':'',onClick:()=>this.setState({mode:x[0]})},h('b',null,x[1]),h('small',null,x[2])))
      );

      var pairBanner=mode==='system'&&primer.id&&finish.id?h('div',{className:'calc-auto-pair '+(isAutoPair?'is-auto':'is-custom')},
        h('div',{className:'calc-auto-icon'},isAutoPair?'✓':'↻'),
        h('div',{className:'calc-auto-copy'},h('small',null,isAutoPair?'HỆ ĐƯỢC GHÉP TỰ ĐỘNG':'HỆ ĐÃ TÙY CHỈNH'),h('b',null,(primer.name||'Sơn lót')+'  +  '+(finish.name||'Sơn phủ')),h('span',null,isAutoPair?'Ưu tiên cùng dòng sản phẩm và đúng khu vực '+this.surfaceLabel().toLowerCase()+'.':'Bạn đã đổi primer thủ công; kết quả vẫn tính theo thông số của lựa chọn hiện tại.')),
        !isAutoPair&&h('button',{type:'button',onClick:()=>this.setState({primerId:recommended.id})},'Dùng gợi ý')
      ):null;

      var form=h('div',{className:'calc-form calc-form-v3 calc-form-v4'},
        surfacePicker,
        tabs,
        h('div',{className:'two'},
          h('label',null,'Diện tích cần sơn',h('div',{className:'input-suffix'},h('input',{type:'number',min:1,value:this.state.area,onChange:e=>this.setState({area:e.target.value})}),h('span',null,'m²'))),
          h('label',null,'Hao hụt dự kiến',h('div',{className:'input-suffix'},h('input',{type:'number',min:0,max:50,value:this.state.waste,onChange:e=>this.setState({waste:e.target.value})}),h('span',null,'%')))
        ),
        pairBanner,
        showPrimer&&h('div',{className:'calc-product-panel primer-panel'},
          h('div',{className:'calc-product-title'},h('span',null,'01'),h('div',null,h('b',null,'Sơn lót '+this.surfaceLabel().toLowerCase()),h('small',null,'Hệ thống tự ưu tiên primer tương thích với sơn phủ'))),
          groups.primers.length?h('div',{className:'two'},
            h('label',null,'Sản phẩm lót',h('select',{value:primer.id||'',onChange:e=>this.setState({primerId:e.target.value})},groups.primers.map(p=>h('option',{value:p.id,key:p.id},p.name+' • '+(p.variants||[]).join('/')+'L')))),
            h('label',null,'Số lớp lót',h('select',{value:this.state.primerCoats,onChange:e=>this.setState({primerCoats:e.target.value})},[1,2].map(x=>h('option',{value:x,key:x},x+' lớp'))))
          ):h('div',{className:'calc-data-warning'},'Chưa đồng bộ được sơn lót '+this.surfaceLabel().toLowerCase()+' có đủ độ phủ, dung tích và giá từ iTop.')
        ),
        showFinish&&h('div',{className:'calc-product-panel finish-panel'},
          h('div',{className:'calc-product-title'},h('span',null,showPrimer?'02':'01'),h('div',null,h('b',null,'Sơn phủ '+this.surfaceLabel().toLowerCase()),h('small',null,'Danh sách đã được lọc theo khu vực thi công'))),
          groups.finishes.length?h('div',{className:'two'},
            h('label',null,'Sản phẩm phủ',h('select',{value:finish.id||'',onChange:e=>this.changeFinish(e.target.value)},groups.finishes.map(p=>h('option',{value:p.id,key:p.id},p.name+' • '+(p.variants||[]).join('/')+'L')))),
            h('label',null,'Số lớp phủ',h('select',{value:this.state.finishCoats,onChange:e=>this.setState({finishCoats:e.target.value})},[1,2,3].map(x=>h('option',{value:x,key:x},x+' lớp'))))
          ):h('div',{className:'calc-data-warning'},'Chưa có sản phẩm sơn phủ '+this.surfaceLabel().toLowerCase()+' đủ dữ liệu kỹ thuật để tính. iTop cần có độ phủ và quy cách dung tích rõ ràng.'),
          h('label',{className:'calc-color-label'},'Màu tham khảo',h('div',{className:'swatch-line'},SWATCHES.map(s=>h('button',{type:'button',title:s[0],key:s[0],className:this.state.color===s[0]?'chosen':'',style:{background:s[1]},onClick:()=>this.setState({color:s[0]})}))))
        )
      );

      var results=[];
      if(showPrimer&&groups.primers.length)results.push(this.resultCard('SƠN LÓT',primerR));
      if(showFinish&&groups.finishes.length)results.push(this.resultCard('SƠN PHỦ',finishR));

      var result=h('aside',{className:'calc-result calc-result-v3'},
        h('div',{className:'calc-result-topline'},h('span',{className:'calc-kicker'},mode==='system'?'KẾT QUẢ TOÀN BỘ HỆ SƠN':'KẾT QUẢ DỰ KIẾN'),h('span',{className:'surface-result-chip'},this.surfaceLabel())),
        h('div',{className:'liters liters-v3'},h('b',null,totalLit.toFixed(1)),h('small',null,mode==='system'?'LÍT / TOÀN HỆ':'LÍT SƠN')),
        h('div',{className:'calc-result-stack'},results),
        mode==='system'&&h('div',{className:'system-total'},
          h('div',null,h('span',null,'Tổng chi phí vật tư dự kiến'),h('small',null,'Chỉ cộng các thùng có giá đúng dung tích từ dữ liệu iTop.')),
          h('strong',{className:totalKnown?'cost-known':'cost-pending'},totalKnown?money(totalCost):'Chưa đủ giá theo quy cách')
        ),
        h(Btn,{kind:'red',className:'full',onClick:this.props.onQuote},'Nhận báo giá chính xác →'),
        h('small',{className:'estimate-note'},'Ghép hệ sơn là gợi ý hỗ trợ mua hàng dựa trên tên dòng, khu vực sử dụng và dữ liệu iTop; không được xem là khuyến nghị kỹ thuật chính thức của Jotun. Báo giá và tư vấn Tiến Bảo là bước xác nhận cuối cùng.')
      );

      return h('section',{className:'calculator-section',id:'calculator'},
        h('div',{className:'container'},
          h(SectionHead,{eyebrow:'PAINT SYSTEM CALCULATOR',title:'Chọn đúng khu vực → tự ghép đúng hệ sơn',desc:'Chọn Nội thất hoặc Ngoại thất trước. V7 lọc sản phẩm phù hợp, tự ghép primer với sơn phủ cùng dòng khi có thể, rồi tính lượng sơn, số thùng và chi phí theo dữ liệu iTop.'}),
          h('div',{className:'calculator-shell calculator-shell-v3 calculator-shell-v4'},form,result)
        )
      );
    }
  }
'''

if MARKER not in app:
    pattern = r"(?:  // CALCULATOR_V3_SYSTEM\n)?  class Calculator extends React\.Component\{.*?\n  class Colors extends React\.Component\{"
    replacement = CALCULATOR + "\n  class Colors extends React.Component{"
    app, count = re.subn(pattern, replacement, app, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError('Calculator section not found for V4 replacement')
    changed_app = True

CSS_MARKER = '/* CALCULATOR_V4_SURFACE_PAIRING */'
CSS_BLOCK = r'''

/* CALCULATOR_V4_SURFACE_PAIRING */
.calc-form-v4{align-content:start}
.calc-surface-block{padding:16px;border:1px solid #2f4352;border-radius:16px;background:linear-gradient(145deg,#0b1721,#122536)}
.calc-surface-copy{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.calc-surface-copy>span{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:#d72620;color:#fff;font-size:10px;font-weight:900;box-shadow:0 8px 18px rgba(215,38,32,.25)}
.calc-surface-copy b{display:block;font-size:13px}.calc-surface-copy small{display:block;color:#88a0af;font-size:9px;margin-top:3px}
.calc-surface-selector{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.calc-surface-selector button{border:1px solid #324958;background:#0b1721;color:#dbe7ed;border-radius:13px;padding:13px;display:flex;align-items:center;gap:11px;text-align:left;transition:.22s}
.calc-surface-selector button>span{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;background:#172b3a;color:#9fb4c0;font-size:17px}
.calc-surface-selector button b{display:block;font-size:12px}.calc-surface-selector button small{display:block;color:#78909e;font-size:8px;margin-top:3px}
.calc-surface-selector button:hover{transform:translateY(-2px);border-color:#557083}
.calc-surface-selector button.active{border-color:#ef4b43;background:linear-gradient(145deg,#182b3a,#261d20);box-shadow:inset 0 0 0 1px rgba(239,75,67,.2),0 12px 24px rgba(0,0,0,.16)}
.calc-surface-selector button.active>span{background:#d72620;color:#fff}.calc-surface-selector button.active small{color:#aebfc8}
.calc-auto-pair{display:grid;grid-template-columns:42px 1fr auto;gap:12px;align-items:center;padding:14px;border-radius:14px;border:1px solid #315468;background:#0c1d29}
.calc-auto-pair.is-auto{border-color:#2e6b59;background:linear-gradient(135deg,#0d251f,#102431)}
.calc-auto-pair.is-custom{border-color:#6b5d35;background:linear-gradient(135deg,#29230f,#152431)}
.calc-auto-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#17392e;color:#72e1b5;font-weight:900}
.is-custom .calc-auto-icon{background:#433719;color:#ffd476}
.calc-auto-copy small{display:block;color:#6ed8ac;font-size:8px;font-weight:900;letter-spacing:.13em}.is-custom .calc-auto-copy small{color:#f1c66b}
.calc-auto-copy b{display:block;font-size:11px;margin:3px 0;color:#f4f8fa}.calc-auto-copy span{display:block;color:#829aa8;font-size:8px;line-height:1.45}
.calc-auto-pair button{border:1px solid #4f6674;background:#142a38;color:#fff;border-radius:9px;padding:8px 10px;font-size:8px;font-weight:800}
.calc-result-topline{display:flex;align-items:center;justify-content:space-between;gap:12px}.surface-result-chip{font-size:9px;font-weight:900;padding:6px 9px;border-radius:999px;background:#173348;color:#b9d0dd;border:1px solid #294b60}
@media(max-width:760px){.calc-surface-selector{grid-template-columns:1fr}.calc-auto-pair{grid-template-columns:38px 1fr}.calc-auto-pair button{grid-column:1/-1;width:100%}.calc-surface-copy>span{width:34px;height:34px}.calc-surface-selector button{min-height:62px}}
'''

if CSS_MARKER not in css:
    css += CSS_BLOCK
    changed_css = True

if changed_app:
    APP.write_text(app, encoding='utf-8')
if changed_css:
    CSS.write_text(css, encoding='utf-8')

if changed_app or changed_css:
    print('Calculator V4 surface pairing applied:', 'app' if changed_app else '', 'css' if changed_css else '')
else:
    print('Calculator V4 surface pairing already applied')
