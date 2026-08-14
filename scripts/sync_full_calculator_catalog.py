#!/usr/bin/env python3
import json
import re
from pathlib import Path
from urllib.parse import urljoin, urlparse

from sync_technical import fetch_page, extract_coverage, first_price, og_image, fmt_num, to_price, num

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'synced-products.js'
BASE = 'https://sontienbao.com/'
MAX_CATEGORY_PAGES = 8
MAX_PRODUCTS = 260


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


def same_host(url):
    return urlparse(url).netloc.lower() in ('sontienbao.com', 'www.sontienbao.com')


def canonical(url):
    return url.split('#', 1)[0].split('?', 1)[0]


def brand_from(text):
    n = norm(text)
    if 'jotun' in n or 'jotashield' in n or 'majestic' in n or 'tough shield' in n:
        return 'JOTUN'
    if 'terraco' in n or 'flexipave' in n:
        return 'TERRACO'
    if 'nippon' in n or re.search(r'(^| )np( |$)', n):
        return 'NIPPON'
    if 'ruby' in n:
        return 'RUBY'
    return 'SƠN TIẾN BẢO'


def infer_surface(text):
    n = norm(text)
    if any(x in n for x in ('san the thao', 'tennis', 'pickleball', 'flexipave', 'san bong')):
        return 'sport'
    interior = any(x in n for x in ('noi that', 'trong nha', 'interior'))
    exterior = any(x in n for x in ('ngoai that', 'ngoai troi', 'exterior', 'mat tien'))
    if interior and exterior:
        return 'both'
    if exterior:
        return 'exterior'
    if interior:
        return 'interior'
    if any(x in n for x in ('chong tham', 'waterproof', 'waterguard')):
        return 'exterior'
    if any(x in n for x in ('son dau', 'chong ri', 'kim loai', 'go ')):
        return 'other'
    return 'both'


def infer_role(text):
    n = norm(text)
    if 'primer' in n or 'son lot' in n:
        return 'primer'
    if any(x in n for x in ('bot tret', 'putty', 'mastic', 'tram tret', 'filler')):
        return 'other'
    if any(x in n for x in ('son phu', 'son noi that', 'son ngoai that', 'trong nha', 'ngoai troi', 'chong tham', 'coating', 'paint')):
        return 'finish'
    return 'other'


def pair_key(text, brand):
    n = norm(text)
    if 'jotashield' in n:
        return 'jotun:jotashield'
    if 'tough shield' in n:
        return 'jotun:tough-shield'
    if 'majestic' in n:
        return 'jotun:majestic'
    if 'essence' in n:
        return 'jotun:essence'
    if 'ultra' in n:
        return 'jotun:ultra'
    return norm(brand).replace(' ', '-') or 'paint'


def is_productish(text):
    n = norm(text)
    blocked = ('tin tuc', 'chinh sach', 'huong dan', 'tai lieu', 'dang nhap', 'dang ky', 'lien he', 'gioi thieu')
    if any(x in n for x in blocked):
        return False
    return any(x in n for x in (
        'son ', 'paint', 'primer', 'coating', 'jotun', 'jotashield', 'majestic', 'essence',
        'nippon', 'terraco', 'flexipave', 'ruby', 'putty', 'mastic', 'bot tret', 'chong tham'
    ))


def is_categoryish(label, href):
    p = urlparse(href)
    if not same_host(href) or p.path.lower().endswith('.html'):
        return False
    n = norm(label + ' ' + p.path)
    if any(x in n for x in ('admin', 'tin tuc', 'tai lieu', 'chinh sach', 'huong dan', 'gioi thieu', 'lien he', 'bang mau')):
        return False
    return is_productish(n)


def discover_categories():
    final, soup, _, _ = fetch_page(BASE)
    out = [final]
    for a in soup.find_all('a', href=True):
        href = canonical(urljoin(final, a.get('href')))
        label = a.get_text(' ', strip=True)
        if is_categoryish(label, href) and href not in out:
            out.append(href)
    return out


def nearest_card(a):
    node = a
    for _ in range(9):
        parent = getattr(node, 'parent', None)
        if not parent:
            break
        text = re.sub(r'\s+', ' ', parent.get_text(' ', strip=True))
        if len(text) > 2600:
            break
        price = first_price(text)
        heading = parent.find(['h2', 'h3', 'h4', 'h5'])
        name = heading.get_text(' ', strip=True) if heading else a.get_text(' ', strip=True)
        if price and is_productish(name + ' ' + text[:700]):
            return name, price
        node = parent
    return '', 0


