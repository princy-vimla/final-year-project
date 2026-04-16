from fastapi import APIRouter, UploadFile, File, HTTPException
from core.resume_parser import parse_resume
from pathlib import Path
import shutil
import uuid

router = APIRouter(prefix="/api/resume", tags=["Resume"])

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse a resume PDF with OCR support."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # Check file size (max 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB.")
    
    # Save file
    file_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{file_id}.pdf"
    
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    # Parse
    result = parse_resume(str(file_path))
    
    if "error" in result and not result.get("skills_found"):
        raise HTTPException(status_code=422, detail=result["error"])
    
    result["file_id"] = file_id
    result["original_filename"] = file.filename
    
    return result
