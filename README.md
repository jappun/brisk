# Student Voice — IEP Intake Companion

A demo tool that captures a student's perspective through a short guided reflection, synthesizes it into a teacher-ready summary, and emails the result.

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
uvicorn main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Email setup (Resend)

Resend's free sandbox sender (`onboarding@resend.dev`) only delivers to **the email you signed up with**. Set `TEACHER_EMAIL` to that address — the UI shows it as a read-only field.

```env
TEACHER_EMAIL=you@example.com
```

To send to arbitrary addresses in production, verify a custom domain in Resend and update `RESEND_FROM_EMAIL` — not needed for this portfolio demo.

---

## Deploying

The frontend (Vite/React) can deploy to Vercel. The backend (FastAPI) needs a Python host — Render, Railway, or Fly.io work well. Point the frontend's API proxy (or `VITE_API_URL`) at your backend URL.

On your deployed backend, set all env vars from `.env.example`. For the public demo, include `TEACHER_EMAIL`.

---

## What it does

1. Student answers 6 reflection questions (one at a time)
2. Student enters teacher email and acknowledges their full answers will be shared
3. Backend synthesizes a summary via Gemini (no diagnosis, no IEP language)
4. Email sent via Resend with overview, detailed summary, and full transcript

See `SPECIFICATION.md` for full product context.
