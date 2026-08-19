import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PartnerBanksService } from './partner-banks.service';
import { CreatePartnerBankDto, UpdatePartnerBankDto } from './dto';

@Controller('partner-banks')
export class PartnerBanksController {
  constructor(private readonly service: PartnerBanksService) {}

  // Public endpoint — used by deposit forms (no auth required)
  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  // Admin only: list all banks (including inactive)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Admin only: get one bank
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Admin only: create bank
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreatePartnerBankDto) {
    return this.service.create(dto);
  }

  // Admin only: update bank
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePartnerBankDto) {
    return this.service.update(id, dto);
  }

  // Admin only: delete bank
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
