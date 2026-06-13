import unittest

from strutils import reverse_words, count_vowels, is_palindrome


class TestStrUtils(unittest.TestCase):
    def test_reverse_words(self):
        # Pre-existing behavior — must not regress.
        self.assertEqual(reverse_words("hello world foo"), "foo world hello")

    def test_count_vowels_basic(self):
        self.assertEqual(count_vowels("Hello"), 2)

    def test_count_vowels_none(self):
        self.assertEqual(count_vowels("xyz"), 0)

    def test_palindrome_true(self):
        self.assertTrue(is_palindrome("A man, a plan, a canal: Panama"))

    def test_palindrome_false(self):
        self.assertFalse(is_palindrome("hello"))


if __name__ == "__main__":
    unittest.main()
