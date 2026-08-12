#!/usr/bin/env python3
import json, re
from pathlib import Path
from urllib.parse import urljoin, urlparse

from sync_technical import (
    SESSION, fetch_page, extract_coverage, extract_liter_variants,
    extract_price_by_size, first_price, size_from_text, og_image,
    fmt_num
)

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'synced-products.js'
BASE = 'https://sontienbao.com/'


def parse_var(text, name):
    m = re.search(r'window\.%s\s*=\s*(\[.*?\]);\s*(?:\n|$)' % re.escape(name), text, re.S)
    return json.loads(m.group(1)) if m else []


def parse_meta(text):
    m = re.search(r'window\.STB_SYNC_META\s*=\s*(\{.*?\});\s*(?:\n|$)', text, re.S)
    return json.loads(m.group(1)) if m else {}


def norm(s):
    s = (s or '').lower()
    table = str.maketrans('àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
                          'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd')
    s = s.translate(table)
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', s)).strip()


def is_primer_text(text):
    n = norm(text)
    positive = ('primer' in n or 'son lot' in n)
    blocked = any(x in n for x in ('gardex', 'alkyd', 'chong ri', 'go kim loai', 'san the thao', 'flexipave', 'bot tret'))
    return positive and not blocked


def find_primer_category():
    final, soup, _, _ = fetch_page(BASE)
    candidates = []
    for a in soup.find_all('a', href=True):
        label = a.get_text(' ', strip=True)
        n = norm(label)
        if 'son lot chong kiem' in n or ('bot tret' in n and 'son lot' in n):
            href = urljoin(final, a.get('href'))
            p = urlparse(href)
            if p.netloc in ('sontienbao.com', 'www.sontienbao.com') and href not in candidates:
                candidates.append(href)
    if not candidates:
        raise RuntimeError('Không tìm thấy danh mục sơn lót Jotun từ trang chủ iTop')
    # Prefer the current GTC category when multiple legacy links exist.
    candidates.sort(key=lambda u: (0 if 'gtc' in u.lower() else 1, len(u)))
    return candidates[0]


def card_for_anchor(a):
    node = a
    for _ in range(8):
        parent = getattr(node, 'parent', None)
        if not parent:
            break
        text = re.sub(r'\s+', ' ', parent.get_text(' ', strip=True))
        if len(text) > 1800:
            break
        price = first_price(text)
        heading = parent.find(['h2', 'h3', 'h4', 'h5'])
        name = heading.get_text(' ', strip=True) if heading else a.get_text(' ', strip=True)
        if price and is_primer_text(name + ' ' + text[:500]):
            return parent, name, price
        node = parent
    return None, '', 0


def discover_primer_urls(category_url, limit=14):
    final, soup, _, _ = fetch_page(category_url)
    found, seen = [], set()
    for a in soup.find_all('a', href=True):
        card, name, price = card_for_anchor(a)
        if not card or not price:
            continue
        href = urljoin(final, a.get('href'))
        p = urlparse(href)
        if p.netloc not in ('sontienbao.com', 'www.sontienbao.com'):
            continue
        if not p.path.lower().endswith('.html'):
            continue
        href = href.split('#', 1)[0].split('?', 1)[0]
        if href in seen:
            continue
        if not is_primer_text(name):
            continue
        seen.add(href)
        found.append((href, name, price))
        if len(found) >= limit:
            break
    return found


def slug_id(url):
    slug = urlparse(url).path.rstrip('/').split('/')[-1]
    slug = re.sub(r'\.html?$', '', slug, flags=re.I)
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', slug).strip('-').lower()
    return 'primer-itop-' + (slug[:72] or 'product')


def build_item(url, card_name, card_price):
    final, soup, title, text = fetch_page(url)
    title = title or card_name
    coverage, label = extract_coverage(text)
    variants = extract_liter_variants(text)
    title_size = size_from_text(title)
    if title_size and title_size not in variants:
        variants.append(title_size)
        variants = sorted(set(variants))
    price_map, reference = extract_price_by_size(soup, text, title, card_price, variants)
    if not reference and title_size:
        reference = title_size
    if reference and str(int(reference) if float(reference).is_integer() else reference) not in price_map and card_price:
        key = str(int(reference)) if float(reference).is_integer() else str(reference)
        price_map[key] = card_price
    unit = (fmt_num(reference) + 'L') if reference else ''
    return {
        'id': slug_id(final),
        'brand': 'JOTUN',
        'name': title,
        'category': 'Sơn lót chống kiềm Jotun',
        'description': 'Sản phẩm sơn lót được V7 tự phát hiện từ danh mục iTop hiện hành.',
        'image': og_image(soup, final),
        'url': final,
        'price': int(card_price or 0),
        'oldPrice': 0,
        'pricePrefix': '',
        'unit': unit,
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
        'priceReferenceSize': reference or 0,
        'enabled': True,
    }


def main():
    text = FILE.read_text(encoding='utf-8')
    meta = parse_meta(text)
    errors = [e for e in (meta.get('errors') or []) if not str(e).startswith('calculator primer-')]
    catalog = []

    try:
        category = find_primer_category()
        print('PRIMER CATEGORY', category)
        candidates = discover_primer_urls(category)
        print('PRIMER CANDIDATES', len(candidates))
        for url, name, price in candidates:
            try:
                item = build_item(url, name, price)
                catalog.append(item)
                print('PRIMER', item['name'], item['coverage'], item['variants'], item['priceBySize'], item['calcEligible'])
            except Exception as e:
                errors.append(f'primer detail {url}: {e}')
                print('PRIMER WARN', url, e)
    except Exception as e:
        errors.append(f'primer discovery: {e}')
        print('PRIMER DISCOVERY WARN', e)

    # Keep only useful wall-primer products in the calculator catalog. Products that
    # are discovered but lack coverage stay in metadata errors rather than being
    # offered as if the calculator knew how to use them.
    usable = [x for x in catalog if x.get('calcEligible')]
    meta['calculatorCatalog'] = len(usable)
    meta['calculatorPrimerDiscovered'] = len(catalog)
    meta['calculatorEligible'] = int(meta.get('calculatorEligible') or 0) + len(usable)
    meta['pricedVariants'] = int(meta.get('pricedVariants') or 0) + sum(len(x.get('priceBySize') or {}) for x in usable)
    meta['errors'] = errors

    calc_line = 'window.STB_CALCULATOR_PRODUCTS = ' + json.dumps(usable, ensure_ascii=False, separators=(',', ':')) + ';'
    if re.search(r'window\.STB_CALCULATOR_PRODUCTS\s*=\s*\[.*?\];', text, re.S):
        text = re.sub(r'window\.STB_CALCULATOR_PRODUCTS\s*=\s*\[.*?\];', calc_line, text, count=1, flags=re.S)
    else:
        text += '\n' + calc_line + '\n'

    meta_line = 'window.STB_SYNC_META = ' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ';'
    if re.search(r'window\.STB_SYNC_META\s*=\s*\{.*?\};', text, re.S):
        text = re.sub(r'window\.STB_SYNC_META\s*=\s*\{.*?\};', meta_line, text, count=1, flags=re.S)
    else:
        text += '\n' + meta_line + '\n'

    FILE.write_text(text, encoding='utf-8')
    print('Calculator primer catalog:', len(usable), 'usable of', len(catalog), 'discovered')


if __name__ == '__main__':
    main()
