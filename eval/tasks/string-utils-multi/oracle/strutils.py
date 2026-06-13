def reverse_words(s):
    """Reverse the order of words in s. Already implemented — keep it working."""
    return " ".join(reversed(s.split()))


def count_vowels(s):
    """Count the vowels (a, e, i, o, u; case-insensitive) in s."""
    return sum(1 for c in s.lower() if c in "aeiou")


def is_palindrome(s):
    """True if s is a palindrome, ignoring case and non-alphanumeric characters."""
    cleaned = [c for c in s.lower() if c.isalnum()]
    return cleaned == cleaned[::-1]
