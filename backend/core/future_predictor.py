from .career_graph import get_future_roles, get_career_paths


def predict_future_career(current_role, years_ahead=5):
    future_data = get_future_roles()
    career_data = get_career_paths()

    current_role_info = career_data["job_roles"].get(current_role, {})
    future_impact = future_data.get("future_impact_on_current_roles", {}).get(current_role, {})
    emerging = future_data.get("emerging_roles_2025_2035", {})

    role_evolution_map = {
        "ai_engineer": ["ai_agent_architect", "ai_safety_researcher", "quantum_ml_engineer"],
        "ml_engineer": ["ai_agent_architect", "quantum_ml_engineer", "edge_ai_engineer", "synthetic_data_engineer"],
        "gen_ai_developer": ["ai_agent_architect", "ai_safety_researcher", "synthetic_data_engineer"],
        "data_analyst": ["synthetic_data_engineer", "ai_agent_architect"],
        "software_engineer": ["ai_agent_architect", "spatial_computing_developer", "edge_ai_engineer"],
        "computer_vision_engineer": ["spatial_computing_developer", "edge_ai_engineer"],
        "data_scientist": ["quantum_ml_engineer", "synthetic_data_engineer"],
    }

    relevant_emerging = role_evolution_map.get(current_role, list(emerging.keys())[:3])
    emerging_details = []
    for role_key in relevant_emerging:
        if role_key in emerging:
            detail = {"id": role_key}
            detail.update(emerging[role_key])
            emerging_details.append(detail)

    timeline = []
    current_year = 2025
    for y in range(1, years_ahead + 1):
        year = current_year + y
        if y <= 2:
            phase = "consolidation"
            advice = "Deepen current expertise, build portfolio, get certifications"
        elif y <= 4:
            phase = "expansion"
            advice = "Branch into adjacent emerging roles, start learning quantum/agent systems"
        else:
            phase = "transformation"
            advice = "Transition into next-gen roles, aim for architect/lead positions"

        timeline.append({
            "year": year,
            "phase": phase,
            "advice": advice,
            "market_prediction": f"AI automation will have replaced ~{min(y * 8, 60)}% of routine tasks in {current_role_info.get('label', current_role)}"
        })

    automation_risk_map = {
        "data_analyst": 65,
        "software_engineer": 35,
        "ai_engineer": 15,
        "ml_engineer": 18,
        "gen_ai_developer": 10,
        "computer_vision_engineer": 20,
        "data_scientist": 40,
    }

    automation_risk = automation_risk_map.get(current_role, 30)

    return {
        "current_role": current_role,
        "current_role_info": current_role_info,
        "future_impact": future_impact,
        "automation_risk_percent_by_2030": automation_risk,
        "emerging_roles_to_transition_to": emerging_details,
        "timeline_prediction": timeline,
        "survival_strategies": [
            "Continuously upskill in AI/ML regardless of your role",
            "Build a strong personal brand (blog, open source, talks)",
            "Develop T-shaped skills: deep in one area, broad in many",
            "Network actively in emerging tech communities",
            "Get a cloud or AI certification every year",
            "Maintain a portfolio of production-grade side projects"
        ]
    }