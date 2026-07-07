# Student Voice — IEP Intake Companion

A demo project built to show Brisk Teaching a gap in their IEP Goal Generator: no mechanism for capturing the student's own perspective before a teacher drafts goals. This tool captures that perspective through a short guided reflection, synthesizes it into a teacher-ready summary, and emails both the summary and the full transcript directly to the student's teacher.

**This is a portfolio/outreach demo, not a production app.** Priorities: working end-to-end flow, clean UI, a good 60-90 second screen recording. Not priorities: auth, multi-tenancy, persistence beyond a single session, real Brisk integration.

---

## Core Principle (read before building anything)

Brisk's own CEO has publicly framed their philosophy as "teachers in control of AI — not students." This tool must respect that:

- The AI **never** produces a diagnosis, disability category, or eligibility claim.
- The AI **never** writes final IEP language — it only synthesizes the student's self-reported input into a summary the teacher receives and can act on.
- The teacher is always the one who decides what, if anything, reaches an actual IEP document. This tool's job ends at "the teacher now has better information than they had before" — nothing here is final or binding.
- **Transparency to the student is mandatory.** The student must be clearly told, before sending, that their teacher will see their full written answers word-for-word, not just a filtered summary. No sending anything without that warning being shown and acknowledged.
- Tone for the student-facing side: plain language, respectful, not clinical, not infantilizing. Assume the student reading it could be anywhere from upper elementary to high school — default the demo copy to a middle/high-school register.

---

## User Flow (3 screens)

### Screen 1 — Student Reflection (chat-style, not a form)
A short, guided conversational flow. Present one question at a time, conversational framing, simple "Next" progression (a stepped card UI is fine — no need for real chat/streaming).

Fixed question set (use these, lightly adjust wording if needed, but keep the intent):
1. What's something you've felt proud of recently?
2. What's something that's genuinely hard for you, and when does it usually show up? (a specific class, a type of task, a time of day, etc.)
3. Has a teacher ever done something that actually helped? What was it?
4. Has anything made things worse, or not helped even if it was meant to?
5. If you could change one thing about how school works for you, what would it be?
6. Is there anything else you want your teacher to know?

Simple text inputs, one question visible at a time, progress indicator (e.g. "3 of 6"). Keep the UI warm — soft colors, generous whitespace, not a clinical form.

### Screen 2 — Handoff to Teacher
After the last question, transition with a brief, warm message (e.g. "Thanks for telling me about yourself — I'll help get this to your teacher.").

