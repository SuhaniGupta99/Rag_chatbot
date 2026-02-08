import faiss
import pickle
from pathlib import Path
import numpy as np

# 🔒 ABSOLUTE PROJECT ROOT
BASE_DIR = Path(__file__).resolve().parents[2]  # backend/app/services → backend
DATA_DIR = BASE_DIR / "app" / "data" / "faiss_index"
DATA_DIR.mkdir(parents=True, exist_ok=True)

INDEX_FILE = DATA_DIR / "index.faiss"
META_FILE = DATA_DIR / "metadata.pkl"

DEFAULT_DIM = 384


class FaissVectorStore:
    def __init__(self, dim: int = DEFAULT_DIM):
        self.dim = dim
        self.index = faiss.IndexFlatL2(dim)
        self.metadata = []

        if INDEX_FILE.exists() and META_FILE.exists():
            self._load()

    def clear(self):
        print("🧹 Clearing FAISS index & metadata")
        self.index = faiss.IndexFlatL2(self.dim)
        self.metadata = []

        if INDEX_FILE.exists():
            INDEX_FILE.unlink()
        if META_FILE.exists():
            META_FILE.unlink()

    def add(self, embeddings, metadatas):
        print("🔥 ADD CALLED")
        print("Embeddings:", len(embeddings))
        print("Metadatas:", len(metadatas))
        print("Index before add:", self.index.ntotal)

        embeddings = np.array(embeddings).astype("float32")
        faiss.normalize_L2(embeddings)

        self.index.add(embeddings)
        self.metadata.extend(metadatas)

        print("Index after add:", self.index.ntotal)

        self._save()

    def search(self, query_embedding, top_k=3):
        if self.index.ntotal == 0:
            return []

        query = np.array([query_embedding]).astype("float32")
        faiss.normalize_L2(query)

        distances, indices = self.index.search(query, top_k)

        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.metadata):
                results.append({
                    "score": float(distances[0][i]),
                    **self.metadata[idx]
                })

        return results

    def _save(self):
        print("💾 Saving FAISS index to:", INDEX_FILE.resolve())
        print("💾 Saving metadata to:", META_FILE.resolve())

        faiss.write_index(self.index, str(INDEX_FILE))
        with open(META_FILE, "wb") as f:
            pickle.dump(self.metadata, f)

    def _load(self):
        print("📦 Loading FAISS index from disk")
        self.index = faiss.read_index(str(INDEX_FILE))
        with open(META_FILE, "rb") as f:
            self.metadata = pickle.load(f)


# ✅ SINGLE SHARED INSTANCE
vector_store = FaissVectorStore()
