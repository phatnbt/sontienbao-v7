#!/usr/bin/env python3
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'synced-products.js'


def parse_assignment(text, name, opener, closer):
    pattern = rf'window\.{re.escape(name)}\s*=\s*({opener}.*?{closer});'
    m = re.search(pattern, text, re.S)
    if not m:
        raise RuntimeError(f'Không tìm thấy {name}')
    return json.loads(m.group(1))


def norm(s):
    s = (s or '').lower()
    table = str.maketrans(
        'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
        'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
    )
    s = s.translate(table)
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', s)).strip()


def fmt_size(v):
    n = float(v)
    return str(int(n)) if n.is_integer() else ('%.3f' % n).rstrip('0').rstrip('.')


def package_unit(item):
    u = str(item.get('packageUnit') or '').strip()
    if u in ('L', 'Kg'):
        return u
    text = str(item.get('unit') or '')
    if re.search(r'kg\b', text, re.I):
        return 'Kg'
    if re.search(r'l\b', text, re.I):
        return 'L'
    return str(item.get('measureUnit') or '')


def is_legacy(item):
    url = (item.get('url') or '').lower()
    title = norm(item.get('name') or '')
    path = urlparse(url).path.lower()
    legacy_path_markers = (
        '/hang-ton-', '/hang-ton/', 'ruby-hang-ton', 'jotun-tgg-ton',
        'tgg-ton-giam-gia', 'ton-giam-gia', '/thanh-ly', 'date-cu',
        '/hang-thanh-ly', '/ton-kho-cu'
    )
    if any(x in path for x in legacy_path_markers):
        return True
    if any(x in title for x in ('thanh ly', 'date cu', 'hang thanh ly', 'ton kho cu')):
        return True
    return False


def family_key(item):
    family = item.get('family') or item.get('name') or ''
    return '|'.join([
        item.get('brand') or '',
        item.get('calculatorRole') or 'other',
        item.get('calculatorSurface') or 'both',
        norm(family),
        package_unit(item),
    ])


def rank(item):
    url = (item.get('url') or '').lower()
    return (
        4 if 'gtc' in url else 0,
        2 if item.get('calcEligible') else 0,
        1 if int(item.get('price') or 0) > 0 else 0,
    )


def consolidate(items):
    clean = [x for x in items if x and not is_legacy(x)]
    groups = {}
    order = []
    for item in clean:
        key = family_key(item)
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(item)

    result = []
    package_count = 0
    for key in order:
        group = groups[key]
        # Choose the safest current source for each exact package size.
        by_size = {}
        no_size = []
        for item in group:
            size = float(item.get('priceReferenceSize') or 0)
            price = int(item.get('price') or 0)
            if size > 0 and price > 0:
                sk = fmt_size(size)
                if sk not in by_size or rank(item) > rank(by_size[sk]):
                    by_size[sk] = item
            else:
                no_size.append(item)

        representative = max(group, key=rank)
        coverage_source = next((x for x in sorted(group, key=rank, reverse=True) if float(x.get('coverage') or 0) > 0), None)
        coverage = float(coverage_source.get('coverage') or 0) if coverage_source else 0
        coverage_label = coverage_source.get('coverageLabel') or '' if coverage_source else ''
        tech_unit = coverage_source.get('measureUnit') or '' if coverage_source else ''
        punit = package_unit(representative)

        sizes = sorted(float(k) for k in by_size.keys())
        price_map = {fmt_size(s): int(by_size[fmt_size(s)].get('price') or 0) for s in sizes}
        variant_urls = {fmt_size(s): by_size[fmt_size(s)].get('url') or '' for s in sizes}
        package_count += len(sizes)

        compatible = bool(coverage > 0 and sizes and punit and tech_unit and punit.lower() == tech_unit.lower())
        enabled = any(x.get('enabled') is not False for x in group)
        calculable = bool(enabled and compatible and price_map)

        family = representative.get('family') or representative.get('name') or 'Sản phẩm sơn'
        digest = hashlib.sha1(key.encode('utf-8')).hexdigest()[:10]
        values = [v for v in price_map.values() if v > 0]
        min_price = min(values) if values else int(representative.get('price') or 0)
        min_size = next((float(k) for k, v in price_map.items() if v == min_price), 0) if min_price else 0
        display_unit = ''
        if sizes and punit:
            display_unit = '/'.join(fmt_size(s) for s in sizes) + punit

        item = dict(representative)
        item.update({
            'id': 'calc-family-' + digest,
            'name': family,
            'family': family,
            'price': min_price,
            'pricePrefix': 'Từ' if len(price_map) > 1 else '',
            'unit': display_unit,
            'packageUnit': punit,
            'coverage': coverage,
            'coverageLabel': coverage_label,
            'measureUnit': tech_unit or punit,
            'coverageBasis': 'm2_per_unit' if coverage > 0 else '',
            'variants': [int(s) if s.is_integer() else s for s in sizes],
            'priceBySize': price_map,
            'variantUrls': variant_urls,
            'priceReferenceSize': min_size,
            'calcEligible': calculable,
            'massOnly': bool(punit == 'Kg' and tech_unit and tech_unit != 'Kg'),
            'technicalSource': 'website-verified-family' if len(group) > 1 else representative.get('technicalSource', 'website'),
            'badge': 'Có thể tính' if calculable else ('Có giá' if values else 'Đang bổ sung dữ liệu'),
            'calculatorOnly': True,
            'enabled': enabled,
        })
        result.append(item)

    result.sort(key=lambda x: (x.get('brand') or '', x.get('calculatorRole') or '', norm(x.get('name') or '')))
    return result, len(items) - len(clean), package_count


def main():
    text = FILE.read_text(encoding='utf-8')
    products = parse_assignment(text, 'STB_CALCULATOR_PRODUCTS', r'\[', r'\]')
    meta = parse_assignment(text, 'STB_SYNC_META', r'\{', r'\}')

    final, removed, package_count = consolidate(products)
    calculable = [x for x in final if x.get('calcEligible')]
    price_only = [x for x in final if not x.get('calcEligible') and int(x.get('price') or 0) > 0]
    brands = sorted(set(x.get('brand') for x in final if x.get('brand')))

    meta['calculatorRawPackages'] = len(products)
    meta['calculatorRemovedLegacy'] = removed
    meta['calculatorCatalog'] = len(final)
    meta['calculatorFamilies'] = len(final)
    meta['calculatorPackages'] = package_count
    meta['calculatorCalculable'] = len(calculable)
    meta['calculatorPriceOnly'] = len(price_only)
    meta['calculatorBrands'] = brands
    meta['pricedVariants'] = package_count

    calc_line = 'window.STB_CALCULATOR_PRODUCTS = ' + json.dumps(final, ensure_ascii=False, separators=(',', ':')) + ';'
    text = re.sub(r'window\.STB_CALCULATOR_PRODUCTS\s*=\s*\[.*?\];', calc_line, text, count=1, flags=re.S)
    meta_line = 'window.STB_SYNC_META = ' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ';'
    text = re.sub(r'window\.STB_SYNC_META\s*=\s*\{.*?\};', meta_line, text, count=1, flags=re.S)
    FILE.write_text(text, encoding='utf-8')

    print('FINAL CALCULATOR:', len(final), 'families;', package_count, 'verified packages;', len(calculable), 'calculable;', len(price_only), 'price-only; removed legacy:', removed, 'brands:', ', '.join(brands))


if __name__ == '__main__':
    main()
