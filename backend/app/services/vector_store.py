import faiss
import pickle
from pathlib import Path
import numpy as np

DATA_DIR = Path("app/data/faiss_index")
DATA_DIR.mkdir(parents=True, exist_ok=True)

INDEX_FILE = DATA_DIR / "index.faiss"
META_FILE = DATA_DIR / "metadata.pkl"


class FaissVectorStore:
    def __init__(self, dim: int):
        self.dim = dim
        self.index = faiss.IndexFlatL2(dim)
        self.metadata = []

        if INDEX_FILE.exists() and META_FILE.exists():
            self._load()

    def add(self, embeddings, metadatas):
        self.index.add(np.array(embeddings).astype("float32"))
        self.metadata.extend(metadatas)
        self._save()

    def search(self, query_embedding, top_k: int = 3):
        distances, indices = self.index.search(
            np.array([query_embedding]).astype("float32"), top_k
        )

        results = []
        for idx in indices[0]:
            if idx < len(self.metadata):
                results.append(self.metadata[idx])

        return results

    def _save(self):
        faiss.write_index(self.index, str(INDEX_FILE))
        with open(META_FILE, "wb") as f:
            pickle.dump(self.metadata, f)

    def _load(self):
        self.index = faiss.read_index(str(INDEX_FILE))
        with open(META_FILE, "rb") as f:
            self.metadata = pickle.load(f)
