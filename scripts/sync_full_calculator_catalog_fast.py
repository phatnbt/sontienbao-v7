#!/usr/bin/env python3
import hashlib
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

import sync_full_calculator_catalog as base

# The previous 260-product cap was reached on the first run, so it was not a
# complete catalog. Keep a generous safety ceiling while still preventing a
# broken pagination loop from crawling forever.
base.MAX_PRODUCTS = 800
base.MAX_CATEGORY_PAGES = 20

BLOCKED_LISTING_TERMS = (
    'co son', 'co lan', 'con lan', 'giay nham', 'ban cha', 'mui nhua',
    'sui can', 'dung cu', 'phu kien', 'bang mau', 'may phun', 'keo cat',
    'thang nhom'
)
BLOCKED_PRODUCT_TERMS = (
    'thanh ly', 'date cu', 'tinh mau', 'hang thanh ly', 'ton kho cu'
)


def exact_product_id(title, url):
    slug = re.sub(r'[^a-z0-9]+', '-', base.norm(title)).strip('-')[:76] or 'product'
    return 'calc-' + slug + '-' + hashlib.sha1(url.encode('utf-8')).hexdigest()[:8]


def selected_size(soup):
    for opt in soup.find_all('option'):
        if not opt.has_attr('selected'):
            continue
        blob = ' '.join([opt.get_text(' ', strip=True)] + [str(v) for v in opt.attrs.values()])
        size, unit = base.size_unit_from_text(blob)
        if size and unit:
            return size, unit
    return 0, ''


def build_precise_product(row):
    url, card_name, card_price, context = row
    final, soup, title, text = base.fetch_page(url)
    title = title or card_name or 'Sản phẩm sơn'
    ntitle = base.norm(title)

    # Do not recommend clearance remnants, tint concentrates, tools or similar
    # non-current materials in a customer-facing quantity calculator.
    if any(x in ntitle for x in BLOCKED_PRODUCT_TERMS):
        return None
    if 'ton ' in ntitle and ' date ' in (' ' + ntitle + ' '):
        return None
    if any(x in ntitle for x in BLOCKED_LISTING_TERMS):
        return None

    brand = base.brand_from(title + ' ' + context + ' ' + final)
    role = base.infer_role(title + ' ' + context)
    surface = base.infer_surface(title + ' ' + context)

    # Technical coverage/consumption normally appears near the top/product
    # description. Limit the sample so recommendations/footer products cannot
    # donate a specification to the current product.
    technical_text = text[:18000]
    coverage, coverage_label, coverage_unit = base.extract_measure(technical_text)

    size, package_unit = base.size_unit_from_text(title)
    if not size:
        size, package_unit = selected_size(soup)

    # Bind the listing price only to a package size explicitly identified by
    # the product title/selected option. Never infer a size from unrelated text.
    price = int(card_price or 0)
    if not price:
        price = int(base.first_price(text[:3500]) or 0)

    compatible_unit = bool(
        coverage > 0 and size and package_unit and coverage_unit and
        package_unit.lower() == coverage_unit.lower()
    )
    calc_eligible = bool(compatible_unit and price > 0)
    price_map = {base.fmt_num(float(size)): price} if size and price > 0 else {}
    variants = [int(size) if float(size).is_integer() else size] if size else []
    measure_unit = coverage_unit or package_unit or ''

    status_sample = base.norm(text[:4000])
    enabled = not ('tinh trang het hang' in status_sample or 'tam het hang' in status_sample)

    return {
        'id': exact_product_id(title, final),
        'brand': brand,
        'name': title,
        'family': base.family_name(title),
        'category': 'Sơn lót' if role == 'primer' else ('Sơn phủ' if role == 'finish' else 'Sản phẩm sơn'),
        'description': 'Dữ liệu sản phẩm được đồng bộ tự động từ website Sơn Tiến Bảo.',
        'image': base.og_image(soup, final),
        'url': final,
        'price': price,
        'oldPrice': 0,
        'pricePrefix': '',
        'unit': (base.fmt_num(float(size)) + package_unit) if size and package_unit else '',
        'badge': 'Có thể tính' if calc_eligible else ('Có giá' if price else 'Đang bổ sung dữ liệu'),
        'featured': False,
        'calculatorOnly': True,
        'calculatorRole': role,
        'calculatorSurface': surface,
        'pairKey': base.pair_key(title, brand),
        'coverage': coverage,
        'coverageLabel': coverage_label,
        'measureUnit': measure_unit,
        'coverageBasis': 'm2_per_unit' if coverage > 0 else '',
        'variants': variants,
        'massOnly': bool(package_unit == 'Kg' and coverage_unit != 'Kg'),
        'calcEligible': calc_eligible,
        'technicalSource': 'website',
        'priceBySize': price_map,
        'priceReferenceSize': size or 0,
        'enabled': enabled,
    }


