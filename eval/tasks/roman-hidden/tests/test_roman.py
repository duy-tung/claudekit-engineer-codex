import unittest

from roman import to_roman


class TestRoman(unittest.TestCase):
    def test_values(self):
        cases = {
            1: "I", 3: "III", 4: "IV", 9: "IX", 14: "XIV", 40: "XL",
            49: "XLIX", 90: "XC", 400: "CD", 500: "D", 900: "CM",
            944: "CMXLIV", 1000: "M", 1994: "MCMXCIV", 2421: "MMCDXXI",
            3888: "MMMDCCCLXXXVIII", 3999: "MMMCMXCIX",
        }
        for n, expected in cases.items():
            self.assertEqual(to_roman(n), expected, f"to_roman({n})")

    def test_invalid(self):
        for bad in (0, -1, 4000, 5000):
            with self.assertRaises(ValueError):
                to_roman(bad)


if __name__ == "__main__":
    unittest.main()
