# Documentation WALTERA

Bienvenue dans la documentation complète du projet WALTERA - Calculateur de tarifs de complémentaires santé individuelles.

## Table des matières

### 📋 [Note de Synthèse](NOTE_DE_SYNTHESE.md)
Vue d'ensemble du projet, objectifs, technologies utilisées et fonctionnalités principales.

**À lire en premier** pour comprendre le contexte global du projet.

**Contenu :**
- Présentation générale du projet
- Technologies et stack technique
- Fonctionnalités principales
- Workflow utilisateur
- État actuel et pistes d'amélioration

---

### 🏗️ [Architecture](ARCHITECTURE.md)
Architecture technique détaillée de l'application.

**Pour les développeurs** qui souhaitent comprendre l'organisation du code et les choix techniques.

**Contenu :**
- Stack technique (Frontend, Backend, Déploiement)
- Architecture des données (schéma base de données)
- Structure frontend (composants, pages, lib)
- Gestion de l'état
- API et communication avec Supabase
- Sécurité (RLS, variables d'environnement)
- Performance et optimisations
- Déploiement Firebase
- Tests (à implémenter)

---

### 🗄️ [Guide Supabase](SUPABASE_GUIDE.md)
Documentation technique complète sur l'utilisation de Supabase dans le projet.

**Pour les développeurs** travaillant avec la base de données et les requêtes.

**Contenu :**
- Configuration Supabase (URL, clés, variables d'environnement)
- Schéma détaillé des tables (`tarifs_sante`, `zones_sante`)
- Index et contraintes
- Row Level Security (RLS)
- Requêtes courantes (recherche zone, tarifs, optimisations)
- Administration (import/export, backup)
- Statistiques et analyses
- Performances et monitoring
- Types TypeScript
- Troubleshooting

---

### 💻 [Guide de Développement](GUIDE_DEVELOPPEMENT.md)
Guide pratique pour installer, développer et déployer l'application.

**Pour les nouveaux développeurs** rejoignant le projet.

**Contenu :**
- Installation et configuration (prérequis, variables d'environnement)
- Commandes de développement (dev, build, lint)
- Structure du projet
- Conventions de code (TypeScript, React, naming)
- Workflow Git (branches, commits, PR)
- Ajout de nouvelles fonctionnalités
- Tests (à implémenter)
- Débogage
- Déploiement Firebase
- FAQ et ressources

---

### 📐 [Règles Métier](REGLES_METIER.md)
Documentation exhaustive des règles métier du calculateur de tarifs santé.

**Pour tous** : développeurs, product owners, et toute personne ayant besoin de comprendre le fonctionnement du tarificateur.

**Contenu :**
- Gammes de produits (SANTE SENIORS PLUS, SANTE SENIORS, TNS FORMULES)
- Tranches d'âge par gamme
- Qualité des bénéficiaires
- Options de garanties (1-6, surcomplémentaire, renfort hospi)
- Zones géographiques (mapping départements)
- Calcul du tarif (formules, algorithmes)
- Calcul de l'âge
- Frais additionnels (ACPS, droit d'entrée)
- Validations (code postal, âge, options)
- Exemples de calculs
- Cas particuliers
- Glossaire

---

### 📄 [Feature CCN](FEATURE_CCN.md)
Documentation de la page Conventions Collectives.

**Pour comprendre** le module de gestion des CCN.

**Contenu :**
- Description de la fonctionnalité
- Accès et navigation
- Affichage des CCN
- Badges de statut
- Source des données Supabase
- Structure technique
- Design et responsive

---

### ⬇️ [Feature CCN Import](FEATURE_CCN_IMPORT.md)
Documentation du module d'import de conventions collectives.

**Pour comprendre** comment ajouter de nouvelles CCN.

**Contenu :**
- Architecture (table `ccn_referentiel`)
- Composant CCNSelector
- Interface utilisateur
- Workflow utilisateur
- Intégration dans la page
- Installation et migration SQL
- Améliorations futures

---

## Quick Start

### Pour découvrir le projet
1. Lire la [Note de Synthèse](NOTE_DE_SYNTHESE.md)
2. Parcourir l'[Architecture](ARCHITECTURE.md)

### Pour développer
1. Suivre le [Guide de Développement](GUIDE_DEVELOPPEMENT.md)
2. Consulter le [Guide Supabase](SUPABASE_GUIDE.md) pour les requêtes
3. Se référer aux [Règles Métier](REGLES_METIER.md) pour la logique

### Pour comprendre le métier
1. Lire les [Règles Métier](REGLES_METIER.md)
2. Consulter la [Note de Synthèse](NOTE_DE_SYNTHESE.md) pour le contexte

---

## Structure de la documentation

```
docs/
├── README.md                    # Ce fichier (index)
├── NOTE_DE_SYNTHESE.md         # Vue d'ensemble du projet
├── ARCHITECTURE.md             # Architecture technique
├── SUPABASE_GUIDE.md          # Guide Supabase
├── GUIDE_DEVELOPPEMENT.md     # Guide développeur
└── REGLES_METIER.md           # Règles métier
```

---

## Autres ressources

### Documentation technique (racine du projet)
- **CLAUDE.md** : Instructions détaillées pour Claude Code (développement assisté)

### Documentation externe
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com/docs)
- [Firebase](https://firebase.google.com/docs)

---

## Maintenance de la documentation

### Principes
- ✅ Garder la documentation à jour avec le code
- ✅ Mettre à jour la date et version à chaque modification
- ✅ Utiliser un langage clair et des exemples concrets
- ✅ Maintenir la cohérence entre les différents documents

### Convention de versionnage
- **Version 1.0** : Version initiale (Décembre 2025)
- **Version X.Y** : Y incrémenté pour ajouts mineurs
- **Version X.0** : X incrémenté pour changements majeurs

### Contributions
Pour contribuer à la documentation :
1. Créer une branche `docs/description-modification`
2. Modifier les fichiers concernés
3. Mettre à jour la date et version
4. Créer une Pull Request

---

## Contact

Pour toute question sur la documentation ou le projet :
- **Équipe de développement** : voir les contributeurs du projet
- **Issues** : Créer une issue sur le repository

---

**Version** : 1.0
**Date de création** : Décembre 2025
**Dernière mise à jour** : Décembre 2025