def dedupe_exact_packages(items):
    chosen = {}
    order = []
    for item in items:
        size = item.get('priceReferenceSize') or 0
        unit = item.get('measureUnit') or ''
        if size:
            key = '|'.join([
                item.get('brand') or '',
                base.norm(item.get('family') or item.get('name') or ''),
                base.fmt_num(float(size)),
                unit,
            ])
        else:
            key = item.get('url') or item.get('id')
        rank = (
            3 if 'gtc' in (item.get('url') or '').lower() else 0,
            2 if item.get('calcEligible') else 0,
            1 if item.get('price') else 0,
        )
        if key not in chosen:
            chosen[key] = (rank, item)
            order.append(key)
        elif rank > chosen[key][0]:
            chosen[key] = (rank, item)
    return [chosen[k][1] for k in order]


def main():
    text = base.FILE.read_text(encoding='utf-8')
    meta = base.parse_meta(text)
    errors = [e for e in (meta.get('errors') or []) if not str(e).startswith('full catalog ')]

    try:
        categories = base.discover_categories()
    except Exception as e:
        categories = [base.BASE]
        errors.append('full catalog categories: ' + str(e))

    candidate_map = {}
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(base.crawl_category, category): category for category in categories}
        for future in as_completed(futures):
            category = futures[future]
            try:
                for row in future.result():
                    n = base.norm((row[1] or '') + ' ' + row[0])
                    if not base.is_productish(n):
                        continue
                    if any(x in n for x in BLOCKED_LISTING_TERMS + BLOCKED_PRODUCT_TERMS):
                        continue
                    candidate_map.setdefault(row[0], row)
                    if len(candidate_map) >= base.MAX_PRODUCTS:
                        break
            except Exception as e:
                errors.append('full catalog category %s: %s' % (category, e))
            if len(candidate_map) >= base.MAX_PRODUCTS:
                break

    rows = list(candidate_map.values())[:base.MAX_PRODUCTS]
    pages = []

    # Bounded parallelism keeps the six-hour refresh practical without placing
    # a large burst of traffic on the storefront.
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(build_precise_product, row): row for row in rows}
        done = 0
        for future in as_completed(futures):
            row = futures[future]
            done += 1
            try:
                item = future.result()
                if not item:
                    continue
                pages.append(item)
                print('FULL CALC', done, '/', len(rows), item['brand'], item['calculatorRole'], item['calculatorSurface'], item['name'], item['coverage'], item['measureUnit'], item['variants'], item['priceBySize'])
            except Exception as e:
                errors.append('full catalog detail %s: %s' % (row[0], e))
                print('FULL CALC WARN', row[0], e)

    catalog = dedupe_exact_packages(pages)
    calculable = [x for x in catalog if x.get('calcEligible')]
    price_only = [x for x in catalog if not x.get('calcEligible') and x.get('price')]
    brands = sorted(set(x.get('brand') for x in catalog if x.get('brand')))

    meta['calculatorCatalog'] = len(catalog)
    meta['calculatorCalculable'] = len(calculable)
    meta['calculatorPriceOnly'] = len(price_only)
    meta['calculatorBrands'] = brands
    meta['calculatorDiscoveredPages'] = len(pages)
    meta['calculatorCategoryPages'] = len(categories)
    meta['calculatorCandidates'] = len(rows)
    meta['calculatorCatalogLimitReached'] = len(candidate_map) >= base.MAX_PRODUCTS
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

    base.FILE.write_text(text, encoding='utf-8')
    print('FULL CALCULATOR CATALOG:', len(catalog), 'products;', len(calculable), 'calculable;', len(price_only), 'price-only; candidates:', len(rows), 'brands:', ', '.join(brands))


if __name__ == '__main__':
    main()
