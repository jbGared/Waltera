-- Table de référentiel des conventions collectives françaises
CREATE TABLE IF NOT EXISTS ccn_referentiel (
  idcc TEXT PRIMARY KEY,
  titre TEXT NOT NULL,
  brochure TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la recherche
CREATE INDEX IF NOT EXISTS idx_ccn_referentiel_titre ON ccn_referentiel USING gin(to_tsvector('french', titre));
CREATE INDEX IF NOT EXISTS idx_ccn_referentiel_active ON ccn_referentiel(active);

-- RLS : Lecture publique
ALTER TABLE ccn_referentiel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON ccn_referentiel
  FOR SELECT
  USING (true);

-- Écriture restreinte (service role uniquement)
CREATE POLICY "Allow service role write access" ON ccn_referentiel
  FOR ALL
  USING (auth.role() = 'service_role');

-- Données initiales : CCN les plus courantes
INSERT INTO ccn_referentiel (idcc, titre, brochure) VALUES
  ('1486', 'Bureaux d''études techniques, cabinets d''ingénieurs-conseils et sociétés de conseils (Syntec)', '3018'),
  ('2120', 'Banque', '3161'),
  ('3127', 'Entreprises de services à la personne', '3127'),
  ('1516', 'Organismes de formation', '2120'),
  ('1996', 'Pharmacie d''officine', '3052'),
  ('2264', 'Hospitalisation privée à but lucratif', '3307'),
  ('1147', 'Personnel des cabinets médicaux', '3168'),
  ('3043', 'Entreprises de propreté et services associés', '3173'),
  ('1501', 'Restauration rapide', '3245'),
  ('2941', 'Aide, accompagnement, soins et services à domicile', '3381'),
  ('1090', 'Services de l''automobile (commerce et réparation)', '3034'),
  ('0044', 'Industries chimiques et connexes', '3108'),
  ('0573', 'Commerces de gros', '3044'),
  ('1979', 'Hôtels, cafés, restaurants (HCR)', '3292'),
  ('0016', 'Transports routiers et activités auxiliaires du transport', '3085'),
  ('0054', 'Métallurgie - Ingénieurs et cadres', '3025'),
  ('0218', 'Organismes de sécurité sociale', '3218'),
  ('0650', 'Établissements d''hospitalisation, de soins, de cure et de garde à but non lucratif', '3198'),
  ('1090', 'Automobile', '3034'),
  ('1388', 'Spectacle vivant', '3226'),
  ('1266', 'Casinos', '3169'),
  ('0045', 'Caoutchouc', '3066'),
  ('1483', 'Industries de la sérigraphie et des procédés d''impression numérique connexes', '3110'),
  ('1517', 'Commerces et services de l''audiovisuel, de l''électronique et de l''équipement ménager', '3193'),
  ('1518', 'Animation', '3246'),
  ('1527', 'Immobilier', '3090'),
  ('1606', 'Bricolage', '3232'),
  ('1702', 'Travail temporaire', '3232'),
  ('1790', 'Espaces de loisirs, d''attractions et culturels', '3275'),
  ('1813', 'Métiers de l''éducation, de la culture, des loisirs et de l''animation agissant pour l''utilité sociale et environnementale, secteur d''activités économiques à but non lucratif', '3218'),
  ('2147', 'Entreprises de prévention et de sécurité', '3196'),
  ('2205', 'Édition phonographique', '3361'),
  ('2216', 'Commerce de détail et de gros à prédominance alimentaire', '3305'),
  ('2247', 'Entreprises de courtage d''assurances et/ou de réassurances', '3110'),
  ('2257', 'Entreprises de l''industrie et des commerces en gros des viandes', '3266'),
  ('2332', 'Entreprises d''architecture', '2332'),
  ('2335', 'Établissements et services pour personnes inadaptées et handicapées', '3116'),
  ('2511', 'Sport', '2511'),
  ('2542', 'Entreprises de vente à distance', '2542'),
  ('2596', 'Coiffure et professions connexes', '2596'),
  ('2609', 'Employés et cadres du négoce et de l''industrie des produits pétroliers', '2609'),
  ('2611', 'Distribution et édition vidéo', '2611'),
  ('2613', 'Boucherie, boucherie-charcuterie, boucherie hippophagique, triperie, commerces de volailles et gibiers', '2613'),
  ('2642', 'Entreprises de la publicité', '2642'),
  ('2691', 'Entreprises de la distribution directe', '2691'),
  ('2728', 'Activités équestres', '2728'),
  ('2782', 'Eau, environnement et propreté', '2782'),
  ('2847', 'Entreprises de mise à disposition de personnel (intérim, recrutement, portage salarial)', '2847'),
  ('2972', 'Entreprises de la distribution de produits pharmaceutiques en gros', '2972'),
  ('3013', 'Entreprises de l''industrie et des commerces en gros des produits alimentaires élaborés', '3013'),
  ('3097', 'Production cinématographique', '3097'),
  ('3179', 'Établissements sociaux et médico-sociaux privés à but non lucratif', '3179'),
  ('3212', 'Télécommunications', '3212'),
  ('3221', 'Grands magasins et magasins populaires', '3221'),
  ('3225', 'Entreprises techniques au service de la création et de l''événement', '3225'),
  ('3230', 'Entreprises de salariés du particulier employeur', '3230'),
  ('3237', 'Commerces de détail non alimentaires (grands magasins, bazar, commerce de détail spécialisé)', '3237'),
  ('3248', 'Industries métallurgiques, mécaniques, électriques, électroniques et connexes', '3248')
ON CONFLICT (idcc) DO NOTHING;

COMMENT ON TABLE ccn_referentiel IS 'Référentiel des conventions collectives nationales françaises';
COMMENT ON COLUMN ccn_referentiel.idcc IS 'Identifiant de la convention collective (code IDCC)';
COMMENT ON COLUMN ccn_referentiel.titre IS 'Titre complet de la convention collective';
COMMENT ON COLUMN ccn_referentiel.brochure IS 'Numéro de brochure du Journal Officiel';
COMMENT ON COLUMN ccn_referentiel.active IS 'Indique si la CCN est toujours en vigueur';
