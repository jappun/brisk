# Student Voice — IEP Goal Generating Tool Companion

The purpose of this repo is to demo a tool that complements Brisk's existing IEP Goal Generating Tool. It captures the students perspective through a guided reflection, synthesizes their answer into a summary and emails both a summary and full transcript to the teacher.

You can view the deployed demo here:
One limitation since I'm using Resend's free tier is that the emails will only actually be sent to me, although the email content is visible on the last page for demo purposes. If you would like to see the actual email you can run the app locally. You'll need to sign up with [Resnd](https://resend.com). Quick start at the bottom of the file.

## Future Implementation Ideas
- Voice-to-text option may help students articulate themselves better/more
- Have the teacher create one-time links for each student, so it is already connected to their Brisk-associated email to avoid sending mishaps
- Set of default questions by grade-level. Allow teachers to edit the questions.

## Tech Stack
- FastAPI
- React
- Vite
- Tailwind CSS
- Gemini API
- Resend API

## Quick start (local)

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:

| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `RESEND_API_KEY` | [Resend](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | `Student Voice <onboarding@resend.dev>` works for free tier |
| `TEACHER_EMAIL` | Your Resend signup email — all summaries are sent here |

Start the backend:

```bash
fastapi dev main.py
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---


To send to arbitrary addresses in production, verify a custom domain in Resend and update `RESEND_FROM_EMAIL` — not needed for this portfolio demo.


## What it does

1. Student answers 6 reflection questions (one at a time)
2. Student enters teacher email and acknowledges their full answers will be shared
3. Backend synthesizes a summary via Gemini (no diagnosis, no IEP language)
4. Email sent via Resend with overview, detailed summary, and full transcript

See `SPECIFICATION.md` for full product context.
