from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import httpx
import json

router = APIRouter(prefix="/api/simulate", tags=["Simulator"])

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_TAGS = "http://localhost:11434/api/tags"

# phi3:mini is 2.2GB and 3x faster than mistral on CPU
# mistral needs 4.5GB RAM — with 6GB free it's borderline and slow
PREFERRED_MODELS = ["phi3:mini", "phi3:latest", "phi3", "mistral:latest", "mistral"]

AGENTS = [
    {"id": "ceo",                 "name": "CEO Perspective",    "icon": "👔", "focus": "strategic value, leadership trajectory, business ROI of career decisions, 5-year executive vision"},
    {"id": "hr_director",         "name": "HR Director",        "icon": "🧑‍💼", "focus": "what recruiters look for in 2025 India, ATS-friendly resume tips, hiring trends, realistic salary bands"},
    {"id": "tech_lead",           "name": "Staff Engineer",     "icon": "💻", "focus": "top 5 skills to learn NOW with specific resources, technical depth needed, IC vs manager trade-offs"},
    {"id": "recruiter",           "name": "FAANG Recruiter",    "icon": "🎯", "focus": "interview prep timeline in weeks, top 3 companies to target, salary negotiation script"},
    {"id": "finance_advisor",     "name": "Financial Advisor",  "icon": "💰", "focus": "CTC targets year by year in INR, best time to job-hop, equity vs base trade-offs with numbers"},
    {"id": "futurist",            "name": "Tech Futurist",      "icon": "🔮", "focus": "skills obsolete by 2028, top 2 emerging roles to pivot toward, automation risk percentage for this role"},
    {"id": "mentor",              "name": "Senior Mentor",      "icon": "🧙", "focus": "top 3 career mistakes to avoid, exact timing for company switches, networking tactics that work"},
    {"id": "skill_coach",         "name": "Skills Coach",       "icon": "📚", "focus": "30-60-90 day learning plan with specific course names, 2 portfolio projects to build right now"},
    {"id": "industry_analyst",    "name": "Market Analyst",     "icon": "📊", "focus": "demand index for this role in India, top 5 companies hiring now, salary benchmark by city"},
    {"id": "career_psychologist", "name": "Career Psychologist","icon": "🧠", "focus": "personality-role fit analysis, imposter syndrome tactics, how to stay motivated long-term"},
]

WHAT_IF_SCENARIOS = {
    "switch_company": "SCENARIO: Switching to FAANG or top product company. Analyze: exact prep (DSA topics + months), expected salary jump INR, top 3 companies to target with realistic probability.",
    "masters":        "SCENARIO: Pursuing Master's degree. Compare MS USA/Canada vs MTech IIT/NIT vs Online OMSCS. Give cost INR, ROI timeline, salary boost %, best option for this profile.",
    "freelance":      "SCENARIO: Going freelance/consulting. Give: realistic monthly income at 6/12/24 months, top 3 platforms, niche to pick, how to land first client.",
    "startup":        "SCENARIO: Joining Seed/Series A startup. Analyze: ESOP scenarios, learning speed, red flags to screen for, how to evaluate equity offer.",
    "management":     "SCENARIO: Switching to Engineering Manager track. Give 5-year salary trajectory both paths in INR, day-to-day reality, which companies promote fastest.",
    "specialize":     "SCENARIO: Hyper-specializing in one niche. Recommend top 2 niches for this profile, how to reach top 1% in 18 months, consulting rate at expert level.",
    "abroad":         "SCENARIO: Relocating abroad. Compare USA H1B, Canada PR, Germany Blue Card, Singapore, UAE. Give salary vs cost of living, visa timeline, total INR savings.",
    "upskill":        "SCENARIO: 3-month intensive upskill sabbatical. Give week-by-week plan, specific course names, 2 projects to build, expected salary jump after completing.",
}


class ProfileRequest(BaseModel):
    stage: Optional[str] = "working"
    stream: Optional[str] = None
    course: Optional[str] = None
    target_role: Optional[str] = "software_engineer"
    experience_years: Optional[int] = 0
    skills: Optional[List[str]] = []
    company_type: Optional[str] = None
    city: Optional[str] = "bangalore"
    goal: Optional[str] = "career growth"
    current_salary_lpa: Optional[float] = None


def build_context(p: ProfileRequest) -> str:
    parts = []
    if p.stage:              parts.append(f"Stage: {p.stage}")
    if p.target_role:        parts.append(f"Role: {p.target_role.replace('_', ' ').title()}")
    if p.experience_years is not None:
                             parts.append(f"Experience: {p.experience_years} years")
    if p.skills:             parts.append(f"Skills: {', '.join((p.skills or [])[:10])}")
    if p.company_type:       parts.append(f"Company: {p.company_type.replace('_', ' ')}")
    if p.city:               parts.append(f"City: {p.city.replace('_', ' ').title()}, India")
    if p.current_salary_lpa: parts.append(f"CTC: Rs.{p.current_salary_lpa} LPA")
    if p.goal:               parts.append(f"Goal: {p.goal}")
    return "\n".join(parts)


