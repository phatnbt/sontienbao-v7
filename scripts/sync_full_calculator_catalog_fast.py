#!/usr/bin/env python3
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

import sync_full_calculator_catalog as base


def main():
    text = base.FILE.read_text(encoding='utf-8')
    meta = base.parse_meta(text)
    errors = [e for e in (meta.get('errors') or []) if not str(e).startswith('full catalog ')]

    try:
        categories = base.discover_categories()
    except Exception as e:
        categories = [base.BASE]
        errors.append('full catalog categories: ' + str(e))

    # Crawl listing/category pages concurrently. Keep the worker count moderate so
    # the public storefront is not overloaded.
    candidate_map = {}
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(base.crawl_category, category): category for category in categories}
        for future in as_completed(futures):
            category = futures[future]
            try:
                for row in future.result():
                    if not base.is_productish((row[1] or '') + ' ' + row[0]):
                        continue
                    n = base.norm((row[1] or '') + ' ' + row[0])
                    if any(x in n for x in (
                        'co son', 'co lan', 'con lan', 'giay nham', 'ban cha',
                        'mui nhua', 'sui can', 'dung cu', 'phu kien', 'bang mau',
                        'may phun', 'keo cat', 'thang nhom'
                    )):
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

    # Product detail pages are the expensive part. Eight workers keeps a small,
    # bounded amount of parallelism while reducing a full refresh from many
    # minutes to a practical scheduled task.
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(base.build_product, row): row for row in rows}
        done = 0
        for future in as_completed(futures):
            row = futures[future]
            done += 1
            try:
                item = future.result()
                pages.append(item)
                print('FULL CALC', done, '/', len(rows), item['brand'], item['role'], item['surface'], item['family'], item['coverage'], item['measureUnit'], item['variants'], item['priceBySize'])
            except Exception as e:
                errors.append('full catalog detail %s: %s' % (row[0], e))
                print('FULL CALC WARN', row[0], e)

    catalog = base.consolidate(pages)
    calculable = [x for x in catalog if x.get('calcEligible')]
    price_only = [x for x in catalog if not x.get('calcEligible') and (x.get('price') or x.get('priceBySize'))]
    brands = sorted(set(x.get('brand') for x in catalog if x.get('brand')))

    meta['calculatorCatalog'] = len(catalog)
    meta['calculatorCalculable'] = len(calculable)
    meta['calculatorPriceOnly'] = len(price_only)
    meta['calculatorBrands'] = brands
    meta['calculatorDiscoveredPages'] = len(pages)
    meta['calculatorCategoryPages'] = len(categories)
    meta['calculatorCandidates'] = len(rows)
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
    print('FULL CALCULATOR CATALOG:', len(catalog), 'products;', len(calculable), 'calculable;', len(price_only), 'price-only; brands:', ', '.join(brands))


if __name__ == '__main__':
    main()
