def final_price(price, customer_type):
    """Apply a customer-type discount to price."""
    if customer_type == "regular":
        return price
    elif customer_type == "member":
        return price * 0.9
    elif customer_type == "vip":
        return price * 0.8
    else:
        raise ValueError(f"unknown customer type: {customer_type}")
