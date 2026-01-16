-- Fonction pour rechercher un client par nom/code (recherche floue)

CREATE OR REPLACE FUNCTION search_client(
  search_term text
)
RETURNS TABLE (
  client_id text,
  client_code text,
  client_name text,
  match_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH unique_clients AS (
    SELECT DISTINCT
      metadata->>'client_id' as client_id,
      metadata->>'client_code' as client_code,
      metadata->>'client_name' as client_name
    FROM documents
    WHERE metadata IS NOT NULL
      AND metadata->>'client_id' IS NOT NULL
      AND is_deleted = false
  )
  SELECT
    uc.client_id,
    uc.client_code,
    uc.client_name,
    GREATEST(
      -- Score pour match exact (insensible à la casse)
      CASE WHEN LOWER(uc.client_name) = LOWER(search_term) THEN 1.0
           WHEN LOWER(uc.client_code) = LOWER(search_term) THEN 1.0
           ELSE 0.0 END,
      -- Score pour match partiel dans le nom
      CASE WHEN LOWER(uc.client_name) LIKE '%' || LOWER(search_term) || '%' THEN 0.8
           WHEN LOWER(uc.client_code) LIKE '%' || LOWER(search_term) || '%' THEN 0.8
           ELSE 0.0 END,
      -- Score pour similarité de texte (trigram)
      similarity(LOWER(uc.client_name), LOWER(search_term)),
      similarity(LOWER(uc.client_code), LOWER(search_term))
    ) AS match_score
  FROM unique_clients uc
  WHERE
    -- Au moins une correspondance partielle
    LOWER(uc.client_name) LIKE '%' || LOWER(search_term) || '%'
    OR LOWER(uc.client_code) LIKE '%' || LOWER(search_term) || '%'
    OR similarity(LOWER(uc.client_name), LOWER(search_term)) > 0.3
    OR similarity(LOWER(uc.client_code), LOWER(search_term)) > 0.3
  ORDER BY match_score DESC
  LIMIT 5;
END;
$$;

-- Activer l'extension pg_trgm pour la similarité de texte
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_documents_client_name_trgm
ON documents USING GIN ((metadata->>'client_name') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_documents_client_code_trgm
ON documents USING GIN ((metadata->>'client_code') gin_trgm_ops);

COMMENT ON FUNCTION search_client IS 'Recherche floue de clients par nom ou code avec scoring de pertinence';
