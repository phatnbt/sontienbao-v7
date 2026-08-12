#!/usr/bin/env python3
import json, re, sys
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse
from difflib import SequenceMatcher

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FILE = ROOT / 'default-data.js'
OUTPUT_FILE = ROOT / 'synced-products.js'
BASE = 'https://sontienbao.com/'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
    'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.6'
}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def load_defaults():
    text = DEFAULT_FILE.read_text(encoding='utf-8')
    m = re.search(r'window\.STB_DEFAULT_DATA\s*=\s*(\{.*\})\s*;?\s*$', text, re.S)
    if not m:
        raise RuntimeError('Cannot parse default-data.js')
    return json.loads(m.group(1))


def norm(s):
    s = (s or '').lower()
    s = re.sub(r'\([^)]*\)', ' ', s)
    s = s.replace('jotun ', '').replace('sơn ', '')
    s = re.sub(r'[^a-z0-9à-ỹ]+', ' ', s, flags=re.I)
    return re.sub(r'\s+', ' ', s).strip()


def to_price(text):
    if not text:
        return 0
    s = re.sub(r'[^0-9]', '', str(text))
    try:
        return int(s)
    except Exception:
        return 0


def price_list(text):
    vals = []
    for m in re.findall(r'(\d{1,3}(?:[\.\s]\d{3})+)\s*đ', text or '', flags=re.I):
        v = to_price(m)
        if v and v not in vals:
            vals.append(v)
    return vals


def fetch_soup(url):
    r = SESSION.get(url, timeout=30, allow_redirects=True)
    r.raise_for_status()
    return r.url, BeautifulSoup(r.text, 'html.parser')


def clean_image_url(value, base_url):
    if not value:
        return ''
    value = str(value).strip()
    # srcset/data-srcset: prefer the largest candidate (last item in most responsive sets)
    if ',' in value:
        parts = [x.strip().split()[0] for x in value.split(',') if x.strip()]
        if parts:
            value = parts[-1]
    else:
        value = value.split()[0]
    if not value or value.startswith('data:'):
        return ''
    url = urljoin(base_url, value)
    if url.startswith('http://'):
        url = 'https://' + url[7:]
    return url


def image_from_tag(img, base_url):
    if not img:
        return ''
    attrs = (
        'data-src', 'data-original', 'data-lazy-src', 'data-lazy', 'data-echo',
        'data-srcset', 'srcset', 'src'
    )
    for attr in attrs:
        url = clean_image_url(img.get(attr), base_url)
        if url:
            return url
    return ''


def card_from_anchor(a):
    node = a
    fallback_img = a.find('img')
    for _ in range(12):
        parent = getattr(node, 'parent', None)
        if not parent:
            break
        txt = parent.get_text(' ', strip=True)
        prices = price_list(txt)
        imgs = parent.find_all('img')
        if prices:
            return parent, prices, (imgs[0] if imgs else fallback_img)
        if not fallback_img and imgs:
            fallback_img = imgs[0]
        node = parent
    return a, [], fallback_img


def same_href_image(soup, href):
    for a in soup.find_all('a', href=True):
        try:
            candidate = urljoin(BASE, a.get('href'))
        except Exception:
            continue
        if candidate.rstrip('/') != href.rstrip('/'):
            continue
        img = a.find('img')
        url = image_from_tag(img, BASE)
        if url:
            return url
    return ''


def image_by_alt(soup, product_name, base_url):
    target = norm(product_name)
    best = ('', 0.0)
    for img in soup.find_all('img'):
        alt = img.get('alt') or img.get('title') or ''
        if not alt:
            continue
        score = SequenceMatcher(None, target, norm(alt)).ratio()
        if target and (target in norm(alt) or norm(alt) in target):
            score += 0.25
        if score > best[1]:
            url = image_from_tag(img, base_url)
            if url:
                best = (url, score)
    return best[0] if best[1] >= 0.48 else ''


def detail_image_and_title(url, fallback_name=''):
    final, soup = fetch_soup(url)
    title = ''
    h1 = soup.find('h1')
    if h1:
        title = h1.get_text(' ', strip=True)
    og = soup.find('meta', attrs={'property': 'og:image'})
    image = clean_image_url(og.get('content') if og else '', final)
    if not image:
        tw = soup.find('meta', attrs={'name': 'twitter:image'})
        image = clean_image_url(tw.get('content') if tw else '', final)
    if not image:
        image = image_by_alt(soup, title or fallback_name, final)
    return final, title, image, soup


