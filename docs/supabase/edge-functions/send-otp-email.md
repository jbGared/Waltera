# Edge Function: send-otp-email

## Description

Envoi d'emails de verification OTP (One-Time Password) pour l'authentification des utilisateurs WALTERA. Genere un email HTML responsive avec le code de verification.

---

## Informations

| Attribut | Valeur |
|----------|--------|
| **Slug** | `send-otp-email` |
| **Statut** | Production |
| **Authentification** | Aucune (verify_jwt: false) |
| **Runtime** | Deno (Supabase Edge) |
| **Service Email** | Resend |

---

## Fonctionnalites

- Envoi d'emails HTML responsive
- Template professionnel aux couleurs WALTERA
- Support du format texte brut (fallback)
- Personnalisation du delai d'expiration
- Code OTP mis en evidence dans l'email

---

## API

### Endpoint

```
POST /functions/v1/send-otp-email
```

### Headers

| Header | Valeur | Requis |
|--------|--------|--------|
| `Content-Type` | `application/json` | Oui |

### Body (JSON)

| Parametre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `email` | string | Oui | Adresse email du destinataire |
| `code` | string | Oui | Code OTP a envoyer |
| `expiresInMinutes` | number | Oui | Duree de validite du code en minutes |

### Exemple de Requete

```bash
curl -X POST "https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/send-otp-email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "utilisateur@example.com",
    "code": "847291",
    "expiresInMinutes": 10
  }'
```

### Reponse (Succes)

```json
{
  "success": true,
  "messageId": "abc123-def456-..."
}
```

### Reponse (Erreur)

```json
{
  "error": "Email et code requis"
}
```

---

## Format de l'Email

### Apercu

```
┌─────────────────────────────────────────────┐
│              WALTERA                         │
│         CONSEIL & ASSURANCES                │
├─────────────────────────────────────────────┤
│                                              │
│  Code de verification                        │
│                                              │
│  Voici votre code de verification pour      │
│  acceder a votre espace WALTERA :           │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │           847291                     │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  Ce code expire dans 10 minutes.            │
│                                              │
│  Si vous n'avez pas demande ce code,        │
│  vous pouvez ignorer cet email.             │
│                                              │
├─────────────────────────────────────────────┤
│  (c) 2026 Waltera. Tous droits reserves.   │
│  Cet email a ete envoye automatiquement.    │
└─────────────────────────────────────────────┘
```

### Styles

- **Couleur principale** : `#5A949E` (gradient vers `#3E7A84`)
- **Code OTP** : Police monospace, 36px, espacement 8px
- **Responsive** : Compatible mobile et desktop

---

## Integration

### Depuis l'Application React

```typescript
// src/services/authService.ts
export async function sendOTPEmail(email: string, code: string): Promise<void> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/send-otp-email`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        code,
        expiresInMinutes: 10
      })
    }
  );

  if (!response.ok) {
    throw new Error('Erreur envoi OTP');
  }
}
```

### Flux d'Authentification

```
┌─────────────────────────────────────────────────────────────┐
│                     FLUX OTP                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Utilisateur entre son email                             │
│     └─> Formulaire de connexion                             │
│                                                              │
│  2. Application genere un code OTP                          │
│     └─> Code aleatoire 6 chiffres                           │
│     └─> Stockage en base avec expiration                    │
│                                                              │
│  3. Appel Edge Function send-otp-email                      │
│     └─> Envoi email via Resend                              │
│                                                              │
│  4. Utilisateur saisit le code                              │
│     └─> Verification en base                                │
│     └─> Connexion si valide                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Cle API Resend pour l'envoi d'emails |

### Email Expediteur

```
From: WALTERA <noreply@waltera.gared.fr>
Subject: 847291 - Votre code de verification WALTERA
```

---

## Troubleshooting

### Erreur 400 (Email et code requis)

**Cause** : Parametres manquants dans le body.

**Solution** : Verifier que `email` et `code` sont fournis.

### Erreur 500 (Erreur envoi email)

**Cause** : Probleme avec l'API Resend.

**Solution** : Verifier la cle API Resend et les logs.

### Email non recu

1. Verifier les spams du destinataire
2. Verifier que l'email est valide
3. Verifier les logs Supabase : `supabase functions logs send-otp-email`
4. Verifier le statut dans le dashboard Resend

### Domaine expediteur

L'email doit etre envoye depuis un domaine verifie dans Resend :
- Domaine : `waltera.gared.fr`
- Verification : DNS SPF, DKIM, DMARC

---

## Securite

### Bonnes Pratiques

- Le code OTP doit avoir une duree de vie limitee (recommande : 10 minutes)
- Le code doit etre a usage unique
- Limiter le nombre de tentatives de verification
- Logger les tentatives echouees

### Rate Limiting

Resend a une limite de 2 requetes/seconde. En cas de nombreuses demandes simultanees, implementer un rate limiting cote application.

---

## Voir Aussi

- [send-ccn-alerts-email](./send-ccn-alerts-email.md) - Envoi des alertes CCN

---

**Derniere mise a jour** : 16 janvier 2026
**Version** : 1.0.0
