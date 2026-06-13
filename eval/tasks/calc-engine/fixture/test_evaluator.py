import unittest

from evaluator import evaluate


class TestEvaluator(unittest.TestCase):
    def test_add(self):
        self.assertEqual(evaluate("1+2"), 3)

    def test_precedence(self):
        self.assertEqual(evaluate("2*3+4"), 10)

    def test_parens(self):
        self.assertEqual(evaluate("2*(3+4)"), 14)

    def test_unary_minus(self):
        self.assertEqual(evaluate("-5+3"), -2)

    def test_float_div(self):
        self.assertEqual(evaluate("10/4"), 2.5)

    def test_nested(self):
        self.assertEqual(evaluate("((1+2)*3)"), 9)

    def test_div_zero(self):
        with self.assertRaises(ZeroDivisionError):
            evaluate("1/0")

    def test_malformed(self):
        with self.assertRaises(ValueError):
            evaluate("2+")


if __name__ == "__main__":
    unittest.main()
