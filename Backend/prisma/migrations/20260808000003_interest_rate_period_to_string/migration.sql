-- AlterTable: change InterestRate.investmentPeriod from enum to TEXT
-- This allows admins to define custom period names beyond the fixed enum values.

-- Step 1: Add a temporary text column
ALTER TABLE "InterestRate" ADD COLUMN "investmentPeriod_text" TEXT;

-- Step 2: Copy existing enum values as strings
UPDATE "InterestRate" SET "investmentPeriod_text" = "investmentPeriod"::TEXT;

-- Step 3: Drop the old enum column
ALTER TABLE "InterestRate" DROP COLUMN "investmentPeriod";

-- Step 4: Rename the text column to the original name
ALTER TABLE "InterestRate" RENAME COLUMN "investmentPeriod_text" TO "investmentPeriod";

-- Step 5: Make it NOT NULL and add unique constraint
ALTER TABLE "InterestRate" ALTER COLUMN "investmentPeriod" SET NOT NULL;
ALTER TABLE "InterestRate" ADD CONSTRAINT "InterestRate_investmentPeriod_key" UNIQUE ("investmentPeriod");
