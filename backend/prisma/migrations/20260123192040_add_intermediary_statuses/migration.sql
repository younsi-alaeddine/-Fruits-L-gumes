-- AlterEnum
-- Ajouter les nouveaux statuts AGGREGATED et SUPPLIER_ORDERED
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AGGREGATED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'SUPPLIER_ORDERED';

-- AlterTable: Order
-- Ajouter supplierOrderId et aggregatedAt
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "supplierOrderId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "aggregatedAt" TIMESTAMP(3);

-- AlterTable: OrderItem
-- Ajouter quantityDelivered
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "quantityDelivered" DOUBLE PRECISION;

-- AlterTable: SupplierOrder
-- Ajouter la relation orders (via foreign key)
-- Note: La relation est déjà définie dans le schéma, cette migration ajoute juste les index

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_supplierOrderId_idx" ON "orders"("supplierOrderId");
CREATE INDEX IF NOT EXISTS "orders_aggregatedAt_idx" ON "orders"("aggregatedAt");

-- AddForeignKey
-- La foreign key sera créée automatiquement par Prisma lors de la génération du client
-- Mais on peut l'ajouter manuellement pour être sûr
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_supplierOrderId_fkey'
  ) THEN
    ALTER TABLE "orders" 
    ADD CONSTRAINT "orders_supplierOrderId_fkey" 
    FOREIGN KEY ("supplierOrderId") 
    REFERENCES "supplier_orders"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
  END IF;
END $$;
