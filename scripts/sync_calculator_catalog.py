#!/usr/bin/env python3
import json, re
from pathlib import Path
from urllib.parse import urljoin, urlparse

from sync_technical import (
    fetch_page, extract_coverage, extract_liter_variants,
    first_price, size_from_text, og_image, fmt_num
)

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'synced-products.js'
BASE = 'https://sontienbao.com/'


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


def discover_primer_urls(category_url, limit=16):
    final, soup, _, _ = fetch_page(category_url)
    found, seen = [], set()
    for a in soup.find_all('a', href=True):
        card, name, price = card_for_anchor(a)
        if not card or not price:
            continue
        href = urljoin(final, a.get('href'))
        p = urlparse(href)
        if p.netloc not in ('sontienbao.com', 'www.sontienbao.com') or not p.path.lower().endswith('.html'):
            continue
        href = href.split('#', 1)[0].split('?', 1)[0]
        if href in seen or not is_primer_text(name):
            continue
        seen.add(href)
        found.append((href, name, price))
        if len(found) >= limit:
            break
    return found


def family_name(title):
    # iTop exposes 5L and 17L as separate pages. Remove pack size and trailing
    # descriptive parentheses so both pages collapse into one calculator product.
    x = re.sub(r'\b\d+(?:[\.,]\d+)?\s*L\b', ' ', title or '', flags=re.I)
    x = re.sub(r'\([^)]*\)', ' ', x)
    x = re.sub(r'\s+', ' ', x).strip(' -')
    return x or (title or 'Sơn lót Jotun')


def family_key(title):
    return norm(family_name(title))


def slug_id(name):
    slug = re.sub(r'[^a-z0-9]+', '-', norm(name)).strip('-')
    return 'primer-itop-' + (slug[:72] or 'product')


def build_page(url, card_name, card_price):
    final, soup, title, text = fetch_page(url)
    title = title or card_name
    coverage, label = extract_coverage(text)
    title_size = size_from_text(title)
    variants = extract_liter_variants(text)
    if title_size and title_size not in variants:
        variants.append(title_size)
    variants = sorted(set(v for v in variants if v))
    return {
        'title': title,
        'family': family_name(title),
        'familyKey': family_key(title),
        'url': final,
        'image': og_image(soup, final),
        'coverage': coverage,
        'coverageLabel': label,
        'variants': variants,
        'referenceSize': title_size or 0,
        # Only bind the listing price to the size named by this exact product page.
        # Do not copy cross-size prices found elsewhere on the page/recommendations.
        'referencePrice': int(card_price or 0),
    }


def consolidate(pages):
    grouped = {}
    order = []
    for page in pages:
        key = page['familyKey']
        if key not in grouped:
            grouped[key] = []
            order.append(key)
        grouped[key].append(page)

    out = []
    for key in order:
        rows = grouped[key]
        coverage_rows = [r for r in rows if r.get('coverage', 0) > 0]
        if not coverage_rows:
            continue
        coverage = coverage_rows[0]['coverage']
        label = coverage_rows[0]['coverageLabel']
        variants = sorted(set(v for r in rows for v in (r.get('variants') or []) if v))
        price_map = {}
        for r in rows:
            size = r.get('referenceSize') or 0
            price = r.get('referencePrice') or 0
            if size and price:
                sk = fmt_num(size)
                price_map[sk] = price
        # Only advertise sizes for which the family has an exact current page price.
        priced_sizes = sorted(float(k) for k in price_map.keys())
        variants = [int(x) if float(x).is_integer() else x for x in priced_sizes]
        if not variants:
            continue
        preferred = next((r for r in rows if r.get('referenceSize') == max(variants)), rows[0])
        name = rows[0]['family']
        out.append({
            'id': slug_id(name),
            'brand': 'JOTUN',
            'name': name,
            'category': 'Sơn lót chống kiềm Jotun',
            'description': 'Dòng sơn lót được V7 tự gộp từ các trang dung tích hiện hành của iTop.',
            'image': preferred.get('image') or rows[0].get('image') or '',
            'url': preferred.get('url') or rows[0].get('url') or '',
            'price': int(price_map.get(fmt_num(max(variants)), 0)),
            'oldPrice': 0,
            'pricePrefix': '',
            'unit': '',
            'badge': 'Sơn lót',
            'featured': False,
            'calculatorOnly': True,
            'calculatorRole': 'primer',
            'coverage': coverage,
            'coverageLabel': label,
            'variants': variants,
            'massOnly': False,
            'calcEligible': True,
            'technicalSource': 'iTop',
            'priceBySize': price_map,
            'priceReferenceSize': max(variants),
            'enabled': True,
        })
    return out


def main():
    text = FILE.read_text(encoding='utf-8')
    meta = parse_meta(text)
    errors = [e for e in (meta.get('errors') or []) if not str(e).startswith(('calculator primer-', 'primer detail ', 'primer discovery:'))]
    pages = []

    try:
        category = find_primer_category()
        print('PRIMER CATEGORY', category)
        candidates = discover_primer_urls(category)
        print('PRIMER CANDIDATES', len(candidates))
        for url, name, price in candidates:
            try:
                page = build_page(url, name, price)
                pages.append(page)
                print('PRIMER PAGE', page['family'], page['referenceSize'], page['referencePrice'], page['coverage'])
            except Exception as e:
                errors.append(f'primer detail {url}: {e}')
                print('PRIMER WARN', url, e)
    except Exception as e:
        errors.append(f'primer discovery: {e}')
        print('PRIMER DISCOVERY WARN', e)

    usable = consolidate(pages)
    for item in usable:
        print('PRIMER FAMILY', item['name'], item['coverage'], item['variants'], item['priceBySize'])

    # Base calculatorEligible/pricedVariants values from sync_technical include only
    # synced + homepage products. Add the consolidated primer families once.
    meta['calculatorCatalog'] = len(usable)
    meta['calculatorPrimerDiscovered'] = len(pages)
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
    print('Calculator primer catalog:', len(usable), 'families from', len(pages), 'pages')


if __name__ == '__main__':
    main()
