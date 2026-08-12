#!/usr/bin/env python3
import json, re
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'synced-products.js'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
    'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.6'
}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)

CALCULATOR_SEEDS = [
    ('primer-jotun-tough-shield-5l', 'https://sontienbao.com/son-jotun-nauy/son-lot-chong-kiem-jotun/tough-shield-primer-5l-son-lot-ngoai-that.html'),
    ('primer-jotun-tough-shield-17l', 'https://sontienbao.com/son-jotun-nauy/son-lot-chong-kiem-jotun/tough-shield-primer-17l-son-lot-ngoai-that.html'),
    ('primer-jotun-essence-5l', 'https://sontienbao.com/son-jotun-nauy/son-lot-chong-kiem-jotun/jotun-essence-primer-5l-son-lot-chong-kiem.html'),
    ('primer-jotun-essence-17l', 'https://sontienbao.com/son-jotun-nauy/son-lot-chong-kiem-jotun/jotun-essence-primer-17l-son-lot-chong-kiem.html'),
    ('primer-jotun-ultra-17l', 'https://sontienbao.com/son-jotun-nauy/son-lot-chong-kiem-jotun/jotun-ultra-primer-17l-son-lot-noi-ngoai-that.html'),
    ('primer-jotun-majestic-5l', 'https://sontienbao.com/son-jotun-nauy/son-lot-chong-kiem-jotun/majestic-primer-5l-son-lot-chong-kiem.html'),
]


def parse_var(text, name):
    m = re.search(r'window\.%s\s*=\s*(\[.*?\]);\s*(?:\n|$)' % re.escape(name), text, re.S)
    return json.loads(m.group(1)) if m else []


def parse_meta(text):
    m = re.search(r'window\.STB_SYNC_META\s*=\s*(\{.*?\});\s*(?:\n|$)', text, re.S)
    return json.loads(m.group(1)) if m else {}


def clean_text(soup):
    clone = BeautifulSoup(str(soup), 'html.parser')
    for tag in clone(['script', 'style', 'noscript']):
        tag.decompose()
    return re.sub(r'\s+', ' ', clone.get_text(' ', strip=True))


def num(v):
    try:
        return float(str(v).replace(',', '.'))
    except Exception:
        return 0.0


def fmt_num(v):
    if float(v).is_integer():
        return str(int(v))
    return ('%.2f' % v).rstrip('0').rstrip('.')


def to_price(value):
    digits = re.sub(r'[^0-9]', '', str(value or ''))
    try:
        n = int(digits)
        return n if 10000 <= n <= 100000000 else 0
    except Exception:
        return 0


def first_price(text):
    for raw in re.findall(r'(\d{1,3}(?:[\.\s]\d{3})+)\s*đ', text or '', re.I):
        p = to_price(raw)
        if p:
            return p
    return 0


def size_from_text(text):
    m = re.search(r'(?<![\d])([0-9]+(?:[\.,][0-9]+)?)\s*L\b', text or '', re.I)
    if not m:
        m = re.search(r'(?<![\d])([0-9]+(?:[\.,][0-9]+)?)\s*lít\b', text or '', re.I)
    if not m:
        return 0
    v = num(m.group(1))
    return int(v) if v and float(v).is_integer() else v


def extract_coverage(text):
    # 8-11 m²/L, 11.6 m²/L - 8.8 m²/L, or "(m²/l): 8 - 10.7"
    patterns = [
        r'(\d+(?:[\.,]\d+)?)\s*(?:-|–|—|đến|to)\s*(\d+(?:[\.,]\d+)?)\s*m\s*[²2]\s*/\s*(?:lít|lit(?:er)?|L\b)',
        r'(\d+(?:[\.,]\d+)?)\s*m\s*[²2]\s*/\s*(?:lít|lit(?:er)?|L\b)\s*(?:-|–|—|đến|to)\s*(\d+(?:[\.,]\d+)?)\s*m\s*[²2]\s*/\s*(?:lít|lit(?:er)?|L\b)',
        r'm\s*[²2]\s*/\s*(?:lít|lit(?:er)?|L\b)[^0-9]{0,35}(\d+(?:[\.,]\d+)?)\s*(?:-|–|—|đến|to)\s*(\d+(?:[\.,]\d+)?)',
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.I)
        if not m:
            continue
        a, b = num(m.group(1)), num(m.group(2))
        lo, hi = min(a, b), max(a, b)
        if 1 <= lo <= 30 and lo <= hi <= 35:
            return lo, f'{fmt_num(lo)}–{fmt_num(hi)} m²/L/lớp'
    m = re.search(r'(\d+(?:[\.,]\d+)?)\s*m\s*[²2]\s*/\s*(?:lít|lit(?:er)?|L\b)', text, re.I)
    if m:
        value = num(m.group(1))
        if 1 <= value <= 30:
            return value, f'{fmt_num(value)} m²/L/lớp'
    return 0, ''


