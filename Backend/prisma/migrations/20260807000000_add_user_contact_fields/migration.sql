-- Add contact info fields directly to User table (available to all roles)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone"    TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address"  TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city"     TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "province" TEXT;
