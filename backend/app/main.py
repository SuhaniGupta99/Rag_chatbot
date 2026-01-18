from fastapi import FastAPI

app = FastAPI(title="RAG Chatbot Backend")

@app.get("/health")
def health():
    return {"status": "ok"}
