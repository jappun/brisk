# IEP Intake Companion

A demo for a tool that complements Brisk's IEP Goal Generator by capturing the **student's perspective** before a teacher drafts goals. Students complete a short guided reflection; the app synthesizes their answers into a teacher-ready summary and emails both the summary and full transcript.

- **Live demo:** https://brisk-iep-intake.vercel.app
- **Demo video:** https://www.youtube.com/watch?v=bMkanNiIdQA

## Demo limitation (Resend free tier)

Resend's sandbox sender (`onboarding@resend.dev`) only delivers to **the email you signed up with**. For the deployed demo, `TEACHER_EMAIL` is set to my address — all submissions route there. The confirmation screen still shows the full email content so viewers can see what a teacher would receive.

To run it yourself with real sends, follow [Quick start](#quick-start-local) below and add your own API keys to `backend/.env`.

## Product Motivation

When I was 10, I was given a gifted designation by my school district, which meant I was supposed to have an IEP. Over the next 8 years of school, only one teacher actually built and followed through on one. It amounted to additional readings and a weekly logic puzzle problem set. While I loved the readings and doing extra book report presentations, the puzzles were a different story. I fell behind on them almost immediately. Looking back, I see two separate problems. The first is time. Most of my teachers didn't have the bandwidth to build an IEP at all. Your IEP Goal Generating Tool addresses this. 

But the second problem is different. The one IEP I did have didn't play to my strengths, which I knew at the time. The puzzles felt like more effort than anything else I did in school and far too difficult of a challenge. At 11, telling my teacher "I don't think this works for me" felt like admitting I didn't deserve the gifted designation. I didn't say anything and the incomplete problem sets piled up, a mountain of evidence that I was failing at something my teacher thought I'd be good at. 

Brisk's IEP tool doesn't yet address this second problem where the students' perspective is not accounted for. **So I built a small demo of an intake tool meant to complement the Goal Generator.** It collects the student perspective through a guided reflection and sends a summary and full transcript straight to their teacher. That way, the teacher has the option to easily include the student's ideas into the prompt for the IEP Goal Generator. 

## Future implementation ideas

- Voice-to-text so students can speak their answers instead of typing
- One-time links per student, pre-connected to the teacher's Brisk-associated email
- Default question sets by grade level that can be edited by the teacher

## Tech stack

- Backend: FastAPI, Gemini API, Resend
- Frontend: React, Vite, Tailwind CSS
- Deploy: Vercel (frontend) + Python host for backend (e.g. Render, Railway)
- Built with: Cursor (see `SPECIFICATION.md` for the original prompt)

---

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
| `GEMINI_MODEL` | Optional. Default: `gemini-2.5-flash-lite` (better free-tier quota than `gemini-2.0-flash`) |
| `RESEND_API_KEY` | [Resend](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | `IEP Intake Companion <onboarding@resend.dev>` works for free tier |
| `TEACHER_EMAIL` | Your Resend signup email — required; shown read-only in the UI |

Start the backend (venv must be active):

```bash
source venv/bin/activate
fastapi dev main.py
```

Or: `uvicorn main:app --reload`

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---
