import faiss
import pickle
from pathlib import Path
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "faiss_index"
DATA_DIR.mkdir(parents=True, exist_ok=True)


INDEX_FILE = DATA_DIR / "index.faiss"
META_FILE = DATA_DIR / "metadata.pkl"


DEFAULT_DIM = 384  # MiniLM embedding size


class FaissVectorStore:
    def __init__(self, dim: int = DEFAULT_DIM):
        self.dim = dim
        self.index = faiss.IndexFlatL2(dim)
        self.metadata = []

        if INDEX_FILE.exists() and META_FILE.exists():
            self._load()

    # 🧹 VERY IMPORTANT
    def clear(self):
        print("🧹 Clearing FAISS index & metadata")

        self.index = faiss.IndexFlatL2(self.dim)
        self.metadata = []

        if INDEX_FILE.exists():
            INDEX_FILE.unlink()
        if META_FILE.exists():
            META_FILE.unlink()

    def add(self, embeddings, metadatas):
        assert len(embeddings) == len(metadatas)

        embeddings = np.array(embeddings).astype("float32")
        faiss.normalize_L2(embeddings)

        self.index.add(embeddings)
        self.metadata.extend(metadatas)
        self._save()

    def search(self, query_embedding, top_k: int = 3):
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
        faiss.write_index(self.index, str(INDEX_FILE))
        with open(META_FILE, "wb") as f:
            pickle.dump(self.metadata, f)

    def _load(self):
        self.index = faiss.read_index(str(INDEX_FILE))
        with open(META_FILE, "rb") as f:
            self.metadata = pickle.load(f)


# ✅ SHARED SINGLETON INSTANCE
vector_store = FaissVectorStore()
