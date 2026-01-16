-- Migration pour créer la fonction match_documents pour la recherche vectorielle

-- Créer la fonction match_documents
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_client_id uuid DEFAULT NULL,
  filter_client_code text DEFAULT NULL
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
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE documents.embedding IS NOT NULL
    AND documents.is_deleted = false
    AND (1 - (documents.embedding <=> query_embedding)) >= match_threshold
    AND (filter_client_id IS NULL OR documents.metadata->>'client_id' = filter_client_id::text)
    AND (filter_client_code IS NULL OR documents.metadata->>'client_code' = filter_client_code)
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION match_documents IS 'Recherche de documents par similarité vectorielle avec filtrage optionnel par client';
