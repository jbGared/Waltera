# Démarrage Rapide - Tarificateur Santé WALTERA

## Lancement immédiat

```bash
# 1. Installer les dépendances (si pas déjà fait)
npm install

# 2. Lancer le serveur de développement
npm run dev

# 3. Ouvrir dans le navigateur
# http://localhost:5173
```

## Accès au tarificateur

### Option 1 : Depuis la page d'accueil
1. Ouvrir `http://localhost:5173`
2. Cliquer sur "Accéder au Tarificateur"

### Option 2 : URL directe
- Ouvrir `http://localhost:5173/tarificateur`

## Test rapide du formulaire

### Exemple 1 : Senior seul à Paris (1 minute)

1. **Gamme** : Sélectionner "Santé Seniors"
2. **Code postal** : `75001`
3. **Date d'effet** : Date du jour (pré-remplie)
4. **Commission** : Laisser 10%
5. **Assuré** : Date de naissance `15/03/1958`
6. **Option** : Sélectionner "Option 4"

→ **Le tarif s'affiche automatiquement à droite !**

### Exemple 2 : Famille TNS à Lyon (2 minutes)

1. **Gamme** : Sélectionner "TNS Formules"
2. **Code postal** : `69001`
3. **Date d'effet** : Date du jour
4. **Commission** : Changer à 15%
5. **Assuré** : Date de naissance `20/06/1983`
6. **Conjoint** : Cocher la case, date `10/09/1985`
7. **Enfants** :
   - Cliquer "Ajouter un enfant" → date `05/04/2013`
   - Cliquer "Ajouter un enfant" → date `22/11/2017`
8. **Option** : Sélectionner "Option 3"
9. **Surcomplémentaire** : Cocher la case

→ **Le tarif total de la famille s'affiche avec le détail par personne !**

### Exemple 3 : Couple Senior Plus Alsace (1 minute)

1. **Gamme** : Sélectionner "Santé Seniors Plus"
2. **Code postal** : `67000`
3. **Commission** : Changer à 20%
4. **Assuré** : Date de naissance `10/01/1953`
5. **Conjoint** : Cocher la case, date `25/05/1955`
6. **Option** : Sélectionner "Option 5"
7. **Surcomplémentaire** : Cocher
8. **Renfort Hospitalisation** : Cocher (uniquement visible pour Seniors Plus)

→ **Le tarif avec tous les compléments s'affiche !**

## Fonctionnalités à tester

### Calcul en temps réel
- ✅ Modifier n'importe quel champ → le tarif se recalcule automatiquement
- ✅ Pas besoin de cliquer sur un bouton "Calculer"

### Validations
- ❌ Code postal avec moins de 5 chiffres → message d'erreur
- ❌ Surcomplémentaire avec option 1 ou 2 → case grisée (désactivée)
- ✅ Surcomplémentaire avec option 3+ → case active
- ✅ Renfort hospi visible uniquement pour "Santé Seniors Plus"

### Composition du foyer
- ✅ Ajouter/supprimer des enfants dynamiquement
- ✅ Activer/désactiver le conjoint
- ✅ TNS "Assuré seul" se désactive si conjoint/enfants ajoutés

### Affichage des résultats
- ✅ Tarif mensuel en grand format
- ✅ Nom du produit calculé automatiquement
- ✅ Zone tarifaire déterminée
- ✅ Détail par bénéficiaire avec âges
- ✅ Décomposition : base + surco + renfort

## Tests unitaires

```bash
# Lancer tous les tests
npm run test

# Voir les tests dans une interface
npm run test:ui

# Exécuter les tests une fois
npm run test:run
```

**Résultat attendu** : 25 tests qui passent ✅

## Structure du résultat

Quand le tarif s'affiche, vous voyez :

```
┌─────────────────────────┐
│   Tarif Mensuel         │
│      XXX.XX €           │  ← En grand, mis en valeur
│      par mois           │
├─────────────────────────┤
│ Produit: ...            │  ← Nom automatique
│ Zone: Z01/Z02/AM        │  ← Zone déterminée
├─────────────────────────┤
│ Détails par bénéficiaire│
│                         │
│ Assuré (XX ans)         │
│ - Base: XX.XX €         │
│ - Surco: XX.XX €        │
│ - Renfort: XX.XX €      │
│ - Total: XX.XX €        │
│                         │
│ Conjoint (XX ans)       │
│ - ...                   │
│                         │
│ Enfant 1 (XX ans)       │
│ - ...                   │
└─────────────────────────┘
```

## Codes postaux de test

Pour tester les différentes zones :

### Zone AM (Alsace-Moselle)
- 57000, 67000, 68000

### Zone Z02 (Grandes villes)
- 75001 (Paris)
- 69001 (Lyon)
- 13001 (Marseille)
- 33000 (Bordeaux)

### Zone Z01 (Reste)
- 44000 (Nantes)
- 29000 (Brest)
- Tout autre département

## Commandes utiles

```bash
# Développement
npm run dev              # Lancer le serveur de dev

# Tests
npm run test             # Tests en mode watch
npm run test:ui          # Interface UI pour les tests
npm run test:run         # Exécuter les tests une fois

# Build
npm run build            # Compiler pour la production
npm run preview          # Prévisualiser le build

# Qualité de code
npm run typecheck        # Vérifier TypeScript
npm run lint             # Vérifier le code
```

## Dépannage rapide

### Le serveur ne démarre pas
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Le tarif ne s'affiche pas
- Vérifier que le code postal a 5 chiffres
- Vérifier que la date de naissance de l'assuré est remplie
- Vérifier la console du navigateur (F12) pour les erreurs

### Les tests échouent
```bash
# Vérifier que vitest est installé
npm install --save-dev vitest @vitest/ui

# Relancer les tests
npm run test:run
```

## Documentation complète

- `README_TARIFICATEUR.md` - Vue d'ensemble complète
- `IMPLEMENTATION.md` - Documentation technique du module
- `FORMULAIRE_DEVIS.md` - Documentation du formulaire
- `src/services/tarificateur/README.md` - API du calculateur

## Support

Pour toute question :
1. Consulter la documentation ci-dessus
2. Vérifier les tests unitaires dans `src/services/tarificateur/*.test.ts`
3. Consulter les exemples dans `src/services/tarificateur/example.ts`

## Prochaines étapes

Une fois familiarisé avec le tarificateur :
1. Personnaliser le design (couleurs, layout)
2. Ajouter la sauvegarde des devis (Supabase)
3. Créer l'export PDF
4. Ajouter l'envoi par email
5. Intégrer dans le site web public de Waltera

---

**Prêt à commencer ?** → `npm run dev` puis ouvrir `http://localhost:5173` 🚀
