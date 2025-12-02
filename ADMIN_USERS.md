# Administration des Utilisateurs - WALTERA

## 📅 Date : 2 décembre 2025

## ✅ Implémentation

Un système d'administration a été créé pour permettre aux administrateurs de gérer les utilisateurs de WALTERA.

---

## 🎯 Changements par Rapport à l'Inscription Publique

### ❌ Page Register Supprimée
- Pas d'auto-inscription
- Les utilisateurs sont créés **uniquement par les administrateurs**
- Plus de lien "Créer un compte" sur la page login

### ✅ Page Admin Créée
- Interface de gestion des utilisateurs
- Formulaire de création d'utilisateur
- Gestion des droits admin
- Accessible uniquement aux administrateurs

---

## 🔑 Donner les Droits Admin à un Utilisateur

### Via Supabase Dashboard

1. **Allez dans Authentication → Users**
2. **Cliquez sur l'utilisateur**
3. **Raw User Meta Data**
4. **Ajoutez** :
   ```json
   {
     "is_admin": true,
     "first_name": "Jean",
     "last_name": "Dupont",
     "role": "Administrateur"
   }
   ```
5. **Cliquez "Save"**

### Via SQL

```sql
-- Donner les droits admin à un utilisateur
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'::jsonb
)
WHERE email = 'admin@waltera.fr';
```

---

## 🛡️ Système de Rôles

### Vérification Admin

Dans le code :
```typescript
const { user } = useAuth();
const isAdmin = user?.user_metadata?.is_admin === true;
```

### Pages Restreintes

**Page Admin** (`/admin`) :
- Vérification côté composant
- Si non-admin → Message "Accès Restreint"
- Si admin → Interface complète

**Dashboard** :
- Card "Administration" visible **uniquement pour les admins**
- Gradient jaune/orange pour se démarquer
- Lien vers `/admin`

---

## 📋 Page Admin - Fonctionnalités

### 1. Créer un Utilisateur

**Formulaire** :
- Prénom, Nom
- Email
- Mot de passe temporaire
- Fonction (rôle)
- Checkbox "Droits administrateur"

**Process** :
```
1. Admin clique "Nouvel utilisateur"
2. Remplit le formulaire
3. Clique "Créer l'utilisateur"
4. → Edge Function Supabase (service_role_key)
5. → Utilisateur créé
6. → Email envoyé (optionnel)
```

### 2. Lister les Utilisateurs

- Liste de tous les utilisateurs
- Avatar avec initiales
- Badge "Admin" pour les administrateurs
- Bouton de suppression

### 3. Supprimer un Utilisateur

- Bouton trash pour chaque utilisateur
- Confirmation avant suppression
- Via Edge Function sécurisée

---

## ⚙️ Configuration Requise - Edge Function

### Pourquoi une Edge Function ?

La création/suppression d'utilisateurs nécessite la `service_role_key` qui **ne doit JAMAIS** être exposée côté client.

**Solution** : Edge Function Supabase qui s'exécute côté serveur.

### Créer l'Edge Function

```bash
# 1. Créer la function
supabase functions new admin-users

# 2. Éditer supabase/functions/admin-users/index.ts
```

**Code de l'Edge Function** :
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { action, data } = await req.json()

  switch (action) {
    case 'create-user':
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: data.user_metadata
      })
      return new Response(JSON.stringify({ success: !error, error }))

    case 'list-users':
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      return new Response(JSON.stringify({ users }))

    case 'delete-user':
      await supabaseAdmin.auth.admin.deleteUser(data.userId)
      return new Response(JSON.stringify({ success: true }))

    default:
      return new Response(JSON.stringify({ error: 'Action inconnue' }), { status: 400 })
  }
})
```

**Déployer** :
```bash
supabase functions deploy admin-users
```

### Mettre à Jour le Frontend

Dans `src/pages/Admin.tsx`, remplacer l'URL :
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      action: 'create-user',
      data: { ...newUser }
    })
  }
);
```

---

## 🎨 Design de la Page Admin

### Card de Création
- Header gradient teal
- Formulaire complet
- Warning pour la configuration
- Boutons d'action

### Liste des Utilisateurs
- Avatar circulaire avec initiales
- Nom, email, rôle
- Badge "Admin" pour les administrateurs
- Bouton de suppression

### Card "Administration" dans Dashboard
- Gradient jaune/orange (couleur admin)
- Icône bouclier
- Visible uniquement pour les admins
- Lien vers `/admin`

---

## 🔒 Sécurité

### Protections

1. **Vérification côté client** :
   ```typescript
   if (!isAdmin) {
     return <AccessDenied />;
   }
   ```

2. **Vérification côté serveur** (Edge Function) :
   ```typescript
   const { data: { user } } = await supabaseAdmin.auth.getUser(token)
   if (!user.user_metadata.is_admin) {
     return new Response('Forbidden', { status: 403 })
   }
   ```

3. **Service Role Key** :
   - Jamais exposée au client
   - Utilisée uniquement dans l'Edge Function
   - Variables d'environnement Supabase

---

## 🚀 Flux Complet

### Premier Utilisateur (Bootstrap)

1. **Créer manuellement dans Supabase Dashboard** :
   - Email + Mot de passe
   - Ajouter `"is_admin": true` dans user_metadata

2. **Se connecter** :
   - Aller sur http://localhost:5173/login
   - Email + Mot de passe

3. **Accéder à l'admin** :
   - Dashboard → Card "Administration"
   - Ou directement : http://localhost:5173/admin

### Utilisateurs Suivants

1. **Admin se connecte**
2. **Va sur /admin**
3. **Crée des utilisateurs** via le formulaire
4. **Choisit** s'ils sont admins ou non

---

## 📊 Résumé

✅ **Page Register supprimée**
✅ **Page Admin créée** (`/admin`)
✅ **Système de rôles** (is_admin)
✅ **Formulaire de création** d'utilisateur
✅ **Card Admin** dans Dashboard
✅ **Protection** accès Admin
✅ **Documentation** Edge Function
⏳ **Edge Function** à déployer

---

## 🎯 Prochaine Étape

**Configurer l'Edge Function Supabase** pour que la création d'utilisateurs fonctionne réellement.

Voir le code de l'Edge Function ci-dessus et le déployer avec :
```bash
supabase functions deploy admin-users
```

---

**L'infrastructure admin est prête !** 🎊
