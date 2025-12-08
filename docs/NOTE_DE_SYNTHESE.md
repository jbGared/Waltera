# Note de Synthèse - Projet WALTERA

## Vue d'ensemble

### Présentation du projet
**WALTERA** est une application web de tarification de complémentaires santé individuelles pour le courtage en assurance. Le projet permet de calculer des devis personnalisés en temps réel en fonction du profil des bénéficiaires (âge, situation familiale, localisation).

### Objectif principal
Automatiser le processus de tarification des contrats santé avec trois gammes de produits :
- **SANTE SENIORS PLUS** (haut de gamme)
- **SANTE SENIORS** (standard)
- **TNS FORMULES** (Travailleurs Non Salariés)

### Technologies utilisées
- **Frontend** : React + TypeScript + Vite
- **UI** : Tailwind CSS + shadcn/ui
- **Backend** : Supabase (PostgreSQL + API REST)
- **Déploiement** : Firebase Hosting

---

## Architecture du projet

### Structure des données

#### Base de données Supabase
Le projet utilise deux tables principales :

1. **`tarifs_sante`** (5 868 lignes)
   - Contient tous les tarifs par combinaison gamme/produit/zone/qualité/âge
   - 6 options tarifaires + surcomplémentaire (opt. 3-6) + renfort hospi

2. **`zones_sante`** (199 lignes)
   - Mapping départements → zones tarifaires
   - Deux types : SENIORS (Z01, Z02, AM) et TNS (Z01-Z05)

### Architecture Frontend

```
src/
├── components/
│   ├── tarificateur/         # Interface principale du calculateur
│   │   ├── TarificateurForm.tsx
│   │   ├── GammeSelection.tsx
│   │   ├── BeneficiairesSection.tsx
│   │   ├── OptionsSection.tsx
│   │   └── RecapPanel.tsx
│   └── ui/                   # Composants UI (shadcn)
├── lib/
│   ├── supabase.ts           # Client Supabase
│   └── types/                # Types TypeScript
└── pages/
    └── Tarificateur.tsx
```

---

## Fonctionnalités principales

### 1. Sélection de la gamme et du produit
- Choix parmi 3 gammes de produits
- Sélection du taux de commission (10%, 15%, 20%)
- Validation automatique du code postal et détermination de la zone

### 2. Composition familiale
- Ajout de bénéficiaires (assuré, conjoint, enfants)
- Calcul automatique de l'âge à la date d'effet
- Gestion des règles spécifiques TNS ("Assuré seul" vs "Assuré")

### 3. Options et garanties
- 6 niveaux d'options (1 = économique → 6 = premium)
- Surcomplémentaire disponible pour options 3-6
- Renfort hospitalisation (SANTE SENIORS PLUS uniquement)

### 4. Calcul du devis
- Calcul en temps réel du tarif mensuel
- Détail par bénéficiaire et par type de garantie
- Affichage des garanties principales par catégorie

---

## Règles métier essentielles

### Tranches d'âge
- **SENIORS/SENIORS PLUS** :
  - Adultes : 0-59 ans puis annuel (60, 61, 62...)
  - Enfants : 0-27 ans puis 28+
- **TNS** :
  - 0-19 ans puis annuel (20, 21, 22...)

### Zones tarifaires
- **SENIORS** : Z01 (province), Z02 (grandes villes), AM (Alsace-Moselle)
- **TNS** : Z01 à Z05

### Qualités des bénéficiaires
- **SENIORS** : Assuré, Conjoint, Enfant
- **TNS** : Assuré seul (célibataire sans enfant) ou Assuré (en famille), Conjoint, Enfant

### Frais
- Droits ACPS : 1,50 €/mois (inclus dans les tarifs)
- Droit d'entrée : 10,00 € (unique, à la souscription)

---

## Workflow utilisateur

1. **Saisie de la situation**
   - Code postal
   - Date d'effet (par défaut : date du jour)
   - Gamme de produit
   - Commission souhaitée

2. **Composition familiale**
   - Ajout des bénéficiaires avec leurs dates de naissance
   - Validation automatique de l'âge

3. **Choix des garanties**
   - Sélection de l'option (1-6)
   - Activation éventuelle de la surcomplémentaire
   - Activation du renfort hospi (SENIORS PLUS uniquement)

4. **Visualisation du devis**
   - Tarif mensuel total
   - Détail par bénéficiaire
   - Garanties principales par catégorie

---

## Points clés techniques

### Performance
- Requêtes Supabase optimisées avec filtres multiples
- Mise en cache des zones départementales
- Calculs côté client pour réactivité

### Validation
- Vérification du code postal (5 chiffres + département valide)
- Contraintes sur âge maximum (100+ ans)
- Validation des options (surco uniquement si opt. ≥ 3)

### Sécurité
- Toutes les requêtes passent par l'API Supabase
- Pas d'exposition des clés secrètes côté client
- Row Level Security (RLS) sur les tables

---

## État actuel du projet

### Fonctionnalités implémentées ✅
- Interface complète de saisie
- Calcul des tarifs en temps réel
- Gestion des bénéficiaires
- Panneau récapitulatif avec garanties
- Validation des formulaires

### Améliorations récentes
- Affichage des garanties par catégorie
- Conservation de l'état de l'accordéon lors des changements
- Date d'effet par défaut (date du jour)
- Blocage des dates antérieures

### Pistes d'amélioration futures
- Export du devis en PDF
- Sauvegarde des devis dans Supabase
- Système de comparaison de devis
- Interface d'administration des tarifs
- Historique des calculs
- Intégration email pour envoi de devis

---

## Références utiles

- **CLAUDE.md** : Documentation technique détaillée
- **Supabase** : [https://supabase.com/docs](https://supabase.com/docs)
- **shadcn/ui** : [https://ui.shadcn.com](https://ui.shadcn.com)
- **Vite** : [https://vitejs.dev](https://vitejs.dev)

---

**Date de dernière mise à jour** : Décembre 2025
**Version** : 1.0
**Auteur** : Équipe WALTERA
