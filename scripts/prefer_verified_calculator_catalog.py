#!/usr/bin/env python3
from pathlib import Path

APP = Path(__file__).resolve().parents[1] / 'app.js'
text = APP.read_text(encoding='utf-8')

if 'calcItems(data){' not in text:
    needle = "    allItems(data){\n      return this.catalog(data).filter"
    replacement = "    calcItems(data){\n      var all=this.catalog(data);\n      var verified=all.filter(function(p){return !!(p&&p.calculatorOnly===true&&String(p.id||'').indexOf('calc-family-')===0);});\n      return verified.length?verified:all;\n    }\n    allItems(data){\n      return this.calcItems(data).filter"
    if needle not in text:
        raise RuntimeError('Calculator V5 allItems block not found')
    text = text.replace(needle, replacement, 1)

old = "    groups(data,surface){var self=this,all=this.catalog(data).filter(function(p){return self.eligible(p)&&self.surfaceMatch(p,surface);});return{all:all,primers:all.filter(function(p){return self.isPrimer(p);}),finishes:all.filter(function(p){return !self.isPrimer(p)&&(p.calculatorRole||'finish')!=='other';})};}"
new = "    groups(data,surface){var self=this,all=this.calcItems(data).filter(function(p){return self.eligible(p)&&self.surfaceMatch(p,surface);});return{all:all,primers:all.filter(function(p){return self.isPrimer(p);}),finishes:all.filter(function(p){return !self.isPrimer(p)&&(p.calculatorRole||'finish')!=='other';})};}"
if old in text:
    text = text.replace(old, new, 1)
elif 'groups(data,surface){var self=this,all=this.calcItems(data).filter' not in text:
    raise RuntimeError('Calculator V5 groups block not found')

APP.write_text(text, encoding='utf-8')
print('Calculator V5 now prefers verified calc-family catalog')