def find_home_product(product, soup):
    target = norm(product.get('name'))
    best = None
    for a in soup.find_all('a', href=True):
        text = a.get_text(' ', strip=True)
        if not text:
            continue
        normalized = norm(text)
        if not normalized:
            continue
        score = SequenceMatcher(None, target, normalized).ratio()
        if target and (target in normalized or normalized in target):
            score += 0.25
        if best is None or score > best[0]:
            best = (score, a, text)
    if not best or best[0] < 0.58:
        return None

    _, a, text = best
    card, prices, img = card_from_anchor(a)
    href = urljoin(BASE, a.get('href'))
    image = image_from_tag(img, BASE)
    if not image:
        image = same_href_image(soup, href)
    if not image:
        image = image_by_alt(card, text or product.get('name', ''), BASE)

    current = prices[0] if prices else 0
    old = prices[1] if len(prices) > 1 else 0

    # Detail page is authoritative for image/title if homepage uses background/lazy markup.
    detail_title = ''
    try:
        final_url, detail_title, detail_img, detail_soup = detail_image_and_title(href, text or product.get('name', ''))
        href = final_url
        if detail_img:
            image = detail_img
        if not current:
            dprices = price_list(detail_soup.get_text(' ', strip=True))
            current = dprices[0] if dprices else 0
            old = dprices[1] if len(dprices) > 1 else old
    except Exception as e:
        print('DETAIL WARN', product.get('id'), e, file=sys.stderr)

    return {
        'id': product.get('id'),
        'name': re.sub(r'\s+', ' ', detail_title or text).strip() or product.get('name', ''),
        'url': href,
        'image': image,
        'price': current,
        'oldPrice': old,
        'pricePrefix': product.get('pricePrefix', ''),
        'unit': product.get('unit', '')
    }


def scrape_detail(product):
    url = product.get('url') or ''
    p = urlparse(url)
    if p.netloc not in ('sontienbao.com', 'www.sontienbao.com') or p.path in ('', '/'):
        return None
    final, title, image, soup = detail_image_and_title(url, product.get('name', ''))
    text = soup.get_text(' ', strip=True)
    prices = price_list(text)
    return {
        'id': product.get('id'),
        'name': title or product.get('name', ''),
        'url': final,
        'image': image,
        'price': prices[0] if prices else 0,
        'oldPrice': prices[1] if len(prices) > 1 else 0,
        'pricePrefix': product.get('pricePrefix', ''),
        'unit': product.get('unit', '')
    }


def main():
    data = load_defaults()
    products = data.get('products') or []
    out, errors = [], []

    home_soup = None
    try:
        _, home_soup = fetch_soup(BASE)
        print('HOME OK')
    except Exception as e:
        errors.append(f'homepage: {e}')
        print('HOME ERR', e, file=sys.stderr)

    for product in products:
        item = None
        try:
            if home_soup is not None:
                item = find_home_product(product, home_soup)
            if item is None:
                try:
                    item = scrape_detail(product)
                except Exception as e:
                    errors.append(f"{product.get('id')}: {e}")
            if item:
                out.append(item)
                print('OK', item['id'], item['price'], bool(item.get('image')), item['url'])
            else:
                print('SKIP', product.get('id'))
        except Exception as e:
            errors.append(f"{product.get('id')}: {e}")
            print('ERR', product.get('id'), e, file=sys.stderr)

    if not out:
        print('No product could be synced; keeping previous synced-products.js untouched.', file=sys.stderr)
        sys.exit(0)

    meta = {
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'source': BASE,
        'status': 'ok',
        'synced': len(out),
        'withImages': sum(1 for x in out if x.get('image')),
        'errors': errors
    }
    content = 'window.STB_SYNCED_PRODUCTS = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
    content += 'window.STB_SYNC_META = ' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ';\n'
    OUTPUT_FILE.write_text(content, encoding='utf-8')
    print(f'Wrote {len(out)} products to {OUTPUT_FILE.name}')


if __name__ == '__main__':
    main()
