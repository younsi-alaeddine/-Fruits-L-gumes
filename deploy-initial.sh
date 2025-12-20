#!/bin/bash
# ============================================
# Script de Déploiement Initial sur Serveur
# ============================================
# Ce script installe et configure l'application sur un nouveau serveur

set -e  # Arrêter en cas d'erreur

echo "🚀 =========================================="
echo "🚀 DÉPLOIEMENT INITIAL DE L'APPLICATION"
echo "🚀 =========================================="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
APP_DIR="/var/www/fruits-legumes"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# ============================================
# ÉTAPE 1: Vérification des prérequis
# ============================================
echo -e "${YELLOW}📋 Étape 1: Vérification des prérequis...${NC}"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    echo "Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js installé: $NODE_VERSION${NC}"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm installé: $(npm -v)${NC}"

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL n'est pas installé${NC}"
    echo "Installation de PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
fi
echo -e "${GREEN}✅ PostgreSQL installé${NC}"

# Vérifier PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installation de PM2..."
    sudo npm install -g pm2
fi
echo -e "${GREEN}✅ PM2 installé${NC}"

# Vérifier Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installation de Nginx..."
    sudo apt-get install -y nginx
fi
echo -e "${GREEN}✅ Nginx installé${NC}"

echo ""

# ============================================
# ÉTAPE 2: Création des dossiers
# ============================================
echo -e "${YELLOW}📁 Étape 2: Création des dossiers...${NC}"

sudo mkdir -p $APP_DIR
sudo mkdir -p $BACKEND_DIR
sudo mkdir -p $FRONTEND_DIR
sudo mkdir -p $BACKEND_DIR/uploads/products

# Donner les permissions
sudo chown -R $USER:$USER $APP_DIR
echo -e "${GREEN}✅ Dossiers créés${NC}"
echo ""

# ============================================
# ÉTAPE 3: Cloner ou copier le projet
# ============================================
echo -e "${YELLOW}📥 Étape 3: Récupération du code...${NC}"

# Si le dossier existe déjà, faire un pull
if [ -d "$APP_DIR/.git" ]; then
    echo "Mise à jour du code existant..."
    cd $APP_DIR
    git pull origin main || git pull origin master
else
    echo "⚠️  Le projet doit être cloné manuellement ou copié dans $APP_DIR"
    echo "Exemple: git clone <votre-repo> $APP_DIR"
    read -p "Appuyez sur Entrée une fois le code copié..."
fi

echo -e "${GREEN}✅ Code récupéré${NC}"
echo ""

# ============================================
# ÉTAPE 4: Configuration de la base de données
# ============================================
echo -e "${YELLOW}🗄️  Étape 4: Configuration de la base de données...${NC}"

# Créer la base de données si elle n'existe pas
sudo -u postgres psql -c "CREATE DATABASE fruits_legumes_db;" 2>/dev/null || echo "Base de données existe déjà"

# Créer un utilisateur PostgreSQL si nécessaire
read -p "Nom d'utilisateur PostgreSQL (par défaut: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Mot de passe PostgreSQL: " DB_PASSWORD
echo ""

# ============================================
# ÉTAPE 5: Configuration des variables d'environnement
# ============================================
echo -e "${YELLOW}⚙️  Étape 5: Configuration des variables d'environnement...${NC}"

cd $BACKEND_DIR

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Fichier .env créé à partir de .env.example"
    else
        cat > .env << EOF
# Base de données
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/fruits_legumes_db?schema=public"

# JWT
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRES_IN="7d"

# Serveur
PORT=5000
NODE_ENV=production
HOST=0.0.0.0

# Frontend URL (remplacer par votre domaine)
FRONTEND_URL="https://votre-domaine.com"

# Uploads
UPLOAD_DIR="./uploads"

# Jobs
ENABLE_JOBS=true
EOF
        echo "Fichier .env créé"
    fi
    
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Modifiez le fichier $BACKEND_DIR/.env avec vos paramètres${NC}"
    read -p "Appuyez sur Entrée après avoir configuré le fichier .env..."
