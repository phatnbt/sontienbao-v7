#!/usr/bin/env python3
import json, re, sys
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse
from difflib import SequenceMatcher

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FILE = ROOT / 'default-data.js'
OUTPUT_FILE = ROOT / 'synced-products.js'
BASE = 'https://sontienbao.com/'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
    'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.6'
}

def load_defaults():
    text = DEFAULT_FILE.read_text(encoding='utf-8')
    m = re.search(r'window\.STB_DEFAULT_DATA\s*=\s*(\{.*\})\s*;?\s*$', text, re.S)
    if not m:
        raise RuntimeError('Cannot parse default-data.js')
    return json.loads(m.group(1))

def norm(s):
    s = (s or '').lower()
    s = re.sub(r'\([^)]*\)', ' ', s)
    s = s.replace('jotun ', '').replace('sơn ', '')
    s = re.sub(r'[^a-z0-9à-ỹ]+', ' ', s, flags=re.I)
    return re.sub(r'\s+', ' ', s).strip()

def to_price(text):
    if not text: return 0
    s = re.sub(r'[^0-9]', '', str(text))
    try: return int(s)
    except: return 0

def price_list(text):
    vals = []
    for m in re.findall(r'(\d{1,3}(?:[\.\s]\d{3})+)\s*đ', text or '', flags=re.I):
        v = to_price(m)
        if v and v not in vals: vals.append(v)
    return vals

def fetch_soup(url):
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.url, BeautifulSoup(r.text, 'html.parser')

def card_from_anchor(a):
    node = a
    for _ in range(6):
        parent = getattr(node, 'parent', None)
        if not parent: break
        txt = parent.get_text(' ', strip=True)
        prices = price_list(txt)
        if prices:
            img = parent.find('img')
            return parent, prices, img
        node = parent
    return a, [], a.find('img')

def find_home_product(product, soup):
    target = norm(product.get('name'))
    best = None
    for a in soup.find_all('a', href=True):
        text = a.get_text(' ', strip=True)
        if not text: continue
        score = SequenceMatcher(None, target, norm(text)).ratio()
        if target and (target in norm(text) or norm(text) in target):
            score += 0.25
        if best is None or score > best[0]:
            best = (score, a, text)
    if not best or best[0] < 0.58:
        return None
    _, a, text = best
    card, prices, img = card_from_anchor(a)
    href = urljoin(BASE, a.get('href'))
    image = ''
    if img:
        image = img.get('data-src') or img.get('data-original') or img.get('src') or ''
        image = urljoin(BASE, image)
    current = prices[0] if prices else 0
    old = prices[1] if len(prices) > 1 else 0
    return {
        'id': product.get('id'),
        'name': re.sub(r'\s+',' ', text).strip() or product.get('name',''),
        'url': href,
        'image': image,
        'price': current,
        'oldPrice': old,
        'pricePrefix': product.get('pricePrefix',''),
        'unit': product.get('unit','')
    }

def scrape_detail(product):
    url = product.get('url') or ''
    p = urlparse(url)
    if p.netloc not in ('sontienbao.com','www.sontienbao.com') or p.path in ('','/'):
        return None
    final, soup = fetch_soup(url)
    title = (soup.find('h1').get_text(' ',strip=True) if soup.find('h1') else '') or product.get('name','')
    text = soup.get_text(' ', strip=True)
    prices = price_list(text)
    og = soup.find('meta', attrs={'property':'og:image'})
    image = urljoin(final, og.get('content')) if og and og.get('content') else ''
    return {
        'id': product.get('id'), 'name': title, 'url': final, 'image': image,
        'price': prices[0] if prices else 0,
        'oldPrice': prices[1] if len(prices)>1 else 0,
        'pricePrefix': product.get('pricePrefix',''), 'unit': product.get('unit','')
    }

def main():
    data = load_defaults()
    products = data.get('products') or []
    out, errors = [], []

    home_soup = None
    try:
        _, home_soup = fetch_soup(BASE)
        print('HOME OK')
    except Exception as e:
        errors.append(f'homepage: {e}')
        print('HOME ERR', e, file=sys.stderr)

    for product in products:
        item = None
        try:
            if home_soup is not None:
                item = find_home_product(product, home_soup)
            if item is None:
                try: item = scrape_detail(product)
                except Exception as e: errors.append(f"{product.get('id')}: {e}")
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
        'source': BASE,
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
