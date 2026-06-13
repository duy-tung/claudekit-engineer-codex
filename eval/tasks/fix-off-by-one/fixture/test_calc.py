import unittest

from calc import clamp


class TestClamp(unittest.TestCase):
    def test_within(self):
        self.assertEqual(clamp(5, 0, 10), 5)

    def test_below(self):
        self.assertEqual(clamp(-3, 0, 10), 0)

    def test_above(self):
        # Fails with the off-by-one bug (returns 9 instead of 10).
        self.assertEqual(clamp(42, 0, 10), 10)

    def test_at_high(self):
        self.assertEqual(clamp(10, 0, 10), 10)


if __name__ == "__main__":
    unittest.main()
