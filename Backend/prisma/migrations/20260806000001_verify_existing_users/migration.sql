-- Mark all existing users as email-verified.
-- These accounts were created before the email verification system existed
-- (seeded admin, accountants, and early clients) so they should not be locked out.
UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false;