def listing_products(url):
    final, soup, _, _ = fetch_page(url)
    products = []
    next_pages = []
    seen = set()
    base_path = urlparse(final).path.rstrip('/')
    for a in soup.find_all('a', href=True):
        href = canonical(urljoin(final, a.get('href')))
        if not same_host(href):
            continue
        p = urlparse(href)
        label = a.get_text(' ', strip=True)
        if p.path.lower().endswith('.html'):
            name, price = nearest_card(a)
            if price and href not in seen:
                seen.add(href)
                products.append((href, name, price, final))
            continue
        nlabel = norm(label)
        is_page = bool(re.fullmatch(r'\d{1,3}', nlabel)) or nlabel in ('next', 'tiep', '>', '>>', '»') or any(x in href.lower() for x in ('page=', '/page/', 'trang-'))
        if is_page and (not base_path or base_path in p.path) and href != final and href not in next_pages:
            next_pages.append(href)
    return products, next_pages


def crawl_category(start_url):
    queue = [start_url]
    visited = set()
    out = []
    while queue and len(visited) < MAX_CATEGORY_PAGES:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)
        try:
            rows, pages = listing_products(url)
            out.extend(rows)
            for p in pages:
                if p not in visited and p not in queue:
                    queue.append(p)
        except Exception as e:
            print('FULL CATALOG LIST WARN', url, e)
    return out


def size_unit_from_text(text):
    text = text or ''
    patterns = [
        (r'(?<![\d])([0-9]+(?:[\.,][0-9]+)?)\s*(?:lít|lit(?:er)?s?|L)\b', 'L'),
        (r'(?<![\d])([0-9]+(?:[\.,][0-9]+)?)\s*(?:kg|kilogram)\b', 'Kg'),
    ]
    for pattern, unit in patterns:
        m = re.search(pattern, text, re.I)
        if m:
            v = num(m.group(1))
            if 0.05 <= v <= 100:
                return (int(v) if float(v).is_integer() else v), unit
    return 0, ''


def extract_sizes(text, unit):
    if unit == 'Kg':
        raw = re.findall(r'(?<![\d])([0-9]+(?:[\.,][0-9]+)?)\s*(?:kg|kilogram)\b', text or '', re.I)
    else:
        raw = re.findall(r'(?<![\d])([0-9]+(?:[\.,][0-9]+)?)\s*(?:lít|lit(?:er)?s?|L)\b', text or '', re.I)
    vals = []
    for x in raw:
        v = num(x)
        if 0.05 <= v <= 100 and v not in vals:
            vals.append(v)
    vals.sort()
    return [int(v) if float(v).is_integer() else v for v in vals]


def extract_measure(text):
    coverage, label = extract_coverage(text)
    if coverage > 0:
        return coverage, label, 'L'

    # m²/kg
    m = re.search(r'(\d+(?:[\.,]\d+)?)\s*(?:-|–|—|đến|to)\s*(\d+(?:[\.,]\d+)?)\s*m\s*[²2]\s*/\s*kg\b', text, re.I)
    if m:
        a, b = num(m.group(1)), num(m.group(2))
        lo, hi = min(a, b), max(a, b)
        if 0.05 < lo <= hi <= 100:
            return lo, f'{fmt_num(lo)}–{fmt_num(hi)} m²/kg/lớp', 'Kg'
    m = re.search(r'(\d+(?:[\.,]\d+)?)\s*m\s*[²2]\s*/\s*kg\b', text, re.I)
    if m:
        v = num(m.group(1))
        if 0.05 < v <= 100:
            return v, f'{fmt_num(v)} m²/kg/lớp', 'Kg'

    # kg/m² -> convert consumption to equivalent m²/kg. Use the higher
    # consumption in a range so the purchase estimate is conservative.
    m = re.search(r'(\d+(?:[\.,]\d+)?)\s*(?:-|–|—|đến|to)\s*(\d+(?:[\.,]\d+)?)\s*kg\s*/\s*m\s*[²2]', text, re.I)
    if m:
        a, b = num(m.group(1)), num(m.group(2))
        lo, hi = min(a, b), max(a, b)
        if 0.01 < lo <= hi <= 20:
            return 1.0 / hi, f'{fmt_num(lo)}–{fmt_num(hi)} kg/m²/lớp', 'Kg'
    m = re.search(r'(\d+(?:[\.,]\d+)?)\s*kg\s*/\s*m\s*[²2]', text, re.I)
    if m:
        v = num(m.group(1))
        if 0.01 < v <= 20:
            return 1.0 / v, f'{fmt_num(v)} kg/m²/lớp', 'Kg'
    return 0, '', ''


def normalize_price_map(m):
    out = {}
    for k, v in (m or {}).items():
        try:
            size = float(str(k).replace(',', '.'))
            price = int(v or 0)
        except Exception:
            continue
        if size > 0 and price > 0:
            out[fmt_num(size)] = price
    return out


