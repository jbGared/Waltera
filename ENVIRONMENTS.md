# Documentation des Environnements WALTERA

## Vue d'ensemble

Le projet WALTERA utilise 3 environnements distincts pour garantir une séparation claire entre le développement, les tests et la production.

## Environnements

### 1. **Développement (dev)**
- **Firebase Project ID**: `waltera-dev`
- **URL**: https://waltera-dev.web.app
- **Usage**: Tests en cours de développement, fonctionnalités expérimentales
- **Fichier config**: `.env.dev`

### 2. **Staging**
- **Firebase Project ID**: `waltera-staging`
- **URL**: https://waltera-staging.web.app
- **Usage**: Tests de pré-production, validation client, QA
- **Fichier config**: `.env.staging`

### 3. **Production (prod)**
- **Firebase Project ID**: `waltera-prod`
- **URL**: https://waltera-prod.web.app
- **Usage**: Environnement de production pour les utilisateurs finaux
- **Fichier config**: `.env.prod`

---

## Configuration Firebase

### Fichier `.firebaserc`

```json
{
  "projects": {
    "default": "waltera-prod",
    "dev": "waltera-dev",
    "staging": "waltera-staging",
    "prod": "waltera-prod"
  }
}
```

### Commandes Firebase

```bash
# Lister les projets configurés
firebase projects:list

# Sélectionner un environnement
firebase use dev
firebase use staging
firebase use prod

# Voir l'environnement actuel
firebase use
```

---

## Configuration Supabase

Chaque environnement utilise actuellement le même projet Supabase. Pour une séparation complète, vous pouvez créer des projets Supabase distincts.

### Configuration actuelle (partagée)

- **URL**: https://syxsacbciqwrahjdixuc.supabase.co
- **Project Ref**: syxsacbciqwrahjdixuc

### Recommandation pour isolation complète

Il est recommandé de créer 2 projets Supabase supplémentaires :
- `waltera-dev` pour le développement
- `waltera-staging` pour le staging
- Garder le projet actuel pour la production

---

## Variables d'environnement

### Structure des fichiers `.env`

Chaque environnement a son propre fichier de configuration :

#### `.env.dev`
```bash
VITE_APP_ENV=dev
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
VITE_FIREBASE_PROJECT_ID=waltera-dev
```

#### `.env.staging`
```bash
VITE_APP_ENV=staging
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
VITE_FIREBASE_PROJECT_ID=waltera-staging
```

#### `.env.prod`
```bash
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://syxsacbciqwrahjdixuc.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
VITE_FIREBASE_PROJECT_ID=waltera-prod
```

### Variables disponibles

| Variable | Description | Requis |
|----------|-------------|---------|
| `VITE_APP_ENV` | Environnement (dev/staging/production) | ✅ |
| `VITE_SUPABASE_URL` | URL du projet Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clé publique Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (CONFIDENTIELLE) | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | ID du projet Firebase | ✅ |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Google Client ID | ❌ |
| `VITE_MICROSOFT_CLIENT_ID` | OAuth Microsoft Client ID | ❌ |

---

## Déploiement

### Script de déploiement automatisé

Le script `deploy.sh` permet de déployer facilement sur n'importe quel environnement.

#### Usage

```bash
# Déployer sur dev
./deploy.sh dev

# Déployer sur staging
./deploy.sh staging

# Déployer sur production
./deploy.sh prod
```

#### Ce que fait le script

1. Valide l'environnement spécifié
2. Copie le fichier `.env.[env]` vers `.env.local`
3. Sélectionne le projet Firebase approprié
4. Build le projet avec `npm run build`
5. Déploie sur Firebase Hosting
6. Affiche l'URL de l'application déployée

### Déploiement manuel

Si vous préférez déployer manuellement :

```bash
# 1. Copier le fichier d'environnement
cp .env.dev .env.local

# 2. Sélectionner le projet Firebase
firebase use dev

# 3. Build
npm run build

# 4. Déployer
firebase deploy --only hosting
```

---

## Workflow Git

### Branches recommandées

```
main (production)
├── staging
└── dev
```

### Workflow de développement

1. **Développer sur `dev`**
   ```bash
   git checkout dev
   # Faire vos modifications
   git add .
   git commit -m "feat: nouvelle fonctionnalité"
   ./deploy.sh dev
   ```

2. **Tester sur `staging`**
   ```bash
   git checkout staging
   git merge dev
   ./deploy.sh staging
   # Tests QA
   ```

