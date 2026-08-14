#!/usr/bin/env python3
import re

import finalize_calculator_catalog as finalize

_ORIGINAL_SUB = re.sub


def safe_sub(pattern, repl, string, count=0, flags=0):
    if isinstance(repl, str) and repl.startswith('window.STB_'):
        return _ORIGINAL_SUB(pattern, lambda _m: repl, string, count=count, flags=flags)
    return _ORIGINAL_SUB(pattern, repl, string, count=count, flags=flags)


finalize.re.sub = safe_sub

if __name__ == '__main__':
    finalize.main()
