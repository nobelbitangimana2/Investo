-- CreateTable
CREATE TABLE "PartnerBank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "accountName" TEXT NOT NULL DEFAULT 'Investo',
    "accountNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerBank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerBank_name_key" ON "PartnerBank"("name");

-- CreateIndex
CREATE INDEX "PartnerBank_isActive_idx" ON "PartnerBank"("isActive");