def extract_price_map(soup, visible, title, card_price, sizes, unit):
    out = {}
    allowed = {fmt_num(float(x)) for x in sizes}
    title_size, title_unit = size_unit_from_text(title)
    selected = 0

    def accept(size, price, overwrite=False):
        try:
            s = float(size)
        except Exception:
            return
        key = fmt_num(s)
        p = to_price(price)
        if not key or not p or (allowed and key not in allowed):
            return
        if overwrite or key not in out:
            out[key] = p

    for opt in soup.find_all('option'):
        blob = ' '.join([opt.get_text(' ', strip=True)] + [str(v) for v in opt.attrs.values()])
        size, opt_unit = size_unit_from_text(blob)
        if not size or (unit and opt_unit and opt_unit != unit):
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
            selected = size

    unit_rx = r'(?:kg|kilogram)' if unit == 'Kg' else r'(?:lít|lit(?:er)?s?|L)'
    for raw_size, raw_price in re.findall(r'([0-9]+(?:[\.,][0-9]+)?)\s*' + unit_rx + r'.{0,100}?(\d{1,3}(?:[\.\s]\d{3})+)\s*đ', visible, re.I):
        accept(raw_size, raw_price)

    reference = selected or (title_size if title_unit == unit else 0)
    if card_price:
        if reference:
            accept(reference, card_price, overwrite=True)
        elif len(sizes) == 1:
            reference = sizes[0]
            accept(reference, card_price, overwrite=True)
    return normalize_price_map(out), reference or 0


def family_name(title):
    x = re.sub(r'(?<![\d])[0-9]+(?:[\.,][0-9]+)?\s*(?:L|lít|lit(?:er)?s?|kg|kilogram)\b', ' ', title or '', flags=re.I)
    x = re.sub(r'\s+', ' ', x).strip(' -/')
    return x or (title or 'Sản phẩm sơn')


def slug_id(name, brand, role, surface):
    slug = re.sub(r'[^a-z0-9]+', '-', norm(name)).strip('-')[:68]
    b = re.sub(r'[^a-z0-9]+', '-', norm(brand)).strip('-')[:18]
    return 'calc-' + (b or 'paint') + '-' + role + '-' + surface + '-' + (slug or 'product')


def build_product(row):
    url, card_name, card_price, context = row
    final, soup, title, text = fetch_page(url)
    title = title or card_name
    brand = brand_from(title + ' ' + context + ' ' + final)
    role = infer_role(title + ' ' + context)
    surface = infer_surface(title + ' ' + context)
    coverage, coverage_label, measure_unit = extract_measure(text)
    title_size, title_unit = size_unit_from_text(title)
    if not measure_unit:
        measure_unit = title_unit
    sizes = extract_sizes(text, measure_unit) if measure_unit else []
    if title_size and title_unit and (not measure_unit or title_unit == measure_unit) and title_size not in sizes:
        sizes.append(title_size)
        sizes.sort()
    price_map, reference = extract_price_map(soup, text, title, card_price, sizes, measure_unit or title_unit)
    if title_size and title_unit and card_price:
        measure_unit = measure_unit or title_unit
        price_map[fmt_num(title_size)] = int(card_price)
        reference = title_size
    if not sizes and price_map:
        sizes = sorted(float(k) for k in price_map)
    sizes = [int(x) if float(x).is_integer() else x for x in sizes]
    fam = family_name(title)
    return {
        'title': title,
        'family': fam,
        'brand': brand,
        'role': role,
        'surface': surface,
        'pairKey': pair_key(title, brand),
        'url': final,
        'image': og_image(soup, final),
        'coverage': coverage,
        'coverageLabel': coverage_label,
        'measureUnit': measure_unit or title_unit or '',
        'coverageBasis': 'm2_per_unit' if coverage > 0 else '',
        'variants': sizes,
        'referenceSize': reference or title_size or 0,
        'referencePrice': int(card_price or 0),
        'priceBySize': normalize_price_map(price_map),
    }


