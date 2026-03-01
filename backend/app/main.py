from fastapi import FastAPI
from app.api.upload import router as upload_router
from app.api.chat import router as chat_router

app = FastAPI(title="RAG Chatbot API")

# ✅ Routers
app.include_router(upload_router)
app.include_router(chat_router)

# ✅ Health check
@app.get("/health")
def health():
    return {"status": "ok"}