#!/usr/bin/env python3
import re

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


# fast/base/resilient all reference Python's shared re module, so installing the
# safe writer here protects the entire crawl/write operation for this process.
resilient.fast.re.sub = safe_sub
resilient.base.re.sub = safe_sub
resilient.re.sub = safe_sub

if __name__ == '__main__':
    resilient.main()
