#!/usr/bin/env python3
import json, re, sys, urllib.request
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FILE = ROOT / 'default-data.js'
OUTPUT_FILE = ROOT / 'synced-products.js'
UA = 'Mozilla/5.0 (compatible; STBProductSync/1.0; +https://sontienbao.com/)'

class ProductHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
        self.in_jsonld = False
        self.jsonld_buf = []
        self.jsonld = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag.lower() == 'meta':
            key = a.get('property') or a.get('name')
            val = a.get('content')
            if key and val:
                self.meta[key.lower()] = val.strip()
        elif tag.lower() == 'script' and 'ld+json' in (a.get('type') or '').lower():
            self.in_jsonld = True
            self.jsonld_buf = []
    def handle_data(self, data):
        if self.in_jsonld:
            self.jsonld_buf.append(data)
    def handle_endtag(self, tag):
        if tag.lower() == 'script' and self.in_jsonld:
            self.in_jsonld = False
            text = ''.join(self.jsonld_buf).strip()
            if text:
                self.jsonld.append(text)
            self.jsonld_buf = []

def load_defaults():
    text = DEFAULT_FILE.read_text(encoding='utf-8')
    m = re.search(r'window\.STB_DEFAULT_DATA\s*=\s*(\{.*\})\s*;?\s*$', text, re.S)
    if not m:
        raise RuntimeError('Cannot parse default-data.js')
    return json.loads(m.group(1))

def walk_products(obj):
    if isinstance(obj, dict):
        t = obj.get('@type')
        types = t if isinstance(t, list) else [t]
        if any(str(x).lower() == 'product' for x in types if x):
            yield obj
        for v in obj.values():
            yield from walk_products(v)
    elif isinstance(obj, list):
        for x in obj:
            yield from walk_products(x)

def first_offer(product):
    offers = product.get('offers')
    if isinstance(offers, list):
        offers = offers[0] if offers else {}
    return offers if isinstance(offers, dict) else {}

def to_price(v):
    if v is None:
        return 0
    s = str(v).strip().replace('\xa0',' ')
    s = re.sub(r'[^0-9,\.]', '', s)
    if not s:
        return 0
    if s.count('.') > 1 and ',' not in s:
        s = s.replace('.', '')
    elif s.count(',') > 1 and '.' not in s:
        s = s.replace(',', '')
    else:
        # Vietnamese prices are normally integer VND; remove separators when 3-digit grouping is likely.
        s = re.sub(r'[\.,](?=\d{3}(?:\D|$))', '', s)
        s = s.replace(',', '.')
    try:
        return int(round(float(s)))
    except Exception:
        return 0

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.6'})
    with urllib.request.urlopen(req, timeout=25) as r:
        final_url = r.geturl()
        body = r.read().decode('utf-8', errors='replace')
        return final_url, body

def scrape(product):
    url = product.get('url') or ''
    parsed = urlparse(url)
    if parsed.netloc not in ('sontienbao.com','www.sontienbao.com'):
        return None
    if parsed.path in ('','/'):
        return None
    final_url, html = fetch(url)
    p = ProductHTMLParser(); p.feed(html)
    schema_product = None
    for block in p.jsonld:
        try:
            obj = json.loads(block)
        except Exception:
            continue
        found = list(walk_products(obj))
        if found:
            schema_product = found[0]
            break
    name = ''
    image = ''
    price = 0
    old_price = 0
    if schema_product:
        name = str(schema_product.get('name') or '').strip()
        img = schema_product.get('image')
        if isinstance(img, list): img = img[0] if img else ''
        if isinstance(img, dict): img = img.get('url') or img.get('contentUrl') or ''
        image = str(img or '').strip()
        offer = first_offer(schema_product)
        price = to_price(offer.get('price') or offer.get('lowPrice'))
    name = name or p.meta.get('og:title','') or product.get('name','')
    image = image or p.meta.get('og:image','')
    if not price:
        for key in ('product:price:amount','og:price:amount'):
            if p.meta.get(key):
                price = to_price(p.meta[key]); break
    if not price:
        patterns = [
            r'"price"\s*:\s*"?([0-9][0-9\.,]*)',
            r'(?:Giá bán|Giá khuyến mãi|price)[^0-9]{0,80}([0-9][0-9\.]{3,})\s*đ',
        ]
        for pat in patterns:
            mm = re.search(pat, html, re.I)
            if mm:
                price = to_price(mm.group(1))
                if price: break
    if image:
        image = urljoin(final_url, image)
    if not name and not image and not price:
        return None
    return {
        'id': product.get('id'),
        'name': re.sub(r'\s+',' ',name).strip(),
        'url': final_url,
        'image': image,
        'price': price,
        'oldPrice': old_price,
        'pricePrefix': product.get('pricePrefix',''),
        'unit': product.get('unit','')
    }

def main():
    data = load_defaults()
    products = data.get('products') or []
    out = []
    errors = []
    for product in products:
        try:
            item = scrape(product)
            if item:
                out.append(item)
                print('OK', item['id'], item['price'], item['url'])
            else:
                print('SKIP', product.get('id'))
        except Exception as e:
            errors.append(f"{product.get('id')}: {e}")
            print('ERR', product.get('id'), e, file=sys.stderr)
    if not out:
        print('No product could be synced; keeping previous synced-products.js untouched.', file=sys.stderr)
        sys.exit(0)
    meta = {
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'source': 'https://sontienbao.com',
        'status': 'ok',
        'synced': len(out),
        'errors': errors
    }
    content = 'window.STB_SYNCED_PRODUCTS = ' + json.dumps(out, ensure_ascii=False, separators=(',',':')) + ';\n'
    content += 'window.STB_SYNC_META = ' + json.dumps(meta, ensure_ascii=False, separators=(',',':')) + ';\n'
    OUTPUT_FILE.write_text(content, encoding='utf-8')
    print(f'Wrote {len(out)} products to {OUTPUT_FILE.name}')

if __name__ == '__main__':
    main()
