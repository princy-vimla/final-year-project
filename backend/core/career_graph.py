import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def load_json(filename):
    filepath = DATA_DIR / filename
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def get_career_paths():
    return load_json("career_paths.json")


def get_companies():
    return load_json("companies.json")


def get_salary_data():
    return load_json("salary_data.json")


def get_skills_matrix():
    return load_json("skills_matrix.json")


def get_future_roles():
    return load_json("future_roles.json")


def get_stream_options():
    data = get_career_paths()
    streams = []
    for key, val in data["streams"].items():
        streams.append({
            "id": key,
            "label": val["label"],
            "description": val["description"]
        })
    return streams


def get_paths_for_stream(stream_id):
    data = get_career_paths()
    stream = data["streams"].get(stream_id)
    if not stream:
        return None

    paths = []

    for exam_key, exam_val in stream.get("entrance_exams", {}).items():
        courses = []
        for course_id in exam_val.get("leads_to", []):
            course_info = data["courses"].get(course_id, {"label": course_id, "career_roles": []})
            courses.append({
                "id": course_id,
                "label": course_info.get("label", course_id),
                "duration_years": course_info.get("duration_years", 4),
                "career_roles": course_info.get("career_roles", [])
            })

        paths.append({
            "type": "entrance_exam",
            "id": exam_key,
            "label": exam_val["label"],
            "difficulty": exam_val.get("difficulty", "unknown"),
            "courses": courses
        })

    direct = []
    for dp in stream.get("direct_paths", []):
        course_info = data["courses"].get(dp, {"label": dp})
        direct.append({
            "id": dp,
            "label": course_info.get("label", dp),
            "career_roles": course_info.get("career_roles", [])
        })

    paths.append({
        "type": "direct_admission",
        "label": "Direct Admission",
        "courses": direct
    })

    return {"stream": stream, "paths": paths}


def get_role_details(role_id):
    data = get_career_paths()
    role = data["job_roles"].get(role_id)
    if not role:
        return None

    skills = get_skills_matrix()
    future = get_future_roles()

    role_skills = skills.get("role_skills", {}).get(role_id, {})
    future_impact = future.get("future_impact_on_current_roles", {}).get(role_id, {})

    return {
        "role": role,
        "skills": role_skills,
        "future_impact": future_impact,
        "salary_factors": get_salary_data()
    }


def get_after_experience_options(years=2):
    companies = get_companies()
    return companies.get("after_2_years_scenarios", {})


def calculate_salary_estimate(role_id, experience_years, city, company_type):
    career_data = get_career_paths()
    salary_data = get_salary_data()

    role = career_data["job_roles"].get(role_id)
    if not role:
        return None

    if experience_years <= 1:
        base = role["entry_salary_lpa"]["avg"]
    elif experience_years <= 5:
        base = role["mid_salary_lpa"]["avg"]
    else:
        base = role["senior_salary_lpa"]["avg"]

    city_mult = salary_data["india_city_multiplier"].get(city, 0.85)
    industry_mult = salary_data["industry_multiplier"].get(company_type, 1.0)

    estimated = round(base * city_mult * industry_mult, 1)

    return {
        "estimated_ctc_lpa": estimated,
        "base_for_role": base,
        "city_multiplier": city_mult,
        "industry_multiplier": industry_mult,
        "breakdown": {
            "base_salary_monthly": round((estimated * 100000) / 12 * 0.6),
            "hra_monthly": round((estimated * 100000) / 12 * 0.2),
            "special_allowance_monthly": round((estimated * 100000) / 12 * 0.1),
            "pf_monthly": round((estimated * 100000) / 12 * 0.1),
            "approx_in_hand_monthly": round((estimated * 100000) / 12 * 0.72)
        }
    }