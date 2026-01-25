const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Script d'import en masse de fournisseurs depuis un fichier CSV
 * 
 * Format CSV attendu (séparateur: point-virgule):
 * Nom;Contact;Email;Telephone;Adresse;SIRET;TVA;Conditions Paiement;Délai Livraison;Notes
 * 
 * Exemple:
 * Fruits Bio SARL;Jean Dupont;contact@fruitsbio.fr;0123456789;123 rue des Vergers;12345678900012;FR12345678901;Net 30 jours;2;Fournisseur principal
 * 
 * Usage:
 * node scripts/import-suppliers-csv.js chemin/vers/fichier.csv
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

async function importSuppliers(csvFilePath) {
  try {
    console.log('🚀 Démarrage de l\'import des fournisseurs...\n')
    
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error('Le fichier CSV est vide')
    }
    
    const headers = await parseCSVLine(lines[0])
    console.log(`📋 En-têtes: ${headers.join(', ')}\n`)
    
    let imported = 0
    let updated = 0
    let errors = 0
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      try {
        const values = await parseCSVLine(line)
        const [name, contact, email, phone, address, siret, tva, paymentTerms, deliveryDays, notes] = values
        
        if (!name || !email) {
          console.log(`⚠️  Ligne ${i + 1}: Nom ou email manquant`)
          errors++
          continue
        }
        
        const supplierData = {
          name: name.trim(),
          contact: contact?.trim() || '',
          email: email.trim(),
          phone: phone?.trim() || '',
          address: address?.trim() || null,
          siret: siret?.trim() || null,
          tva: tva?.trim() || null,
          paymentTerms: paymentTerms?.trim() || 'Net 30 jours',
          averageDeliveryDays: deliveryDays ? parseInt(deliveryDays) : 2,
          notes: notes?.trim() || null,
          isActive: true
        }
        
        // Vérifier si le fournisseur existe déjà
        const existing = await prisma.supplier.findFirst({
          where: {
            OR: [
              { email: supplierData.email },
              { name: supplierData.name }
            ]
          }
        })
        
        if (existing) {
          await prisma.supplier.update({
            where: { id: existing.id },
            data: supplierData
          })
          console.log(`  ♻️  ${supplierData.name} - Mis à jour`)
          updated++
        } else {
          await prisma.supplier.create({
            data: supplierData
          })
          console.log(`  ✅ ${supplierData.name} - Créé`)
          imported++
        }
        
      } catch (error) {
        console.error(`❌ Erreur ligne ${i + 1}: ${error.message}`)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Import terminé!`)
    console.log(`   - Fournisseurs créés: ${imported}`)
    console.log(`   - Fournisseurs mis à jour: ${updated}`)
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
    console.error('❌ Usage: node scripts/import-suppliers-csv.js chemin/vers/fichier.csv')
    process.exit(1)
  }
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Fichier introuvable: ${csvFilePath}`)
    process.exit(1)
  }
  
  importSuppliers(csvFilePath)
    .then(() => {
      console.log('\n✅ Script terminé')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { importSuppliers }
