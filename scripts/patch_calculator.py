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

MARKER = 'CALCULATOR_V3_SYSTEM'

CALCULATOR = r'''  // CALCULATOR_V3_SYSTEM
  class Calculator extends React.Component{
    constructor(p){
      super(p);
      var groups=this.groups(p.data);
      this.state={
        mode:'system',
        area:125,
        primerCoats:1,
        finishCoats:Number(p.data.calculator.defaultCoats||2),
        waste:Number(p.data.calculator.defaultWaste||10),
        primerId:groups.primers[0]&&groups.primers[0].id,
        productId:groups.finishes[0]&&groups.finishes[0].id,
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
      var text=((p.name||'')+' '+(p.category||'')).toLowerCase();
      return text.indexOf('primer')>=0||text.indexOf('sơn lót')>=0||text.indexOf('son lot')>=0;
    }
    eligible(p){
      return !!(p&&p.enabled!==false&&p.massOnly!==true&&Number(p.coverage||0)>0&&Array.isArray(p.variants)&&p.variants.some(function(x){return Number(x)>0;}));
    }
    groups(data){
      var self=this,all=this.catalog(data).filter(function(p){return self.eligible(p);});
      return {
        all:all,
        primers:all.filter(function(p){return self.isPrimer(p);}),
        finishes:all.filter(function(p){return !self.isPrimer(p)&&p.calculatorOnly!==true;})
      };
    }
    find(items,id){return items.find(function(x){return x.id===id;})||items[0]||{};}
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
    resultCard(label,r){
      var self=this,p=r.p||{};
      return h('div',{className:'calc-layer-card'},
        h('div',{className:'calc-layer-head'},
          h('span',null,label),
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
      var groups=this.groups(this.props.data),mode=this.state.mode;
      var finish=this.find(groups.finishes,this.state.productId);
      var primer=this.find(groups.primers,this.state.primerId);
      var finishR=this.layer(finish,this.state.finishCoats);
      var primerR=this.layer(primer,this.state.primerCoats);
      var showFinish=mode!=='primer',showPrimer=mode!=='finish';
      var totalLit=(showFinish?finishR.lit:0)+(showPrimer?primerR.lit:0);
      var totalKnown=(showFinish?finishR.pricing.known:true)&&(showPrimer?primerR.pricing.known:true);
      var totalCost=(showFinish?finishR.pricing.total:0)+(showPrimer?primerR.pricing.total:0);

      var tabs=h('div',{className:'calc-mode-tabs'},
        [['finish','Sơn phủ','Tính lớp hoàn thiện'],['primer','Sơn lót','Tính lớp nền'],['system','Toàn bộ hệ sơn','Lót + phủ + chi phí']].map(x=>h('button',{type:'button',key:x[0],className:mode===x[0]?'active':'',onClick:()=>this.setState({mode:x[0]})},h('b',null,x[1]),h('small',null,x[2])))
      );

      var form=h('div',{className:'calc-form calc-form-v3'},
        tabs,
        h('div',{className:'two'},
          h('label',null,'Diện tích cần sơn',h('div',{className:'input-suffix'},h('input',{type:'number',min:1,value:this.state.area,onChange:e=>this.setState({area:e.target.value})}),h('span',null,'m²'))),
          h('label',null,'Hao hụt dự kiến',h('div',{className:'input-suffix'},h('input',{type:'number',min:0,max:50,value:this.state.waste,onChange:e=>this.setState({waste:e.target.value})}),h('span',null,'%')))
        ),
        showPrimer&&h('div',{className:'calc-product-panel primer-panel'},
          h('div',{className:'calc-product-title'},h('span',null,'01'),h('div',null,h('b',null,'Sơn lót'),h('small',null,'Lớp nền chống kiềm / tăng bám dính'))),
          groups.primers.length?h('div',{className:'two'},
            h('label',null,'Sản phẩm lót',h('select',{value:primer.id||'',onChange:e=>this.setState({primerId:e.target.value})},groups.primers.map(p=>h('option',{value:p.id,key:p.id},p.name+' • '+(p.unit||((p.variants||[])[0]+'L')))))),
            h('label',null,'Số lớp lót',h('select',{value:this.state.primerCoats,onChange:e=>this.setState({primerCoats:e.target.value})},[1,2].map(x=>h('option',{value:x,key:x},x+' lớp'))))
          ):h('div',{className:'calc-data-warning'},'Chưa đồng bộ được sản phẩm sơn lót có đủ độ phủ và dung tích từ iTop.')
        ),
        showFinish&&h('div',{className:'calc-product-panel finish-panel'},
          h('div',{className:'calc-product-title'},h('span',null,showPrimer?'02':'01'),h('div',null,h('b',null,'Sơn phủ hoàn thiện'),h('small',null,'Chọn dòng sơn và số lớp phủ'))),
          groups.finishes.length?h('div',{className:'two'},
            h('label',null,'Sản phẩm phủ',h('select',{value:finish.id||'',onChange:e=>this.setState({productId:e.target.value})},groups.finishes.map(p=>h('option',{value:p.id,key:p.id},p.name)))),
            h('label',null,'Số lớp phủ',h('select',{value:this.state.finishCoats,onChange:e=>this.setState({finishCoats:e.target.value})},[1,2,3].map(x=>h('option',{value:x,key:x},x+' lớp'))))
          ):h('div',{className:'calc-data-warning'},'Chưa có sản phẩm sơn phủ đủ dữ liệu kỹ thuật để tính.'),
          h('label',{className:'calc-color-label'},'Màu tham khảo',h('div',{className:'swatch-line'},SWATCHES.map(s=>h('button',{type:'button',title:s[0],key:s[0],className:this.state.color===s[0]?'chosen':'',style:{background:s[1]},onClick:()=>this.setState({color:s[0]})}))))
        )
      );

      var results=[];
      if(showPrimer&&groups.primers.length)results.push(this.resultCard('SƠN LÓT',primerR));
      if(showFinish&&groups.finishes.length)results.push(this.resultCard('SƠN PHỦ',finishR));

      var result=h('aside',{className:'calc-result calc-result-v3'},
        h('span',{className:'calc-kicker'},mode==='system'?'KẾT QUẢ TOÀN BỘ HỆ SƠN':'KẾT QUẢ DỰ KIẾN'),
        h('div',{className:'liters liters-v3'},h('b',null,totalLit.toFixed(1)),h('small',null,mode==='system'?'LÍT / TOÀN HỆ':'LÍT SƠN')),
        h('div',{className:'calc-result-stack'},results),
        mode==='system'&&h('div',{className:'system-total'},
          h('div',null,h('span',null,'Tổng chi phí vật tư dự kiến'),h('small',null,'Chỉ cộng các thùng có giá đúng dung tích từ dữ liệu iTop.')),
          h('strong',{className:totalKnown?'cost-known':'cost-pending'},totalKnown?money(totalCost):'Chưa đủ giá theo quy cách')
        ),
        h(Btn,{kind:'red',className:'full',onClick:this.props.onQuote},'Nhận báo giá chính xác →'),
        h('small',{className:'estimate-note'},'Kết quả là ước tính theo diện tích, số lớp, hao hụt, độ phủ và quy cách đã đồng bộ/cấu hình. Giá có thể thay đổi theo màu, base, dung tích, chương trình và thời điểm đặt hàng; báo giá iTop là bước xác nhận cuối cùng.')
      );

      return h('section',{className:'calculator-section',id:'calculator'},
        h('div',{className:'container'},
          h(SectionHead,{eyebrow:'PAINT SYSTEM CALCULATOR',title:'Tính cả hệ sơn — từ lớp lót đến lớp phủ',desc:'Chọn Sơn phủ, Sơn lót hoặc Toàn bộ hệ sơn. Hệ thống gợi ý số lít, số thùng ít dư và chi phí khi iTop có giá đúng theo dung tích.'}),
          h('div',{className:'calculator-shell calculator-shell-v3'},form,result)
        )
      );
    }
  }
'''

