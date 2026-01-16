# 🚀 Configuration Supabase pour Waltera

## Étape 1 : Récupérer les credentials Supabase

1. Va sur ton projet Supabase : https://supabase.com/dashboard
2. Sélectionne ton projet Waltera existant
3. Va dans **Settings** > **API**
4. Copie ces deux valeurs :
   - **Project URL** (commence par `https://xxx.supabase.co`)
   - **anon public** key (clé longue commençant par `eyJh...`)

## Étape 2 : Configurer les variables d'environnement

Ouvre le fichier `.env.local` à la racine du projet et remplace :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Par tes vraies valeurs :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## Étape 3 : Appliquer la migration SQL

1. Va dans ton projet Supabase Dashboard
2. Clique sur **SQL Editor** dans le menu de gauche
3. Clique sur **New query**
4. Copie-colle le contenu du fichier `supabase/migrations/20251103000000_initial_schema.sql`
5. Clique sur **Run** ou `Ctrl+Enter`

✅ La migration va créer :
- Table `profiles`
- Table `conversations`
- Table `analysis_reports`
- RLS policies
- Fonctions helper
- Vue `user_stats`

## Étape 4 : Vérifier l'installation

Dans le SQL Editor, exécute :

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'conversations', 'analysis_reports')
ORDER BY table_name;
```

Tu devrais voir les 3 nouvelles tables.

## Étape 5 : Tester l'authentification (optionnel)

Dans le SQL Editor :

```sql
-- Vérifier les RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

Tu devrais voir les policies pour chaque table.

## 🔧 Installation des dépendances

```bash
cd waltera
npm install
```

## 🚀 Lancer le projet

```bash
npm run dev
```

Le projet démarre sur `http://localhost:5173`

## ⚠️ Troubleshooting

### Erreur : "Missing Supabase environment variables"
- Vérifie que `.env.local` existe et contient les bonnes valeurs
- Redémarre le serveur de dev après avoir modifié `.env.local`

### Erreur : "relation does not exist"
- La migration SQL n'a pas été appliquée
- Retourne à l'Étape 3

### Erreur RLS : "new row violates row-level security policy"
- Assure-toi d'être authentifié
- Vérifie que les RLS policies ont été créées (Étape 5)

## 📚 Fichiers créés

```
src/integrations/supabase/
├── client.ts          # Client Supabase configuré
├── types.ts           # Types TypeScript générés
├── helpers.ts         # Fonctions utilitaires
└── index.ts           # Exports

src/hooks/
├── useAuth.ts         # Hook authentification
├── useConversations.ts # Hook conversations
└── index.ts           # Exports
```

## 🎯 Prochaines étapes

Une fois configuré, tu peux :
1. Tester l'authentification
2. Créer des conversations
3. Migrer les composants UI (Phase 3)

---

**Besoin d'aide ?** Vérifie la [documentation Supabase](https://supabase.com/docs)
