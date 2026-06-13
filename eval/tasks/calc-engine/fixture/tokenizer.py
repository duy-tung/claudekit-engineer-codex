import re

# Numbers (int or float) and the single-char operators / parentheses.
_TOKEN_RE = re.compile(r"\s*(?:(\d+\.\d+|\d+)|([+\-*/()]))")


def tokenize(expr):
    """Tokenize an arithmetic expression into ('num', float) / ('op', str) tuples.

    Raises ValueError on any character that is not a number, operator,
    parenthesis, or whitespace.
    """
    tokens = []
    pos = 0
    while pos < len(expr):
        if expr[pos].isspace():
            pos += 1
            continue
        m = _TOKEN_RE.match(expr, pos)
        if not m or m.end() == pos:
            raise ValueError(f"unexpected character at {pos}: {expr[pos]!r}")
        num, op = m.group(1), m.group(2)
        if num is not None:
            tokens.append(("num", float(num)))
        else:
            tokens.append(("op", op))
        pos = m.end()
    return tokens
