#!/bin/bash
# Script de démarrage pour Render
# Vérifie que DATABASE_URL est disponible avant d'exécuter les migrations

set -e

echo "🚀 Démarrage de l'application..."

# Vérifier que DATABASE_URL est définie
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERREUR: DATABASE_URL n'est pas définie"
    echo "Vérifiez la configuration dans Render Dashboard:"
    echo "1. La base de données 'fruits-legumes-db' existe"
    echo "2. La variable DATABASE_URL est liée à la base de données"
    exit 1
fi

echo "✅ DATABASE_URL est définie"

# Générer le client Prisma
echo "📦 Génération du client Prisma..."
npx prisma generate

# Exécuter les migrations
echo "🔄 Exécution des migrations..."
npx prisma migrate deploy

# Démarrer l'application
echo "🌟 Démarrage du serveur..."
npm start

