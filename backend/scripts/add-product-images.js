const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script pour ajouter des URLs d'images aux produits
 * Utilise des images gratuites d'Unsplash (Unsplash License - libre d'utilisation)
 * Les URLs utilisent le format Unsplash direct avec des photos spécifiques
 */

// Mapping des produits vers des URLs d'images Unsplash
// Format: https://images.unsplash.com/photo-{id}?w=800&h=800&fit=crop&q=80
// Toutes ces images sont libres d'utilisation selon Unsplash License
const productImages = {
  // OIGNONS & PDT
  'Oignons jaunes': 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=800&h=800&fit=crop&q=80',
  'Oignons rouges': 'https://images.unsplash.com/photo-1605052301361-9063c98b86e6?w=800&h=800&fit=crop&q=80',
  'Pommes de terre': 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800&h=800&fit=crop&q=80',
  'Échalotes': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&h=800&fit=crop&q=80',
  
  // LÉGUMES
  'Carottes': 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=800&h=800&fit=crop&q=80',
  'Courgettes': 'https://images.unsplash.com/photo-1605016211174-194d5d3d90ea?w=800&h=800&fit=crop&q=80',
  'Aubergines': 'https://images.unsplash.com/photo-1615485925503-b5f5b3ce5e20?w=800&h=800&fit=crop&q=80',
  'Poivrons rouges': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&h=800&fit=crop&q=80',
  
  // HERBES
  'Basilic': 'https://images.unsplash.com/photo-1594282299263-93822e8cb13d?w=800&h=800&fit=crop&q=80',
  'Persil': 'https://images.unsplash.com/photo-1604962809430-5cd1e4bd2c7d?w=800&h=800&fit=crop&q=80',
  'Ciboulette': 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=800&h=800&fit=crop&q=80',
  
  // SALADES
  'Laitue': 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800&h=800&fit=crop&q=80',
  'Roquette': 'https://images.unsplash.com/photo-1615485500669-c0463b1c7c0e?w=800&h=800&fit=crop&q=80',
  'Mâche': 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800&h=800&fit=crop&q=80',
  
  // TOMATES
  'Tomates cerises': 'https://images.unsplash.com/photo-1546094097-8a19a4cdf37b?w=800&h=800&fit=crop&q=80',
  'Tomates rondes': 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800&h=800&fit=crop&q=80',
  'Tomates allongées': 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&h=800&fit=crop&q=80',
  
  // CHAMPIGNONS
  'Champignons de Paris': 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&h=800&fit=crop&q=80',
  'Cèpes': 'https://images.unsplash.com/photo-1567267069396-5ae92364372d?w=800&h=800&fit=crop&q=80',
};

async function main() {
  console.log('🖼️  Ajout des images aux produits...\n');
  console.log('📝 Utilisation d\'images Unsplash (libres d\'utilisation)\n');

  try {
    let updatedCount = 0;
    let notFoundCount = 0;
    const notFound = [];

    for (const [productName, imageUrl] of Object.entries(productImages)) {
      // Rechercher le produit par nom (case insensitive)
      const product = await prisma.product.findFirst({
        where: {
          name: {
            equals: productName,
            mode: 'insensitive',
          },
        },
      });

      if (product) {
        // Mettre à jour l'image
        await prisma.product.update({
          where: { id: product.id },
          data: { photoUrl: imageUrl },
        });
        console.log(`✅ Image ajoutée à "${productName}"`);
        updatedCount++;
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
    console.log('💡 Toutes les images proviennent d\'Unsplash');
    console.log('📄 Licence: Unsplash License (libre d\'utilisation)');
    console.log('🌐 Les images sont chargées depuis Unsplash CDN');
    console.log('');
    console.log('💡 Pour utiliser l\'API Unsplash avec recherche automatique :');
    console.log('   npm run add-product-images-unsplash');
    console.log('   (nécessite UNSPLASH_ACCESS_KEY dans .env)\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des images:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
