def total(xs):
    """Sum of xs. Already implemented — keep it working."""
    return sum(xs)


def mean(xs):
    """Arithmetic mean of xs; 0.0 for an empty list."""
    return sum(xs) / len(xs)  # BUG: ZeroDivisionError when xs is empty