Then:
1. **Ask for the teacher's email address** (simple text input, basic email format validation).
2. **Show a clear, unmissable warning** before anything can be sent: *"Your teacher will receive a summary AND your full written answers, exactly as you wrote them. Nothing is private from your teacher here."* This should be visually distinct (bordered box, icon, contrasting color) — not fine print.
3. **Require explicit acknowledgment** — a checkbox ("I understand my teacher will see my full answers") that must be checked before the send button activates.
4. **Send button** — "Send to my teacher." On click, trigger the backend synthesis + send flow (show a loading state while this happens — synthesis + send can be one combined step from the student's point of view).

### Screen 3 — Confirmation
Simple confirmation: "Sent to [teacher email]." Include a **preview toggle** ("See what was sent") that expands to show the actual summary + transcript content — this is mainly for your demo recording, so the viewer can see the email content without needing to cut to an actual inbox. If you do wire up real email sending (see below), this preview is still worth keeping for the recording regardless.

---

## Tech Stack

- **Backend:** FastAPI (Python)
- **Frontend:** React + Vite + Tailwind CSS
- **LLM**: Gemini API - or something else with a generous free tier
- **Email sending:** two options, pick based on how much polish you want for the recording:
  - **Mocked (default, fastest):** backend "send" endpoint logs the composed email to console and returns success — no real email goes out. Fine for a demo since the Screen 3 preview shows the content anyway.
  - **Real (more impressive, a bit more setup):** wire up a transactional email API (e.g. Resend — has a generous free tier and a very simple API) so an actual email lands in an actual inbox during your recording. If you want this, get a Resend API key and add it as an environment variable; the send endpoint becomes a real API call instead of a console log. Worth doing if you have an extra hour — receiving a real email on camera is a stronger demo than a "trust me, it sent" screen.
- **No database needed** — session state lives in React state / passed through requests. No persistence needed beyond the single session.
- **No auth needed** — single-user, single-session demo.

---

## API Design

### `POST /api/synthesize`

**Request body:**
```json
{
  "responses": {
    "proud_moment": "string",
    "challenge": "string",
    "helped": "string",
    "didnt_help": "string",
    "wish_changed": "string",
    "anything_else": "string"
  }
}
```

**Response body:**
```json
{
  "overview": "string",
  "strengths": "string",
  "challenges": "string",
  "what_worked": "string",
  "student_goals": "string"
}
```

`overview` is a 1-2 sentence at-a-glance summary that sits above the four detailed sections — this is what a busy teacher reads first (and possibly *only* reads, if they're skimming before a meeting), so it needs to carry the single most useful takeaway on its own, not just restate "here's a summary of the student's reflection."

**System prompt guidance for the synthesis call:**
- Instruct the model explicitly: do not diagnose, do not name or imply any disability category, do not use clinical/deficit-framed language, write in a warm but professional register suitable for a teacher preparing for an IEP meeting.
- Ground every section in what the student actually said — no inventing details not present in the responses.
- Keep each detailed section to 2-4 sentences max; keep `overview` to 1-2 sentences — this is a starting point for a teacher, not a finished document.
- Generate `overview` last (or in a separate pass) so it can pull the single most salient point across strengths/challenges/goals, rather than being generated independently and risking redundancy with the sections below it.

### `POST /api/send-summary`

**Request body:**
```json
{
  "teacher_email": "string",
  "responses": { "...same shape as above" },
  "summary": { "...same shape as /api/synthesize response" }
}
```

**Behavior:** composes and sends (or logs, if mocked) an email to `teacher_email` containing, in this order:
1. **Overview** — the 1-2 sentence at-a-glance summary, placed right under the subject/greeting so it's the first thing a teacher reads.
2. **Detailed summary** (strengths / challenges / what's worked / student goals), clearly labeled as a starting point for the teacher to review — not a finished assessment.
3. The full raw transcript of the student's six answers, clearly labeled as the student's own words.

**Response body:**
```json
{ "status": "sent", "teacher_email": "string" }
```

---

## File Structure

```
student-voice/
├── backend/
│   ├── main.py              # FastAPI app: /api/synthesize, /api/send-summary
│   ├── prompts.py           # System prompt + synthesis prompt template
│   ├── email_template.py    # Composes the email body (summary + transcript sections)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ReflectionFlow.jsx   # Screen 1
│   │   │   ├── TeacherHandoff.jsx   # Screen 2 (email input + warning + send)
│   │   │   └── Confirmation.jsx     # Screen 3
│   │   └── index.css
│   └── package.json
└── SPECIFICATION.md
```

---

## Build Order (for Cursor)

NOTE: Remember to set up a git repo and commit regularly. 

1. Scaffold FastAPI backend: `/api/synthesize` first. Hardcode a test payload to confirm the LLM call works and guardrails hold — test with a deliberately tricky input (e.g. one that could tempt the model toward diagnostic language) to confirm the system prompt holds up.
2. Add `/api/send-summary` with the **mocked** version first (console log, not a real send) so the flow works end-to-end before adding any external email dependency.
3. Scaffold React frontend with all three screens using static/mocked data (no backend calls yet) to get the flow and the warning/consent UI feeling right — the warning screen especially deserves some design attention since it's doing real trust-signaling work in the pitch.
4. Wire the frontend to the real backend endpoints.
5. Polish: transitions between screens, loading state during synthesize+send, the "See what was sent" preview toggle on Screen 3.
6. Optional: swap the mocked send for a real Resend (or similar) API call if you want an actual email landing in an inbox for the recording.
7. Record a 60-90 second screen capture: fill out the reflection quickly with a plausible test case (e.g. reuse the "gifted student, high anxiety" framing that surfaced the earlier IEP Goal Generator output), through the warning/consent step, to the sent confirmation.

---

## Explicitly Out of Scope

- Real Brisk API integration (they don't have a public API for this; this tool stands alone and hands off via email, not a real Brisk handoff)
- Multi-student/multi-teacher accounts
- Persistent storage / database
- Authentication
- Verifying the entered teacher email actually belongs to a real teacher (out of scope for a demo — note this as a known limitation if asked, don't pretend it's solved)
- Real compliance/legal review (this is a demo of the *idea*, not a shippable product — don't claim otherwise in the pitch)
