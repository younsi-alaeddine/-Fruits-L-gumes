#!/bin/bash
# Script pour pousser le code vers GitHub avec authentification

echo "🔐 Push vers GitHub"
echo "=================="
echo ""
echo "Le dépôt est prêt à être poussé."
echo "Commit: $(git log -1 --oneline)"
echo ""
echo "Options d'authentification:"
echo ""
echo "1. Avec un Personal Access Token (recommandé):"
echo "   git push https://VOTRE_TOKEN@github.com/younsi-alaeddine/-Fruits-L-gumes.git master"
echo ""
echo "2. Avec credentials Git configurés:"
echo "   git config --global credential.helper store"
echo "   git push origin master"
echo "   (entrez votre username et token quand demandé)"
echo ""
echo "3. Avec SSH (si clé SSH configurée):"
echo "   git remote set-url origin git@github.com:younsi-alaeddine/-Fruits-L-gumes.git"
echo "   git push origin master"
echo ""
echo "📝 Pour créer un Personal Access Token:"
echo "   https://github.com/settings/tokens"
echo "   - Cliquez sur 'Generate new token (classic)'"
echo "   - Sélectionnez les scopes: repo"
echo "   - Copiez le token généré"
echo ""
read -p "Voulez-vous pousser maintenant avec un token? (o/n): " answer

if [ "$answer" = "o" ] || [ "$answer" = "O" ]; then
    read -sp "Entrez votre GitHub Personal Access Token: " token
    echo ""
    if [ -n "$token" ]; then
        git push https://${token}@github.com/younsi-alaeddine/-Fruits-L-gumes.git master
        if [ $? -eq 0 ]; then
            echo "✅ Push réussi!"
        else
            echo "❌ Erreur lors du push"
        fi
    else
        echo "❌ Token vide"
    fi
else
    echo "ℹ️  Utilisez l'une des méthodes ci-dessus pour pousser manuellement"
fi