3. **Déployer en production**
   ```bash
   git checkout main
   git merge staging
   ./deploy.sh prod
   ```

---

## Sécurité

### ⚠️ Fichiers à NE JAMAIS committer

Les fichiers suivants sont dans `.gitignore` et **NE DOIVENT JAMAIS** être committés :

- `.env`
- `.env.local`
- `.env.dev`
- `.env.staging`
- `.env.prod`
- `.env.*.local`
- `.env.production`

### ✅ Fichier à committer

- `.env.example` : Template sans valeurs sensibles

### Gestion des secrets

1. **Supabase Secrets** : Stockez les secrets sensibles dans Supabase Vault
2. **Firebase Secrets** : Utilisez Firebase Functions Config pour les secrets
3. **Variables locales** : Gardez les fichiers `.env.*` en local uniquement
4. **Partage d'équipe** : Utilisez un gestionnaire de secrets (1Password, Vault, etc.)

---

## Authentification Firebase

### Se connecter à Firebase

```bash
# Connexion interactive (ouvre le navigateur)
firebase login --reauth

# Voir les comptes connectés
firebase login:list

# Se déconnecter
firebase logout
```

### Token CI/CD

Pour les pipelines d'intégration continue :

```bash
# Générer un token
firebase login:ci

# Utiliser le token
firebase deploy --token "$FIREBASE_TOKEN"
```

---

## Commandes utiles

### Vérifier la configuration

```bash
# Voir le projet Firebase actuel
firebase use

# Lister tous les projets
firebase projects:list

# Voir les détails du projet actuel
firebase apps:list
```

### Tester localement

```bash
# Dev
cp .env.dev .env.local
npm run dev

# Staging
cp .env.staging .env.local
npm run dev

# Prod
cp .env.prod .env.local
npm run dev
```

### Build sans déployer

```bash
# Copier l'env
cp .env.dev .env.local

# Build uniquement
npm run build

# Prévisualiser le build
npm run preview
```

---

## Monitoring et Logs

### Firebase Hosting

- **Console**: https://console.firebase.google.com/
- **Logs**: Hosting → Historique
- **Analytics**: Google Analytics intégré

### Supabase

- **Console**: https://supabase.com/dashboard/
- **Logs**: Logs & Monitoring
- **API Usage**: Settings → Usage

---

## Checklist de déploiement

### Avant le premier déploiement

- [ ] Créer les 3 projets Firebase (dev, staging, prod)
- [ ] Créer les 3 projets Supabase (optionnel, recommandé)
- [ ] Configurer `.firebaserc`
- [ ] Créer `.env.dev`, `.env.staging`, `.env.prod`
- [ ] Remplir les variables d'environnement
- [ ] Tester le build localement : `npm run build`
- [ ] Se connecter à Firebase : `firebase login --reauth`
- [ ] Rendre le script exécutable : `chmod +x deploy.sh`

### Avant chaque déploiement

- [ ] Tests locaux passent : `npm run test` (si applicable)
- [ ] Build réussit : `npm run build`
- [ ] Pas de secrets dans le code
- [ ] Fichiers `.env.*` à jour
- [ ] Git commit et push effectué
- [ ] Environnement Firebase correct

### Après le déploiement

- [ ] Vérifier l'URL de déploiement
- [ ] Tester les fonctionnalités principales
- [ ] Vérifier les logs Firebase
- [ ] Vérifier les logs Supabase (si applicable)
- [ ] Créer un tag Git pour la prod : `git tag v1.0.0`

---

## Troubleshooting

### Erreur : "Authentication Error: Your credentials are no longer valid"

```bash
firebase login --reauth
```

### Erreur : "Project not found"

Vérifier que le projet existe dans `.firebaserc` et sur Firebase Console.

```bash
firebase projects:list
```

### Erreur : Build failed

Vérifier les variables d'environnement :
```bash
cat .env.local
```

### Le mauvais environnement est déployé

Vérifier le projet Firebase actuel :
```bash
firebase use
```

Changer si nécessaire :
```bash
firebase use dev
```

---

## Support

Pour toute question ou problème :

1. Vérifier cette documentation
2. Consulter les logs Firebase : `firebase-debug.log`
3. Consulter la console Firebase : https://console.firebase.google.com/
4. Consulter la console Supabase : https://supabase.com/dashboard/

---

**Dernière mise à jour** : 11 janvier 2026
