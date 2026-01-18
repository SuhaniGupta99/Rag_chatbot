from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil

from app.services.document_loader import load_text_from_file
from app.utils.text_cleaner import clean_text
from app.services.chunker import chunk_text

router = APIRouter()

UPLOAD_DIR = Path("app/data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".txt", ".pdf")):
     raise HTTPException(
        status_code=400,
        detail="Only .txt and .pdf files are supported"
     )


    file_path = UPLOAD_DIR / file.filename

    # Save file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Load & process text
    raw_text = load_text_from_file(file_path)
    cleaned_text = clean_text(raw_text)
    chunks = chunk_text(cleaned_text)

    return {
        "message": "Document processed successfully",
        "chunks_added": len(chunks)
    }
