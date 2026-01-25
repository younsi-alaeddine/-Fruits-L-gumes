const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function assignCategories() {
  try {
    console.log('🚀 Démarrage de l\'assignation des catégories...\n')

    // 1. Créer ou récupérer la catégorie "test 1"
    console.log('📦 Création/récupération de la catégorie "test 1"...')
    let category = await prisma.category.findFirst({
      where: { name: 'test 1' }
    })

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'test 1',
          description: 'Catégorie de test',
          isActive: true,
        }
      })
      console.log(`✅ Catégorie "test 1" créée (ID: ${category.id})`)
    } else {
      console.log(`✅ Catégorie "test 1" trouvée (ID: ${category.id})`)
    }

    // 2. Créer ou récupérer la sous-catégorie "test 2"
    console.log('📦 Création/récupération de la sous-catégorie "test 2"...')
    let subCategory = await prisma.subCategory.findFirst({
      where: { 
        name: 'test 2',
        categoryId: category.id
      }
    })

    if (!subCategory) {
      subCategory = await prisma.subCategory.create({
        data: {
          name: 'test 2',
          description: 'Sous-catégorie de test',
          categoryId: category.id,
          isActive: true,
        }
      })
      console.log(`✅ Sous-catégorie "test 2" créée (ID: ${subCategory.id})`)
    } else {
      console.log(`✅ Sous-catégorie "test 2" trouvée (ID: ${subCategory.id})`)
    }

    // 3. Compter les produits
    const totalProducts = await prisma.product.count({
      where: { deletedAt: null }
    })
    console.log(`\n📊 Total de produits à mettre à jour: ${totalProducts}`)

    // 4. Mettre à jour tous les produits
    console.log('\n🔄 Mise à jour des produits...')
    const result = await prisma.product.updateMany({
      where: { deletedAt: null },
      data: {
        categoryId: category.id,
        subCategoryId: subCategory.id,
      }
    })

    console.log(`\n✅ ${result.count} produits mis à jour avec succès !`)
    console.log(`\n📋 Résumé:`)
    console.log(`   Catégorie: "${category.name}" (ID: ${category.id})`)
    console.log(`   Sous-catégorie: "${subCategory.name}" (ID: ${subCategory.id})`)
    console.log(`   Produits mis à jour: ${result.count}`)

    // 5. Vérification
    const verif = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        subCategoryId: subCategory.id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      take: 5,
    })

    console.log(`\n🔍 Exemple de produits mis à jour (5 premiers):`)
    verif.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name}`)
    })

    console.log('\n✅ Assignation terminée avec succès !')

  } catch (error) {
    console.error('❌ Erreur:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

assignCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
