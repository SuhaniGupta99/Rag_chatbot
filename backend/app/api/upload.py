from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
from app.services.document_loader import load_text_from_file
from app.utils.text_cleaner import clean_text
from app.services.chunker import chunk_text
from app.services.embeddings import generate_embeddings
from app.services.vector_store import FaissVectorStore

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

    # 1️⃣ Save file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2️⃣ Process file
        raw_text = load_text_from_file(file_path)
        cleaned_text = clean_text(raw_text)
        chunks = chunk_text(cleaned_text)

        # 3️⃣ Embeddings
        embeddings = generate_embeddings(chunks)

        metadatas = [
            {"text": chunk, "source": file.filename}
            for chunk in chunks
        ]

        vector_store = FaissVectorStore(dim=len(embeddings[0]))
        vector_store.add(embeddings, metadatas)

    finally:
        # 4️⃣ Delete uploaded file (SAFE CLEANUP)
        if file_path.exists():
            file_path.unlink()

    return {
        "message": "Document indexed and cleaned up successfully",
        "chunks_added": len(chunks)
    }