if MARKER not in app:
    pattern = r"  class Calculator extends React\.Component\{.*?\n  class Colors extends React\.Component\{"
    replacement = CALCULATOR + "\n  class Colors extends React.Component{"
    app, count = re.subn(pattern, replacement, app, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError('Calculator section not found for V3 replacement')
    changed_app = True

CSS_MARKER = '/* CALCULATOR_V3_SYSTEM */'
CSS_BLOCK = r'''

/* CALCULATOR_V3_SYSTEM */
.calculator-shell-v3{grid-template-columns:minmax(0,1.08fr) minmax(390px,.92fr);align-items:start}
.calc-form-v3{gap:18px}
.calc-mode-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:5px;background:#08141e;border:1px solid #273844;border-radius:15px}
.calc-mode-tabs button{border:1px solid transparent;background:transparent;color:#8ea2af;border-radius:11px;padding:12px 10px;text-align:left;transition:.22s}
.calc-mode-tabs button b{display:block;color:#dce7ed;font-size:11px;margin-bottom:3px}
.calc-mode-tabs button small{display:block;font-size:8px;line-height:1.35;color:#718792}
.calc-mode-tabs button:hover{background:#ffffff08;transform:translateY(-1px)}
.calc-mode-tabs button.active{background:linear-gradient(135deg,#d92b24,#a91614);border-color:#ff655c55;box-shadow:0 10px 25px #d7262026}
.calc-mode-tabs button.active b,.calc-mode-tabs button.active small{color:#fff}
.calc-product-panel{border:1px solid #2a3d49;background:linear-gradient(145deg,#0c1923,#10222e);border-radius:16px;padding:16px;position:relative;overflow:hidden}
.calc-product-panel:before{content:"";position:absolute;width:180px;height:180px;border-radius:50%;right:-100px;top:-110px;background:radial-gradient(circle,#ffffff0d,transparent 70%);pointer-events:none}
.calc-product-title{display:flex;align-items:center;gap:10px;margin-bottom:13px}
.calc-product-title>span{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;background:#ffffff0c;border:1px solid #ffffff14;color:#ff746d;font-size:9px;font-weight:900}
.calc-product-title b{display:block;color:#f1f6f8;font-size:12px}
.calc-product-title small{display:block;color:#748b98;font-size:8px;margin-top:3px}
.primer-panel{box-shadow:inset 3px 0 0 #f5c24b55}.finish-panel{box-shadow:inset 3px 0 0 #d7262055}
.calc-color-label{display:block;margin-top:13px}.calc-data-warning{border:1px dashed #ce9d5355;background:#ce9d5310;color:#d9b982;border-radius:10px;padding:12px;font-size:9px;line-height:1.5}
.calc-result-v3{position:sticky;top:98px}
.liters-v3{padding-bottom:16px}.liters-v3 b{font-size:60px}.calc-result-stack{display:grid;gap:10px;margin:12px 0 16px}
.calc-layer-card{border:1px solid #2b3e4a;background:#0c1923;border-radius:15px;padding:14px}
.calc-layer-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.calc-layer-head span{font-size:8px;letter-spacing:.14em;color:#8197a4;font-weight:900}.calc-layer-head b{font-size:17px;color:#fff}
.calc-layer-card h3{font-size:11px;line-height:1.45;margin:0 0 12px;color:#e5edf2}
.calc-mini-grid{display:grid;grid-template-columns:.65fr 1.1fr 1.1fr;gap:7px}
.calc-mini-grid>div{background:#132531;border-radius:9px;padding:8px}.calc-mini-grid small{display:block;font-size:7px;color:#718895;margin-bottom:4px}.calc-mini-grid strong{display:block;font-size:8px;line-height:1.35;color:#dce7ed}
.pack-box-v3{margin:12px 0 8px}.pack-chip-v3{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;background:#162a37;border:1px solid #293d49;border-radius:9px;padding:8px 9px}.pack-chip-v3 b{background:none;padding:0}.pack-chip-v3 small{font-size:8px;color:#8ea3af;text-align:right}
.calc-cost-line{display:flex;justify-content:space-between;gap:15px;align-items:center;padding-top:10px;border-top:1px solid #243743}.calc-cost-line span{font-size:8px;color:#7e929f}.calc-cost-line strong{font-size:11px;text-align:right}.cost-known{color:#71d68a}.cost-pending{color:#e1b96c}
.system-total{display:flex;justify-content:space-between;align-items:center;gap:16px;border:1px solid #d7262040;background:linear-gradient(135deg,#d7262018,#09151f);border-radius:14px;padding:14px;margin:12px 0 16px}.system-total span{display:block;font-size:9px;color:#e5edf1;font-weight:800}.system-total small{display:block;color:#728895;font-size:7px;line-height:1.45;margin-top:4px;max-width:260px}.system-total strong{font-size:15px;text-align:right;white-space:nowrap}
@media(max-width:980px){.calculator-shell-v3{grid-template-columns:1fr}.calc-result-v3{position:static}.calc-mode-tabs{grid-template-columns:1fr}.calc-mode-tabs button{text-align:center}.calc-mini-grid{grid-template-columns:1fr 1fr}.system-total{align-items:flex-start;flex-direction:column}.system-total strong{text-align:left}}
@media(max-width:620px){.calc-form-v3 .two{grid-template-columns:1fr}.calc-mini-grid{grid-template-columns:1fr}.liters-v3 b{font-size:50px}.calc-product-panel{padding:13px}.calculator-shell-v3{padding:10px}.calc-form-v3,.calc-result-v3{padding:16px}.pack-chip-v3{align-items:flex-start;flex-direction:column}.pack-chip-v3 small{text-align:left}}
'''

if CSS_MARKER not in css:
    css += CSS_BLOCK
    changed_css = True

if changed_app:
    APP.write_text(app, encoding='utf-8')
if changed_css:
    CSS.write_text(css, encoding='utf-8')

if changed_app or changed_css:
    print('Calculator V3 system upgrade applied:', 'app' if changed_app else '', 'css' if changed_css else '')
else:
    print('Calculator V3 system upgrade already applied')
