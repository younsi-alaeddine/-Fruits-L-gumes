const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  { name: 'Agrumes', products: [
    'Citron jaune', 'Citron jaune filet', 'Citron vert',
    'Clémentine Extra', 'Clémentine Feuille portugal', 'Clémentine Feuille Espagne',
    'Clémentine Soculente', 'Clémentine Orri', 'Clémenmiel Feuil', 'Clémenvilla',
    'Orange flt bouche', 'Orange flt jus', 'Orange machine', 'Orange Feuille',
    'Orange plateau', 'Orange Soculente', 'Orange sanguine', 'Orange Maltaise',
    'Orange Cox', 'Pomelos Rose'
  ]},
  { name: 'Pommes et Poires', products: [
    'P. Boskoop', 'P. Canada', 'P. Chanteclerc', 'P. Chanteclerc petite',
    'P. Joya', 'P. Fuji', 'P. Gala grosse', 'P. Gala petite',
    'P. Golden extra', 'P. golden petite', 'P. Tentation', 'P. Granny',
    'P. Pink lady b', 'P. Red chef', 'P. Reinette',
    'Poire Pascrassane', 'Poire Comice', 'Poire Comice Promo',
    'Poire conférence', 'Poir Conference Promo', 'Poire Guyot',
    'Poire Nashi', 'Poire Williams'
  ]},
  { name: 'Fruits rouges', products: [
    'Fraise barq 1kg', 'Fraise barq 500g', 'Fraise barq 500g France',
    'Fraise barq 250g', 'Fraise Belge', 'Fraise carpentras',
    'Fraise Gariguette saveol', 'Fraise barq Mariguette', 'Mara des bois',
    'Fraise des bois',
    'Framboise extra nu', 'Mure extra nu', 'Myrtille extra nu',
    'Framboise barquette', 'Mure barquette', 'Myrtille barquette',
    'Framboise barq', 'Groseille barq', 'Mure barq', 'Myrtille barq',
    'Cerise Extra', 'Cerise 1er Prix', 'Cerise Rainier'
  ]},
  { name: 'Fruits d\'été', products: [
    'Melon Char Gros', 'Melon charentais 1er prix', 'Melon Galia',
    'Melon jaune', 'Melon Vert', 'pastèque box', 'pastèque pièce x 2',
    'Mini pasteque',
    'Prune jaune', 'Prune rouge', 'Prune noire', 'Prune quetsch',
    'Prune reine claude véritable', 'Prune mirabelle'
  ]},
  { name: 'Fruits à Noyaux', products: [
    'Abricot FR', 'Nectarine Blanche FR', 'Nectarine Jaune FR',
    'Peche Blanche FR', 'Peche Jaune FR', 'Peche plate FR', 'Nectarine Plate FR',
    'Peche Blanche Royal', 'Peche Jaune Royal', 'Nectarine Blanche Royal',
    'Nectarine Jaune Royal',
    'Abricot esp', 'Nectarine Blanche ESP', 'Nectarine Jaune ESP',
    'Peche Blanche ESP', 'Peche Jaune ESP', 'Peche plate ESP', 'Nectarine Plate ESP'
  ]},
  { name: 'Fruits exotiques', products: [
    'Ananas', 'Ananas Victoria',
    'Avocat Gros', 'Avocat Petit', 'Avocat tropical',
    'Banane', 'Banane Bio', 'Banane plantain', 'Banane mini',
    'Carambole', 'Figue de barbarie', 'Fruits de passion',
    'Gingembre', 'Grenade', 'Grosse Grenade Machine',
    'Kiwi', 'Kiwi jaune', 'Kiwi barquette',
    'kaki brq', 'kaki persimon', 'Kaki Mou',
    'Litchi', 'litchi branche',
    'Mangue Avion', 'Mangue Bateaux', 'Mangustan',
    'Marron', 'Nefle', 'Anone',
    'Noix de coco', 'Papaye', 'Physalis', 'Pitaya',
    'Pomelos Chinois', 'Ramboutan'
  ]},
  { name: 'Dattes et fruits secs', products: [
    'Dattes régime 1kg', 'Dattes branchée 1kg',
    'datte ravier 250g', 'Datte Ravier 500g',
    'Datte Fraiche', 'Datte Medjoul', 'Datte Bouquet',
    'Noix Sèche', 'Noix fraiche', 'Amande fraiche',
    'Figue baglama', 'Pruneau moelleux vrac', 'Abricot moelleux vrac'
  ]},
  { name: 'Produits Ethniques', products: [
    'Banane plantin', 'Banane verte', 'Gombo',
    'Aubergine blanche', 'Aubergine djakatou',
    'Ignam', 'Manioc', 'Goyave',
    'Patate douce blanche', 'Piment Antillais',
    'Placali', 'Atiké', 'Morue 25kg (Julienne)'
  ]}
];

async function main() {
  console.log('🍎 Démarrage du seeding des fruits...\n');

  let totalProducts = 0;
  let totalCategories = 0;

  for (const catData of categories) {
    console.log(`📁 ${catData.name}`);

    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: {},
      create: { name: catData.name, description: `Catégorie ${catData.name}` },
    });

    totalCategories++;

    let created = 0;
    for (const productName of catData.products) {
      const existing = await prisma.product.findFirst({
        where: { name: productName, categoryId: category.id }
      });

      if (!existing) {
        await prisma.product.create({
          data: { 
            name: productName, 
            categoryId: category.id, 
            unit: 'kg', 
            priceHT: 0, 
            isActive: true 
          },
        });
        created++;
        totalProducts++;
      }
    }

    console.log(`   ✅ ${created}/${catData.products.length} produits créés\n`);
  }

  console.log(`\n🎉 Terminé: ${totalCategories} catégories, ${totalProducts} produits créés`);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
