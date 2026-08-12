#!/usr/bin/env python3
import json, re
from pathlib import Path
from urllib.parse import urljoin, urlparse

from sync_technical import (
    fetch_page, extract_coverage, extract_liter_variants,
    extract_price_by_size, first_price, size_from_text,
    og_image, fmt_num, to_price
)

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'synced-products.js'
BASE = 'https://sontienbao.com/'


def parse_meta(text):
    m = re.search(r'window\.STB_SYNC_META\s*=\s*(\{.*?\});\s*(?:\n|$)', text, re.S)
    return json.loads(m.group(1)) if m else {}


def norm(s):
    s = (s or '').lower()
    table = str.maketrans(
        'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
        'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
    )
    s = s.translate(table)
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', s)).strip()


def pair_key(text):
    n = norm(text)
    if 'jotashield' in n:
        return 'jotashield'
    if 'tough shield' in n:
        return 'tough-shield'
    if 'majestic' in n:
        return 'majestic'
    if 'essence' in n:
        return 'essence'
    if 'ultra' in n:
        return 'ultra'
    return 'jotun'


def infer_surface(text, fallback='both'):
    n = norm(text)
    # iTop currently contains both "nội ngoại thất" and typo variants such as
    # "nội ngọai thất". After accent normalization they share "noi ngoai".
    if 'noi ngoai' in n:
        return 'both'
    interior = 'noi that' in n
    exterior = 'ngoai that' in n
    if interior and exterior:
        return 'both'
    if exterior:
        return 'exterior'
    if interior:
        return 'interior'
    if 'jotashield' in n or 'tough shield' in n:
        return 'exterior'
    if 'majestic' in n or 'essence' in n:
        return 'interior'
    return fallback


def is_primer_text(text):
    n = norm(text)
    positive = ('primer' in n or 'son lot' in n)
    blocked = any(x in n for x in ('gardex', 'alkyd', 'chong ri', 'go kim loai', 'san the thao', 'flexipave', 'bot tret'))
    return positive and not blocked


def is_finish_text(text):
    n = norm(text)
    if any(x in n for x in ('primer', 'son lot', 'bot tret', 'san the thao', 'flexipave', 'chong ri', 'go kim loai')):
        return False
    return ('son phu' in n or any(x in n for x in ('jotashield', 'tough shield', 'majestic', 'essence', 'jotaplast')))


def find_categories():
    final, soup, _, _ = fetch_page(BASE)
    out = {'primer': [], 'interior': [], 'exterior': []}
    for a in soup.find_all('a', href=True):
        label = a.get_text(' ', strip=True)
        href = urljoin(final, a.get('href'))
        p = urlparse(href)
        if p.netloc not in ('sontienbao.com', 'www.sontienbao.com'):
            continue
        n = norm(label + ' ' + p.path)
        if 'son lot chong kiem' in n or ('bot tret' in n and 'son lot' in n):
            out['primer'].append(href)
        if 'son phu noi that' in n:
            out['interior'].append(href)
        if 'son phu ngoai that' in n:
            out['exterior'].append(href)

    for key in out:
        unique = []
        for href in out[key]:
            href = href.split('#', 1)[0].split('?', 1)[0]
            if href not in unique:
                unique.append(href)
        unique.sort(key=lambda u: (0 if 'gtc' in u.lower() else 1, len(u)))
        out[key] = unique
    return out


def card_for_anchor(a, role):
    node = a
    pred = is_primer_text if role == 'primer' else is_finish_text
    for _ in range(8):
        parent = getattr(node, 'parent', None)
        if not parent:
            break
        text = re.sub(r'\s+', ' ', parent.get_text(' ', strip=True))
        if len(text) > 2000:
            break
        price = first_price(text)
        heading = parent.find(['h2', 'h3', 'h4', 'h5'])
        name = heading.get_text(' ', strip=True) if heading else a.get_text(' ', strip=True)
        if price and pred(name + ' ' + text[:600]):
            return parent, name, price
        node = parent
    return None, '', 0


def discover_urls(category_url, role, limit=18):
    final, soup, _, _ = fetch_page(category_url)
    found, seen = [], set()
    pred = is_primer_text if role == 'primer' else is_finish_text
    for a in soup.find_all('a', href=True):
        card, name, price = card_for_anchor(a, role)
        if not card or not price:
            continue
        href = urljoin(final, a.get('href'))
        p = urlparse(href)
        if p.netloc not in ('sontienbao.com', 'www.sontienbao.com') or not p.path.lower().endswith('.html'):
            continue
        href = href.split('#', 1)[0].split('?', 1)[0]
        if href in seen or not pred(name):
            continue
        seen.add(href)
        found.append((href, name, price))
        if len(found) >= limit:
            break
    return found


