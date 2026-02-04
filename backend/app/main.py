from fastapi import FastAPI
from app.api.upload import router as upload_router
from app.api.chat import router as chat_router
from app.services.vector_store import vector_store

app = FastAPI(title="RAG Chatbot API")


# 🚀 VERY IMPORTANT: Clear FAISS on app startup
@app.on_event("startup")
def startup_event():
    print("🚀 App startup: clearing FAISS index")
    vector_store.clear()


# ✅ Routers
app.include_router(upload_router)
app.include_router(chat_router)


# ✅ Health check
@app.get("/health")
def health():
    return {"status": "ok"}
