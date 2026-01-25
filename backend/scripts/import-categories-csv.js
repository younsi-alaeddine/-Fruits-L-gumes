const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Script d'import en masse de catégories et sous-catégories depuis un fichier CSV
 * 
 * Format CSV attendu (séparateur: point-virgule):
 * Nom Catégorie;Description Catégorie;Icon;Couleur;Nom Sous-catégorie;Description Sous-catégorie;Icon Sous-cat;Actif
 * 
 * Exemple:
 * Fruits;Tous les fruits frais;🍎;#FF5733;Pommes;Variétés de pommes;🍏;Oui
 * Fruits;;;;Agrumes;Citrons oranges etc;🍊;Oui
 * Légumes;Légumes frais;🥬;#4CAF50;;;Non
 * 
 * Usage:
 * node scripts/import-categories-csv.js chemin/vers/fichier.csv
 */

async function parseCSVLine(line) {
  const regex = /(?:^|;)("(?:[^"]|"")*"|[^;]*)/g
  const values = []
  let match
  
  while ((match = regex.exec(line)) !== null) {
    let value = match[1]
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/""/g, '"')
    }
    values.push(value)
  }
  
  return values.slice(1) // Enlever le premier élément vide
}

async function importCategories(csvFilePath) {
  try {
    console.log('🚀 Démarrage de l\'import de catégories...\n')
    
    // Lire le fichier CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error('Le fichier CSV est vide ou ne contient pas de données')
    }
    
    // Parser l'en-tête
    const headers = await parseCSVLine(lines[0])
    console.log(`📋 En-têtes trouvés: ${headers.join(', ')}\n`)
    
    let categoriesImported = 0
    let subCategoriesImported = 0
    let errors = 0
    const categoryCache = new Map()
    
    // Importer chaque ligne
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      try {
        const values = await parseCSVLine(line)
        
        const [
          categoryName, categoryDescription, categoryIcon, categoryColor,
          subCategoryName, subCategoryDescription, subCategoryIcon, isActive
        ] = values
        
        if (!categoryName || !categoryName.trim()) {
          console.log(`⚠️  Ligne ${i + 1}: Nom de catégorie manquant, ignorée`)
          continue
        }
        
        const categoryNameTrimmed = categoryName.trim()
        
        // Trouver ou créer la catégorie
        let category
        if (categoryCache.has(categoryNameTrimmed)) {
          category = categoryCache.get(categoryNameTrimmed)
        } else {
          category = await prisma.category.findFirst({
            where: {
              name: categoryNameTrimmed,
              deletedAt: null
            }
          })
          
          if (!category) {
            // Obtenir le prochain ordre
            const maxOrder = await prisma.category.findFirst({
              orderBy: { order: 'desc' },
              select: { order: true }
            })
            
            category = await prisma.category.create({
              data: {
                name: categoryNameTrimmed,
                description: categoryDescription?.trim() || null,
                icon: categoryIcon?.trim() || '📦',
                color: categoryColor?.trim() || '#3B82F6',
                isActive: isActive?.toLowerCase() !== 'non',
                order: (maxOrder?.order || 0) + 1
              }
            })
            console.log(`  ✅ Catégorie créée: ${categoryNameTrimmed}`)
            categoriesImported++
          } else {
            console.log(`  ℹ️  Catégorie existante: ${categoryNameTrimmed}`)
          }
          
          categoryCache.set(categoryNameTrimmed, category)
        }
        
        // Créer la sous-catégorie si spécifiée
        if (subCategoryName && subCategoryName.trim()) {
          const subCategoryNameTrimmed = subCategoryName.trim()
          
          const existingSubCategory = await prisma.subCategory.findFirst({
            where: {
              name: subCategoryNameTrimmed,
              categoryId: category.id,
              deletedAt: null
            }
          })
          
          if (!existingSubCategory) {
            // Obtenir le prochain ordre
            const maxOrder = await prisma.subCategory.findFirst({
              where: { categoryId: category.id },
              orderBy: { order: 'desc' },
              select: { order: true }
            })
            
            await prisma.subCategory.create({
              data: {
                name: subCategoryNameTrimmed,
                description: subCategoryDescription?.trim() || null,
                icon: subCategoryIcon?.trim() || '🏷️',
                categoryId: category.id,
                isActive: isActive?.toLowerCase() !== 'non',
                order: (maxOrder?.order || 0) + 1
              }
            })
            console.log(`    ✅ Sous-catégorie créée: ${subCategoryNameTrimmed} (${categoryNameTrimmed})`)
            subCategoriesImported++
          } else {
            console.log(`    ℹ️  Sous-catégorie existante: ${subCategoryNameTrimmed} (${categoryNameTrimmed})`)
          }
        }
        
      } catch (error) {
        console.error(`❌ Erreur ligne ${i + 1}: ${error.message}`)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Import terminé!`)
    console.log(`   - Catégories importées: ${categoriesImported}`)
    console.log(`   - Sous-catégories importées: ${subCategoriesImported}`)
    console.log(`   - Erreurs: ${errors}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (require.main === module) {
  const csvFilePath = process.argv[2]
  
  if (!csvFilePath) {
    console.error('❌ Usage: node scripts/import-categories-csv.js chemin/vers/fichier.csv')
    process.exit(1)
  }
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Fichier introuvable: ${csvFilePath}`)
    process.exit(1)
  }
  
  importCategories(csvFilePath)
    .then(() => {
      console.log('\n✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { importCategories }
