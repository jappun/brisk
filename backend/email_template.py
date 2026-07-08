QUESTION_LABELS = {
    "proud_moment": "What's something you've felt proud of recently?",
    "challenge": "What's something that's genuinely hard for you, and when does it usually show up?",
    "helped": "Has a teacher ever done something that actually helped? What was it?",
    "didnt_help": "Has anything made things worse, or not helped even if it was meant to?",
    "wish_changed": "If you could change one thing about how school works for you, what would it be?",
    "anything_else": "Is there anything else you want your teacher to know?",
}


def compose_email_body(responses: dict, summary: dict) -> str:
    lines = [
        "Hello,",
        "",
        "A student has completed a self-reflection to share their perspective ahead of an IEP meeting.",
        "This is a starting point for your review — not a finished assessment.",
        "",
        "── OVERVIEW ──",
        summary.get("overview", ""),
        "",
        "── DETAILED SUMMARY ──",
        "",
        "Strengths:",
        summary.get("strengths", ""),
        "",
        "Challenges:",
        summary.get("challenges", ""),
        "",
        "What Has Worked:",
        summary.get("what_worked", ""),
        "",
        "Student Goals & Wishes:",
        summary.get("student_goals", ""),
        "",
        "── STUDENT'S OWN WORDS (full transcript) ──",
        "",
    ]

    for key, label in QUESTION_LABELS.items():
        answer = responses.get(key, "").strip() or "(no response)"
        lines.append(f"Q: {label}")
        lines.append(f"A: {answer}")
        lines.append("")

    lines.append("—")
    lines.append("Sent via IEP Intake Companion")

    return "\n".join(lines)


def compose_email_subject() -> str:
    return "Student Reflection Summary — for your review before IEP meeting"
