_VALUES = [
    (1000, "M"), (900, "CM"), (500, "D"), (400, "CD"),
    (100, "C"), (90, "XC"), (50, "L"), (40, "XL"),
    (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I"),
]


def to_roman(n):
    """Convert an integer 1..3999 to a Roman numeral string."""
    if not isinstance(n, int) or isinstance(n, bool) or n < 1 or n > 3999:
        raise ValueError(f"out of range: {n!r}")
    out = []
    for value, symbol in _VALUES:
        while n >= value:
            out.append(symbol)
            n -= value
    return "".join(out)
