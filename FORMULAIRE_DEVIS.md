# Formulaire de Devis Santé - Implémentation

## Résumé

Un formulaire complet de devis santé a été créé avec calcul en temps réel des tarifs.

## Fichiers créés

### Composants UI (7 fichiers)
- `src/components/ui/input.tsx` - Champ de saisie
- `src/components/ui/label.tsx` - Label de formulaire
- `src/components/ui/button.tsx` - Bouton
- `src/components/ui/checkbox.tsx` - Case à cocher
- `src/components/ui/select.tsx` - Liste déroulante
- `src/components/ui/card.tsx` - Carte/conteneur
- `src/components/ui/sonner.tsx` - Notifications toast

### Composant principal
- `src/components/DevisForm.tsx` - Formulaire de devis complet avec calcul en temps réel

### Page
- `src/pages/Tarificateur.tsx` - Page dédiée au tarificateur
- `src/pages/index.tsx` - Route ajoutée : `/tarificateur`

## Fonctionnalités du formulaire

### Sélections de base
- ✅ **Gamme** : Santé Seniors, Santé Seniors Plus, TNS Formules
- ✅ **Code postal** : Validation 5 chiffres avec message d'erreur
- ✅ **Date d'effet** : Sélecteur de date
- ✅ **Commission** : 10%, 15%, 20%

### Composition du foyer
- ✅ **Assuré** : Date de naissance obligatoire
- ✅ **TNS Assuré seul** : Checkbox (désactivée si conjoint/enfants présents)
- ✅ **Conjoint** : Checkbox + date de naissance (optionnel)
- ✅ **Enfants** : Ajout/suppression dynamique avec dates de naissance

### Options de couverture
- ✅ **Option 1-6** : Liste déroulante (économique → premium)
- ✅ **Surcomplémentaire** : Checkbox désactivée si option < 3
- ✅ **Renfort hospi** : Visible uniquement pour Santé Seniors Plus

### Calcul en temps réel
- ✅ **Automatique** : Le tarif se recalcule à chaque modification du formulaire
- ✅ **Validation** : Messages d'erreur explicites si données invalides

## Affichage des résultats

### Tarif principal
- Montant mensuel en grand et mis en valeur
- Affichage en euros avec 2 décimales

### Informations produit
- Nom du produit calculé automatiquement
- Zone tarifaire déterminée automatiquement

### Détails par bénéficiaire
Pour chaque bénéficiaire (assuré, conjoint, enfants) :
- Nom et âge
- Tarif de base
- Surcomplémentaire (si applicable)
- Renfort hospitalisation (si applicable)
- Total individuel

### Notes
- Droits ACPS inclus (1.50€/mois)
- Droit d'entrée unique (10.00€) mentionné

## Utilisation

### Accès à la page

1. **URL directe** : `http://localhost:5173/tarificateur`
2. **Depuis l'application** : Navigation vers `/tarificateur`

### Exemple de test

1. Sélectionner "Santé Seniors"
2. Saisir le code postal "75001" (Paris)
3. Définir la date d'effet
4. Saisir la date de naissance de l'assuré (ex: 15/03/1958)
5. Sélectionner l'option 4
6. Le tarif s'affiche automatiquement

### Exemple avec famille

1. Sélectionner "TNS Formules"
2. Code postal "69001" (Lyon)
3. Date de naissance assuré : 20/06/1983
4. Cocher "Ajouter un conjoint", date : 10/09/1985
5. Ajouter 2 enfants : 05/04/2013 et 22/11/2017
6. Option 3 + Surcomplémentaire
7. Le tarif total de la famille s'affiche

## Architecture technique

### État du formulaire
```typescript
interface FormData {
  gamme: Gamme;
  codePostal: string;
  dateEffet: string;
  assureNaissance: string;
  assureSeul: boolean;
  conjointNaissance: string;
  enfants: string[];
  option: Option;
  surcomplementaire: boolean;
  renfortHospi: boolean;
  commission: Commission;
}
```

### Calcul automatique
Le formulaire utilise un `useEffect` qui surveille les changements de `formData` et déclenche automatiquement le calcul dès que :
- Le code postal est valide (5 chiffres)
- La date de naissance de l'assuré est renseignée
- La date d'effet est définie

### Gestion des erreurs
Les erreurs de validation sont affichées dans une zone dédiée en haut des résultats avec un style distinctif (fond rouge clair).

## Responsive Design

- **Desktop** : 2 colonnes (formulaire à gauche, résultats à droite)
- **Mobile** : 1 colonne (formulaire puis résultats en dessous)

## Lancer l'application

```bash
# Démarrer le serveur de développement
npm run dev

# Accéder au tarificateur
# Ouvrir http://localhost:5173/tarificateur dans le navigateur
```

## Points d'intégration

### Intégration dans une autre page
```tsx
import DevisForm from '@/components/DevisForm';

function MaPage() {
  return (
    <div>
      <h1>Ma page</h1>
      <DevisForm />
    </div>
  );
}
```

### Personnalisation
Le composant `DevisForm` peut être facilement personnalisé en modifiant :
- Les couleurs via Tailwind CSS
- Le layout (responsive breakpoints)
- Les messages d'erreur
- Les labels de formulaire

## Prochaines améliorations possibles

1. **Sauvegarde des devis** : Stocker les devis calculés dans Supabase
2. **Export PDF** : Générer un document PDF du devis
3. **Email** : Envoyer le devis par email au client
4. **Historique** : Afficher l'historique des devis calculés
5. **Comparateur** : Comparer plusieurs options/gammes côte à côte
6. **URL avec paramètres** : Pré-remplir le formulaire via l'URL
7. **Mode collaborateur vs client** : Adapter l'interface selon l'utilisateur

## Validations implémentées

- ✅ Code postal : 5 chiffres requis
- ✅ Dates : Format valide requis
- ✅ Surco : Désactivée si option < 3
- ✅ Renfort hospi : Visible uniquement pour Seniors Plus
- ✅ Assuré seul TNS : Désactivé si conjoint ou enfants
- ✅ Messages d'erreur contextuels

## Style et UX

- Design moderne avec Radix UI + Tailwind CSS
- Icônes Lucide React
- Feedback visuel immédiat
- États désactivés clairement identifiables
- Espacements cohérents
- Hiérarchie visuelle claire
