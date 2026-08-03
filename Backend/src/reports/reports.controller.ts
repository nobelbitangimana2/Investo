import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.ACCOUNTANT)
@Permissions('generateReports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Combined dashboard summary widgets' })
  dashboard() {
    return this.service.dashboard();
  }

  @Get('deposits')
  @ApiOperation({ summary: 'Deposit reports: totals, by bank, by period, by status, trends' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  deposits(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.depositReport(from, to);
  }

  @Get('investments')
  @ApiOperation({ summary: 'Investment reports: active/matured, returns, maturity calendar' })
  investments() {
    return this.service.investmentReport();
  }

  @Get('clients')
  @ApiOperation({ summary: 'Client reports: count, new registrations, top investors' })
  clients() {
    return this.service.clientReport();
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Withdrawal reports: totals and status breakdown' })
  withdrawals() {
    return this.service.withdrawalReport();
  }
}
