from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
import traceback
import uuid
from datetime import datetime

from app.services.document_loader import load_text_from_file
from app.utils.text_cleaner import clean_text
from app.services.chunker import chunk_text
from app.services.embeddings import EmbeddingService
from app.services.vector_store import vector_store

router = APIRouter(prefix="/upload", tags=["Upload"])

UPLOAD_DIR = Path("app/data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

embedding_service = EmbeddingService()


@router.post("/")
async def upload_document(file: UploadFile = File(...)):

    # ==========================
    # 🔹 Validate file type
    # ==========================
    if not file.filename.lower().endswith((".txt", ".pdf", ".docx", ".pptx")):
        raise HTTPException(
            status_code=400,
            detail="Only .txt, .pdf, .docx, and .pptx files are supported"
        )

    file_path = UPLOAD_DIR / file.filename

    try:
        # ==========================
        # 🔹 1️⃣ Save file temporarily
        # ==========================
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # ==========================
        # 🔹 2️⃣ Load & clean text
        # ==========================
        raw_text = load_text_from_file(file_path)
        cleaned_text = clean_text(raw_text)

        if not cleaned_text.strip():
            raise ValueError("No text extracted from document")

        # ==========================
        # 🔹 3️⃣ Chunk text
        # ==========================
        chunks = chunk_text(cleaned_text)

        if not chunks:
            raise ValueError("No chunks created")

        # ==========================
        # 🔹 4️⃣ Generate embeddings
        # ==========================
        embeddings = embedding_service.embed_documents(chunks)

        # ==========================
        # 🔥 5️⃣ Generate document ID
        # ==========================
        document_id = str(uuid.uuid4())

        # ==========================
        # 🔥 6️⃣ Build rich metadata
        # ==========================
        metadatas = []

        for i, chunk in enumerate(chunks):
            metadatas.append({
                "text": chunk,
                "source": file.filename,
                "document_id": document_id,
                "chunk_id": i,
                "uploaded_at": datetime.utcnow().isoformat()
            })

        # ==========================
        # 🚀 7️⃣ Add to FAISS (NO CLEAR)
        # ==========================
        vector_store.add(embeddings, metadatas)

        return {
            "message": "Document indexed successfully",
            "document_id": document_id,
            "chunks_added": len(chunks),
            "total_index_size": vector_store.index.ntotal
        }

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # ==========================
        # 🔹 8️⃣ Cleanup temp file
        # ==========================
        if file_path.exists():
            file_path.unlink()