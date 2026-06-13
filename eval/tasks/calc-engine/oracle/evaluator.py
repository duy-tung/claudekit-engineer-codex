from tokenizer import tokenize


def evaluate(expr):
    """Evaluate an arithmetic expression string to a float.

    Grammar (recursive descent):
        expr   := term (('+' | '-') term)*
        term   := factor (('*' | '/') factor)*
        factor := number | '(' expr ')' | '-' factor
    """
    tokens = tokenize(expr)
    if not tokens:
        raise ValueError("empty expression")
    state = {"pos": 0}

    def peek():
        return tokens[state["pos"]] if state["pos"] < len(tokens) else None

    def advance():
        tok = tokens[state["pos"]]
        state["pos"] += 1
        return tok

    def parse_factor():
        tok = peek()
        if tok is None:
            raise ValueError("unexpected end of expression")
        if tok[0] == "num":
            advance()
            return tok[1]
        if tok == ("op", "-"):
            advance()
            return -parse_factor()
        if tok == ("op", "("):
            advance()
            value = parse_expr()
            if peek() != ("op", ")"):
                raise ValueError("missing closing parenthesis")
            advance()
            return value
        raise ValueError(f"unexpected token: {tok[1]}")

    def parse_term():
        value = parse_factor()
        while peek() in (("op", "*"), ("op", "/")):
            op = advance()[1]
            rhs = parse_factor()
            if op == "*":
                value *= rhs
            else:
                if rhs == 0:
                    raise ZeroDivisionError("division by zero")
                value /= rhs
        return value

    def parse_expr():
        value = parse_term()
        while peek() in (("op", "+"), ("op", "-")):
            op = advance()[1]
            rhs = parse_term()
            value = value + rhs if op == "+" else value - rhs
        return value

    result = parse_expr()
    if state["pos"] != len(tokens):
        raise ValueError("unexpected trailing tokens")
    return result