def family_name(title):
    x = re.sub(r'\b\d+(?:[\.,]\d+)?\s*L\b', ' ', title or '', flags=re.I)
    x = re.sub(r'\([^)]*\)', ' ', x)
    x = re.sub(r'\s+', ' ', x).strip(' -')
    return x or (title or 'Sơn Jotun')


def slug_id(name, role, surface):
    slug = re.sub(r'[^a-z0-9]+', '-', norm(name)).strip('-')
    return 'calc-' + role + '-' + surface + '-' + (slug[:64] or 'product')


def normalize_price_map(price_map):
    out = {}
    for key, value in (price_map or {}).items():
        try:
            size = float(str(key).replace(',', '.'))
            price = int(value or 0)
        except Exception:
            continue
        if size > 0 and price > 0:
            out[fmt_num(size)] = price
    return out


def selected_variant_prices(soup, current_price):
    """Prefer the <select> that contains the currently selected pack size.

    This avoids collecting sizes/prices from recommendation cards elsewhere on the
    same product page. If the selected option has no embedded price, the current
    storefront/card price is bound only to that selected size.
    """
    candidates = []
    for select in soup.find_all('select'):
        price_map = {}
        selected = 0
        sizes = []
        for opt in select.find_all('option'):
            blob = ' '.join([opt.get_text(' ', strip=True)] + [str(v) for v in opt.attrs.values()])
            size = size_from_text(blob)
            if not size:
                continue
            sizes.append(size)
            price = 0
            for k, v in opt.attrs.items():
                if 'price' in str(k).lower() or 'gia' in str(k).lower():
                    price = to_price(v)
                    if price:
                        break
            if not price:
                price = first_price(blob)
            if price:
                price_map[fmt_num(size)] = price
            if opt.has_attr('selected'):
                selected = size
        if selected:
            if current_price:
                price_map[fmt_num(selected)] = int(current_price)
            score = 100 + len(set(sizes)) * 10 + len(price_map)
            candidates.append((score, price_map, selected))
    if not candidates:
        return {}, 0
    candidates.sort(key=lambda x: x[0], reverse=True)
    return normalize_price_map(candidates[0][1]), candidates[0][2]


def build_page(url, card_name, card_price, role, surface):
    final, soup, title, text = fetch_page(url)
    title = title or card_name
    coverage, label = extract_coverage(text)
    title_size = size_from_text(title)
    variants = extract_liter_variants(text)
    if title_size and title_size not in variants:
        variants.append(title_size)
    variants = sorted(set(v for v in variants if v))

    selected_map, selected_size = selected_variant_prices(soup, card_price)
    if selected_map or selected_size:
        price_map, reference = selected_map, selected_size
    else:
        price_map, reference = extract_price_by_size(soup, text, title, card_price, variants)
        price_map = normalize_price_map(price_map)

    # A page whose title explicitly names 5L/17L is authoritative for that size.
    if title_size and card_price:
        price_map[fmt_num(title_size)] = int(card_price)
        reference = title_size

    detected = infer_surface(title, surface)
    return {
        'title': title,
        'family': family_name(title),
        'role': role,
        'surface': detected,
        'pairKey': pair_key(title),
        'url': final,
        'image': og_image(soup, final),
        'coverage': coverage,
        'coverageLabel': label,
        'variants': variants,
        'referenceSize': reference or title_size or 0,
        'referencePrice': int(card_price or 0),
        'priceBySize': normalize_price_map(price_map),
    }


def merge_surface(values):
    values = set(v for v in values if v)
    if 'both' in values or ('interior' in values and 'exterior' in values):
        return 'both'
    if 'interior' in values:
        return 'interior'
    if 'exterior' in values:
        return 'exterior'
    return 'both'