def extract_liter_variants(text):
    vals = []
    patterns = [
        r'(?<![\d])([0-9]+(?:[\.,][0-9]+)?)\s*(?:lít|lit(?:er)?s?)\b',
        r'(?<![\d])([0-9]+(?:[\.,][0-9]+)?)\s*L\b'
    ]
    matches = []
    matches.extend(re.findall(patterns[0], text, re.I))
    matches.extend(re.findall(patterns[1], text))
    for raw in matches:
        v = num(raw)
        if 0.1 <= v <= 50 and v not in vals:
            vals.append(v)
    vals.sort()
    return [int(v) if float(v).is_integer() else v for v in vals]


def detect_mass_unit(text, title=''):
    sample = (title + ' ' + text[:3000]).lower()
    kg = re.search(r'(?<![\d])([0-9]+(?:[\.,][0-9]+)?)\s*kg\b', sample, re.I)
    if kg:
        return f'{fmt_num(num(kg.group(1)))}Kg'
    return ''


def normalize_size_key(v):
    v = num(v)
    if not v:
        return ''
    return fmt_num(v)


def extract_price_by_size(soup, visible_text, title, current_price, variants):
    allowed = {normalize_size_key(v) for v in (variants or []) if num(v) > 0}
    out = {}
    reference = size_from_text(title)
    selected_size = 0

    def accept(size, price, overwrite=False):
        key = normalize_size_key(size)
        price = to_price(price)
        if not key or not price:
            return
        if allowed and key not in allowed:
            return
        if overwrite or key not in out:
            out[key] = price

    # iTop variants are often rendered in <option> nodes with price-related data attrs.
    for opt in soup.find_all('option'):
        blob = ' '.join([opt.get_text(' ', strip=True)] + [str(v) for v in opt.attrs.values()])
        size = size_from_text(blob)
        if not size:
            continue
        price = 0
        for k, v in opt.attrs.items():
            if 'price' in str(k).lower() or 'gia' in str(k).lower():
                price = to_price(v)
                if price:
                    break
        if not price:
            price = first_price(blob)
        accept(size, price)
        if opt.has_attr('selected'):
            selected_size = size

    # Search embedded JS/JSON for pairs such as 5L ... price: 3580000.
    script_text = ' '.join(s.get_text(' ', strip=True) for s in soup.find_all('script'))
    for raw_size, raw_price in re.findall(r'([0-9]+(?:[\.,][0-9]+)?)\s*L.{0,120}?(?:price|gia|giá)[^0-9]{0,24}([0-9]{5,9})', script_text, re.I):
        accept(raw_size, raw_price)
    for raw_price, raw_size in re.findall(r'(?:price|gia|giá)[^0-9]{0,24}([0-9]{5,9}).{0,120}?([0-9]+(?:[\.,][0-9]+)?)\s*L', script_text, re.I):
        accept(raw_size, raw_price)

    # Visible size/price pairs are useful on category-like product pages.
    for raw_size, raw_price in re.findall(r'([0-9]+(?:[\.,][0-9]+)?)\s*L.{0,90}?(\d{1,3}(?:[\.\s]\d{3})+)\s*đ', visible_text, re.I):
        accept(raw_size, raw_price)

    # The synced storefront price is the most current displayed price. Bind it only
    # when the page tells us which size is selected/reference, never guess a size.
    if current_price:
        if selected_size:
            accept(selected_size, current_price, overwrite=True)
            reference = selected_size
        elif reference:
            accept(reference, current_price, overwrite=True)
        elif len(variants or []) == 1:
            reference = variants[0]
            accept(reference, current_price, overwrite=True)

    return out, reference or 0


def fetch_page(url):
    r = SESSION.get(url, timeout=30, allow_redirects=True)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, 'html.parser')
    h1 = soup.find('h1')
    title = h1.get_text(' ', strip=True) if h1 else ''
    visible = clean_text(soup)
    return r.url, soup, title, visible


def fetch_technical(item):
    url = item.get('url') or ''
    p = urlparse(url)
    if p.netloc not in ('sontienbao.com', 'www.sontienbao.com'):
        return {}
    final_url, soup, title, text = fetch_page(url)
    title = title or item.get('name', '')
    coverage, label = extract_coverage(text)
    variants = extract_liter_variants(text)
    mass_unit = detect_mass_unit(text, title)
    mass_only = bool(mass_unit and not variants)
    price_map, reference_size = extract_price_by_size(soup, text, title, item.get('price', 0), variants)
    calc_eligible = bool(coverage > 0 and variants and not mass_only)
    return {
        'url': final_url,
        'coverage': coverage,
        'coverageLabel': label,
        'variants': variants,
        'unit': mass_unit or item.get('unit', ''),
        'massOnly': mass_only,
        'calcEligible': calc_eligible,
        'technicalSource': 'iTop' if (coverage or variants or mass_unit) else '',
        'priceBySize': price_map,
        'priceReferenceSize': reference_size,
    }


