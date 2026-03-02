from fastapi import FastAPI
from app.api.upload import router as upload_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.services.vector_store import vector_store

app = FastAPI(title="RAG Chatbot API")

@app.on_event("startup")
def startup_event():
    print("🚀 App startup")
    # DO NOT clear FAISS anymore
    # vector_store.clear()

app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(documents_router)

@app.get("/health")
def health():
    return {"status": "ok"}