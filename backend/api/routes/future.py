from fastapi import APIRouter
from core.future_predictor import predict_future_career
from core.career_graph import get_future_roles

router = APIRouter(prefix="/api/future", tags=["Future"])


@router.get("/predict/{role_id}")
async def predict(role_id: str, years: int = 5):
    return predict_future_career(role_id, years)


@router.get("/emerging-roles")
async def emerging_roles():
    data = get_future_roles()
    return data.get("emerging_roles_2025_2035", {})