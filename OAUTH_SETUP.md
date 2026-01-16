# Configuration OAuth - Google et Microsoft

Ce document explique comment configurer l'authentification OAuth pour Google et Microsoft dans Supabase.

## Vue d'ensemble

La nouvelle page de login propose maintenant :
- ✅ Design moderne en deux colonnes (turquoise/blanc)
- ✅ Authentification par email/mot de passe
- ✅ Authentification Google OAuth
- ✅ Authentification Microsoft (Azure AD)
- ✅ Checkbox "Se souvenir de moi"
- ✅ Bouton "Afficher/Masquer" le mot de passe
- ✅ Lien "Créer un compte"
- ✅ Responsive (mobile + desktop)

## 1. Configuration Google OAuth

### Étape 1 : Créer un projet Google Cloud

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API "Google+ API" (ou "People API")

### Étape 2 : Configurer l'écran de consentement OAuth

1. Dans le menu latéral : **APIs & Services > OAuth consent screen**
2. Choisir **External** (sauf si vous avez un Google Workspace)
3. Remplir les informations :
   - **App name** : WALTERA AI Assistant
   - **User support email** : votre email
   - **Developer contact** : votre email
4. Ajouter les scopes :
   - `userinfo.email`
   - `userinfo.profile`
5. Sauvegarder

### Étape 3 : Créer les identifiants OAuth

1. Dans **APIs & Services > Credentials**
2. Cliquer sur **Create Credentials > OAuth 2.0 Client ID**
3. Choisir **Web application**
4. Configurer :
   - **Name** : WALTERA Web Client
   - **Authorized JavaScript origins** :
     - `http://localhost:5173` (développement)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs** :
     - `https://djxbhqoswgmgogefqlra.supabase.co/auth/v1/callback`
5. Copier le **Client ID** et le **Client Secret**

### Étape 4 : Configurer dans Supabase

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet : `djxbhqoswgmgogefqlra`
3. **Authentication > Providers > Google**
4. Activer Google OAuth
5. Coller :
   - **Client ID**
   - **Client Secret**
6. **Redirect URL** devrait être :
   ```
   https://djxbhqoswgmgogefqlra.supabase.co/auth/v1/callback
   ```
7. Sauvegarder

### Étape 5 : Tester

1. Aller sur `http://localhost:5173/login`
2. Cliquer sur le bouton **Google**
3. Se connecter avec un compte Google
4. Redirection vers `/dashboard` après succès

---

## 2. Configuration Microsoft OAuth (Azure AD)

### Étape 1 : Créer une application Azure AD