def consolidate(pages):
    grouped, order = {}, []
    for page in pages:
        key = page['role'] + '|' + norm(page['family'])
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
        price_map = {}
        for r in rows:
            price_map.update(normalize_price_map(r.get('priceBySize')))
        # Exact page/reference prices win over any cross-size values found in page HTML.
        for r in rows:
            size = r.get('referenceSize') or 0
            price = r.get('referencePrice') or 0
            if size and price:
                price_map[fmt_num(size)] = int(price)

        priced_sizes = sorted(float(k) for k in price_map.keys())
        variants = [int(x) if float(x).is_integer() else x for x in priced_sizes]
        if not variants:
            continue
        role = rows[0]['role']
        surface = merge_surface(r.get('surface') for r in rows)
        preferred = next((r for r in rows if r.get('referenceSize') == max(variants)), rows[0])
        name = rows[0]['family']
        out.append({
            'id': slug_id(name, role, surface),
            'brand': 'JOTUN',
            'name': name,
            'category': ('Sơn lót' if role == 'primer' else 'Sơn phủ') + (' nội thất' if surface == 'interior' else (' ngoại thất' if surface == 'exterior' else ' nội & ngoại thất')),
            'description': 'Dòng sản phẩm được V7 tự phát hiện và gộp từ dữ liệu iTop hiện hành.',
            'image': preferred.get('image') or rows[0].get('image') or '',
            'url': preferred.get('url') or rows[0].get('url') or '',
            'price': int(price_map.get(fmt_num(max(variants)), 0)),
            'oldPrice': 0,
            'pricePrefix': '',
            'unit': '',
            'badge': 'Sơn lót' if role == 'primer' else 'Sơn phủ',
            'featured': False,
            'calculatorOnly': True,
            'calculatorRole': role,
            'calculatorSurface': surface,
            'pairKey': rows[0].get('pairKey') or pair_key(name),
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


def crawl_category(category_url, role, surface, pages, errors):
    try:
        candidates = discover_urls(category_url, role)
        print('CALC CATEGORY', role, surface, category_url, 'CANDIDATES', len(candidates))
        for url, name, price in candidates:
            try:
                page = build_page(url, name, price, role, surface)
                pages.append(page)
                print('CALC PAGE', role, page['surface'], page['family'], page['referenceSize'], page['priceBySize'], page['coverage'])
            except Exception as e:
                errors.append(f'calculator detail {url}: {e}')
                print('CALC DETAIL WARN', url, e)
    except Exception as e:
        errors.append(f'calculator category {role}/{surface}: {e}')
        print('CALC CATEGORY WARN', role, surface, e)


def main():
    text = FILE.read_text(encoding='utf-8')
    meta = parse_meta(text)
    errors = [e for e in (meta.get('errors') or []) if not str(e).startswith(('calculator detail ', 'calculator category ', 'calculator discovery:', 'primer detail ', 'primer discovery:'))]
    pages = []

    try:
        cats = find_categories()
        if cats['primer']:
            crawl_category(cats['primer'][0], 'primer', 'both', pages, errors)
        else:
            errors.append('calculator category primer/both: Không tìm thấy danh mục sơn lót Jotun')

        if cats['interior']:
            crawl_category(cats['interior'][0], 'finish', 'interior', pages, errors)
        else:
            errors.append('calculator category finish/interior: Không tìm thấy danh mục sơn phủ nội thất Jotun')

        if cats['exterior']:
            crawl_category(cats['exterior'][0], 'finish', 'exterior', pages, errors)
        else:
            errors.append('calculator category finish/exterior: Không tìm thấy danh mục sơn phủ ngoại thất Jotun')
    except Exception as e:
        errors.append(f'calculator discovery: {e}')
        print('CALCULATOR DISCOVERY WARN', e)

    usable = consolidate(pages)
    for item in usable:
        print('CALC FAMILY', item['calculatorRole'], item['calculatorSurface'], item['pairKey'], item['name'], item['coverage'], item['variants'], item['priceBySize'])

    primers = [x for x in usable if x.get('calculatorRole') == 'primer']
    finishes = [x for x in usable if x.get('calculatorRole') == 'finish']
    meta['calculatorCatalog'] = len(usable)
    meta['calculatorPrimerFamilies'] = len(primers)
    meta['calculatorFinishFamilies'] = len(finishes)
    meta['calculatorInteriorFinishes'] = sum(1 for x in finishes if x.get('calculatorSurface') in ('interior', 'both'))
    meta['calculatorExteriorFinishes'] = sum(1 for x in finishes if x.get('calculatorSurface') in ('exterior', 'both'))
    meta['calculatorDiscoveredPages'] = len(pages)
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
    print('Calculator catalog:', len(usable), 'families from', len(pages), 'pages; primers', len(primers), 'finishes', len(finishes))


if __name__ == '__main__':
    main()
