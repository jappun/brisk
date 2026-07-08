import re

MIN_LENGTH = 15
MIN_WORDS = 3

KEYBOARD_PATTERNS = re.compile(
    r"^(asdf|qwerty|zxcv|qwer|hjkl|jkl|fdsa|ytrewq|wasd|lol|lmao|idk|nvm|test|aaa|xxx|none|nothing)$",
    re.IGNORECASE,
)


def validate_response(text: str) -> str | None:
    answer = text.strip()

    if len(answer) < MIN_LENGTH:
        return (
            "Please write at least a sentence or two — your teacher needs enough "
            "detail to understand."
        )

    words = [w for w in answer.split() if w]
    if len(words) < MIN_WORDS:
        return "Try using a few words to explain your answer, not just one or two."

    letters = len(re.findall(r"[a-zA-Z]", answer))
    if letters / len(answer) < 0.5:
        return "Please use real words — numbers or symbols alone aren't enough."

    if not re.search(r"[aeiouAEIOU]", answer):
        return "Please write your answer in English so your teacher can read it."

    vowel_count = len(re.findall(r"[aeiouAEIOU]", answer))
    if vowel_count < 3:
        return (
            "Please write a full sentence using real words your teacher can understand."
        )

    long_word_count = 0
    for word in words:
        clean = re.sub(r"[^a-zA-Z]", "", word)
        clean_lower = clean.lower()

        if len(clean) >= 3 and KEYBOARD_PATTERNS.match(clean_lower):
            return (
                "Please share something real about your experience — "
                "there are no wrong answers."
            )

        if len(clean) >= 3 and re.match(r"^(.)\1+$", clean_lower):
            return "Please write a real answer instead of repeating the same letters."

        if len(clean) >= 3 and not re.search(r"[aeiouAEIOU]", clean):
            return "Please use real words your teacher can understand."

        if len(clean) >= 5 and re.search(r"[aeiouAEIOU]", clean):
            long_word_count += 1

    if long_word_count < 1:
        return "Try writing a bit more — use a full sentence with real words."

    unique = len(set(answer.lower().replace(" ", "")))
    if len(answer) >= 15 and unique <= 4:
        return "Please write a real answer — a few sentences about your experience."

    return None


def validate_all_responses(responses: dict) -> str | None:
    optional_keys = {"anything_else"}
    for key, value in responses.items():
        if key in optional_keys and not value.strip():
            continue
        if not value.strip():
            return (
                "Please write at least a sentence or two — your teacher needs enough "
                "detail to understand."
            )
        error = validate_response(value)
        if error:
            return error
    return None
