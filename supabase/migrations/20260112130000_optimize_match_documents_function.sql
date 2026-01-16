-- Migration pour optimiser la fonction match_documents
-- Ajoute : seuil de similarité, filtrage is_deleted, vérification embedding non NULL

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS match_documents(vector, integer, jsonb);

-- Créer la nouvelle fonction optimisée
CREATE FUNCTION match_documents(
  query_embedding vector(1024),
  match_count integer DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb,
  match_threshold float DEFAULT 0.5  -- Seuil par défaut assez permissif
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    (1 - (documents.embedding <=> query_embedding))::float AS similarity
  FROM documents
  WHERE documents.embedding IS NOT NULL
    AND documents.is_deleted = false
    AND documents.metadata @> filter
    AND (1 - (documents.embedding <=> query_embedding)) >= match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Commentaire
COMMENT ON FUNCTION match_documents IS 'Recherche vectorielle optimisée avec seuil de similarité, filtrage par métadonnées, et exclusion des documents supprimés';

-- Vérifier/créer les index pour la performance
CREATE INDEX IF NOT EXISTS idx_documents_metadata_gin
ON documents USING GIN (metadata);

CREATE INDEX IF NOT EXISTS idx_documents_is_deleted
ON documents (is_deleted)
WHERE is_deleted = false;

-- Note: L'index vectoriel (hnsw ou ivfflat) devrait déjà exister
-- Si ce n'est pas le cas, décommenter l'une des lignes suivantes :

-- Pour HNSW (recommandé, plus précis mais plus lent à construire) :
-- CREATE INDEX IF NOT EXISTS idx_documents_embedding_hnsw
-- ON documents USING hnsw (embedding vector_cosine_ops)
-- WITH (m = 16, ef_construction = 64);

-- Pour IVFFlat (plus rapide à construire, moins précis) :
-- CREATE INDEX IF NOT EXISTS idx_documents_embedding_ivfflat
-- ON documents USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);
