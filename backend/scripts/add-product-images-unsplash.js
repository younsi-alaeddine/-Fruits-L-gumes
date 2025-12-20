const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

/**
 * Script pour ajouter des URLs d'images aux produits
 * Utilise l'API Unsplash pour rechercher des images correspondantes
 * 
 * ⚠️  Pour utiliser ce script, vous devez obtenir une clé API Unsplash gratuite :
 * 1. Aller sur https://unsplash.com/developers
 * 2. Créer une application
 * 3. Obtenir votre Access Key
 * 4. Ajouter UNSPLASH_ACCESS_KEY=votre_cle dans backend/.env
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Mapping des termes de recherche pour chaque produit
const productSearchTerms = {
  'Oignons jaunes': 'yellow onions',
  'Oignons rouges': 'red onions',
  'Pommes de terre': 'potatoes',
  'Échalotes': 'shallots',
  'Carottes': 'carrots',
  'Courgettes': 'zucchini',
  'Aubergines': 'eggplant',
  'Poivrons rouges': 'red bell peppers',
  'Basilic': 'basil',
  'Persil': 'parsley',
  'Ciboulette': 'chives',
  'Laitue': 'lettuce',
  'Roquette': 'arugula',
  'Mâche': 'lettuce salad',
  'Tomates cerises': 'cherry tomatoes',
  'Tomates rondes': 'tomatoes',
  'Tomates allongées': 'roma tomatoes',
  'Champignons de Paris': 'white button mushrooms',
  'Cèpes': 'porcini mushrooms',
};

async function searchUnsplashImage(searchTerm) {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('⚠️  UNSPLASH_ACCESS_KEY non configurée, utilisation d\'URLs par défaut');
    // Retourner une URL Unsplash avec placeholder si pas de clé API
    return `https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=800&h=800&fit=crop&q=80`;
  }

  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: searchTerm,
        per_page: 1,
        orientation: 'squarish',
      },
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const photo = response.data.results[0];
      // Retourner l'URL avec paramètres de taille
      return `${photo.urls.raw}&w=800&h=800&fit=crop&q=80`;
    }
  } catch (error) {
    console.error(`Erreur recherche image pour "${searchTerm}":`, error.message);
  }

  // Fallback vers une URL par défaut
  return `https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=800&h=800&fit=crop&q=80`;
}

async function main() {
  console.log('🖼️  Ajout des images aux produits avec Unsplash API...\n');

  if (!UNSPLASH_ACCESS_KEY) {
    console.log('ℹ️  Mode sans clé API : utilisation d\'URLs par défaut');
    console.log('💡 Pour utiliser l\'API Unsplash, ajoutez UNSPLASH_ACCESS_KEY dans .env\n');
  }

  try {
    let updatedCount = 0;
    let notFoundCount = 0;
    const notFound = [];

    for (const [productName, searchTerm] of Object.entries(productSearchTerms)) {
      // Rechercher le produit par nom
      const product = await prisma.product.findFirst({
        where: {
          name: {
            equals: productName,
            mode: 'insensitive',
          },
        },
      });

      if (product) {
        // Rechercher une image sur Unsplash
        const imageUrl = await searchUnsplashImage(searchTerm);
        
        // Mettre à jour l'image
        await prisma.product.update({
          where: { id: product.id },
          data: { photoUrl: imageUrl },
        });
        console.log(`✅ Image ajoutée à "${productName}" (recherche: ${searchTerm})`);
        updatedCount++;
        
        // Petite pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        notFound.push(productName);
        notFoundCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Résumé :');
    console.log(`   ✅ ${updatedCount} produits mis à jour avec des images`);
    if (notFoundCount > 0) {
      console.log(`   ⚠️  ${notFoundCount} produits non trouvés :`);
      notFound.forEach(name => console.log(`      - ${name}`));
    }
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des images:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
