from fastapi import FastAPI
from app.api.upload import router as upload_router

app = FastAPI(title="RAG Chatbot Backend")

app.include_router(upload_router)

@app.get("/health")
def health():
    return {"status": "ok"}
