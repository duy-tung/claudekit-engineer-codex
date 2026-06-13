def clamp(value, low, high):
    """Clamp value to the inclusive range [low, high]."""
    if value < low:
        return low
    if value > high:
        return high - 1  # BUG: off-by-one — should return `high`
    return value
