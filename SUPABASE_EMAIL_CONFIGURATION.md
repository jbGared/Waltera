# Configuration de l'email de réinitialisation dans Supabase

## 📋 Mode opératoire complet

### Étape 1 : Accéder au Dashboard Supabase

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet WALTERA

### Étape 2 : Configuration des templates d'email

1. Dans la sidebar gauche, cliquez sur **"Authentication"** (icône de cadenas)
2. Dans le sous-menu, cliquez sur **"Email Templates"**

### Étape 3 : Modifier le template "Reset Password"

1. Dans la liste des templates, trouvez **"Reset Password"**
2. Cliquez sur **"Edit"** ou sur le template pour l'ouvrir

### Étape 4 : Copier le nouveau template HTML

1. **Supprimez** tout le contenu existant du template
2. **Copiez** tout le contenu du fichier `supabase-email-template.html`
3. **Collez** le contenu dans l'éditeur de template Supabase

### Étape 5 : Vérification des variables

Assurez-vous que les variables suivantes sont correctement configurées :

- `{{ .ConfirmationURL }}` - URL de réinitialisation (NE PAS MODIFIER)
- Cette variable est automatiquement remplacée par Supabase avec le lien de réinitialisation

### Étape 6 : Configuration du sujet de l'email

1. Dans le champ **"Subject"**, entrez :
   ```
   Réinitialisation de votre mot de passe WALTERA
   ```

### Étape 7 : Configuration de l'URL de redirection

1. Allez dans **"Authentication"** > **"URL Configuration"**
2. Dans **"Site URL"**, assurez-vous d'avoir : `https://votre-domaine.com`
3. Dans **"Redirect URLs"**, ajoutez :
   ```
   https://votre-domaine.com/reset-password
   http://localhost:5173/reset-password
   http://localhost:5174/reset-password
   ```
   (Ajoutez toutes les URLs où votre application peut être accessible)

### Étape 8 : Configuration SMTP (si nécessaire)

Si vous utilisez un serveur SMTP personnalisé :

1. Allez dans **"Project Settings"** > **"Authentication"**
2. Scrollez jusqu'à **"SMTP Settings"**
3. Activez **"Enable Custom SMTP"**
4. Configurez vos paramètres SMTP :
   - **Host** : smtp.votre-provider.com
   - **Port** : 587 (ou 465 pour SSL)
   - **Username** : votre-email@waltera.fr
   - **Password** : votre-mot-de-passe-smtp
   - **Sender email** : noreply@waltera.fr
   - **Sender name** : WALTERA

### Étape 9 : Test de l'envoi

1. Retournez dans **"Email Templates"** > **"Reset Password"**
2. Cliquez sur **"Send test email"**
3. Entrez votre adresse email de test
4. Vérifiez la réception et l'affichage de l'email

### Étape 10 : Sauvegarder les modifications

1. Cliquez sur **"Save"** pour enregistrer le template
2. Les modifications sont appliquées immédiatement

## ⚙️ Variables disponibles dans Supabase

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | URL complète de réinitialisation avec token |
| `{{ .Token }}` | Token de réinitialisation seul |
| `{{ .Email }}` | Email du destinataire |
| `{{ .SiteURL }}` | URL de base de votre site |

## 🔒 Paramètres de sécurité recommandés

1. **Durée de validité du lien** :
   - Par défaut : 3600 secondes (1 heure)
   - Modifiable dans : **"Authentication"** > **"Settings"** > **"Password Recovery"**

2. **Rate limiting** :
   - Limitez le nombre de demandes par IP
   - Configuration dans : **"Authentication"** > **"Settings"** > **"Rate Limits"**

## 🎨 Personnalisation du template

Le template fourni inclut :
- ✅ Design responsive (mobile-friendly)
- ✅ Logo WALTERA stylisé
- ✅ Couleurs de la marque (#3E7A84 et #5A949E)
- ✅ Conseils de sécurité pour le mot de passe
- ✅ Lien alternatif si le bouton ne fonctionne pas
- ✅ Footer avec contact support

### Modifications possibles :

1. **Changer les couleurs** :
   - Couleur principale : Remplacez `#3E7A84` par votre couleur
   - Gradient header : Modifiez `linear-gradient(135deg, #5A949E 0%, #3E7A84 100%)`

2. **Modifier le logo** :
   - Remplacez le div avec "W" par votre logo en base64 ou URL

3. **Ajuster le texte** :
   - Personnalisez les messages selon votre ton de marque
   - Modifiez l'email de support : `support@waltera.fr`

## 📱 Test multi-clients email

Testez l'affichage sur différents clients email :
- ✅ Gmail (Web & Mobile)
- ✅ Outlook (Web & Desktop)
- ✅ Apple Mail
- ✅ Thunderbird
- ✅ Yahoo Mail

## 🚨 Troubleshooting

### L'email n'arrive pas :
1. Vérifiez les **spam/courriers indésirables**
2. Vérifiez la configuration SMTP
3. Consultez les logs dans **"Authentication"** > **"Logs"**

### Le lien ne fonctionne pas :
1. Vérifiez que l'URL de redirection est bien configurée
2. Assurez-vous que `/reset-password` est accessible publiquement
3. Vérifiez que le token n'a pas expiré (1 heure par défaut)

### Problème d'affichage :
1. Testez avec un outil comme Litmus ou Email on Acid
2. Simplifiez le CSS si nécessaire
3. Utilisez des tables pour la structure (compatibilité Outlook)

## 📞 Support

Pour toute question sur la configuration :
- Documentation Supabase : https://supabase.com/docs/guides/auth/auth-email
- Support Supabase : support@supabase.com

---

**Note importante** : Après configuration, testez toujours le flux complet de réinitialisation en production pour vous assurer que tout fonctionne correctement.