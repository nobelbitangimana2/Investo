import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';
import { FilterWithdrawalsDto } from './dto/filter-withdrawals.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('withdrawals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawals: WithdrawalsService) {}

  // ── CLIENT ────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Request a withdrawal (client)' })
  create(@CurrentUser() user: User, @Body() dto: CreateWithdrawalDto) {
    return this.withdrawals.create(user.id, dto);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Get own withdrawals (client)' })
  findMine(@CurrentUser() user: User, @Query() filters: FilterWithdrawalsDto) {
    return this.withdrawals.findMine(user.id, filters);
  }

  // ── ADMIN / ACCOUNTANT ────────────────────────────────────────────

  @Get()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Permissions('viewWithdrawals')
  @ApiOperation({ summary: 'List all withdrawals — filtered (admin/accountant)' })
  findAll(@Query() filters: FilterWithdrawalsDto) {
    return this.withdrawals.findAll(filters);
  }

  @Get(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Permissions('viewWithdrawals')
  @ApiOperation({ summary: 'Get withdrawal by id (admin/accountant)' })
  findOne(@Param('id') id: string) {
    return this.withdrawals.findOne(id);
  }

  @Patch(':id/confirm')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Permissions('confirmWithdrawals')
  @ApiOperation({ summary: 'Confirm withdrawal + apply ledger deductions' })
  confirm(@Param('id') id: string, @CurrentUser() user: User) {
    return this.withdrawals.confirm(id, user.id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Permissions('rejectWithdrawals')
  @ApiOperation({ summary: 'Reject withdrawal (rejection note required)' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectWithdrawalDto,
    @CurrentUser() user: User,
  ) {
    return this.withdrawals.reject(id, user.id, dto);
  }
}
