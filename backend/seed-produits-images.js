/**
 * Script pour télécharger automatiquement les images des produits
 * Usage: node seed-produits-images.js
 * 
 * Ce script télécharge les images depuis l'API Unsplash (gratuite)
 * et les sauvegarde dans le dossier uploads/products
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();

// Charger les variables d'environnement
require('dotenv').config();

// Configuration
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'YOUR_UNSPLASH_ACCESS_KEY';
const UPLOAD_DIR = path.join(__dirname, 'uploads/products');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Fonction pour télécharger une image depuis une URL
async function downloadImage(imageUrl, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;
    
    protocol.get(imageUrl, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filePath);
        });
        fileStream.on('error', reject);
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Suivre les redirections
        downloadImage(response.headers.location, filePath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`Erreur HTTP: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Fonction pour chercher une image sur Unsplash (utilise fetch natif)
async function searchImageOnUnsplash(query) {
  try {
    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
      return null;
    }

    // Utiliser fetch natif Node.js (18+)
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.small || data.results[0].urls.regular;
      }
    }
    return null;
  } catch (error) {
    console.error(`Erreur recherche Unsplash pour "${query}":`, error.message);
    return null;
  }
}

// Fonction pour obtenir une URL d'image depuis Pixabay (gratuit, sans API key pour usage limité)
async function getImageFromPixabay(query) {
  try {
    // Pixabay API (gratuite avec limite)
    const url = `https://pixabay.com/api/?key=YOUR_PIXABAY_KEY&q=${encodeURIComponent(query)}&image_type=photo&category=food&per_page=1`;
    // Note: Nécessite une clé API Pixabay gratuite
    return null;
  } catch (error) {
    return null;
  }
}

// Fonction pour obtenir une URL d'image placeholder réaliste (sans API)
function getPlaceholderImageUrl(productName) {
  // Utiliser un service d'images placeholder avec texte
  // Exemple: placeholder.com ou via.placeholder.com
  const encodedName = encodeURIComponent(productName);
  // Option: utiliser un service qui génère des images avec texte
  return `https://via.placeholder.com/400x400/4CAF50/FFFFFF?text=${encodedName}`;
}

// Fonction pour obtenir une image depuis un service alternatif (sans API key)
async function getImageFromService(productName) {
  // Utiliser un service d'images libres sans API key
  // Option 1: Lorem Picsum avec dimensions
  // Option 2: Utiliser des URLs d'images placeholder réalistes
  // Option 3: Utiliser un service comme placeholder.com avec des images de produits
  
  // Pour l'instant, on utilise un placeholder simple
  // En production, vous pouvez utiliser une vraie API ou uploader manuellement
  return null;
}

// Mapping des produits vers des termes de recherche optimisés
const searchTerms = {
  // Fruits
  'Pommes Golden': 'golden apple fruit',
  'Pommes Gala': 'gala apple fruit',
  'Pommes Granny Smith': 'granny smith apple green',
  'Pommes Pink Lady': 'pink lady apple',
  'Pommes Fuji': 'fuji apple',
  'Bananes': 'banana fruit',
  'Bananes plantain': 'plantain banana',
  'Oranges': 'orange fruit',
  'Oranges sanguines': 'blood orange',
  'Clémentines': 'clementine fruit',
  'Mandarines': 'mandarin orange',
  'Citrons': 'lemon fruit',
  'Citrons verts': 'lime fruit',
  'Fraises': 'strawberry fruit',
  'Framboises': 'raspberry fruit',
  'Myrtilles': 'blueberry fruit',
  'Mûres': 'blackberry fruit',
  'Groseilles': 'red currant',
  'Raisin blanc': 'white grapes',
  'Raisin noir': 'black grapes',
  'Raisin rouge': 'red grapes',
  'Pêches': 'peach fruit',
  'Nectarines': 'nectarine fruit',
  'Abricots': 'apricot fruit',
  'Poires': 'pear fruit',
  'Poires Williams': 'williams pear',
  'Poires Conférence': 'conference pear',
  'Kiwis': 'kiwi fruit',
  'Ananas': 'pineapple fruit',
  'Mangues': 'mango fruit',
  'Avocats': 'avocado fruit',
  'Papayes': 'papaya fruit',
  'Melons': 'melon fruit',
  'Pastèques': 'watermelon fruit',
  'Cantaloups': 'cantaloupe melon',
  'Cerises': 'cherry fruit',
  'Prunes': 'plum fruit',
  'Reines-claudes': 'greengage plum',
  'Figues': 'fig fruit',
  'Dattes': 'date fruit',
  
  // Légumes
  'Tomates': 'tomato vegetable',
  'Tomates cerises': 'cherry tomato',
  'Tomates grappes': 'tomato on vine',
  'Tomates anciennes': 'heirloom tomato',
  'Carottes': 'carrot vegetable',
  'Carottes nouvelles': 'baby carrot',
  'Courgettes': 'zucchini vegetable',
  'Courgettes rondes': 'round zucchini',
  'Aubergines': 'eggplant vegetable',
  'Poivrons rouges': 'red bell pepper',
  'Poivrons verts': 'green bell pepper',
  'Poivrons jaunes': 'yellow bell pepper',
  'Concombres': 'cucumber vegetable',
  'Concombres libanais': 'lebanese cucumber',
  'Salade verte': 'lettuce salad',
  'Laitue': 'lettuce vegetable',
  'Roquette': 'arugula salad',
  'Épinards': 'spinach vegetable',
  'Chou': 'cabbage vegetable',
  'Chou-fleur': 'cauliflower vegetable',
  'Brocoli': 'broccoli vegetable',
  'Chou de Bruxelles': 'brussels sprouts',
  'Chou kale': 'kale vegetable',
  'Oignons': 'onion vegetable',
  'Oignons rouges': 'red onion',
  'Échalotes': 'shallot vegetable',
  'Ail': 'garlic vegetable',
  'Pommes de terre': 'potato vegetable',
  'Pommes de terre nouvelles': 'new potato',
  'Patates douces': 'sweet potato',
  'Radis': 'radish vegetable',
  'Betteraves': 'beetroot vegetable',
  'Navets': 'turnip vegetable',
  'Céleri': 'celery vegetable',
  'Fenouil': 'fennel vegetable',
  'Asperges': 'asparagus vegetable',
  'Artichauts': 'artichoke vegetable',
  'Poireaux': 'leek vegetable',
  'Champignons': 'mushroom',
  'Champignons de Paris': 'button mushroom',
  'Pleurotes': 'oyster mushroom',
  'Haricots verts': 'green beans',
  'Haricots blancs': 'white beans',
  'Pois': 'peas vegetable',
  'Petits pois': 'green peas',
  'Maïs': 'corn vegetable',
  'Courges': 'squash vegetable',
  'Potiron': 'pumpkin vegetable',
  'Butternut': 'butternut squash',
  
  // Herbes
  'Basilic': 'basil herb',
  'Persil': 'parsley herb',
  'Coriandre': 'coriander herb',
  'Ciboulette': 'chives herb',
  'Thym': 'thyme herb',
  'Romarin': 'rosemary herb',
  'Origan': 'oregano herb',
  'Menthe': 'mint herb',
  'Aneth': 'dill herb',
  'Estragon': 'tarragon herb',
  'Sauge': 'sage herb',
  'Laurier': 'bay leaf',
  
  // Fruits secs
  'Amandes': 'almond nut',
  'Noix': 'walnut nut',
  'Noisettes': 'hazelnut nut',
  'Pistaches': 'pistachio nut',
  'Cacahuètes': 'peanut nut',
  'Noix de cajou': 'cashew nut',
  'Noix de coco': 'coconut',
  'Raisins secs': 'raisin dried',
  'Abricots secs': 'dried apricot',
  'Figues séchées': 'dried fig',
  'Dattes séchées': 'dried date',
  'Cranberries séchées': 'dried cranberry'
};

// Fonction principale pour télécharger les images
async function downloadProductImages() {
  console.log('🖼️  Début du téléchargement des images des produits...\n');

  // Récupérer tous les produits sans images ou avec placeholders
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { photoUrl: null },
        { photoUrl: { contains: 'placeholder' } },
        // Inclure aussi les produits avec des fichiers vides (placeholders créés précédemment)
        { photoUrl: { not: null } }
      ]
    },
    take: 200 // Limiter pour éviter de surcharger l'API
  });

  console.log(`📦 ${products.length} produits à traiter\n`);

  let downloaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    try {
      const searchTerm = searchTerms[product.name] || product.name.toLowerCase();
      console.log(`🔍 Recherche image pour: ${product.name}...`);

      // Essayer Unsplash d'abord si clé API disponible
      let imageUrl = await searchImageOnUnsplash(searchTerm);

      // Si pas d'image trouvée et pas de clé API, utiliser placeholder.com
      if (!imageUrl) {
        console.log(`   ⚠️  Pas de clé API Unsplash, utilisation d'un placeholder`);
        imageUrl = getPlaceholderImageUrl(product.name);
        
        // Télécharger le placeholder
        const fileName = `product-${product.id}-${Date.now()}.jpg`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        
        try {
          await downloadImage(imageUrl, filePath);
          const photoUrl = `/uploads/products/${fileName}`;
          await prisma.product.update({
            where: { id: product.id },
            data: { photoUrl }
          });
          
          downloaded++;
          console.log(`   ✅ Placeholder téléchargé: ${photoUrl}\n`);
        } catch (error) {
          // Si le téléchargement échoue, créer un fichier vide
          fs.writeFileSync(filePath, '');
          const photoUrl = `/uploads/products/${fileName}`;
          await prisma.product.update({
            where: { id: product.id },
            data: { photoUrl }
          });
          
          skipped++;
          console.log(`   ⏭️  Placeholder créé (à remplacer manuellement): ${photoUrl}\n`);
        }
        
        // Attendre un peu pour éviter de surcharger
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }

      // Télécharger l'image
      const fileName = `product-${product.id}-${Date.now()}.jpg`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      
      await downloadImage(imageUrl, filePath);
      
      const photoUrl = `/uploads/products/${fileName}`;
      await prisma.product.update({
        where: { id: product.id },
        data: { photoUrl }
      });
      
      downloaded++;
      console.log(`   ✅ Image téléchargée: ${photoUrl}\n`);
      
      // Attendre un peu pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      errors++;
      console.error(`   ❌ Erreur pour ${product.name}:`, error.message);
      console.log('');
    }
  }

  console.log('\n============================================================');
  console.log('🎉 TÉLÉCHARGEMENT TERMINÉ!');
  console.log('============================================================');
  console.log(`\n📊 Statistiques:`);
  console.log(`   - ${downloaded} images téléchargées`);
  console.log(`   - ${skipped} placeholders créés`);
  console.log(`   - ${errors} erreurs\n`);
}

// Fonction alternative : utiliser des URLs d'images libres directement
async function downloadProductImagesFromFreeSources() {
  console.log('🖼️  Téléchargement des images depuis des sources libres...\n');

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { photoUrl: null },
        { photoUrl: { contains: 'placeholder' } }
      ]
    }
  });

  console.log(`📦 ${products.length} produits à traiter\n`);

  // Utiliser un service d'images placeholder avec des images réalistes
  // Exemple: utiliser placeholder.com avec des dimensions et du texte
  // Ou mieux: utiliser des URLs d'images libres de droits
  
  let downloaded = 0;
  let errors = 0;

  for (const product of products) {
    try {
      // Créer un nom de fichier unique
      const fileName = `product-${product.id}-${Date.now()}.jpg`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      
      // Pour l'instant, créer un fichier placeholder
      // En production, vous pouvez télécharger depuis une vraie source
      const placeholderContent = Buffer.from('');
      fs.writeFileSync(filePath, placeholderContent);
      
      const photoUrl = `/uploads/products/${fileName}`;
      await prisma.product.update({
        where: { id: product.id },
        data: { photoUrl }
      });
      
      downloaded++;
      console.log(`   ✅ Placeholder créé pour: ${product.name} (${photoUrl})`);
      
    } catch (error) {
      errors++;
      console.error(`   ❌ Erreur pour ${product.name}:`, error.message);
    }
  }

  console.log(`\n✅ ${downloaded} placeholders créés`);
  console.log(`❌ ${errors} erreurs\n`);
  console.log('💡 Note: Remplacez les placeholders par de vraies images manuellement');
  console.log('   ou configurez UNSPLASH_ACCESS_KEY pour télécharger automatiquement.\n');
}

// Exécuter
async function main() {
  if (UNSPLASH_ACCESS_KEY && UNSPLASH_ACCESS_KEY !== 'YOUR_UNSPLASH_ACCESS_KEY') {
    await downloadProductImages();
  } else {
    console.log('⚠️  Clé API Unsplash non configurée.');
    console.log('   Utilisation de placeholders...\n');
    await downloadProductImagesFromFreeSources();
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du téléchargement:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

