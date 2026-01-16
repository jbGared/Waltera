# Waltera - Assistant IA pour RH

Application moderne de gestion et assistance IA pour le conseil RH, migrée depuis base44.com vers une stack locale Supabase.

## 🚀 Stack Technique

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Déploiement**: Cloudflare Pages
- **Router**: React Router v7

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local

# Configurer vos variables Supabase dans .env.local
```

## 🔧 Configuration Supabase

1. Créer/utiliser un projet Supabase sur https://supabase.com
2. Aller dans Settings > API
3. Copier l'URL du projet et la clé anonyme (anon key)
4. Les ajouter dans `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

5. Appliquer les migrations de base de données:

```bash
# Copier le SQL depuis supabase/migrations/
# L'exécuter dans l'éditeur SQL de Supabase Dashboard
```

## 🛠️ Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Build pour production
npm run build

# Preview du build
npm run preview

# Linter
npm run lint

# Type checking
npm run typecheck
```

## 📁 Structure du Projet

```
waltera/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── ui/             # Composants shadcn/ui
│   │   └── chat/           # Composants de chat
│   ├── pages/              # Pages de l'application
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilitaires
│   ├── types/              # Types TypeScript
│   ├── integrations/       # Intégrations externes
│   │   └── supabase/       # Client et types Supabase
│   └── utils/              # Fonctions utilitaires
├── public/                 # Assets statiques
└── supabase/              # Migrations et config Supabase
    └── migrations/
```

## 🎯 Fonctionnalités

### Services disponibles

1. **Chat RAG Contrats Clients**
   - Consultation instantanée des contrats via IA
   - Historique des conversations
   - Streaming de réponses

2. **Conventions Collectives**
   - Base de connaissances des conventions collectives
   - Analyse d'impact sur contrats

3. **Analyse Réseau de Fichiers**
   - Optimisation de l'organisation documentaire
   - Recommandations pour améliorer le RAG

## 🔐 Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Authentification Supabase Auth
- Variables d'environnement pour les secrets

## 🚀 Déploiement

### Cloudflare Pages

```bash
# Build
npm run build

# Le dossier dist/ est prêt pour Cloudflare Pages
# Configurer les variables d'environnement dans Cloudflare Dashboard
```

## 📝 Variables d'Environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | URL du projet Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | ✅ |

## 🐛 Troubleshooting

### Erreur de connexion Supabase
- Vérifier que les variables d'environnement sont correctes
- Vérifier que le projet Supabase est actif

### Erreur RLS
- Vérifier que l'utilisateur est authentifié
- Vérifier les policies RLS dans Supabase Dashboard

## 📚 Documentation

- [Documentation Supabase](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)

## 📄 License

Propriétaire - Waltera

## 👨‍💻 Support

Pour toute question, contacter l'équipe de développement.