def og_image(soup, base_url):
    tag = soup.find('meta', attrs={'property': 'og:image'}) or soup.find('meta', attrs={'name': 'twitter:image'})
    if not tag:
        return ''
    value = (tag.get('content') or '').strip()
    if value.startswith('//'):
        return 'https:' + value
    if value.startswith('/'):
        p = urlparse(base_url)
        return f'{p.scheme}://{p.netloc}{value}'
    return value


def fetch_calculator_seed(seed_id, url):
    final_url, soup, title, text = fetch_page(url)
    coverage, label = extract_coverage(text)
    size = size_from_text(title)
    price = first_price(text)
    image = og_image(soup, final_url)
    variants = [size] if size else extract_liter_variants(text)[:1]
    price_map = {normalize_size_key(size): price} if size and price else {}
    return {
        'id': seed_id,
        'brand': 'JOTUN',
        'name': title or seed_id,
        'category': 'Sơn lót chống kiềm',
        'description': 'Sơn lót dùng trong công cụ tính hệ sơn V7.',
        'image': image,
        'url': final_url,
        'price': price,
        'oldPrice': 0,
        'pricePrefix': '',
        'unit': (fmt_num(size) + 'L') if size else '',
        'badge': 'Sơn lót',
        'featured': False,
        'calculatorOnly': True,
        'calculatorRole': 'primer',
        'coverage': coverage,
        'coverageLabel': label,
        'variants': variants,
        'massOnly': False,
        'calcEligible': bool(coverage > 0 and variants),
        'technicalSource': 'iTop',
        'priceBySize': price_map,
        'priceReferenceSize': size or 0,
        'enabled': True,
    }


def enrich(items, errors):
    out, cache = [], {}
    for item in items:
        x = dict(item)
        url = x.get('url') or ''
        try:
            tech = cache.get(url)
            if tech is None:
                tech = fetch_technical(x)
                cache[url] = tech
            x.update(tech)
            print('TECH', x.get('id'), x.get('coverage'), x.get('variants'), x.get('priceBySize'), x.get('massOnly'), x.get('calcEligible'))
        except Exception as e:
            errors.append(f"technical {x.get('id')}: {e}")
            print('TECH WARN', x.get('id'), e)
        out.append(x)
    return out


def sync_calculator_catalog(errors):
    out = []
    for seed_id, url in CALCULATOR_SEEDS:
        try:
            item = fetch_calculator_seed(seed_id, url)
            out.append(item)
            print('CALC', item['id'], item['coverage'], item['variants'], item['priceBySize'], item['calcEligible'])
        except Exception as e:
            errors.append(f'calculator {seed_id}: {e}')
            print('CALC WARN', seed_id, e)
    return out


def main():
    text = FILE.read_text(encoding='utf-8')
    synced = parse_var(text, 'STB_SYNCED_PRODUCTS')
    homepage = parse_var(text, 'STB_HOMEPAGE_PRODUCTS')
    meta = parse_meta(text)
    errors = list(meta.get('errors') or [])

    synced = enrich(synced, errors)
    homepage = enrich(homepage, errors)
    calculator = sync_calculator_catalog(errors)

    meta['technicalSynced'] = sum(1 for x in synced + homepage if x.get('technicalSource') == 'iTop')
    meta['calculatorEligible'] = sum(1 for x in synced + homepage + calculator if x.get('calcEligible'))
    meta['calculatorCatalog'] = len(calculator)
    meta['pricedVariants'] = sum(len(x.get('priceBySize') or {}) for x in synced + homepage + calculator)
    meta['errors'] = errors

    content = 'window.STB_SYNCED_PRODUCTS = ' + json.dumps(synced, ensure_ascii=False, separators=(',', ':')) + ';\n'
    content += 'window.STB_HOMEPAGE_PRODUCTS = ' + json.dumps(homepage, ensure_ascii=False, separators=(',', ':')) + ';\n'
    content += 'window.STB_CALCULATOR_PRODUCTS = ' + json.dumps(calculator, ensure_ascii=False, separators=(',', ':')) + ';\n'
    content += 'window.STB_SYNC_META = ' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ';\n'
    FILE.write_text(content, encoding='utf-8')
    print('Technical sync complete:', meta['technicalSynced'], 'technical,', meta['calculatorEligible'], 'calculator eligible,', meta['pricedVariants'], 'priced variants')


if __name__ == '__main__':
    main()
