-- AlterTable
ALTER TABLE "users" ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "users" ADD COLUMN "approvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_isApproved_idx" ON "users"("isApproved");
