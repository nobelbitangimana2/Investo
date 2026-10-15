/**
 * Investo — Production seed
 *
 * Creates only the two real users:
 *   Admin:  Sonny Bryton Nishimwe  /  brytontoni@gmail.com   / admin1234
 *   Client: Alain Bitangimana      /  nobelbitangimana2@gmail.com / nobel1234
 *
 * Run with:  npm run prisma:seed
 */

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT = 12;

async function main() {
  console.log('🌱 Seeding production database...');

  // ── 1. Admin: Sonny Bryton Nishimwe ────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'brytontoni@gmail.com' },
    update: {
      name: 'Sonny Bryton Nishimwe',
      passwordHash: await bcrypt.hash('admin1234', SALT),
      role: Role.ADMIN,
      emailVerified: true,
    },
    create: {
      name: 'Sonny Bryton Nishimwe',
      email: 'brytontoni@gmail.com',
      passwordHash: await bcrypt.hash('admin1234', SALT),
      role: Role.ADMIN,
      emailVerified: true,
    },
  });
  console.log('✅ Admin created: Sonny Bryton Nishimwe (brytontoni@gmail.com)');

  // ── 2. Client: Alain Bitangimana ────────────────────────────────────────
  const client = await prisma.user.upsert({
    where: { email: 'nobelbitangimana2@gmail.com' },
    update: {
      name: 'Alain Bitangimana',
      passwordHash: await bcrypt.hash('nobel1234', SALT),
      role: Role.CLIENT,
      emailVerified: true,
    },
    create: {
      name: 'Alain Bitangimana',
      email: 'nobelbitangimana2@gmail.com',
      passwordHash: await bcrypt.hash('nobel1234', SALT),
      role: Role.CLIENT,
      emailVerified: true,
      clientProfile: {
        create: {
          firstName: 'Alain',
          lastName: 'Bitangimana',
          country: 'Burundi',
        },
      },
    },
  });
  console.log('✅ Client created: Alain Bitangimana (nobelbitangimana2@gmail.com)');

  console.log('\n🎉 Seed complete!');
  console.log('');
  console.log('  Admin:  brytontoni@gmail.com        / admin1234');
  console.log('  Client: nobelbitangimana2@gmail.com / nobel1234');
  console.log('');
  console.log('⚠️  To apply: run "npm run prisma:seed" in the Backend/ directory.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
