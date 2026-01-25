/* eslint-disable no-console */
/**
 * Backfill multi-tenant / multi-shop structures.
 *
 * - Creates an Organization per existing CLIENT (shop owner userId) if missing
 * - Links Shop.organizationId
 * - Creates Membership (user <-> org)
 * - Creates ShopMembership (membership <-> shop)
 * - Seeds ShopStock for each (shop, product) from legacy Product.stock/stockAlert
 *
 * Safe to re-run (uses upserts / existence checks).
 */

const prisma = require('../config/database');

async function main() {
  console.log('🔄 Backfill multi-shop: start');

  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      name: true,
      userId: true,
      organizationId: true,
    },
  });

  // Create an "Administration" org for non-client internal roles if needed later
  // (not used in this first pass)

  // 1) Ensure organizations + link to shops
  for (const shop of shops) {
    if (shop.organizationId) continue;

    // If shop has an owning user, we group by owner userId (so 1 owner can later have multiple shops)
    const ownerUserId = shop.userId || null;

    let organization = null;

    if (ownerUserId) {
      // Try find an existing org already created for this owner (by membership)
      const existingMembership = await prisma.membership.findFirst({
        where: { userId: ownerUserId },
        select: { organizationId: true },
      });
      if (existingMembership?.organizationId) {
        organization = await prisma.organization.findUnique({
          where: { id: existingMembership.organizationId },
          select: { id: true },
        });
      }
    }

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: ownerUserId ? `Organisation ${shop.name}` : `Organisation ${shop.name}`,
        },
        select: { id: true },
      });
      console.log(`✅ Organization created for shop "${shop.name}": ${organization.id}`);
    }

    await prisma.shop.update({
      where: { id: shop.id },
      data: { organizationId: organization.id },
    });

    // 2) Ensure membership + shop membership for owner user
    if (ownerUserId) {
      const membership = await prisma.membership.upsert({
        where: { organizationId_userId: { organizationId: organization.id, userId: ownerUserId } },
        update: {},
        create: { organizationId: organization.id, userId: ownerUserId },
        select: { id: true },
      });

      await prisma.shopMembership.upsert({
        where: { membershipId_shopId: { membershipId: membership.id, shopId: shop.id } },
        update: {},
        create: { membershipId: membership.id, shopId: shop.id },
      });
    }
  }

  // 3) Seed shop stock from legacy Product.stock for each shop
  const linkedShops = await prisma.shop.findMany({
    where: { organizationId: { not: null } },
    select: { id: true, organizationId: true },
  });

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, stock: true, stockAlert: true },
  });

  let createdCount = 0;
  for (const shop of linkedShops) {
    for (const product of products) {
      await prisma.shopStock.upsert({
        where: { shopId_productId: { shopId: shop.id, productId: product.id } },
        update: {},
        create: {
          organizationId: shop.organizationId,
          shopId: shop.id,
          productId: product.id,
          quantity: product.stock ?? 0,
          threshold: product.stockAlert ?? 10,
        },
      });
      createdCount += 1;
    }
  }

  console.log(`✅ ShopStock upserted rows: ${createdCount}`);
  console.log('✅ Backfill multi-shop: done');
}

main()
  .catch((e) => {
    console.error('❌ Backfill multi-shop failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

