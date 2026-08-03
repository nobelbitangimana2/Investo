/**
 * Investo — Prisma seed
 * Run with:  npx ts-node prisma/seed.ts
 *       or:  npm run prisma:seed
 */

import {
  PrismaClient,
  Role,
  Bank,
  InvestmentPeriod,
  DepositStatus,
  WithdrawalStatus,
  InvestmentStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT = 12;

async function main() {
  console.log('🌱 Seeding database...');

  // ── Interest Rates ──────────────────────────────────────────────
  const rates = [
    { investmentPeriod: InvestmentPeriod.WEEKLY,       ratePercentage: 1.5   },
    { investmentPeriod: InvestmentPeriod.MONTHLY,      ratePercentage: 5.0   },
    { investmentPeriod: InvestmentPeriod.THREE_MONTHS, ratePercentage: 12.0  },
    { investmentPeriod: InvestmentPeriod.SIX_MONTHS,   ratePercentage: 20.0  },
    { investmentPeriod: InvestmentPeriod.ONE_YEAR,     ratePercentage: 35.0  },
    { investmentPeriod: InvestmentPeriod.FIVE_YEARS,   ratePercentage: 120.0 },
  ];

  for (const rate of rates) {
    await prisma.interestRate.upsert({
      where: { investmentPeriod: rate.investmentPeriod },
      update: { ratePercentage: rate.ratePercentage },
      create: rate,
    });
  }
  console.log('✅ Interest rates seeded');

  // ── Admin user ──────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@investo.bi' },
    update: {},
    create: {
      name: 'Emmanuel Nkurunziza',
      email: 'admin@investo.bi',
      passwordHash: await bcrypt.hash('Admin@2024!', SALT),
      role: Role.ADMIN,
      profilePicture: 'https://api.dicebear.com/7.x/initials/svg?seed=EN',
    },
  });

  // ── Accountant 1 ────────────────────────────────────────────────
  const acc1 = await prisma.user.upsert({
    where: { email: 'grace@investo.bi' },
    update: {},
    create: {
      name: 'Grace Iradukunda',
      email: 'grace@investo.bi',
      passwordHash: await bcrypt.hash('Grace@2024!', SALT),
      role: Role.ACCOUNTANT,
      profilePicture: 'https://api.dicebear.com/7.x/initials/svg?seed=GI',
      accountantPermission: {
        create: {
          viewDeposits: true,
          confirmDeposits: true,
          rejectDeposits: true,
          viewWithdrawals: true,
          confirmWithdrawals: true,
          rejectWithdrawals: false,
          generateReports: true,
        },
      },
    },
  });

  // ── Accountant 2 ────────────────────────────────────────────────
  const acc2 = await prisma.user.upsert({
    where: { email: 'patrick@investo.bi' },
    update: {},
    create: {
      name: 'Patrick Hakizimana',
      email: 'patrick@investo.bi',
      passwordHash: await bcrypt.hash('Patrick@2024!', SALT),
      role: Role.ACCOUNTANT,
      profilePicture: 'https://api.dicebear.com/7.x/initials/svg?seed=PH',
      accountantPermission: {
        create: {},  // all false by default
      },
    },
  });

  // ── Clients ─────────────────────────────────────────────────────
  const clientSeeds = [
    {
      name: 'Kevin Mutabazi', email: 'kevin@example.com', seed: 'KM',
      profile: { firstName: 'Kevin', lastName: 'Mutabazi', phone: '+257 79 123 456',
        city: 'Bujumbura', bankName: Bank.BCB, accountNumber: 'BCB-00123456',
        accountHolderName: 'Kevin Mutabazi' },
    },
    {
      name: 'Alice Niyonzima', email: 'alice@example.com', seed: 'AN',
      profile: { firstName: 'Alice', lastName: 'Niyonzima', phone: '+257 69 234 567',
        city: 'Bujumbura', bankName: Bank.BANCOBU, accountNumber: 'BNB-00234567',
        accountHolderName: 'Alice Niyonzima' },
    },
    {
      name: 'Jean-Pierre Havyarimana', email: 'jpierre@example.com', seed: 'JP',
      profile: { firstName: 'Jean-Pierre', lastName: 'Havyarimana', phone: '+257 78 345 678',
        city: 'Ngozi', bankName: Bank.KCB, accountNumber: 'KCB-00345678',
        accountHolderName: 'Jean-Pierre Havyarimana' },
    },
    {
      name: 'Marie-Claire Uwimana', email: 'mclaire@example.com', seed: 'MC',
      profile: { firstName: 'Marie-Claire', lastName: 'Uwimana', phone: '+257 68 456 789',
        city: 'Gitega', bankName: Bank.ECOBANK, accountNumber: 'ECO-00456789',
        accountHolderName: 'Marie-Claire Uwimana' },
    },
  ];

  const clients: { id: string; name: string }[] = [];
  for (const c of clientSeeds) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        name: c.name,
        email: c.email,
        passwordHash: await bcrypt.hash('Client@2024!', SALT),
        role: Role.CLIENT,
        profilePicture: `https://api.dicebear.com/7.x/initials/svg?seed=${c.seed}`,
        clientProfile: { create: c.profile },
      },
    });
    clients.push({ id: user.id, name: user.name });
  }
  console.log(`✅ ${clients.length} clients seeded`);

  // ── Deposits & Investments for Kevin ────────────────────────────
  const kevin = clients[0];
  const dep1 = await prisma.deposit.create({
    data: {
      clientId: kevin.id,
      fullName: kevin.name,
      bank: Bank.BCB,
      accountNumber: 'BCB-00123456',
      amount: 5000000,
      depositDate: new Date('2024-01-10'),
      investmentPeriod: InvestmentPeriod.SIX_MONTHS,
      referenceNumber: 'BCB-REF-20240110-001',
      status: DepositStatus.CONFIRMED,
      verifiedById: admin.id,
      verifiedAt: new Date('2024-01-11'),
      investment: {
        create: {
          clientId: kevin.id,
          originalPrincipal: 5000000,
          currentPrincipal: 4600000,
          accruedInterest: 0,
          interestRate: 0.20,
          investmentPeriod: InvestmentPeriod.SIX_MONTHS,
          confirmationDate: new Date('2024-01-11'),
          maturityDate: new Date('2024-07-11'),
          lastInterestUpdate: new Date('2024-07-11'),
          status: InvestmentStatus.MATURED,
        },
      },
    },
  });

  // Pending deposit
  await prisma.deposit.create({
    data: {
      clientId: kevin.id,
      fullName: kevin.name,
      bank: Bank.BCB,
      accountNumber: 'BCB-00123456',
      amount: 1500000,
      depositDate: new Date('2024-06-20'),
      investmentPeriod: InvestmentPeriod.MONTHLY,
      referenceNumber: 'BCB-REF-20240620-003',
      status: DepositStatus.PENDING,
    },
  });

  // ── Deposit & Investment for Alice ──────────────────────────────
  const alice = clients[1];
  await prisma.deposit.create({
    data: {
      clientId: alice.id,
      fullName: alice.name,
      bank: Bank.BANCOBU,
      accountNumber: 'BNB-00234567',
      amount: 10000000,
      depositDate: new Date('2024-01-20'),
      investmentPeriod: InvestmentPeriod.ONE_YEAR,
      referenceNumber: 'BNB-REF-20240120-001',
      status: DepositStatus.CONFIRMED,
      verifiedById: admin.id,
      verifiedAt: new Date('2024-01-21'),
      investment: {
        create: {
          clientId: alice.id,
          originalPrincipal: 10000000,
          currentPrincipal: 10000000,
          accruedInterest: 1225000,
          interestRate: 0.35,
          investmentPeriod: InvestmentPeriod.ONE_YEAR,
          confirmationDate: new Date('2024-01-21'),
          maturityDate: new Date('2025-01-21'),
          lastInterestUpdate: new Date(),
          status: InvestmentStatus.ACTIVE,
        },
      },
    },
  });

  // Rejected deposit for Alice
  await prisma.deposit.create({
    data: {
      clientId: alice.id,
      fullName: alice.name,
      bank: Bank.BANCOBU,
      accountNumber: 'BNB-00234567',
      amount: 3000000,
      depositDate: new Date('2024-04-15'),
      investmentPeriod: InvestmentPeriod.THREE_MONTHS,
      referenceNumber: 'BNB-REF-20240415-002',
      status: DepositStatus.REJECTED,
      rejectionNote: 'Reference number does not match bank records. Please resubmit.',
      verifiedById: acc1.id,
      verifiedAt: new Date('2024-04-16'),
    },
  });

  // ── Withdrawal for Kevin ─────────────────────────────────────────
  await prisma.withdrawal.create({
    data: {
      clientId: kevin.id,
      fullName: kevin.name,
      bankToTransferTo: Bank.BCB,
      accountNumber: 'BCB-00123456',
      recipientName: kevin.name,
      amount: 1000000,
      status: WithdrawalStatus.CONFIRMED,
      confirmedAt: new Date('2024-04-02'),
    },
  });

  await prisma.withdrawal.create({
    data: {
      clientId: kevin.id,
      fullName: kevin.name,
      bankToTransferTo: Bank.BCB,
      accountNumber: 'BCB-00123456',
      recipientName: kevin.name,
      amount: 500000,
      status: WithdrawalStatus.PENDING,
    },
  });

  // ── Notifications ─────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: kevin.id, title: 'Deposit Confirmed', message: 'Your deposit of 5,000,000 BIF has been confirmed.', type: 'deposit', read: true },
      { userId: kevin.id, title: 'Deposit Pending Review', message: 'Your recent deposit of 1,500,000 BIF is pending verification.', type: 'deposit', read: false },
      { userId: alice.id, title: 'Deposit Rejected', message: 'Your deposit of 3,000,000 BIF has been rejected. Please check details.', type: 'deposit', read: false },
      { userId: admin.id, title: 'New Deposit Submitted', message: `Kevin Mutabazi submitted a deposit of 1,500,000 BIF (Monthly) — pending review.`, type: 'deposit', read: false },
    ],
  });

  // ── Audit Logs ────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'CONFIRM_DEPOSIT', details: `Confirmed deposit for Kevin Mutabazi (5,000,000 BIF)`, targetType: 'deposit' },
      { userId: admin.id, action: 'CONFIRM_DEPOSIT', details: `Confirmed deposit for Alice Niyonzima (10,000,000 BIF)`, targetType: 'deposit' },
      { userId: acc1.id, action: 'REJECT_DEPOSIT', details: `Rejected deposit for Alice Niyonzima (3,000,000 BIF). Reference mismatch.`, targetType: 'deposit' },
      { userId: admin.id, action: 'CREATE_ACCOUNTANT', details: `Created accountant account for Grace Iradukunda`, targetType: 'accountant' },
      { userId: admin.id, action: 'UPDATE_INTEREST_RATE', details: `Updated ONE_YEAR rate to 35%`, targetType: 'interestRate' },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin:       admin@investo.bi    / Admin@2024!');
  console.log('  Accountant:  grace@investo.bi    / Grace@2024!');
  console.log('  Accountant:  patrick@investo.bi  / Patrick@2024!');
  console.log('  Client:      kevin@example.com   / Client@2024!');
  console.log('  Client:      alice@example.com   / Client@2024!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
