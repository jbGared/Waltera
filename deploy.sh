#!/bin/bash

# Script de déploiement multi-environnement pour WALTERA
# Usage: ./deploy.sh [dev|staging|prod]

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier l'argument
if [ -z "$1" ]; then
    echo -e "${RED}❌ Erreur: Environnement non spécifié${NC}"
    echo ""
    echo "Usage: ./deploy.sh [dev|staging|prod]"
    echo ""
    echo "Exemples:"
    echo "  ./deploy.sh dev       # Déployer sur l'environnement de développement"
    echo "  ./deploy.sh staging   # Déployer sur l'environnement de staging"
    echo "  ./deploy.sh prod      # Déployer sur l'environnement de production"
    exit 1
fi

ENV=$1

# Valider l'environnement
if [ "$ENV" != "dev" ] && [ "$ENV" != "staging" ] && [ "$ENV" != "prod" ]; then
    echo -e "${RED}❌ Environnement invalide: $ENV${NC}"
    echo "Environnements valides: dev, staging, prod"
    exit 1
fi

# Définir les variables selon l'environnement
case "$ENV" in
    dev)
        PROJECT_ID="waltera-dev"
        ENV_FILE=".env.dev"
        URL="https://waltera-dev.web.app"
        ;;
    staging)
        PROJECT_ID="waltera-staging"
        ENV_FILE=".env.staging"
        URL="https://waltera-staging.web.app"
        ;;
    prod)
        PROJECT_ID="waltera-prod"
        ENV_FILE=".env.prod"
        URL="https://waltera-prod.web.app"
        ;;
esac

echo -e "${BLUE}🚀 Déploiement WALTERA - Environnement: ${YELLOW}$ENV${NC}"
echo "===================================="
echo ""

# Vérifier que le fichier .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Fichier $ENV_FILE introuvable${NC}"
    exit 1
fi

# Copier le fichier .env approprié
echo -e "${BLUE}📋 Configuration de l'environnement...${NC}"
cp "$ENV_FILE" .env.local
echo -e "${GREEN}✅ Fichier $ENV_FILE copié vers .env.local${NC}"
echo ""

# Sélectionner le projet Firebase
echo -e "${BLUE}🔥 Sélection du projet Firebase: $PROJECT_ID${NC}"
firebase use "$ENV"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de la sélection du projet Firebase${NC}"
    echo "Veuillez vous reconnecter avec: firebase login --reauth"
    exit 1
fi
echo ""

# Build du projet
echo -e "${BLUE}📦 Build du projet...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build réussi !${NC}"
    echo ""

    # Déploiement
    echo -e "${BLUE}🔥 Déploiement sur Firebase Hosting ($ENV)...${NC}"
    firebase deploy --only hosting

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Déploiement réussi !${NC}"
        echo -e "${GREEN}🌐 Votre site est accessible sur : $URL${NC}"
        echo ""
        echo -e "${YELLOW}📊 Environnement : $ENV${NC}"
        echo -e "${YELLOW}🔧 Project ID : $PROJECT_ID${NC}"
    else
        echo ""
        echo -e "${RED}❌ Erreur lors du déploiement${NC}"
        echo "Veuillez vous reconnecter avec : firebase login --reauth"
        exit 1
    fi
else
    echo -e "${RED}❌ Erreur lors du build${NC}"
    exit 1
fi