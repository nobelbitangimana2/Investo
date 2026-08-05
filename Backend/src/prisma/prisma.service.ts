import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
    // Override Decimal serialization so all Decimal fields come through
    // as plain JS numbers in JSON responses instead of Decimal objects.
    // This prevents NaN on the frontend when doing arithmetic.
    (Prisma.Decimal.prototype as unknown as Record<string, unknown>).toJSON =
      function () {
        return parseFloat(this.toString());
      };
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
