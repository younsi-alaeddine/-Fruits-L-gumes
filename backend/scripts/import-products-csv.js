const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Script d'import en masse de produits depuis un fichier CSV
 * 
 * Format CSV attendu (séparateur: point-virgule):
 * Nom;SKU;Description;Catégorie;Sous-catégorie;Unité;Prix HT;Prix HT T2;TVA (%);Stock;Origine;Packaging;Présentation;GENCOD;Code-barres;Actif
 * 
 * Exemple:
 * Pomme Golden;FRUIT-POMME-001;Pomme Golden de qualité;Fruits;Pommes;kg;2.50;2.30;5.5;100;France;Carton 5kg;Vrac;3700123456789;123456;Oui
 * 
 * Usage:
 * node scripts/import-products-csv.js chemin/vers/fichier.csv
 */

async function parseCSVLine(line) {
  // Parser une ligne CSV avec gestion des guillemets
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

async function findOrCreateCategory(name, subCategoryName = null) {
  if (!name) return { categoryId: null, subCategoryId: null }
  
  // Chercher ou créer la catégorie
  let category = await prisma.category.findFirst({
    where: { name, deletedAt: null }
  })
  
  if (!category) {
    category = await prisma.category.create({
      data: {
        name,
        icon: '📦',
        color: '#3B82F6',
        isActive: true,
      }
    })
    console.log(`  ✅ Catégorie créée: ${name}`)
  }
  
  let subCategoryId = null
  
  if (subCategoryName && subCategoryName.trim()) {
    let subCategory = await prisma.subCategory.findFirst({
      where: {
        name: subCategoryName,
        categoryId: category.id,
        deletedAt: null
      }
    })
    
    if (!subCategory) {
      subCategory = await prisma.subCategory.create({
        data: {
          name: subCategoryName,
          categoryId: category.id,
          icon: '🏷️',
          isActive: true,
        }
      })
      console.log(`  ✅ Sous-catégorie créée: ${subCategoryName} (${name})`)
    }
    
    subCategoryId = subCategory.id
  }
  
  return { categoryId: category.id, subCategoryId }
}

async function importProducts(csvFilePath) {
  try {
    console.log('🚀 Démarrage de l\'import de produits...\n')
    
    // Lire le fichier CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error('Le fichier CSV est vide ou ne contient pas de données')
    }
    
    // Parser l'en-tête
    const headers = await parseCSVLine(lines[0])
    console.log(`📋 En-têtes trouvés: ${headers.join(', ')}\n`)
    
    let imported = 0
    let errors = 0
    
    // Importer chaque ligne (en sautant l'en-tête)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      try {
        const values = await parseCSVLine(line)
        
        // Extraire les valeurs (selon l'ordre de l'en-tête)
        const [
          name, sku, description, categoryName, subCategoryName,
          unit, priceHT, priceHT_T2, tva, stock,
          origine, packaging, presentation, gencod, barcode, isActive
        ] = values
        
        if (!name || !name.trim()) {
          console.log(`⚠️  Ligne ${i + 1}: Nom manquant, ignorée`)
          continue
        }
        
        // Trouver ou créer catégorie/sous-catégorie
        const { categoryId, subCategoryId } = await findOrCreateCategory(
          categoryName?.trim(),
          subCategoryName?.trim()
        )
        
        // Préparer les données du produit
        const productData = {
          name: name.trim(),
          sku: sku?.trim() || null,
          description: description?.trim() || null,
          categoryId: categoryId || null,
          subCategoryId: subCategoryId || null,
          unit: unit?.trim() || 'kg',
          priceHT: parseFloat(priceHT?.replace(',', '.')) || 0,
          priceHT_T2: priceHT_T2?.trim() ? parseFloat(priceHT_T2.replace(',', '.')) : null,
          tva: parseFloat(tva?.replace(',', '.')) || 5.5,
          stock: parseInt(stock) || 0,
          origine: origine?.trim() || null,
          packaging: packaging?.trim() || null,
          presentation: presentation?.trim() || null,
          gencod: gencod?.trim() || null,
          barcode: barcode?.trim() || null,
          isActive: isActive?.toLowerCase() === 'oui' || isActive?.toLowerCase() === 'true',
        }
        
        // Vérifier si le produit existe déjà (par SKU ou nom)
        const existing = await prisma.product.findFirst({
          where: {
            OR: [
              { sku: productData.sku },
              { name: productData.name }
            ],
            deletedAt: null
          }
        })
        
        if (existing) {
          // Mettre à jour le produit existant
          await prisma.product.update({
            where: { id: existing.id },
            data: productData
          })
          console.log(`  🔄 Produit mis à jour: ${productData.name}`)
        } else {
          // Créer un nouveau produit
          await prisma.product.create({
            data: productData
          })
          console.log(`  ➕ Produit créé: ${productData.name}`)
        }
        
        imported++
      } catch (error) {
        console.error(`❌ Erreur ligne ${i + 1}: ${error.message}`)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Import terminé!`)
    console.log(`   - Produits importés/mis à jour: ${imported}`)
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
    console.error('❌ Usage: node scripts/import-products-csv.js chemin/vers/fichier.csv')
    process.exit(1)
  }
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Fichier introuvable: ${csvFilePath}`)
    process.exit(1)
  }
  
  importProducts(csvFilePath)
    .then(() => {
      console.log('\n✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { importProducts }
