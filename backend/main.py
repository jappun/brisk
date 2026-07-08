import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, EmailStr

from email_sender import send_email
from email_template import compose_email_body, compose_email_subject
from prompts import SYNTHESIS_PROMPT_TEMPLATE, SYSTEM_PROMPT
from validate_response import validate_all_responses

load_dotenv(Path(__file__).resolve().parent / ".env")

# Lighter model with a separate free-tier quota pool (gemini-2.0-flash often shows limit: 0).
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite").strip()


def get_teacher_email() -> str | None:
    return os.getenv("TEACHER_EMAIL", "").strip() or None

app = FastAPI(title="Student Voice API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StudentResponses(BaseModel):
    proud_moment: str = ""
    challenge: str = ""
    helped: str = ""
    didnt_help: str = ""
    wish_changed: str = ""
    anything_else: str = ""


class SynthesisResult(BaseModel):
    overview: str
    strengths: str
    challenges: str
    what_worked: str
    student_goals: str


class SynthesizeRequest(BaseModel):
    responses: StudentResponses


class SendSummaryRequest(BaseModel):
    teacher_email: EmailStr
    responses: StudentResponses
    summary: SynthesisResult


def _is_gemini_quota_error(exc: BaseException) -> bool:
    msg = str(exc)
    upper = msg.upper()
    return (
        "429" in msg
        or "RESOURCE_EXHAUSTED" in upper
        or ("QUOTA" in upper and "EXCEED" in upper)
    )


def parse_synthesis_json(text: str) -> dict:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if fence:
        cleaned = fence.group(1).strip()
    return json.loads(cleaned)


@app.post("/api/synthesize", response_model=SynthesisResult)
async def synthesize(request: SynthesizeRequest):
    validation_error = validate_all_responses(request.responses.model_dump())
    if validation_error:
        raise HTTPException(status_code=400, detail=validation_error)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not set. Copy .env.example to .env and set your key.",
        )

    prompt = SYNTHESIS_PROMPT_TEMPLATE.format(**request.responses.model_dump())

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
            ),
        )
        data = parse_synthesis_json(response.text or "")
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse LLM response as JSON: {exc}",
        ) from exc
    except Exception as exc:
        if _is_gemini_quota_error(exc):
            raise HTTPException(
                status_code=429,
                detail=(
                    "Gemini API quota or rate limit was exceeded. Wait and retry, try another model "
                    f"via GEMINI_MODEL in backend/.env (current: {GEMINI_MODEL}), or check billing. "
                    "https://ai.google.dev/gemini-api/docs/rate-limits"
                ),
            ) from exc
        raise HTTPException(
            status_code=502,
            detail=f"LLM synthesis failed: {exc}",
        ) from exc

    required_keys = [
        "overview",
        "strengths",
        "challenges",
        "what_worked",
        "student_goals",
    ]
    for key in required_keys:
        if key not in data:
            raise HTTPException(
                status_code=502,
                detail=f"LLM response missing required field: {key}",
            )

    return SynthesisResult(**data)


@app.post("/api/send-summary")
async def send_summary(request: SendSummaryRequest):
    teacher_email = get_teacher_email()
    if not teacher_email:
        raise HTTPException(
            status_code=500,
            detail="TEACHER_EMAIL is not set. Add it to backend/.env.",
        )

    subject = compose_email_subject()
    body = compose_email_body(
        request.responses.model_dump(),
        request.summary.model_dump(),
    )

    try:
        send_email(teacher_email, subject, body)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to send email: {exc}",
        ) from exc

    return {"status": "sent", "teacher_email": teacher_email}


@app.get("/api/config")
async def config():
    teacher_email = get_teacher_email()
    if not teacher_email:
        raise HTTPException(
            status_code=500,
            detail="TEACHER_EMAIL is not set. Add it to backend/.env.",
        )
    return {"teacher_email": teacher_email}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
