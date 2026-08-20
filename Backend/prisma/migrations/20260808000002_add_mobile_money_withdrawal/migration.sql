-- CreateTable: MobileMoneyWithdrawal
-- Stores phone numbers for Lumicash/Ecocash withdrawals

CREATE TABLE "MobileMoneyWithdrawal" (
    "id"           TEXT NOT NULL,
    "withdrawalId" TEXT NOT NULL,
    "phoneNumber"  TEXT NOT NULL,
    "provider"     "Bank" NOT NULL,

    CONSTRAINT "MobileMoneyWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MobileMoneyWithdrawal_withdrawalId_key" ON "MobileMoneyWithdrawal"("withdrawalId");

-- AddForeignKey
ALTER TABLE "MobileMoneyWithdrawal"
    ADD CONSTRAINT "MobileMoneyWithdrawal_withdrawalId_fkey"
    FOREIGN KEY ("withdrawalId") REFERENCES "Withdrawal"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
