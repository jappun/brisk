# IEP Intake Companion

A demo for a tool that complements Brisk's IEP Goal Generator by capturing the **student's perspective** before a teacher drafts goals. A teacher picks the questions and emails a student a one-time link; the student completes a short guided reflection; the app turns their answers into a schema-validated summary and emails the teacher both the summary and the full transcript.

**Live demo:** https://brisk-iep-intake.vercel.app

This is the second version of this demo, you can see a video of the old one here: https://www.youtube.com/watch?v=bMkanNiIdQA

## Changes since v1

### Product

- **Teacher-first:** Teachers pick and add questions, then email the student a one-time link (expires in 7 days, single use).
- **Adaptive follow-ups:** Two questions ask one follow-up if the student sounds frustrated or anxious.
- **Works end to end:** v1's sandbox sender only emailed me. v2 sends from a verified domain to real addresses.
- **Brisk branding:** Brisk's fonts, with its teal (`#296C81`) for primary actions.

### Technical

- **FastAPI → TypeScript Vercel Functions** (`api/`). The Vercel AI SDK is TypeScript-only, and one Vercel project replaces a separate Render backend.
- **Schema-enforced summaries.** `generateText` + `Output.object()` with a zod schema replaces JSON-mode + `json.loads`. A schema failure retries once, then the teacher gets the transcript marked "Needs teacher review" instead of a bad summary.
- **Supabase for one-time links.** Each link saves its question set when it's created. Submission claims the link with one conditional update, so a double-submit can't send twice, and the claim is released if the teacher email fails so the student can retry.
- **Adaptive follow-ups** (`lib/questions.ts`): stored as a map keyed by question id, so follow-ups can be added to the other default questions. One regex trigger and one follow-up per question.

## How it works

1. **Teacher config** (`/`): toggle the default questions, turn adaptive follow-ups on/off, add custom questions, and enter teacher + student emails.
2. **One-time link:** the API stores the config in Supabase (`intake_links`) under a random token and emails the student `/intake/{token}`. Links expire after 7 days and stop working once submitted.
3. **Student reflection** (`/intake/{token}`): answers each question. With adaptive questioning on, some default questions ask one short follow-up when the answer matches a trigger (see `lib/questions.ts`). Custom questions never trigger follow-ups.
4. **Summary:** the AI SDK (`generateText` + `Output.object()` with a zod schema) produces structured output via Gemini. If the output fails schema validation twice, the teacher still gets the transcript, clearly marked **Needs teacher review**.
## Tech stack

- Vite + React + Tailwind CSS (UI in `src/`)
- Vercel Functions in TypeScript (`api/`), with shared question/validation logic in `lib/`
- Vercel AI SDK v7 + Gemini, Supabase Postgres, Resend
- Deploy: a single Vercel project

## Product Motivation

When I was 10, I was given a gifted designation by my school district, which meant I was supposed to have an IEP. Over the next 8 years of school, only one teacher actually built and followed through on one. It amounted to additional readings and a weekly logic puzzle problem set. While I loved the readings and doing extra book report presentations, the puzzles were a different story. I fell behind on them almost immediately. Looking back, I see two separate problems. The first is time. Most of my teachers didn't have the bandwidth to build an IEP at all. Your IEP Goal Generating Tool addresses this. 

But the second problem is different. The one IEP I did have didn't play to my strengths, which I knew at the time. The puzzles felt like more effort than anything else I did in school and far too difficult of a challenge. At 11, telling my teacher "I don't think this works for me" felt like admitting I didn't deserve the gifted designation. I didn't say anything and the incomplete problem sets piled up, a mountain of evidence that I was failing at something my teacher thought I'd be good at. 

Brisk's IEP tool doesn't yet address this second problem where the students' perspective is not accounted for. **So I built a small demo of an intake tool meant to complement the Goal Generator.** It collects the student perspective through a guided reflection and sends a summary and full transcript straight to their teacher. That way, the teacher has the option to easily include the student's ideas into the prompt for the IEP Goal Generator. 

## Quick start (local)

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

Open http://localhost:5173. The Vite dev server also runs the `api/` handlers, so no separate backend process is needed.

| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` / `GEMINI_FALLBACK_MODELS` | Optional. Fallbacks are tried when a model is overloaded |
| `RESEND_API_KEY` | [Resend](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | A verified Resend sender, e.g. `IEP Intake Companion <noreply@jappundhillon.com>` |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API |
| `APP_URL` | Optional. Base URL for student links; defaults to the request origin |

### Database

Run [`supabase/intake_links.sql`](supabase/intake_links.sql) once in the Supabase SQL editor.

## Emails

Mail is sent from `noreply@jappundhillon.com`, which can't receive replies. Every email points recipients to jappun.dev@gmail.com for questions.

## Future implementation ideas

- Voice-to-text so students can speak their answers instead of typing
- Default question sets by grade level
