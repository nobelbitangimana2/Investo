import { Test, TestingModule } from '@nestjs/testing';
import { InterestService } from './interest.service';
import { PrismaService } from '../prisma/prisma.service';
import { Investment, InvestmentStatus, InvestmentPeriod } from '@prisma/client';

// ── Minimal mock Investment factory ──────────────────────────────────────────
function makeInvestment(overrides: Partial<Investment> = {}): Investment {
  const now = new Date('2024-01-01T00:00:00Z');
  const maturity = new Date('2025-01-01T00:00:00Z');
  return {
    id: 'inv-test-1',
    clientId: 'client-1',
    depositId: 'dep-1',
    originalPrincipal: 10000000 as unknown as Investment['originalPrincipal'],
    currentPrincipal: 10000000 as unknown as Investment['currentPrincipal'],
    accruedInterest: 0 as unknown as Investment['accruedInterest'],
    interestRate: 0.35 as unknown as Investment['interestRate'],   // 35% p.a.
    investmentPeriod: InvestmentPeriod.ONE_YEAR,
    confirmationDate: now,
    maturityDate: maturity,
    lastInterestUpdate: now,
    status: InvestmentStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as unknown as Investment;
}

describe('InterestService', () => {
  let service: InterestService;

  const mockPrisma = {
    investment: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterestService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InterestService>(InterestService);
    jest.clearAllMocks();
  });

  // ── calculateDailyInterest ────────────────────────────────────────
  describe('calculateDailyInterest', () => {
    it('computes ACT/365 daily interest correctly', () => {
      const inv = makeInvestment({
        currentPrincipal: 10_000_000 as unknown as Investment['currentPrincipal'],
        interestRate: 0.35 as unknown as Investment['interestRate'],
      });
      const daily = service.calculateDailyInterest(inv);
      // 10_000_000 * 0.35 / 365 ≈ 9589.04
      expect(daily).toBeCloseTo(9589.04, 1);
    });

    it('returns 0 for zero principal', () => {
      const inv = makeInvestment({
        currentPrincipal: 0 as unknown as Investment['currentPrincipal'],
      });
      expect(service.calculateDailyInterest(inv)).toBe(0);
    });

    it('scales linearly with principal', () => {
      const inv1 = makeInvestment({ currentPrincipal: 5_000_000 as unknown as Investment['currentPrincipal'] });
      const inv2 = makeInvestment({ currentPrincipal: 10_000_000 as unknown as Investment['currentPrincipal'] });
      expect(service.calculateDailyInterest(inv2)).toBeCloseTo(
        service.calculateDailyInterest(inv1) * 2,
        5,
      );
    });
  });

  // ── calculateMaturityValue ────────────────────────────────────────
  describe('calculateMaturityValue', () => {
    it('returns at least currentPrincipal + accruedInterest', () => {
      const inv = makeInvestment({
        currentPrincipal: 10_000_000 as unknown as Investment['currentPrincipal'],
        accruedInterest: 500_000 as unknown as Investment['accruedInterest'],
        maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days away
      });
      const mv = service.calculateMaturityValue(inv);
      expect(mv).toBeGreaterThanOrEqual(10_500_000);
    });

    it('equals principal + accrued interest when past maturity', () => {
      const inv = makeInvestment({
        currentPrincipal: 10_000_000 as unknown as Investment['currentPrincipal'],
        accruedInterest: 3_500_000 as unknown as Investment['accruedInterest'],
        maturityDate: new Date('2020-01-01'), // past maturity
      });
      const mv = service.calculateMaturityValue(inv);
      expect(mv).toBe(13_500_000);
    });
  });

  // ── updateAccruedInterest ─────────────────────────────────────────
  describe('updateAccruedInterest', () => {
    it('skips matured investments', async () => {
      mockPrisma.investment.findUniqueOrThrow.mockResolvedValueOnce(
        makeInvestment({ status: InvestmentStatus.MATURED }),
      );
      await service.updateAccruedInterest('inv-test-1');
      expect(mockPrisma.investment.update).not.toHaveBeenCalled();
    });

    it('accrues correct interest for 30 days', async () => {
      const lastUpdate = new Date('2024-01-01T00:00:00Z');
      const now = new Date('2024-01-31T00:00:00Z'); // 30 days later
      jest.useFakeTimers().setSystemTime(now);

      const inv = makeInvestment({
        currentPrincipal: 10_000_000 as unknown as Investment['currentPrincipal'],
        accruedInterest: 0 as unknown as Investment['accruedInterest'],
        interestRate: 0.35 as unknown as Investment['interestRate'],
        lastInterestUpdate: lastUpdate,
        maturityDate: new Date('2025-01-01'),
      });

      mockPrisma.investment.findUniqueOrThrow.mockResolvedValueOnce(inv);
      mockPrisma.investment.update.mockResolvedValueOnce({
        ...inv,
        accruedInterest: 287671.23,
        lastInterestUpdate: now,
      });

      await service.updateAccruedInterest('inv-test-1');

      const updateCall = mockPrisma.investment.update.mock.calls[0][0];
      const newAccrued = updateCall.data.accruedInterest as number;
      // 10_000_000 * 0.35 / 365 * 30 ≈ 287_671.23
      expect(newAccrued).toBeCloseTo(287_671.23, 0);

      jest.useRealTimers();
    });
  });
});
