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


def slug_id(url):
    path = urlparse(url).path.rstrip('/').split('/')[-1]
    path = re.sub(r'\.html?$', '', path, flags=re.I)
    path = re.sub(r'[^a-zA-Z0-9]+', '-', path).strip('-').lower()
    return 'itop-' + (path[:72] or 'product')


def infer_brand(name, url):
    text = (name + ' ' + url).lower()
    if 'terraco' in text or 'flexipave' in text:
        return 'TERRACO'
    if 'nippon' in text:
        return 'NIPPON'
    if 'ruby' in text:
        return 'RUBY PAINT'
    if 'jotun' in text or 'jotashield' in text or 'tough shield' in text or 'waterguard' in text:
        return 'JOTUN'
    return 'SƠN TIẾN BẢO'


def infer_category(name, url):
    text = (name + ' ' + url).lower()
    if 'san-the-thao' in text or 'flexipave' in text or 'tennis' in text or 'pickleball' in text:
        return 'Sơn sân thể thao'
    if 'chong-tham' in text or 'waterguard' in text:
        return 'Chống thấm'
    if 'son-lot' in text or 'primer' in text:
        return 'Sơn lót'
    if 'noi-that' in text or 'interior' in text or 'majestic' in text:
        return 'Sơn nội thất'
    if 'ngoai-that' in text or 'exterior' in text or 'jotashield' in text or 'tough-shield' in text:
        return 'Sơn ngoại thất'
    return 'Sản phẩm nổi bật'


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


def compact_product_card(a):
    node = a
    best_img = a.find('img')
    for _ in range(7):
        parent = getattr(node, 'parent', None)
        if not parent:
            break
        text = parent.get_text(' ', strip=True)
        if len(text) > 1400:
            break
        imgs = parent.find_all('img')
        if imgs and not best_img:
            best_img = imgs[0]
        prices = price_list(text)
        if prices and (imgs or best_img):
            return parent, prices, (imgs[0] if imgs else best_img)
        node = parent
    return None, [], best_img


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


def discover_home_catalog(soup, limit=18):
    found = []
    seen = set()
    blocked = ('/lien-he', '/gio-hang', '/tin-tuc', '/bang-gia', '/bang-mau', '/admin')

    for a in soup.find_all('a', href=True):
        href = urljoin(BASE, a.get('href'))
        parsed = urlparse(href)
        if parsed.netloc not in ('sontienbao.com', 'www.sontienbao.com'):
            continue
        path = parsed.path.lower()
        if not path.endswith('.html') or any(x in path for x in blocked):
            continue
        canonical = href.split('#', 1)[0].split('?', 1)[0]
        if canonical in seen:
            continue

        card, prices, img = compact_product_card(a)
        if not card or not prices:
            continue

        name = re.sub(r'\s+', ' ', a.get_text(' ', strip=True)).strip()
        if len(name) < 5 or name.lower() in ('xem chi tiết', 'xem sản phẩm', 'mua ngay', 'chi tiết'):
            heading = card.find(['h2', 'h3', 'h4', 'h5'])
            name = re.sub(r'\s+', ' ', heading.get_text(' ', strip=True)).strip() if heading else ''
        if len(name) < 5 and img:
            name = (img.get('alt') or img.get('title') or '').strip()
        if len(name) < 5:
            continue

        image = image_from_tag(img, BASE) or same_href_image(soup, canonical)
        if not image:
            image = image_by_alt(card, name, BASE)

        current = prices[0]
        old = prices[1] if len(prices) > 1 and prices[1] > current else 0
        item = {
            'id': slug_id(canonical),
            'brand': infer_brand(name, canonical),
            'name': name,
            'category': infer_category(name, canonical),
            'image': image,
            'url': canonical,
            'price': current,
            'oldPrice': old,
            'pricePrefix': 'Từ',
            'unit': '',
            'featured': True,
            'enabled': True,
            'storefrontOnly': True
        }
        found.append(item)
        seen.add(canonical)
        if len(found) >= limit:
            break

    return found


def main():
    data = load_defaults()
    products = data.get('products') or []
    out, errors = [], []
    homepage_products = []

    home_soup = None
    try:
        _, home_soup = fetch_soup(BASE)
        print('HOME OK')
        homepage_products = discover_home_catalog(home_soup)
        print('HOME FEATURED', len(homepage_products))
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

    if not out and not homepage_products:
        print('No product could be synced; keeping previous synced-products.js untouched.', file=sys.stderr)
        sys.exit(0)

    meta = {
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'source': BASE,
        'status': 'ok',
        'synced': len(out),
        'withImages': sum(1 for x in out if x.get('image')),
        'homepageProducts': len(homepage_products),
        'errors': errors
    }
    content = 'window.STB_SYNCED_PRODUCTS = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
    content += 'window.STB_HOMEPAGE_PRODUCTS = ' + json.dumps(homepage_products, ensure_ascii=False, separators=(',', ':')) + ';\n'
    content += 'window.STB_SYNC_META = ' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ';\n'
    OUTPUT_FILE.write_text(content, encoding='utf-8')
    print(f'Wrote {len(out)} synced products and {len(homepage_products)} homepage products')


if __name__ == '__main__':
    main()
