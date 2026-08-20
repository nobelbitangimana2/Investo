import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role, InvestmentPeriod } from '@prisma/client';
import { InterestRatesService } from './interest-rates.service';
import { UpsertRateDto } from './dto/upsert-rate.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('interest-rates')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('interest-rates')
export class InterestRatesController {
  constructor(private readonly service: InterestRatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all interest rates' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create or update an interest rate (admin)' })
  upsert(@Body() dto: UpsertRateDto, @CurrentUser() admin: User) {
    return this.service.upsert(dto, admin.id);
  }

  @Patch(':period')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a specific period rate (admin)' })
  update(
    @Param('period') period: InvestmentPeriod,
    @Body() dto: UpsertRateDto,
    @CurrentUser() admin: User,
  ) {
    return this.service.upsert({ ...dto, investmentPeriod: period }, admin.id);
  }

  @Delete(':period')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an interest rate for a period (admin)' })
  remove(
    @Param('period') period: InvestmentPeriod,
    @CurrentUser() admin: User,
  ) {
    return this.service.delete(period, admin.id);
  }
}
