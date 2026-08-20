import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { InterestRatesService } from './interest-rates.service';
import { UpsertRateDto } from './dto/upsert-rate.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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
  @ApiOperation({ summary: 'Update a specific period rate by period name (admin)' })
  update(
    @Param('period') period: string,
    @Body() dto: UpsertRateDto,
    @CurrentUser() admin: User,
  ) {
    return this.service.upsert({ ...dto, investmentPeriod: period }, admin.id);
  }

  @Delete(':period')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an interest rate by period name (admin)' })
  remove(
    @Param('period') period: string,
    @CurrentUser() admin: User,
  ) {
    return this.service.delete(period, admin.id);
  }
}