def consolidate(rows):
    grouped = {}
    order = []
    for r in rows:
        key = '|'.join([r['brand'], r['role'], r['surface'], norm(r['family'])])
        if key not in grouped:
            grouped[key] = []
            order.append(key)
        grouped[key].append(r)

    out = []
    used_ids = set()
    for key in order:
        group = grouped[key]
        price_map = {}
        sizes = []
        for r in group:
            price_map.update(normalize_price_map(r.get('priceBySize')))
            sizes.extend(r.get('variants') or [])
        for r in group:
            size, price = r.get('referenceSize') or 0, r.get('referencePrice') or 0
            if size and price:
                price_map[fmt_num(float(size))] = int(price)
        if price_map:
            sizes.extend(float(k) for k in price_map.keys())
        sizes = sorted(set(float(x) for x in sizes if float(x) > 0))
        variants = [int(x) if x.is_integer() else x for x in sizes]
        coverage_row = next((r for r in group if r.get('coverage', 0) > 0), None)
        coverage = coverage_row.get('coverage', 0) if coverage_row else 0
        label = coverage_row.get('coverageLabel', '') if coverage_row else ''
        measure_unit = (coverage_row or group[0]).get('measureUnit') or ''
        preferred = next((r for r in group if r.get('image')), group[0])
        name = group[0]['family']
        item_id = slug_id(name, group[0]['brand'], group[0]['role'], group[0]['surface'])
        base_id = item_id
        suffix = 2
        while item_id in used_ids:
            item_id = base_id + '-' + str(suffix)
            suffix += 1
        used_ids.add(item_id)
        max_size = max(variants) if variants else 0
        reference_price = int(price_map.get(fmt_num(float(max_size)), 0)) if max_size else int(group[0].get('referencePrice') or 0)
        calculable = bool(coverage > 0 and variants and any(int(v or 0) > 0 for v in price_map.values()))
        out.append({
            'id': item_id,
            'brand': group[0]['brand'],
            'name': name,
            'category': ('Sơn lót' if group[0]['role'] == 'primer' else ('Sơn phủ' if group[0]['role'] == 'finish' else 'Sản phẩm sơn')),
            'description': 'Dữ liệu sản phẩm được đồng bộ tự động từ website Sơn Tiến Bảo.',
            'image': preferred.get('image') or '',
            'url': preferred.get('url') or group[0].get('url') or '',
            'price': reference_price,
            'oldPrice': 0,
            'pricePrefix': 'Từ' if len(price_map) > 1 else '',
            'unit': (fmt_num(max_size) + measure_unit) if max_size and measure_unit else '',
            'badge': 'Có thể tính' if calculable else 'Đang bổ sung thông số',
            'featured': False,
            'calculatorOnly': True,
            'calculatorRole': group[0]['role'],
            'calculatorSurface': group[0]['surface'],
            'pairKey': group[0].get('pairKey') or pair_key(name, group[0]['brand']),
            'coverage': coverage,
            'coverageLabel': label,
            'measureUnit': measure_unit,
            'coverageBasis': 'm2_per_unit' if coverage > 0 else '',
            'variants': variants,
            'massOnly': False,
            'calcEligible': calculable,
            'technicalSource': 'website',
            'priceBySize': price_map,
            'priceReferenceSize': max_size or 0,
            'enabled': True,
        })
    return out


def main():
    text = FILE.read_text(encoding='utf-8')
    meta = parse_meta(text)
    errors = [e for e in (meta.get('errors') or []) if not str(e).startswith('full catalog ')]

    try:
        categories = discover_categories()
    except Exception as e:
        categories = [BASE]
        errors.append('full catalog categories: ' + str(e))

    candidate_map = {}
    for category in categories:
        try:
            for row in crawl_category(category):
                url = row[0]
                if url not in candidate_map:
                    candidate_map[url] = row
                if len(candidate_map) >= MAX_PRODUCTS:
                    break
        except Exception as e:
            errors.append('full catalog category %s: %s' % (category, e))
        if len(candidate_map) >= MAX_PRODUCTS:
            break

    pages = []
    for i, row in enumerate(list(candidate_map.values())[:MAX_PRODUCTS], 1):
        try:
            item = build_product(row)
            pages.append(item)
            print('FULL CALC', i, item['brand'], item['role'], item['surface'], item['family'], item['coverage'], item['measureUnit'], item['variants'], item['priceBySize'])
        except Exception as e:
            errors.append('full catalog detail %s: %s' % (row[0], e))
            print('FULL CALC WARN', row[0], e)

    catalog = consolidate(pages)
    calculable = [x for x in catalog if x.get('calcEligible')]
    price_only = [x for x in catalog if not x.get('calcEligible') and (x.get('price') or x.get('priceBySize'))]
    brands = sorted(set(x.get('brand') for x in catalog if x.get('brand')))

    meta['calculatorCatalog'] = len(catalog)
    meta['calculatorCalculable'] = len(calculable)
    meta['calculatorPriceOnly'] = len(price_only)
    meta['calculatorBrands'] = brands
    meta['calculatorDiscoveredPages'] = len(pages)
    meta['calculatorCategoryPages'] = len(categories)
    meta['pricedVariants'] = sum(len(x.get('priceBySize') or {}) for x in catalog)
    meta['errors'] = errors

    calc_line = 'window.STB_CALCULATOR_PRODUCTS = ' + json.dumps(catalog, ensure_ascii=False, separators=(',', ':')) + ';'
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
    print('FULL CALCULATOR CATALOG:', len(catalog), 'products;', len(calculable), 'calculable;', len(price_only), 'price-only; brands:', ', '.join(brands))


if __name__ == '__main__':
    main()
