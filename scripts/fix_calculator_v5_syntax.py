#!/usr/bin/env python3
import re
from pathlib import Path

APP = Path(__file__).resolve().parents[1] / 'app.js'
text = APP.read_text(encoding='utf-8')

pattern = re.compile(
    r"\n        form=h\('div',\{className:'calc-form calc-form-v3 calc-form-v4 calc-form-v5'\},surfacePicker,tabs,commonInputs,pairBanner,.*?\n        var results=\[\];",
    re.S,
)

replacement = r'''
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
        var results=[];'''

text2, count = pattern.subn(replacement, text, count=1)
if count != 1:
    # If the corrected structure is already present, keep the task idempotent.
    if "var primerPanel=null,finishPanel=null;" in text:
        print('Calculator V5 syntax already fixed')
    else:
        raise RuntimeError('Calculator V5 malformed product-panel block not found')
else:
    APP.write_text(text2, encoding='utf-8')
    print('Calculator V5 product-panel syntax fixed')