async def detect_model() -> str:
    """Auto-detect the fastest available model."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as c:
            r = await c.get(OLLAMA_TAGS)
            if r.status_code == 200:
                available = [m["name"] for m in r.json().get("models", [])]
                for preferred in PREFERRED_MODELS:
                    if preferred in available:
                        return preferred
                if available:
                    return available[0]
    except Exception:
        pass
    return "phi3:mini"


async def call_ollama_single(prompt: str, model: str, max_tokens: int = 350) -> str:
    """Call Ollama for a single agent. Sequential, one at a time."""
    try:
        async with httpx.AsyncClient(timeout=150.0) as c:
            r = await c.post(OLLAMA_URL, json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": max_tokens,
                    "top_p": 0.9,
                    "num_ctx": 2048,  # Smaller context = faster
                }
            })
            data = r.json()
            return data.get("response", "").strip()
    except httpx.TimeoutException:
        return "- **Timeout**: This agent took too long. Other agents' results are valid.\n- **Tip**: phi3:mini is fastest for demo use."
    except Exception as e:
        return f"- **Error**: {str(e)}"


def make_prompt(agent: dict, context: str) -> str:
    return (
        f"You are giving career advice as {agent['name']}.\n"
        f"Focus ONLY on: {agent['focus']}\n\n"
        f"CAREER PROFILE:\n{context}\n\n"
        f"Give exactly 4 bullet points. Be specific — include numbers, timelines, INR amounts.\n"
        f"Format: - **Title**: explanation (2 sentences max)\n"
        f"Start immediately:"
    )


async def stream_all_agents(context: str, model: str):
    """Stream agent results one by one as SSE events."""
    for i, agent in enumerate(AGENTS):
        # Send "thinking" event
        yield f"data: {json.dumps({'type': 'thinking', 'agent_id': agent['id'], 'name': agent['name'], 'icon': agent['icon'], 'index': i})}\n\n"

        prompt = make_prompt(agent, context)
        analysis = await call_ollama_single(prompt, model)

        result = {
            "type": "result",
            "agent_id": agent["id"],
            "name": agent["name"],
            "icon": agent["icon"],
            "analysis": analysis,
            "status": "success" if not analysis.startswith("- **Error") and not analysis.startswith("- **Timeout") else "error",
            "index": i
        }
        yield f"data: {json.dumps(result)}\n\n"
        await asyncio.sleep(0.1)  # Small gap between requests

    yield f"data: {json.dumps({'type': 'done', 'model': model})}\n\n"


@router.get("/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=4.0) as c:
            r = await c.get(OLLAMA_TAGS)
            if r.status_code == 200:
                models = [m["name"] for m in r.json().get("models", [])]
                active = await detect_model()
                return {"ollama_available": True, "models": models, "active_model": active}
    except Exception:
        pass
    return {"ollama_available": False, "models": [], "active_model": None}


@router.post("/perspectives/stream")
async def stream_perspectives(profile: ProfileRequest):
    """SSE endpoint — streams each agent result as it completes."""
    model = await detect_model()
    context = build_context(profile)

    return StreamingResponse(
        stream_all_agents(context, model),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@router.post("/what-if/stream")
async def stream_what_if(profile: ProfileRequest, change: str = "switch_company"):
    """SSE endpoint for what-if scenarios."""
    scenario_text = WHAT_IF_SCENARIOS.get(change, f"SCENARIO: {change}")
    model = await detect_model()
    context = build_context(profile) + f"\n\n{scenario_text}"

    return StreamingResponse(
        stream_all_agents(context, model),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


# Keep non-streaming endpoints as fallback
@router.post("/perspectives")
async def get_perspectives(profile: ProfileRequest):
    model = await detect_model()
    context = build_context(profile)
    results = []
    for agent in AGENTS:
        prompt = make_prompt(agent, context)
        analysis = await call_ollama_single(prompt, model)
        results.append({
            "agent_id": agent["id"], "name": agent["name"], "icon": agent["icon"],
            "analysis": analysis,
            "status": "success" if analysis and not analysis.startswith("- **Error") else "error"
        })
    return {"perspectives": results, "model_used": model, "total": len(results)}


@router.post("/perspective/{agent_id}")
async def get_one(agent_id: str, profile: ProfileRequest):
    agent = next((a for a in AGENTS if a["id"] == agent_id), None)
    if not agent:
        return {"error": f"Agent '{agent_id}' not found"}
    model = await detect_model()
    analysis = await call_ollama_single(make_prompt(agent, build_context(profile)), model)
    return {"agent_id": agent_id, "name": agent["name"], "icon": agent["icon"], "analysis": analysis, "status": "success"}


@router.post("/what-if")
async def what_if_sync(profile: ProfileRequest, change: str = "switch_company"):
    scenario_text = WHAT_IF_SCENARIOS.get(change, f"SCENARIO: {change}")
    model = await detect_model()
    context = build_context(profile) + f"\n\n{scenario_text}"
    results = []
    for agent in AGENTS:
        prompt = make_prompt(agent, context)
        analysis = await call_ollama_single(prompt, model)
        results.append({
            "agent_id": agent["id"], "name": agent["name"], "icon": agent["icon"],
            "analysis": analysis,
            "status": "success" if analysis and not analysis.startswith("- **Error") else "error"
        })
    return {"what_if": change, "perspectives": results, "model_used": model}
