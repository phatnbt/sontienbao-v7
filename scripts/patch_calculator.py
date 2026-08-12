#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'app.js'
text = APP.read_text(encoding='utf-8')
changed = False

# Apply the original Calculator upgrade when working from an older app.js.
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
        """h('div',{className:'result-row'},h('span',null,'Độ phủ dùng'),h('strong',null,r.cov+' m²/L/lớp')),""",
        """h('div',{className:'result-row'},h('span',null,'Độ phủ dùng'),h('strong',null,r.p.coverageLabel||((r.isFallback?'Ước tính ': '')+r.cov+' m²/L/lớp'))),
        h('div',{className:'result-row'},h('span',null,'Nguồn thông số'),h('strong',null,r.p.technicalSource==='iTop'?'iTop đồng bộ':(r.p.technicalSource==='hybrid'?'Dung tích iTop • độ phủ V7':(r.isFallback?'Ước tính mặc định':'Cấu hình kỹ thuật V7')))),"""
    ),
    (
        "h('small',{className:'estimate-note'},'Kết quả mang tính ước tính và cần xác nhận theo bề mặt thi công thực tế.')",
        "h('small',{className:'estimate-note'},r.p.technicalSource==='iTop'?'Độ phủ và quy cách được đồng bộ từ dữ liệu đang hiển thị trên iTop; vẫn cần xác nhận theo bề mặt, màu và phiên bản sản phẩm thực tế.':(r.p.technicalSource==='hybrid'?'Dung tích được đồng bộ từ iTop; độ phủ đang dùng cấu hình kỹ thuật V7 và vẫn cần xác nhận trước khi đặt hàng.':(r.isFallback?'Sản phẩm chưa có đủ độ phủ kỹ thuật trên iTop; hệ thống đang dùng mức ước tính mặc định và cần xác nhận khi báo giá.':'Kết quả dựa trên thông số đã cấu hình và vẫn cần xác nhận theo bề mặt thi công thực tế.')))"
    )
]

for old, new in replacements:
    if new in text:
        continue
    if old in text:
        text = text.replace(old, new, 1)
        changed = True

# Scope the remaining cleanup to Calculator only so unrelated product lists are untouched.
start = text.find('class Calculator extends React.Component{')
end = text.find('class Colors extends React.Component{', start)
if start < 0 or end <= start:
    raise RuntimeError('Calculator section not found in app.js')
section = text[start:end]

old_filter = "var products=(this.props.data.products||[]).filter(function(x){return x.enabled!==false});"
new_filter = "var products=(this.props.data.products||[]).filter(function(x){return x.enabled!==false&&x.calcEligible!==false});"
if old_filter in section:
    section = section.replace(old_filter, new_filter)
    changed = True

old_source = "r.p.technicalSource==='iTop'?'iTop đồng bộ':(r.isFallback?'Ước tính mặc định':'Cấu hình kỹ thuật V7')"
new_source = "r.p.technicalSource==='iTop'?'iTop đồng bộ':(r.p.technicalSource==='hybrid'?'Dung tích iTop • độ phủ V7':(r.isFallback?'Ước tính mặc định':'Cấu hình kỹ thuật V7'))"
if old_source in section:
    section = section.replace(old_source, new_source)
    changed = True

old_note = "r.p.technicalSource==='iTop'?'Độ phủ và quy cách được đồng bộ từ dữ liệu đang hiển thị trên iTop; vẫn cần xác nhận theo bề mặt, màu và phiên bản sản phẩm thực tế.':(r.isFallback?'Sản phẩm chưa có đủ độ phủ kỹ thuật trên iTop; hệ thống đang dùng mức ước tính mặc định và cần xác nhận khi báo giá.':'Kết quả dựa trên thông số đã cấu hình và vẫn cần xác nhận theo bề mặt thi công thực tế.')"
new_note = "r.p.technicalSource==='iTop'?'Độ phủ và quy cách được đồng bộ từ dữ liệu đang hiển thị trên iTop; vẫn cần xác nhận theo bề mặt, màu và phiên bản sản phẩm thực tế.':(r.p.technicalSource==='hybrid'?'Dung tích được đồng bộ từ iTop; độ phủ đang dùng cấu hình kỹ thuật V7 và vẫn cần xác nhận trước khi đặt hàng.':(r.isFallback?'Sản phẩm chưa có đủ độ phủ kỹ thuật trên iTop; hệ thống đang dùng mức ước tính mặc định và cần xác nhận khi báo giá.':'Kết quả dựa trên thông số đã cấu hình và vẫn cần xác nhận theo bề mặt thi công thực tế.'))"
if old_note in section:
    section = section.replace(old_note, new_note)
    changed = True

text = text[:start] + section + text[end:]

if changed:
    APP.write_text(text, encoding='utf-8')
    print('Patched app.js Calculator safely')
else:
    print('Calculator patch already applied')
