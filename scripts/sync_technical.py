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


def parse_var(text, name):
    m = re.search(r'window\.%s\s*=\s*(\[.*?\]);\s*(?:\n|$)' % re.escape(name), text, re.S)
    if not m:
        return []
    return json.loads(m.group(1))


def parse_meta(text):
    m = re.search(r'window\.STB_SYNC_META\s*=\s*(\{.*?\});\s*(?:\n|$)', text, re.S)
    return json.loads(m.group(1)) if m else {}


def clean_text(soup):
    for tag in soup(['script', 'style', 'noscript']):
        tag.decompose()
    return re.sub(r'\s+', ' ', soup.get_text(' ', strip=True))


def num(v):
    try:
        return float(str(v).replace(',', '.'))
    except Exception:
        return 0.0


def fmt_num(v):
    if float(v).is_integer():
        return str(int(v))
    return ('%.2f' % v).rstrip('0').rstrip('.')


def extract_coverage(text):
    # Examples supported: 10-12 m²/L/lớp, 11,1 m2/lít/lớp, 5.5 – 7.5 m²/l
    patterns = [
        r'(\d+(?:[\.,]\d+)?)\s*(?:-|–|—|đến|to)\s*(\d+(?:[\.,]\d+)?)\s*m\s*[²2]\s*/\s*(?:l|lít|lit(?:er)?)',
        r'(\d+(?:[\.,]\d+)?)\s*m\s*[²2]\s*/\s*(?:l|lít|lit(?:er)?)'
    ]
    m = re.search(patterns[0], text, re.I)
    if m:
        lo, hi = num(m.group(1)), num(m.group(2))
        if 1 <= lo <= 30 and lo <= hi <= 35:
            return lo, f'{fmt_num(lo)}–{fmt_num(hi)} m²/L/lớp'
    m = re.search(patterns[1], text, re.I)
    if m:
        value = num(m.group(1))
        if 1 <= value <= 30:
            return value, f'{fmt_num(value)} m²/L/lớp'
    return 0, ''


def extract_liter_variants(text):
    vals = []
    # Match only explicit litre units; do not convert kg to litres.
    for raw in re.findall(r'(?<![\d])([0-9]+(?:[\.,][0-9]+)?)\s*(?:lít|lit(?:er)?s?|l)(?![a-zA-Z])', text, re.I):
        v = num(raw)
        if 0.1 <= v <= 50 and v not in vals:
            vals.append(v)
    vals.sort()
    return [int(v) if float(v).is_integer() else v for v in vals]


def detect_mass_unit(text, title=''):
    sample = (title + ' ' + text[:2500]).lower()
    kg = re.search(r'(?<![\d])([0-9]+(?:[\.,][0-9]+)?)\s*kg\b', sample, re.I)
    if kg:
        return f'{fmt_num(num(kg.group(1)))}Kg'
    return ''


def fetch_technical(item):
    url = item.get('url') or ''
    p = urlparse(url)
    if p.netloc not in ('sontienbao.com', 'www.sontienbao.com'):
        return {}
    r = SESSION.get(url, timeout=30, allow_redirects=True)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, 'html.parser')
    title = soup.find('h1').get_text(' ', strip=True) if soup.find('h1') else item.get('name', '')
    text = clean_text(soup)
    coverage, label = extract_coverage(text)
    variants = extract_liter_variants(text)
    mass_unit = detect_mass_unit(text, title)

    # A kg-only material must never be fed into a litres-of-paint calculator.
    kg_only = bool(mass_unit and not variants)
    calc_eligible = bool(coverage > 0 and variants and not kg_only)
    return {
        'coverage': coverage,
        'coverageLabel': label,
        'variants': variants,
        'unit': mass_unit or item.get('unit', ''),
        'calcEligible': calc_eligible,
        'technicalSource': 'iTop' if (coverage or variants or mass_unit) else '',
    }


def enrich(items, errors):
    out = []
    cache = {}
    for item in items:
        x = dict(item)
        url = x.get('url') or ''
        try:
            tech = cache.get(url)
            if tech is None:
                tech = fetch_technical(x)
                cache[url] = tech
            x.update(tech)
            print('TECH', x.get('id'), x.get('coverage'), x.get('variants'), x.get('unit'), x.get('calcEligible'))
        except Exception as e:
            errors.append(f"technical {x.get('id')}: {e}")
            print('TECH WARN', x.get('id'), e)
        out.append(x)
    return out


def main():
    text = FILE.read_text(encoding='utf-8')
    synced = parse_var(text, 'STB_SYNCED_PRODUCTS')
    homepage = parse_var(text, 'STB_HOMEPAGE_PRODUCTS')
    meta = parse_meta(text)
    errors = list(meta.get('errors') or [])

    synced = enrich(synced, errors)
    homepage = enrich(homepage, errors)
    meta['technicalSynced'] = sum(1 for x in synced + homepage if x.get('technicalSource') == 'iTop')
    meta['calculatorEligible'] = sum(1 for x in synced + homepage if x.get('calcEligible'))
    meta['errors'] = errors

    content = 'window.STB_SYNCED_PRODUCTS = ' + json.dumps(synced, ensure_ascii=False, separators=(',', ':')) + ';\n'
    content += 'window.STB_HOMEPAGE_PRODUCTS = ' + json.dumps(homepage, ensure_ascii=False, separators=(',', ':')) + ';\n'
    content += 'window.STB_SYNC_META = ' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ';\n'
    FILE.write_text(content, encoding='utf-8')
    print('Technical sync complete:', meta['technicalSynced'], 'with technical data,', meta['calculatorEligible'], 'calculator eligible')


if __name__ == '__main__':
    main()
