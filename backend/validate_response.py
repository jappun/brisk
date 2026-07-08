MIN_LENGTH = 15
MIN_WORDS = 3

OPTIONAL_KEYS = {"anything_else"}


def validate_response(text: str) -> str | None:
    answer = text.strip()

    if len(answer) < MIN_LENGTH:
        return (
            "Please write at least a sentence or two — your teacher needs enough "
            "detail to understand."
        )

    if len(answer.split()) < MIN_WORDS:
        return "Try using a few words to explain your answer, not just one or two."

    return None


def validate_all_responses(responses: dict) -> str | None:
    for key, value in responses.items():
        if key in OPTIONAL_KEYS:
            continue
        error = validate_response(value)
        if error:
            return error
    return None
