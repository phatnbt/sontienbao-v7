#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'app.js'
text = APP.read_text(encoding='utf-8')

replacements = [
    (
        "var products=(p.data.products||[]).filter(function(x){return x.enabled!==false});",
        "var products=(p.data.products||[]).filter(function(x){return x.enabled!==false&&x.calcEligible!==false});"
    ),
    (
        """var products=this.props.data.products||[];
      var p=products.find(x=>x.id===this.state.productId)||products[0]||{};
      var cov=Number(p.coverage)||Number(this.props.data.calculator.fallbackCoverage)||10;
      var lit=(Number(this.state.area)||0)*(Number(this.state.coats)||1)/cov*(1+(Number(this.state.waste)||0)/100);
      return {p:p,cov:cov,lit:lit};""",
        """var products=(this.props.data.products||[]).filter(function(x){return x.enabled!==false&&x.calcEligible!==false});
      var p=products.find(x=>x.id===this.state.productId)||products[0]||{};
      var configured=Number(p.coverage)||0;
      var cov=configured||Number(this.props.data.calculator.fallbackCoverage)||10;
      var lit=(Number(this.state.area)||0)*(Number(this.state.coats)||1)/cov*(1+(Number(this.state.waste)||0)/100);
      return {p:p,cov:cov,lit:lit,isFallback:!configured};"""
    ),
    (
        """pack(lit,vars){
      var sizes=(vars||[]).map(Number).filter(x=>x>0).sort(function(a,b){return b-a});
      if(!sizes.length)return [];
      var rem=lit,out=[];
      sizes.forEach(function(s,i){var q=i===sizes.length-1?Math.ceil(rem/s):Math.floor(rem/s);if(q>0){out.push([s,q]);rem-=q*s;}});
      if(rem>0&&sizes.length)out.push([sizes[sizes.length-1],1]);
      return out;
    }""",
        """pack(lit,vars){
      var sizes=(vars||[]).map(Number).filter(function(x){return x>0&&isFinite(x);}).filter(function(x,i,a){return a.indexOf(x)===i;}).sort(function(a,b){return b-a});
      if(!sizes.length||!(lit>0))return [];
      var target=Number(lit),best=null,minSize=sizes[sizes.length-1],maxCans=Math.min(80,Math.ceil(target/minSize)+2);
      function score(total,cans){return (total-target)*1000+cans;}
      function walk(i,total,counts,cans){
        if(cans>maxCans)return;
        if(total>=target){var sc=score(total,cans);if(!best||sc<best.score)best={score:sc,total:total,counts:counts.slice()};return;}
        if(i>=sizes.length)return;
        var s=sizes[i],need=Math.ceil((target-total)/s)+1;
        for(var q=0;q<=need&&cans+q<=maxCans;q++){counts[i]=q;walk(i+1,total+q*s,counts,cans+q);}
        counts[i]=0;
      }
      walk(0,0,new Array(sizes.length).fill(0),0);
      if(!best)return [];
      return sizes.map(function(s,i){return [s,best.counts[i]||0];}).filter(function(x){return x[1]>0;});
    }"""
    ),
    (
        "var products=(this.props.data.products||[]).filter(function(x){return x.enabled!==false});",
        "var products=(this.props.data.products||[]).filter(function(x){return x.enabled!==false&&x.calcEligible!==false});"
    ),
    (
        """h('div',{className:'result-row'},h('span',null,'Độ phủ dùng'),h('strong',null,r.cov+' m²/L/lớp')),""",
        """h('div',{className:'result-row'},h('span',null,'Độ phủ dùng'),h('strong',null,r.p.coverageLabel||((r.isFallback?'Ước tính ': '')+r.cov+' m²/L/lớp'))),
        h('div',{className:'result-row'},h('span',null,'Nguồn thông số'),h('strong',null,r.p.technicalSource==='iTop'?'iTop đồng bộ':(r.isFallback?'Ước tính mặc định':'Cấu hình kỹ thuật V7'))),"""
    ),
    (
        "h('small',{className:'estimate-note'},'Kết quả mang tính ước tính và cần xác nhận theo bề mặt thi công thực tế.')",
        "h('small',{className:'estimate-note'},r.p.technicalSource==='iTop'?'Độ phủ và quy cách được đồng bộ từ dữ liệu đang hiển thị trên iTop; vẫn cần xác nhận theo bề mặt, màu và phiên bản sản phẩm thực tế.':(r.isFallback?'Sản phẩm chưa có đủ độ phủ kỹ thuật trên iTop; hệ thống đang dùng mức ước tính mặc định và cần xác nhận khi báo giá.':'Kết quả dựa trên thông số đã cấu hình và vẫn cần xác nhận theo bề mặt thi công thực tế.'))"
    )
]

changed = False
for old, new in replacements:
    if new in text:
        continue
    if old not in text:
        raise RuntimeError('Calculator patch target not found: ' + old[:90])
    text = text.replace(old, new, 1)
    changed = True

if changed:
    APP.write_text(text, encoding='utf-8')
    print('Patched app.js Calculator safely')
else:
    print('Calculator patch already applied')
