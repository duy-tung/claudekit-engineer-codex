def total(xs):
    """Sum of xs. Already implemented — keep it working."""
    return sum(xs)


def mean(xs):
    """Arithmetic mean of xs; 0.0 for an empty list."""
    return sum(xs) / len(xs) if xs else 0.0
