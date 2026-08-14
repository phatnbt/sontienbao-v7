#!/usr/bin/env python3
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse

import sync_full_calculator_catalog_fast as fast

base = fast.base

SEED_CATEGORIES = [
    'https://sontienbao.com/san-pham/',
    'https://sontienbao.com/son-jotun-nauy/',
    'https://sontienbao.com/san-pham/son-nippon/',
    'https://sontienbao.com/san-pham/son-ruby/',
    'https://sontienbao.com/danh-muc-san-pham/son-trang-tri-terraco/',
]
MAX_DISCOVERY_CATEGORIES = 140


def canonical(url):
    return url.split('#', 1)[0].split('?', 1)[0]


def discover_children(url):
    out = []
    try:
        final, soup, _, _ = base.fetch_page(url)
    except Exception as e:
        print('CATEGORY DISCOVERY WARN', url, e)
        return out
    for a in soup.find_all('a', href=True):
        href = canonical(urljoin(final, a.get('href')))
        if urlparse(href).netloc.lower() not in ('sontienbao.com', 'www.sontienbao.com'):
            continue
        label = a.get_text(' ', strip=True)
        try:
            if base.is_categoryish(label, href):
                out.append(href)
        except Exception:
            continue
    return out


def discover_categories_resilient():
    # Start from stable brand/category roots, so a timeout on the homepage can
    # never collapse the Calculator catalog to a tiny subset.
    seen = []
    seen_set = set()

    def add(url):
        url = canonical(url)
        if url and url not in seen_set and len(seen) < MAX_DISCOVERY_CATEGORIES:
            seen_set.add(url)
            seen.append(url)
            return True
        return False

    for url in SEED_CATEGORIES:
        add(url)

    # Homepage discovery is useful when available, but no longer mandatory.
    try:
        for url in base._original_discover_categories():
            add(url)
    except Exception as e:
        print('HOMEPAGE CATEGORY DISCOVERY WARN', e)

    frontier = list(seen)
    for _depth in range(3):
        if not frontier or len(seen) >= MAX_DISCOVERY_CATEGORIES:
            break
        next_frontier = []
        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = {pool.submit(discover_children, url): url for url in frontier}
            for future in as_completed(futures):
                try:
                    children = future.result()
                except Exception:
                    children = []
                for child in children:
                    if add(child):
                        next_frontier.append(child)
                    if len(seen) >= MAX_DISCOVERY_CATEGORIES:
                        break
        frontier = next_frontier

    print('RESILIENT CATEGORY DISCOVERY:', len(seen), 'category/listing pages')
    return seen


def package_hint_precise(title, card_name, url, soup):
    # Reliability order:
    # 1) H1/title of the current product page
    # 2) selected variant on that product page
    # 3) package size encoded in the exact product URL
    # 4) listing-card text only as a final fallback
    #
    # This prevents a listing card from donating e.g. 5Kg to a product URL that
    # explicitly represents the 20Kg SKU.
    size, unit = base.size_unit_from_text(title or '')
    if size and unit:
        return size, unit

    size, unit = fast.selected_size(soup)
    if size and unit:
        return size, unit

    path = urlparse(url).path.lower()
    m = re.search(r'(?:^|[-_/])([0-9]+(?:[.,][0-9]+)?)(l|kg)(?:[-_./]|$)', path, re.I)
    if m:
        value = base.num(m.group(1))
        if 0.05 <= value <= 100:
            return (int(value) if float(value).is_integer() else value), ('Kg' if m.group(2).lower() == 'kg' else 'L')

    size, unit = base.size_unit_from_text(card_name or '')
    if size and unit:
        return size, unit
    return 0, ''


def parse_calc_products(text):
    m = re.search(r'window\.STB_CALCULATOR_PRODUCTS\s*=\s*(\[.*?\]);', text, re.S)
    return json.loads(m.group(1)) if m else []


def parse_meta(text):
    m = re.search(r'window\.STB_SYNC_META\s*=\s*(\{.*?\});', text, re.S)
    return json.loads(m.group(1)) if m else {}


def replace_assignment(text, name, value):
    line = 'window.%s = %s;' % (name, json.dumps(value, ensure_ascii=False, separators=(',', ':')))
    opener = r'\[' if isinstance(value, list) else r'\{'
    closer = r'\]' if isinstance(value, list) else r'\}'
    return re.sub(r'window\.%s\s*=\s*%s.*?%s;' % (re.escape(name), opener, closer), line, text, count=1, flags=re.S)


def main():
    before_text = base.FILE.read_text(encoding='utf-8')
    before_products = parse_calc_products(before_text)
    before_meta = parse_meta(before_text)

    base._original_discover_categories = base.discover_categories
    base.discover_categories = discover_categories_resilient
    fast.package_hint = package_hint_precise

    fast.main()

    # Never replace a healthy previously published catalog with a severely
    # degraded crawl caused by temporary storefront/network failures.
    after_text = base.FILE.read_text(encoding='utf-8')
    after_meta = parse_meta(after_text)
    previous_count = int(before_meta.get('calculatorCatalog') or len(before_products) or 0)
    new_count = int(after_meta.get('calculatorCatalog') or 0)
    new_candidates = int(after_meta.get('calculatorCandidates') or 0)
    degraded = previous_count >= 40 and (new_count < max(30, int(previous_count * 0.45)) or new_candidates < 30)

    if degraded:
        errors = list(before_meta.get('errors') or [])
        errors.append('full catalog degraded crawl ignored: previous=%s new=%s candidates=%s' % (previous_count, new_count, new_candidates))
        before_meta['errors'] = errors[-80:]
        before_meta['calculatorLastDegradedCatalog'] = new_count
        before_meta['calculatorLastDegradedCandidates'] = new_candidates
        restored = replace_assignment(after_text, 'STB_CALCULATOR_PRODUCTS', before_products)
        restored = replace_assignment(restored, 'STB_SYNC_META', before_meta)
        base.FILE.write_text(restored, encoding='utf-8')
        print('DEGRADED CRAWL IGNORED; kept previous Calculator catalog:', previous_count)


if __name__ == '__main__':
    main()
