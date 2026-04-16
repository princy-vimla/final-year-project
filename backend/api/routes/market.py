from fastapi import APIRouter
from core.scraper import scrape_job_trends, get_market_pulse

router = APIRouter(prefix="/api/market", tags=["Market"])


@router.get("/pulse")
async def market_pulse():
    return await get_market_pulse()


@router.get("/trends/{role}")
async def job_trends(role: str):
    return await scrape_job_trends(role)