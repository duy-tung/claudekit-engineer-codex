DISCOUNT_MULTIPLIERS = {
    "regular": 1.0,
    "member": 0.9,
    "vip": 0.8,
    "staff": 0.5,
}


def final_price(price, customer_type):
    """Apply a customer-type discount to price."""
    if customer_type not in DISCOUNT_MULTIPLIERS:
        raise ValueError(f"unknown customer type: {customer_type}")
    return price * DISCOUNT_MULTIPLIERS[customer_type]
