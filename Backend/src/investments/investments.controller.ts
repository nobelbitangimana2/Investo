import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role, InvestmentStatus } from '@prisma/client';
import { InvestmentsService } from './investments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { User } from '@prisma/client';

@ApiTags('investments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investments: InvestmentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own investments (client)' })
  findMine(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.investments.findMine(user.id, pagination);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'List all investments — filterable (admin/accountant)' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'status', enum: InvestmentStatus, required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('clientId') clientId?: string,
    @Query('status') status?: InvestmentStatus,
  ) {
    return this.investments.findAll(pagination, { clientId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get investment by id' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.investments.findOne(id, user.id, user.role);
  }
}
