const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Script d'import en masse de prix depuis un fichier CSV
 * 
 * Format CSV attendu (séparateur: point-virgule):
 * Nom Produit;SKU;Prix HT T1;Prix HT T2;Raison
 * 
 * Exemple:
 * Pomme Golden;FRUIT-POMME-001;2.50;2.30;Hausse fournisseur
 * 
 * Usage:
 * node scripts/import-prices-csv.js chemin/vers/fichier.csv
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
  
  return values.slice(1)
}

async function importPrices(csvFilePath) {
  try {
    console.log('🚀 Démarrage de l\'import des prix...\n')
    
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error('Le fichier CSV est vide')
    }
    
    const headers = await parseCSVLine(lines[0])
    console.log(`📋 En-têtes: ${headers.join(', ')}\n`)
    
    let imported = 0
    let errors = 0
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      try {
        const values = await parseCSVLine(line)
        const [name, sku, priceHT, priceHT_T2, reason] = values
        
        if (!name && !sku) {
          console.log(`⚠️  Ligne ${i + 1}: Nom ou SKU manquant`)
          continue
        }
        
        // Trouver le produit
        const product = await prisma.product.findFirst({
          where: {
            OR: [
              { name: name?.trim() },
              { sku: sku?.trim() }
            ],
            deletedAt: null
          }
        })
        
        if (!product) {
          console.log(`⚠️  Ligne ${i + 1}: Produit non trouvé: ${name || sku}`)
          errors++
          continue
        }
        
        const newPriceHT = parseFloat(priceHT?.replace(',', '.')) || product.priceHT
        const newPriceT2 = priceHT_T2?.trim() ? parseFloat(priceHT_T2.replace(',', '.')) : product.priceHT_T2
        
        // Créer l'historique
        await prisma.priceHistory.create({
          data: {
            productId: product.id,
            oldPriceHT: product.priceHT,
            newPriceHT: newPriceHT,
            oldPriceT2: product.priceHT_T2,
            newPriceT2: newPriceT2,
            changeType: 'import',
            reason: reason?.trim() || 'Import CSV',
            changedBy: null
          }
        })
        
        // Mettre à jour le produit
        await prisma.product.update({
          where: { id: product.id },
          data: {
            priceHT: newPriceHT,
            priceHT_T2: newPriceT2
          }
        })
        
        console.log(`  ✅ ${product.name}: ${product.priceHT.toFixed(2)} → ${newPriceHT.toFixed(2)} €`)
        imported++
        
      } catch (error) {
        console.error(`❌ Erreur ligne ${i + 1}: ${error.message}`)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Import terminé!`)
    console.log(`   - Prix importés: ${imported}`)
    console.log(`   - Erreurs: ${errors}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  const csvFilePath = process.argv[2]
  
  if (!csvFilePath) {
    console.error('❌ Usage: node scripts/import-prices-csv.js chemin/vers/fichier.csv')
    process.exit(1)
  }
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Fichier introuvable: ${csvFilePath}`)
    process.exit(1)
  }
  
  importPrices(csvFilePath)
    .then(() => {
      console.log('\n✅ Script terminé')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { importPrices }
