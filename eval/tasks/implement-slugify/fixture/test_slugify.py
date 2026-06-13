import unittest

from slugify import slugify


class TestSlugify(unittest.TestCase):
    def test_basic(self):
        self.assertEqual(slugify("Hello World"), "hello-world")

    def test_trim_and_collapse(self):
        self.assertEqual(slugify("  Multiple   Spaces  "), "multiple-spaces")

    def test_punctuation(self):
        self.assertEqual(slugify("Hello, World!"), "hello-world")

    def test_underscores_and_dashes(self):
        self.assertEqual(slugify("a_b-c"), "a-b-c")


if __name__ == "__main__":
    unittest.main()
