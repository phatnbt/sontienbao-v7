#!/usr/bin/env python3
import re
from urllib.parse import urlparse

import sync_full_calculator_catalog_resilient as resilient

_ORIGINAL_SUB = re.sub


def safe_sub(pattern, repl, string, count=0, flags=0):
    # JSON replacement text can legitimately contain sequences such as \\1 in a
    # product title. Passing that text directly as re.sub's replacement would
    # interpret it as a regex group reference. A callable replacement keeps the
    # serialized JSON byte-for-byte literal.
    if isinstance(repl, str) and repl.startswith('window.STB_'):
        return _ORIGINAL_SUB(pattern, lambda _m: repl, string, count=count, flags=flags)
    return _ORIGINAL_SUB(pattern, repl, string, count=count, flags=flags)


def url_first_package_hint(title, card_name, url, soup):
    # Exact SKU URLs such as ...-20kg.html or ...-18l.html are the strongest
    # package-size signal. Some product pages preload a 5Kg/5L default option,
    # so selected HTML state must not overwrite an explicit SKU encoded in URL.
    path = urlparse(url).path.lower()
    matches = list(re.finditer(r'(?:^|[-_/])([0-9]+(?:[.,][0-9]+)?)(l|kg)(?:[-_./]|$)', path, re.I))
    if matches:
        m = matches[-1]
        value = resilient.base.num(m.group(1))
        if 0.05 <= value <= 100:
            return (int(value) if float(value).is_integer() else value), ('Kg' if m.group(2).lower() == 'kg' else 'L')

    size, unit = resilient.base.size_unit_from_text(title or '')
    if size and unit:
        return size, unit

    size, unit = resilient.fast.selected_size(soup)
    if size and unit:
        return size, unit

    size, unit = resilient.base.size_unit_from_text(card_name or '')
    if size and unit:
        return size, unit
    return 0, ''


# fast/base/resilient all reference Python's shared re module, so installing the
# safe writer here protects the entire crawl/write operation for this process.
resilient.fast.re.sub = safe_sub
resilient.base.re.sub = safe_sub
resilient.re.sub = safe_sub
resilient.package_hint_precise = url_first_package_hint

if __name__ == '__main__':
    resilient.main()
