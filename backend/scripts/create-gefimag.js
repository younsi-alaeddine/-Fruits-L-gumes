/* eslint-disable no-console */
/**
 * Script pour créer le groupe GEFIMAG avec ses 6 magasins.
 * 
 * Magasins:
 * - Dupkeix
 * - Sodislet
 * - Dodis
 * - Cedibat
 * - VH
 * - Distrisevres
 */

const prisma = require('../config/database');

const GEFIMAG_SHOPS = [
  { name: 'Dupkeix', city: 'Paris', postalCode: '75001' },
  { name: 'Sodislet', city: 'Paris', postalCode: '75002' },
  { name: 'Dodis', city: 'Paris', postalCode: '75003' },
  { name: 'Cedibat', city: 'Paris', postalCode: '75004' },
  { name: 'VH', city: 'Paris', postalCode: '75005' },
  { name: 'Distrisevres', city: 'Paris', postalCode: '75006' }
];

async function main() {
  console.log('🔄 Création du groupe GEFIMAG avec ses magasins...');

  try {
    // Créer l'organisation GEFIMAG
    let organization = await prisma.organization.findFirst({
      where: { name: 'GEFIMAG' }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'GEFIMAG',
          status: 'ACTIVE'
        }
      });
      console.log(`✅ Organisation créée: ${organization.name} (${organization.id})`);
    } else {
      console.log(`ℹ️  Organisation existante trouvée: ${organization.name} (${organization.id})`);
    }

    // Créer ou mettre à jour les magasins
    const createdShops = [];
    for (const shopData of GEFIMAG_SHOPS) {
      let shop = await prisma.shop.findFirst({
        where: {
          name: shopData.name,
          organizationId: organization.id
        }
      });

      if (!shop) {
        shop = await prisma.shop.create({
          data: {
            name: shopData.name,
            address: `Adresse ${shopData.name}`,
            city: shopData.city,
            postalCode: shopData.postalCode,
            organizationId: organization.id
          }
        });
        console.log(`✅ Magasin créé: ${shop.name} (${shop.id})`);
      } else {
        // Mettre à jour l'organisation si nécessaire
        if (shop.organizationId !== organization.id) {
          shop = await prisma.shop.update({
            where: { id: shop.id },
            data: { organizationId: organization.id }
          });
          console.log(`🔄 Magasin mis à jour: ${shop.name} (${shop.id})`);
        } else {
          console.log(`ℹ️  Magasin existant: ${shop.name} (${shop.id})`);
        }
      }
      createdShops.push(shop);
    }

    // Vérifier si un utilisateur "Didier" existe pour GEFIMAG, sinon créer un utilisateur de démo
    let user = await prisma.user.findFirst({
      where: {
        email: 'didier@gefimag.fr'
      }
    });

    if (!user) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('didier123', 10);
      
      user = await prisma.user.create({
        data: {
          name: 'Didier',
          email: 'didier@gefimag.fr',
          password: hashedPassword,
          role: 'CLIENT',
          emailVerified: true
        }
      });
      console.log(`✅ Utilisateur créé: ${user.name} (${user.email})`);
    } else {
      console.log(`ℹ️  Utilisateur existant: ${user.name} (${user.email})`);
    }

    // Créer le membership pour Didier dans GEFIMAG
    let membership = await prisma.membership.findFirst({
      where: {
        organizationId: organization.id,
        userId: user.id
      }
    });

    if (!membership) {
      membership = await prisma.membership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          status: 'ACTIVE'
        }
      });
      console.log(`✅ Membership créé pour ${user.name} dans ${organization.name}`);
    } else {
      console.log(`ℹ️  Membership existant pour ${user.name} dans ${organization.name}`);
    }

    // Créer les shopMemberships pour tous les magasins
    for (const shop of createdShops) {
      const shopMembership = await prisma.shopMembership.findFirst({
        where: {
          membershipId: membership.id,
          shopId: shop.id
        }
      });

      if (!shopMembership) {
        await prisma.shopMembership.create({
          data: {
            membershipId: membership.id,
            shopId: shop.id,
            status: 'ACTIVE'
          }
        });
        console.log(`✅ ShopMembership créé: ${shop.name} pour ${user.name}`);
      } else {
        console.log(`ℹ️  ShopMembership existant: ${shop.name} pour ${user.name}`);
      }
    }

    console.log('✅ Groupe GEFIMAG créé avec succès !');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Mot de passe: didier123`);
    console.log(`🏪 Nombre de magasins: ${createdShops.length}`);
  } catch (error) {
    console.error('❌ Erreur lors de la création du groupe GEFIMAG:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Script échoué:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