1. Aller sur [Azure Portal](https://portal.azure.com)
2. **Azure Active Directory > App registrations**
3. Cliquer sur **New registration**
4. Configurer :
   - **Name** : WALTERA AI Assistant
   - **Supported account types** : Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI** : Web
     ```
     https://djxbhqoswgmgogefqlra.supabase.co/auth/v1/callback
     ```
5. Cliquer sur **Register**

### Étape 2 : Créer un Client Secret

1. Dans votre application Azure AD : **Certificates & secrets**
2. Cliquer sur **New client secret**
3. Description : WALTERA Supabase
4. Expiration : 24 mois (recommandé)
5. Copier la **Value** (Client Secret) immédiatement (ne sera plus visible)

### Étape 3 : Configurer les permissions API

1. Dans **API permissions**
2. Cliquer sur **Add a permission**
3. Sélectionner **Microsoft Graph**
4. Choisir **Delegated permissions**
5. Ajouter :
   - `email`
   - `openid`
   - `profile`
   - `User.Read`
6. Cliquer sur **Grant admin consent** (si vous êtes admin)

### Étape 4 : Récupérer les identifiants

1. Dans **Overview** de votre application
2. Copier :
   - **Application (client) ID**
   - **Directory (tenant) ID** (optionnel, pour les comptes organisationnels uniquement)

### Étape 5 : Configurer dans Supabase

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet : `djxbhqoswgmgogefqlra`
3. **Authentication > Providers > Azure (Microsoft)**
4. Activer Azure OAuth
5. Coller :
   - **Client ID** (Application ID)
   - **Client Secret** (créé à l'étape 2)
   - **Azure Tenant** (optionnel) : `common` pour tous les comptes Microsoft
6. **Redirect URL** :
   ```
   https://djxbhqoswgmgogefqlra.supabase.co/auth/v1/callback
   ```
7. Sauvegarder

### Étape 6 : Tester

1. Aller sur `http://localhost:5173/login`
2. Cliquer sur le bouton **Microsoft**
3. Se connecter avec un compte Microsoft
4. Redirection vers `/dashboard` après succès

---

## 3. Gestion des utilisateurs OAuth

### Profils automatiques

Lorsqu'un utilisateur se connecte via OAuth :
- Un compte est créé automatiquement dans Supabase Auth
- Un profil est créé dans la table `profiles` via le trigger `on_auth_user_created`
- L'email et le nom sont récupérés depuis le provider OAuth

### Vérifier les utilisateurs OAuth

```sql
-- Voir tous les utilisateurs avec leur provider
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as name,
  raw_app_meta_data->>'provider' as provider,
  created_at
FROM auth.users
ORDER BY created_at DESC;
```

### Lier plusieurs providers au même compte

Supabase permet de lier plusieurs méthodes d'authentification au même compte :
- Email/Password + Google
- Google + Microsoft
- Etc.

Pour cela, l'utilisateur doit être connecté et utiliser :
```typescript
await supabase.auth.linkIdentity({ provider: 'google' });
```

---

## 4. Sécurité et bonnes pratiques

### Variables d'environnement (production)

Ne jamais commit les secrets OAuth. Utiliser des variables d'environnement :

```bash
# .env (NE PAS COMMIT)
VITE_GOOGLE_CLIENT_ID=votre_client_id
VITE_MICROSOFT_CLIENT_ID=votre_client_id
```

### Domaines autorisés

Dans Supabase Dashboard > Authentication > URL Configuration :
- Ajouter votre domaine de production dans **Site URL**
- Ajouter les redirects autorisés dans **Redirect URLs**

Exemple :
```
https://app.waltera.fr
https://app.waltera.fr/dashboard
```

### HTTPS obligatoire en production

OAuth nécessite HTTPS en production. Assurer que :
- Votre domaine a un certificat SSL valide
- Les redirects utilisent `https://`

---

## 5. Dépannage

### Google : "Error 400: redirect_uri_mismatch"

**Cause** : L'URL de redirection n'est pas autorisée dans Google Cloud Console

**Solution** :
1. Vérifier que l'URL de callback Supabase est bien ajoutée dans Google Cloud Console
2. Format exact : `https://[PROJECT_REF].supabase.co/auth/v1/callback`

### Microsoft : "AADSTS50011: The reply URL specified in the request does not match"

**Cause** : L'URL de redirection ne correspond pas dans Azure AD

**Solution** :
1. Vérifier que l'URL de callback est bien configurée dans Azure Portal
2. Format exact : `https://[PROJECT_REF].supabase.co/auth/v1/callback`
3. Type de plateforme doit être **Web** (pas SPA ou Mobile)

### L'utilisateur est créé mais pas redirigé

**Cause** : Le `redirectTo` n'est pas configuré correctement

**Solution** :
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/dashboard`, // ✅ Correct
  },
});
```

### Popup bloquée par le navigateur

Les navigateurs peuvent bloquer les popups OAuth.

**Solution** :
- L'authentification OAuth utilise une redirection complète, pas de popup
- Si nécessaire, utiliser le mode popup :
  ```typescript
  options: {
    skipBrowserRedirect: false, // Utilise une redirection
  }
  ```

---

## 6. Test en développement

Pour tester localement avec OAuth :

1. **Utiliser localhost:5173** (pas 127.0.0.1)
2. Ajouter `http://localhost:5173` dans les origines autorisées (Google/Azure)
3. La callback URL Supabase reste la même (cloud)

### Test rapide

```bash
# Démarrer le serveur
npm run dev

# Ouvrir
open http://localhost:5173/login

# Tester Google OAuth
# Tester Microsoft OAuth
```

---

## Support

En cas de problème :
1. Vérifier les logs Supabase : Dashboard > Logs > Auth Logs
2. Vérifier la console navigateur (F12)
3. Consulter la [documentation Supabase Auth](https://supabase.com/docs/guides/auth)
4. Vérifier que les providers sont activés dans Supabase Dashboard
