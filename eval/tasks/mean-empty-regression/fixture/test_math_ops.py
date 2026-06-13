import unittest

from math_ops import total, mean


class TestMathOps(unittest.TestCase):
    def test_total(self):
        # Pre-existing behavior — must not regress.
        self.assertEqual(total([1, 2, 3]), 6)

    def test_mean_basic(self):
        self.assertEqual(mean([2, 4]), 3.0)

    def test_mean_empty(self):
        # Fails with the bug (ZeroDivisionError).
        self.assertEqual(mean([]), 0.0)


if __name__ == "__main__":
    unittest.main()