fi

echo -e "${GREEN}✅ Variables d'environnement configurées${NC}"
echo ""

# ============================================
# ÉTAPE 6: Installation des dépendances
# ============================================
echo -e "${YELLOW}📦 Étape 6: Installation des dépendances...${NC}"

# Backend
echo "Installation des dépendances backend..."
cd $BACKEND_DIR
npm install --production

# Frontend
echo "Installation des dépendances frontend..."
cd $FRONTEND_DIR
npm install

echo -e "${GREEN}✅ Dépendances installées${NC}"
echo ""

# ============================================
# ÉTAPE 7: Configuration Prisma
# ============================================
echo -e "${YELLOW}🔄 Étape 7: Configuration Prisma...${NC}"

cd $BACKEND_DIR
npx prisma generate
npx prisma migrate deploy

echo -e "${GREEN}✅ Prisma configuré${NC}"
echo ""

# ============================================
# ÉTAPE 8: Build du frontend
# ============================================
echo -e "${YELLOW}🏗️  Étape 8: Build du frontend...${NC}"

cd $FRONTEND_DIR

# Créer le fichier .env pour le frontend si nécessaire
if [ ! -f .env.production ]; then
    read -p "URL de l'API backend (ex: https://api.votre-domaine.com): " API_URL
    API_URL=${API_URL:-http://localhost:5000}
    
    cat > .env.production << EOF
REACT_APP_API_URL=$API_URL
EOF
fi

npm run build

echo -e "${GREEN}✅ Frontend buildé${NC}"
echo ""

# ============================================
# ÉTAPE 9: Configuration PM2
# ============================================
echo -e "${YELLOW}⚡ Étape 9: Configuration PM2...${NC}"

cd $BACKEND_DIR

# Créer le fichier ecosystem.config.js si nécessaire
if [ ! -f ecosystem.config.js ]; then
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'fruits-legumes-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF
fi

# Créer le dossier logs
mkdir -p logs

# Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo -e "${GREEN}✅ Application démarrée avec PM2${NC}"
echo ""

# ============================================
# ÉTAPE 10: Configuration Nginx
# ============================================
echo -e "${YELLOW}🌐 Étape 10: Configuration Nginx...${NC}"

read -p "Votre domaine (ex: fruits-legumes.com): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

sudo tee /etc/nginx/sites-available/fruits-legumes > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend
    location / {
        root $FRONTEND_DIR/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Uploads (images)
    location /uploads {
        alias $BACKEND_DIR/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF

# Activer le site
sudo ln -sf /etc/nginx/sites-available/fruits-legumes /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx

echo -e "${GREEN}✅ Nginx configuré${NC}"
echo ""

# ============================================
# ÉTAPE 11: Création d'un administrateur
# ============================================
echo -e "${YELLOW}👤 Étape 11: Création d'un administrateur...${NC}"

cd $BACKEND_DIR
npm run create-admin || echo "Script create-admin non disponible"

echo ""

# ============================================
# RÉSUMÉ
# ============================================
echo -e "${GREEN}=========================================="
echo -e "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
echo -e "==========================================${NC}"
echo ""
echo "📋 Informations importantes:"
echo "   - Application: $APP_DIR"
echo "   - Backend: http://localhost:5000"
echo "   - Frontend: http://$DOMAIN"
echo ""
echo "🔧 Commandes utiles:"
echo "   - Voir les logs: pm2 logs"
echo "   - Redémarrer: pm2 restart fruits-legumes-backend"
echo "   - Arrêter: pm2 stop fruits-legumes-backend"
echo "   - Status: pm2 status"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Configurer SSL/HTTPS avec Let's Encrypt"
echo "   2. Vérifier que l'application fonctionne"
echo "   3. Créer un compte administrateur si nécessaire"
echo ""
echo -e "${YELLOW}⚠️  N'oubliez pas de configurer:${NC}"
echo "   - Le fichier .env dans $BACKEND_DIR"
echo "   - Le certificat SSL pour HTTPS"
echo "   - Les sauvegardes de la base de données"
echo ""
