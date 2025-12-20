#!/bin/bash
# ============================================
# Script de Mise à Jour de l'Application
# ============================================
# Ce script met à jour l'application sur le serveur

set -e  # Arrêter en cas d'erreur

echo "🔄 =========================================="
echo "🔄 MISE À JOUR DE L'APPLICATION"
echo "🔄 =========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
APP_DIR="/var/www/fruits-legumes"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Vérifier que le dossier existe
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Le dossier $APP_DIR n'existe pas${NC}"
    echo "Exécutez d'abord deploy-initial.sh"
    exit 1
fi

cd $APP_DIR

# ============================================
# ÉTAPE 1: Sauvegarde
# ============================================
echo -e "${YELLOW}💾 Étape 1: Sauvegarde...${NC}"

# Sauvegarder la base de données
if [ -d "$BACKEND_DIR" ]; then
    cd $BACKEND_DIR
    if [ -f .env ]; then
        source .env
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        echo "Création d'une sauvegarde de la base de données..."
        PGPASSWORD=$(echo $DATABASE_URL | grep -oP '://[^:]+:\K[^@]+') pg_dump -h localhost -U $(echo $DATABASE_URL | grep -oP '://[^:]+:\K[^@]+' | cut -d: -f1) fruits_legumes_db > "../$BACKUP_FILE" 2>/dev/null || echo "Sauvegarde de la base de données ignorée (vérifiez les permissions)"
    fi
fi

echo -e "${GREEN}✅ Sauvegarde effectuée${NC}"
echo ""

# ============================================
# ÉTAPE 2: Récupération du code
# ============================================
echo -e "${YELLOW}📥 Étape 2: Récupération du code...${NC}"

cd $APP_DIR

if [ -d ".git" ]; then
    echo "Récupération des dernières modifications depuis Git..."
    git fetch origin
    git pull origin main || git pull origin master
    
    # Afficher les changements
    echo ""
    echo "Derniers commits:"
    git log --oneline -5
else
    echo -e "${YELLOW}⚠️  Ce n'est pas un dépôt Git. Mettez à jour le code manuellement.${NC}"
    read -p "Appuyez sur Entrée une fois le code mis à jour..."
fi

echo -e "${GREEN}✅ Code mis à jour${NC}"
echo ""

# ============================================
# ÉTAPE 3: Mise à jour des dépendances Backend
# ============================================
echo -e "${YELLOW}📦 Étape 3: Mise à jour des dépendances backend...${NC}"

cd $BACKEND_DIR
npm install --production

echo -e "${GREEN}✅ Dépendances backend mises à jour${NC}"
echo ""

# ============================================
# ÉTAPE 4: Mise à jour Prisma
# ============================================
echo -e "${YELLOW}🔄 Étape 4: Mise à jour Prisma...${NC}"

cd $BACKEND_DIR
npx prisma generate
npx prisma migrate deploy

echo -e "${GREEN}✅ Prisma mis à jour${NC}"
echo ""

# ============================================
# ÉTAPE 5: Mise à jour des dépendances Frontend
# ============================================
echo -e "${YELLOW}📦 Étape 5: Mise à jour des dépendances frontend...${NC}"

cd $FRONTEND_DIR
npm install

echo -e "${GREEN}✅ Dépendances frontend mises à jour${NC}"
echo ""

# ============================================
# ÉTAPE 6: Rebuild du frontend
# ============================================
echo -e "${YELLOW}🏗️  Étape 6: Rebuild du frontend...${NC}"

cd $FRONTEND_DIR
npm run build

echo -e "${GREEN}✅ Frontend rebuildé${NC}"
echo ""

# ============================================
# ÉTAPE 7: Redémarrage de l'application
# ============================================
echo -e "${YELLOW}⚡ Étape 7: Redémarrage de l'application...${NC}"

cd $BACKEND_DIR

# Redémarrer avec PM2
if pm2 list | grep -q "fruits-legumes-backend"; then
    pm2 restart fruits-legumes-backend
    pm2 save
    echo -e "${GREEN}✅ Application redémarrée${NC}"
else
    echo -e "${YELLOW}⚠️  L'application n'est pas démarrée avec PM2${NC}"
    echo "Démarrage de l'application..."
    pm2 start ecosystem.config.js || pm2 start server.js --name fruits-legumes-backend
    pm2 save
fi

# Attendre un peu pour que l'application démarre
sleep 3

# Vérifier le statut
pm2 status

echo ""

# ============================================
# ÉTAPE 8: Rechargement de Nginx
# ============================================
echo -e "${YELLOW}🌐 Étape 8: Rechargement de Nginx...${NC}"

sudo nginx -t && sudo systemctl reload nginx
echo -e "${GREEN}✅ Nginx rechargé${NC}"
echo ""

# ============================================
# VÉRIFICATION
# ============================================
echo -e "${YELLOW}🔍 Vérification de l'application...${NC}"

# Vérifier que le backend répond
sleep 2
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend opérationnel${NC}"
else
    echo -e "${RED}⚠️  Le backend ne répond pas. Vérifiez les logs: pm2 logs${NC}"
fi

echo ""

# ============================================
# RÉSUMÉ
# ============================================
echo -e "${GREEN}=========================================="
echo -e "✅ MISE À JOUR TERMINÉE!"
echo -e "==========================================${NC}"
echo ""
echo "📋 Commandes utiles:"
echo "   - Voir les logs: pm2 logs fruits-legumes-backend"
echo "   - Voir les logs en temps réel: pm2 logs fruits-legumes-backend --lines 50"
echo "   - Redémarrer: pm2 restart fruits-legumes-backend"
echo "   - Status: pm2 status"
echo ""
echo -e "${GREEN}🎉 L'application est à jour!${NC}"
echo ""
