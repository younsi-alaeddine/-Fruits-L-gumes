const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  { name: 'Légumes-tiges', products: ['Artichaut', 'Artichaut Viollet', 'Poivrade botte', 'Poivrade vrac', 'Oignon botte', 'Poireau vrac 10kg', 'Poireau vrac 5kg', 'Blanc de Poireau vrac', 'Celerie branche', 'Celerie rave', 'Fenouil', 'Carde']},
  { name: 'Légumes-racines', products: ['Betterave cuite', 'Betterave botte', 'Betterave sous vide', 'Carotte botte', 'Carotte botte couleur', 'Carotte vrac', 'Carotte sable', 'Carotte couleur vrac', 'Navet botte', 'Navet viollet vrac', 'Navet marteau vrac', 'Navet boule d\'or', 'Rurabaga', 'Topinambour']},
  { name: 'Légumes-feuilles', products: ['Brocolis', 'Choux fleur', 'Choux blanc', 'Choux rouge', 'Choux doux', 'Choux vert', 'Choux pointu', 'Choux chinois', 'Choux patchoy', 'Choux romanesco', 'Choux rave', 'Choux de Bruxelles vrac', 'Endvie vrac', 'Endive sachet']},
  { name: 'Légumes-fruits', products: ['Courgette verte', 'Courgette blanche', 'Courgette ronde', 'Courgette jaune', 'Aubergine', 'Aubergine rayée', 'Aubergine japonaise', 'Aubergine Ronde', 'Poivron vert', 'Poivron rouge', 'Poivron jaune', 'Poivron Orange', 'Poivron trio 500g', 'Mini Poivron vrac', 'Mini Poivron barq', 'Piment vert', 'Piment blanc', 'Piment rouge', 'Corne de bœuf verte', 'Corne de bœuf rouge']},
  { name: 'Légumes-grains', products: ['Haricot vert vrac', 'Haricot beurre', 'Haricot vert Kenya vrac', 'Haricot vert 250g', 'Haricot vert 500g', 'Coco plat', 'Haricot écossé', 'Pois gourmands brq', 'Fève', 'Petit pois vrac', 'Petit pois brq']},
  { name: 'Autres', products: ['Radis rose', 'Radis rouge', 'Radis couleur', 'Radis noir', 'Concombre', 'Mini concombre', 'Concombre noa', 'Mais épi', 'Maïs frais brq', 'Carde']},
  { name: 'Ail & Oignons', products: ['Ail blanc vrac', 'Ail violet vrac', 'Ail 3 tête', 'Échalote filet 250g', 'Échalote vrac', 'Échalion vrac', 'Oignon blanc', 'Oignon jaune vrac', 'Oignon rouge vrac', 'Oignon doux', 'Oignon jaune tubes', 'Oignon rouge tubes', 'Oignon jaune filet 1kg', 'Oignon rouge filet 1kg']},
  { name: 'Pomme de terre', products: ['Pomme de terre chair ferme vrac', 'Pomme de terre rosevalt vrac', 'Pomme de terre monalisa lavé vrac', 'Pomme de terre grenaille vrac', 'Pomme de terre grenaille filet 1kg', 'Pomme terre agréa non lavé vrac', 'Pomme de terre vapeur filet 2kg', 'Pomme de terre fritte filet 2kg', 'Pomme de terre rouge filet 2kg', 'Pomme de terre spunta vrac', 'Patate douce', 'Panais', 'Potimarron', 'Butternut', 'Potiron', 'Pomme de terre sous vide aux herbes', 'Pomme de terre grenaille rôtisserie', 'Ail pelé 1kg']},
  { name: 'Salade', products: ['Salade batavia x12', 'Salade laitue x12', 'Salade chêne verte x12', 'Salade chêne rouge x12', 'Salade Romaine x6', 'Scarole x8', 'Frisée x8', 'Salade batavia x6', 'Salade laitue x6', 'Salade chêne verte x6', 'Salade chêne rouge x6', 'Salade iceberg x10', 'Salade sucrine x3', 'Salade sucrine x6', 'Trevise', 'Cresson botte', 'Salade mâche barquette', 'Salade jeune pousse', 'Épinard barquette', 'Salade mesclun barquette', 'Salade roquette barquette', 'Blette', 'Épinard vrac']},
  { name: 'Asperges', products: ['Asperge blanche vrac', 'Asperge violette vrac', 'Asperge verte vrac', 'Asperge blanche botte', 'Asperge violette botte', 'Asperge verte botte', 'Asperge sauvage botte']},
  { name: 'Tomate', products: ['Tomate grappe vrac France', 'Tomate grappe vrac', 'Tomate ronde vrac France', 'Tomate ronde', 'Tomate cocktail vrac', 'Tomate cerise allongé vrac', 'Tomate cerise ronde vrac', 'Tomate cerise grappe vrac', 'Tomate cerise ronde couleur grappe vrac', 'Tomate cœur de bœuf vrac', 'Tomate noir de crimé vrac', 'Tomate kumato vrac', 'Tomate torino vrac', 'Tomate roma vrac', 'Tomate olivettes vrac', 'Tomate ananas', 'Tomate aumônier', 'Tomate d\'antan', 'Tomate rébellion', 'Tomate cerise ronde 250g', 'Tomate cœur de pigeon 250g', 'Tomate duo 250g', 'Tomate méli-mélo 1kg', 'Tomate cerise allongé 1kg', 'Tomate cerise ronde 1kg']},
  { name: 'Champignon', products: ['Champignon de Paris blanc 250g', 'Champignon de Paris blanc 500g', 'Champignon de Paris lamelle 250g', 'Champignon mixte barquette 250g', 'Champignon pied coupé vrac 2kg', 'Champignon pied coupé vrac 3kg', 'Champignon girolles', 'Champignon pleurote', 'Champignon cèpe vrac']}
];

async function main() {
  console.log('🌱 Démarrage du seeding...\n');

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
          data: { name: productName, categoryId: category.id, unit: 'kg', priceHT: 0, isActive: true },
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
