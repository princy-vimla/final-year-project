import httpx
import json
import asyncio
from typing import AsyncGenerator

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "phi3"  # Change to "mistral" or "llama3.1:8b" if you have them

AGENT_PERSONAS = {
    "ceo": {
        "name": "CEO Perspective",
        "icon": "👔",
        "prompt": "You are a Fortune 500 CEO. Analyze this career profile and give 4 strategic bullet points about: long-term value creation, leadership trajectory, business ROI of decisions, and executive positioning. Be direct and use specific numbers where possible."
    },
    "hr_director": {
        "name": "HR Director",
        "icon": "🧑‍💼",
        "prompt": "You are a Senior HR Director at a top tech company. Give 4 bullet points about: what recruiters look for, hiring trends for this role, resume red flags to avoid, and realistic salary expectations. Be practical."
    },
    "tech_lead": {
        "name": "Staff Engineer / Tech Lead",
        "icon": "💻",
        "prompt": "You are a Staff Engineer at Google. Give 4 bullet points about: technical depth needed, right technologies to learn NOW, IC vs management track decision, and how to stand out technically. Be specific with tech names."
    },
    "recruiter": {
        "name": "FAANG Recruiter",
        "icon": "🎯",
        "prompt": "You are a FAANG technical recruiter. Give 4 bullet points about: what makes a resume stand out, optimal experience progression, salary negotiation tactics, and interview prep timeline. Use realistic numbers."
    },
    "finance_advisor": {
        "name": "Financial Advisor",
        "icon": "💰",
        "prompt": "You are a financial advisor specializing in tech careers. Give 4 bullet points about: salary optimization strategy, equity vs base pay decisions, financial milestones to target, and wealth building timeline. Use specific INR amounts."
    },
    "futurist": {
        "name": "Technology Futurist",
        "icon": "🔮",
        "prompt": "You are a technology futurist. Give 4 bullet points about: how AI will affect this role by 2030, which adjacent skills to develop now, which roles will be hot in 2027-2030, and quantum/AGI timeline impact. Be specific."
    },
    "mentor": {
        "name": "Senior Industry Mentor",
        "icon": "🧙",
        "prompt": "You are a 20-year industry veteran. Give 4 bullet points about: biggest career mistakes to avoid, when to switch companies, networking strategies that actually work, and work-life balance reality. Be honest and empathetic."
    },
    "skill_coach": {
        "name": "Skills & Learning Coach",
        "icon": "📚",
        "prompt": "You are a professional learning coach. Give 4 bullet points about: top 3 skills to learn in next 6 months, best certifications worth getting, project portfolio strategy, and month-by-month learning plan. Be actionable."
    },
    "industry_analyst": {
        "name": "Industry Market Analyst",
        "icon": "📊",
        "prompt": "You are a Gartner-level analyst. Give 4 bullet points about: current market demand for this role, top companies hiring right now, salary range by city and company tier, and demand forecast for next 3 years. Use data."
    },
    "career_psychologist": {
        "name": "Career Psychologist",
        "icon": "🧠",
        "prompt": "You are a career psychologist. Give 4 bullet points about: personality-role fit analysis, overcoming imposter syndrome in this field, decision-making framework for career transitions, and mental health sustainability. Be insightful."
    }
}


async def check_ollama_available() -> bool:
    """Check if Ollama is running."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get("http://localhost:11434/api/tags")
            return resp.status_code == 200
    except Exception:
        return False


async def query_agent(agent_id: str, context: str) -> dict:
    """Query a single agent perspective."""
    agent = AGENT_PERSONAS.get(agent_id)
    if not agent:
        return {"error": f"Unknown agent: {agent_id}"}

    full_prompt = f"""{agent['prompt']}

CAREER PROFILE:
{context}

Respond with exactly 4 bullet points. Format each as:
- **[Title]**: [2-3 sentence explanation with specific advice]

Start your response directly with the first bullet point. No introduction needed."""

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 300,
                        "top_p": 0.9,
                        "stop": ["\n\n\n"]
                    }
                }
            )
            result = response.json()
            return {
                "agent_id": agent_id,
                "name": agent["name"],
                "icon": agent["icon"],
                "analysis": result.get("response", "No response generated."),
                "status": "success"
            }
    except httpx.TimeoutException:
        return {
            "agent_id": agent_id,
            "name": agent["name"],
            "icon": agent["icon"],
            "analysis": "- **Timeout**: Agent took too long. Try a lighter model like phi3:mini for faster responses.\n- **Tip**: Run `ollama pull phi3:mini` for 3x faster analysis.",
            "status": "timeout"
        }
    except Exception as e:
        return {
            "agent_id": agent_id,
            "name": agent["name"],
            "icon": agent["icon"],
            "analysis": f"- **Error**: {str(e)}\n- **Fix**: Ensure Ollama is running: open a terminal and run `ollama serve`",
            "status": "error"
        }


async def query_all_agents(context: str) -> list:
    """Query all 10 agents with controlled concurrency to avoid overloading."""
    # Run 3 agents at a time to avoid overloading local LLM
    agents = list(AGENT_PERSONAS.keys())
    results = []
    
    # Process in batches of 3
    batch_size = 1
    for i in range(0, len(agents), batch_size):
        batch = agents[i:i+batch_size]
        batch_tasks = [query_agent(agent_id, context) for agent_id in batch]
        batch_results = await asyncio.gather(*batch_tasks)
        results.extend(batch_results)

        await asyncio.sleep(2)
    
    return results


async def query_single_agent(agent_id: str, context: str) -> dict:
    """Query just one agent."""
    return await query_agent(agent_id, context)


async def generate_career_scenario(user_profile: dict) -> dict:
    """Generate comprehensive career scenario."""
    context = f"""
Career Stage: {user_profile.get('stage', 'working')}
Academic Stream: {user_profile.get('stream', 'not specified')}
Course/Degree: {user_profile.get('course', 'not specified')}
Target/Current Role: {user_profile.get('target_role', 'software engineer')}
Years of Experience: {user_profile.get('experience_years', 0)}
Current Skills: {', '.join(user_profile.get('skills', [])[:10]) if user_profile.get('skills') else 'not specified'}
Company Type: {user_profile.get('company_type', 'product company')}
City: {user_profile.get('city', 'Bangalore')}
Current Salary: {user_profile.get('current_salary_lpa', 'not specified')} LPA
Career Goal: {user_profile.get('goal', 'career growth and higher salary')}

Create a detailed 5-year career roadmap with:
1. Next 6 months: Immediate actions and skill building
2. Year 1: Career milestones and target salary
3. Year 2-3: Career progression and role advancement
4. Year 4-5: Senior/leadership positions or specialization
5. Key companies to target at each stage
6. Specific certifications and learning resources
7. Realistic salary expectations at each stage in LPA
8. Risk factors and mitigation strategies"""

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "prompt": context,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 1200}
                }
            )
            result = response.json()
            return {
                "scenario": result.get("response", ""),
                "status": "success"
            }
    except Exception as e:
        return {
            "scenario": f"Error generating scenario: {str(e)}. Ensure Ollama is running with `ollama serve`.",
            "status": "error"
        }
