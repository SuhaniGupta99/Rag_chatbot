from fastapi import APIRouter, HTTPException
from app.services.vector_store import vector_store

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("/")
def list_documents():
    metadata = vector_store.metadata
    documents = {}

    for item in metadata:
        doc_id = item.get("document_id")
        if not doc_id:
            continue

        if doc_id not in documents:
            documents[doc_id] = {
                "document_id": doc_id,
                "filename": item.get("source"),
                "uploaded_at": item.get("uploaded_at"),
                "chunks": 0
            }

        documents[doc_id]["chunks"] += 1

    return list(documents.values())


@router.delete("/{document_id}")
def delete_document(document_id: str):

    success = vector_store.delete_document(document_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return {
        "message": "Document deleted successfully",
        "remaining_chunks": vector_store.index.ntotal
    }