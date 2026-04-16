from fastapi import APIRouter
from pathlib import Path
import json
import os

router = APIRouter(prefix="/api/career", tags=["Career"])

# Find data directory relative to this file
DATA_DIR = Path(__file__).parent.parent.parent / "data"


def load_json(filename: str) -> dict:
    filepath = DATA_DIR / filename
    if not filepath.exists():
        return {}
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/streams")
async def get_streams():
    data = load_json("career_paths.json")
    streams = []
    for key, val in data.get("streams", {}).items():
        streams.append({
            "id": key,
            "label": val.get("label", key),
            "description": val.get("description", "")
        })
    return {"streams": streams}


@router.get("/paths/{stream_id}")
async def get_paths(stream_id: str):
    data = load_json("career_paths.json")
    stream = data.get("streams", {}).get(stream_id)
    if not stream:
        return {"error": "Stream not found", "paths": []}

    paths = []
    for exam_key, exam_val in stream.get("entrance_exams", {}).items():
        courses = []
        for course_id in exam_val.get("leads_to", []):
            course_info = data.get("courses", {}).get(course_id, {"label": course_id.replace("_", " ").title()})
            courses.append({
                "id": course_id,
                "label": course_info.get("label", course_id),
                "duration_years": course_info.get("duration_years", 4),
                "career_roles": course_info.get("career_roles", [])
            })
        paths.append({
            "type": "entrance_exam",
            "id": exam_key,
            "label": exam_val.get("label", exam_key),
            "difficulty": exam_val.get("difficulty", "medium"),
            "courses": courses
        })

    direct = []
    for dp in stream.get("direct_paths", []):
        course_info = data.get("courses", {}).get(dp, {"label": dp.replace("_", " ").title()})
        direct.append({
            "id": dp,
            "label": course_info.get("label", dp),
            "career_roles": course_info.get("career_roles", [])
        })
    if direct:
        paths.append({"type": "direct_admission", "label": "Direct Admission", "courses": direct})

    return {"stream": stream, "paths": paths}


@router.get("/role/{role_id}")
async def get_role(role_id: str):
    data = load_json("career_paths.json")
    role = data.get("job_roles", {}).get(role_id)
    if not role:
        return {"error": "Role not found"}

    skills_data = load_json("skills_matrix.json")
    future_data = load_json("future_roles.json")

    role_skills = skills_data.get("role_skills", {}).get(role_id, {})
    future_impact = future_data.get("future_impact_on_current_roles", {}).get(role_id, {})

    return {"role": role, "skills": role_skills, "future_impact": future_impact}


@router.get("/companies")
async def get_companies():
    return load_json("companies.json")


@router.get("/after-experience")
async def get_after_experience(years: int = 2):
    data = load_json("companies.json")
    return data.get("after_2_years_scenarios", {})


@router.get("/salary-estimate")
async def salary_estimate(
    role_id: str,
    experience: int = 0,
    city: str = "bangalore",
    company_type: str = "product_company"
):
    career_data = load_json("career_paths.json")
    salary_data = load_json("salary_data.json")

    role = career_data.get("job_roles", {}).get(role_id)
    if not role:
        return {"error": f"Role '{role_id}' not found", "estimated_ctc_lpa": 0}

    if experience <= 1:
        base = role.get("entry_salary_lpa", {}).get("avg", 6)
    elif experience <= 5:
        base = role.get("mid_salary_lpa", {}).get("avg", 15)
    else:
        base = role.get("senior_salary_lpa", {}).get("avg", 30)

    city_mult = salary_data.get("india_city_multiplier", {}).get(city, 0.85)
    industry_mult = salary_data.get("industry_multiplier", {}).get(company_type, 1.0)
    estimated = round(base * city_mult * industry_mult, 1)

    return {
        "estimated_ctc_lpa": estimated,
        "base_for_role": base,
        "city_multiplier": city_mult,
        "industry_multiplier": industry_mult,
        "breakdown": {
            "approx_in_hand_monthly": round((estimated * 100000) / 12 * 0.72)
        }
    }
