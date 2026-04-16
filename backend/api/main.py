from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add backend directory to path so imports work correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(
    title="NeuroCareer AI",
    description="Real-Time Career Intelligence Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import all routes
from api.routes.career import router as career_router
from api.routes.resume import router as resume_router
from api.routes.simulate import router as simulate_router
from api.routes.market import router as market_router
from api.routes.future import router as future_router

app.include_router(career_router)
app.include_router(resume_router)
app.include_router(simulate_router)
app.include_router(market_router)
app.include_router(future_router)

@app.get("/")
async def root():
    return {"name": "NeuroCareer AI", "version": "2.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
