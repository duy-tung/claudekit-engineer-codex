import unittest

from pricing import final_price


class TestPricing(unittest.TestCase):
    def test_regular(self):
        self.assertEqual(final_price(100, "regular"), 100)

    def test_member(self):
        self.assertEqual(final_price(100, "member"), 90)

    def test_vip(self):
        self.assertEqual(final_price(100, "vip"), 80)

    def test_staff(self):
        # New tier — fails until added.
        self.assertEqual(final_price(100, "staff"), 50)

    def test_unknown(self):
        with self.assertRaises(ValueError):
            final_price(100, "ghost")


if __name__ == "__main__":
    unittest.main()
