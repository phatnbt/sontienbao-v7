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
        "var products=this.props.data.products||[];\n      var p=products.find(x=>x.id===this.state.productId)||products[0]||{};\n      var cov=Number(p.coverage)||Number(this.props.data.calculator.fallbackCoverage)||10;\n      var lit=(Number(this.state.area)||0)*(Number(this.state.coats)||1)/cov*(1+(Number(this.state.waste)||0)/100);\n      return {p:p,cov:cov,lit:lit};",
        "var products=(this.props.data.products||[]).filter(function(x){return x.enabled!==false&&x.calcEligible!==false});\n      var p=products.find(x=>x.id===this.state.productId)||products[0]||{};\n      var configured=Number(p.coverage)||0;\n      var cov=configured||Number(this.props.data.calculator.fallbackCoverage)||10;\n      var lit=(Number(this.state.area)||0)*(Number(this.state.coats)||1)/cov*(1+(Number(this.state.waste)||0)/100);\n      return {p:p,cov:cov,lit:lit,isFallback:!configured};"
    ),
    (
        "pack(lit,vars){\n      var sizes=(vars||[]).map(Number).filter(x=>x>0).sort(function(a,b){return b-a});\n      if(!sizes.length)return [];\n      var rem=lit,out=[];\n      sizes.forEach(function(s,i){var q=i===sizes.length-1?Math.ceil(rem/s):Math.floor(rem/s);if(q>0){out.push([s,q]);rem-=q*s;}});\n      if(rem>0&&sizes.length)out.push([sizes[sizes.length-1],1]);\n      return out;\n    }",
        "pack(lit,vars){\n      var sizes=(vars||[]).map(Number).filter(function(x){return x>0&&isFinite(x);}).filter(function(x,i,a){return a.indexOf(x)===i;}).sort(function(a,b){return b-a});\n      if(!sizes.length||!(lit>0))return [];\n      var target=Number(lit),best=null,minSize=sizes[sizes.length-1],maxCans=Math.min(80,Math.ceil(target/minSize)+2);\n      function score(total,cans){return (total-target)*1000+cans;}\n      function walk(i,total,counts,cans){\n        if(cans>maxCans)return;\n        if(total>=target){var sc=score(total,cans);if(!best||sc<best.score)best={score:sc,total:total,counts:counts.slice()};return;}\n        if(i>=sizes.length)return;\n        var s=sizes[i],need=Math.ceil((target-total)/s)+1;\n        for(var q=0;q<=need&&cans+q<=maxCans;q++){counts[i]=q;walk(i+1,total+q*s,counts,cans+q);}\n        counts[i]=0;\n      }\n      walk(0,0,new Array(sizes.length).fill(0),0);\n      if(!best)return [];\n      return sizes.map(function(s,i){return [s,best.counts[i]||0];}).filter(function(x){return x[1]>0;});\n    }"
    ),
    (
        "var products=(this.props.data.products||[]).filter(function(x){return x.enabled!==false});",
        "var products=(this.props.data.products||[]).filter(function(x){return x.enabled!==false&&x.calcEligible!==false});"
    ),
    (
        "h('div',{className:'result-row'},h('span',null,'Độ phủ dùng'),h('strong',null,r.cov+' m²/L/lớp')),
",
        "h('div',{className:'result-row'},h('span',null,'Độ phủ dùng'),h('strong',null,r.p.coverageLabel||((r.isFallback?'Ước tính ': '')+r.cov+' m²/L/lớp'))),\n        h('div',{className:'result-row'},h('span',null,'Nguồn thông số'),h('strong',null,r.p.technicalSource==='iTop'?'iTop đồng bộ':(r.isFallback?'Ước tính mặc định':'Cấu hình kỹ thuật V7'))),\n"
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
