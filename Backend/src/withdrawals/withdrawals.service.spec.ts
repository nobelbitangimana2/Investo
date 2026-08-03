import { Test, TestingModule } from '@nestjs/testing';
import { WithdrawalsService } from './withdrawals.service';
import { PrismaService } from '../prisma/prisma.service';
import { InterestService } from '../investments/interest.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Investment, InvestmentStatus, InvestmentPeriod } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

function makeInv(
  id: string,
  principal: number,
  accrued: number,
): Investment {
  return {
    id,
    clientId: 'client-1',
    depositId: `dep-${id}`,
    originalPrincipal: principal as unknown as Investment['originalPrincipal'],
    currentPrincipal: principal as unknown as Investment['currentPrincipal'],
    accruedInterest: accrued as unknown as Investment['accruedInterest'],
    interestRate: 0.35 as unknown as Investment['interestRate'],
    investmentPeriod: InvestmentPeriod.ONE_YEAR,
    confirmationDate: new Date(),
    maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    lastInterestUpdate: new Date(),
    status: InvestmentStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Investment;
}

describe('WithdrawalsService.calculateDeductions', () => {
  let service: WithdrawalsService;

  const mockPrisma = { withdrawal: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() }, investment: { findMany: jest.fn() }, user: { findUnique: jest.fn() }, $transaction: jest.fn() };
  const mockInterest = { updateAccruedInterest: jest.fn() };
  const mockNotifications = { create: jest.fn(), notifyStaff: jest.fn() };
  const mockAuditLogs = { log: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InterestService, useValue: mockInterest },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AuditLogsService, useValue: mockAuditLogs },
      ],
    }).compile();

    service = module.get<WithdrawalsService>(WithdrawalsService);
  });

  // ── Empty investments ─────────────────────────────────────────────
  it('returns empty array when no investments', () => {
    const result = service.calculateDeductions([], 1000);
    expect(result).toEqual([]);
  });

  // ── Single investment — interest covers full withdrawal ───────────
  it('single investment: deducts from interest only when sufficient', () => {
    const inv = makeInv('inv-1', 5000, 500);
    const results = service.calculateDeductions([inv], 300);

    expect(results).toHaveLength(1);
    expect(results[0].interestUsed).toBe(300);
    expect(results[0].principalUsed).toBe(0);
    expect(results[0].newAccruedInterest).toBe(200);
    expect(results[0].newPrincipal).toBe(5000);
  });

  // ── Single investment — interest insufficient, spills to principal ─
  it('single investment: spills to principal when interest insufficient', () => {
    // Principal 5000, interest 100, withdraw 500
    const inv = makeInv('inv-1', 5000, 100);
    const results = service.calculateDeductions([inv], 500);

    expect(results[0].interestUsed).toBe(100);
    expect(results[0].principalUsed).toBe(400);
    expect(results[0].newAccruedInterest).toBe(0);
    expect(results[0].newPrincipal).toBe(4600);
  });

  // ── Single investment — over-limit still runs (guard is upstream) ─
  it('single investment: consumes all available if amount equals total balance', () => {
    const inv = makeInv('inv-1', 5000, 100);
    const results = service.calculateDeductions([inv], 5100);

    expect(results[0].newPrincipal).toBe(0);
    expect(results[0].newAccruedInterest).toBe(0);
  });

  // ── Multiple investments — proportional allocation ────────────────
  it('multiple investments: distributes proportionally (example from spec)', () => {
    // Investment A: principal $2000, interest $100 → value $2100
    // Investment B: principal $5000, interest $200 → value $5200
    // Investment C: principal $3000, interest $100 → value $3100
    // Total portfolio: $10,400
    // Withdrawal: $2,080 → ratio = 20%
    const invA = makeInv('A', 2000, 100);
    const invB = makeInv('B', 5000, 200);
    const invC = makeInv('C', 3000, 100);

    const results = service.calculateDeductions([invA, invB, invC], 2080);

    expect(results).toHaveLength(3);

    const rA = results.find((r) => r.investmentId === 'A')!;
    const rB = results.find((r) => r.investmentId === 'B')!;
    const rC = results.find((r) => r.investmentId === 'C')!;

    // A contributes 20% of $2100 = $420
    expect(rA.interestUsed).toBeCloseTo(100, 1);   // interest = $100 → fully used
    expect(rA.principalUsed).toBeCloseTo(320, 1);   // remaining $320 from principal
    expect(rA.newPrincipal).toBeCloseTo(1680, 1);
    expect(rA.newAccruedInterest).toBeCloseTo(0, 1);

    // B contributes 20% of $5200 = $1040
    expect(rB.interestUsed).toBeCloseTo(200, 1);
    expect(rB.principalUsed).toBeCloseTo(840, 1);
    expect(rB.newPrincipal).toBeCloseTo(4160, 1);
    expect(rB.newAccruedInterest).toBeCloseTo(0, 1);

    // C contributes 20% of $3100 = $620
    expect(rC.interestUsed).toBeCloseTo(100, 1);
    expect(rC.principalUsed).toBeCloseTo(520, 1);
    expect(rC.newPrincipal).toBeCloseTo(2480, 1);
    expect(rC.newAccruedInterest).toBeCloseTo(0, 1);

    // Total deducted should equal $2080
    const totalDeducted = results.reduce(
      (s, r) => s + r.interestUsed + r.principalUsed,
      0,
    );
    expect(totalDeducted).toBeCloseTo(2080, 1);
  });

  // ── Multiple investments — partial interest coverage ──────────────
  it('multiple investments: each investment uses interest first', () => {
    // Both investments have interest > their allocation
    const invA = makeInv('A', 10000, 5000); // value 15000
    const invB = makeInv('B', 10000, 5000); // value 15000
    // Total = 30000, withdraw 3000 (10%)
    const results = service.calculateDeductions([invA, invB], 3000);

    results.forEach((r) => {
      // Each gets 1500 allocation, interest is 5000 so fully covered
      expect(r.principalUsed).toBeCloseTo(0, 1);
      expect(r.interestUsed).toBeCloseTo(1500, 1);
      expect(r.newPrincipal).toBeCloseTo(10000, 1);
    });
  });

  // ── Over-limit guard in create() ─────────────────────────────────
  it('create() throws BadRequestException when amount exceeds portfolio', async () => {
    mockPrisma.investment.findMany.mockResolvedValueOnce([
      makeInv('inv-1', 1000, 50),
    ]);

    await expect(
      service.create('client-1', {
        fullName: 'Test',
        bankToTransferTo: 'BCB' as any,
        accountNumber: 'BCB-001',
        recipientName: 'Test',
        amount: 999999, // exceeds 1050
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
