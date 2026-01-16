-- ============================================================================
-- Migration: Ajout du type de service 'recherche_clients'
-- ============================================================================
-- Description: Ajoute le type de service recherche_clients pour le chatbot
-- Date: 2025-12-07
-- ============================================================================

-- Ajouter la nouvelle valeur au type ENUM service_type
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'recherche_clients';

-- Commentaire sur le nouveau service
COMMENT ON TYPE service_type IS 'Types de services disponibles: rag_contrats, conventions, analyse_fichiers, recherche_clients';
