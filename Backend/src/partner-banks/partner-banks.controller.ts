import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PartnerBanksService } from './partner-banks.service';
import { CreatePartnerBankDto, UpdatePartnerBankDto } from './dto';

@Controller('partner-banks')
export class PartnerBanksController {
  constructor(private readonly service: PartnerBanksService) {}

  // Public endpoint: Get active banks (for deposit forms)
  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  // Admin only: Get all banks
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Admin only: Get one bank
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Admin only: Create bank
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreatePartnerBankDto) {
    return this.service.create(dto);
  }

  // Admin only: Update bank
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePartnerBankDto) {
    return this.service.update(id, dto);
  }

  // Admin only: Delete bank
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
