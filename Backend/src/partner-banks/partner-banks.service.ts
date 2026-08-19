import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerBankDto, UpdatePartnerBankDto } from './dto';

@Injectable()
export class PartnerBanksService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.partnerBank.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findActive() {
    return this.prisma.partnerBank.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const bank = await this.prisma.partnerBank.findUnique({ where: { id } });
    if (!bank) throw new NotFoundException('Partner bank not found');
    return bank;
  }

  async create(dto: CreatePartnerBankDto) {
    return this.prisma.partnerBank.create({ data: dto });
  }

  async update(id: string, dto: UpdatePartnerBankDto) {
    await this.findOne(id); // Check existence
    return this.prisma.partnerBank.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    await this.prisma.partnerBank.delete({ where: { id } });
    return { message: 'Partner bank deleted successfully' };
  }
}
