"""Clustering of news items via embeddings + agglomerative clustering.

Two backends are supported:
  - "gemini": semantic embeddings from the Gemini API (best quality).
  - "tfidf":  local TF-IDF vectors (no API key, works offline).
"""

from __future__ import annotations

import numpy as np

from .config import EMBEDDING_MODEL


def _embed_gemini(texts: list[str]) -> np.ndarray:
    from google import genai

    client = genai.Client()
    vectors: list[list[float]] = []
    for start in range(0, len(texts), 100):
        chunk = texts[start : start + 100]
        response = client.models.embed_content(model=EMBEDDING_MODEL, contents=chunk)
        vectors.extend(embedding.values for embedding in response.embeddings)
    return np.asarray(vectors, dtype=np.float32)


def _embed_tfidf(texts: list[str]) -> np.ndarray:
    from sklearn.feature_extraction.text import TfidfVectorizer

    vectorizer = TfidfVectorizer(stop_words="english", max_features=4096)
    return vectorizer.fit_transform(texts).toarray().astype(np.float32)


def cluster_texts(texts: list[str], threshold: float, method: str = "gemini") -> list[int]:
    """Return a cluster label for each text.

    Texts are embedded, then merged with agglomerative clustering using cosine
    distance. `threshold` is the maximum cosine distance for two items to be
    joined into the same cluster.
    """
    count = len(texts)
    if count == 0:
        return []
    if count == 1:
        return [0]

    if method == "tfidf":
        matrix = _embed_tfidf(texts)
    else:
        matrix = _embed_gemini(texts)

    # A zero vector has undefined cosine distance; nudge it so clustering is stable.
    norms = np.linalg.norm(matrix, axis=1)
    matrix[norms == 0] = 1e-9

    from sklearn.cluster import AgglomerativeClustering

    model = AgglomerativeClustering(
        n_clusters=None,
        distance_threshold=threshold,
        metric="cosine",
        linkage="average",
    )
    return model.fit_predict(matrix).tolist()
