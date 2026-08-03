import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DepositsService } from './deposits.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { RejectDepositDto } from './dto/reject-deposit.dto';
import { FilterDepositsDto } from './dto/filter-deposits.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('deposits')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('deposits')
export class DepositsController {
  constructor(private readonly deposits: DepositsService) {}

  // ── CLIENT ────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Submit a new deposit (client)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('receipt', { storage: undefined }))
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateDepositDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.deposits.create(user.id, dto, file);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Get own deposits (client)' })
  findMine(@CurrentUser() user: User, @Query() filters: FilterDepositsDto) {
    return this.deposits.findMine(user.id, filters);
  }

  @Get('me/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Get own deposit by id (client)' })
  findMineOne(@Param('id') id: string, @CurrentUser() user: User) {
    // ownership enforced inside service
    return this.deposits.findOne(id);
  }

  // ── ADMIN / ACCOUNTANT ────────────────────────────────────────────

  @Get()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Permissions('viewDeposits')
  @ApiOperation({ summary: 'List all deposits — filtered + paginated (admin/accountant)' })
  findAll(@Query() filters: FilterDepositsDto) {
    return this.deposits.findAll(filters);
  }

  @Get(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Permissions('viewDeposits')
  @ApiOperation({ summary: 'Get deposit by id (admin/accountant)' })
  findOne(@Param('id') id: string) {
    return this.deposits.findOne(id);
  }

  @Patch(':id/confirm')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Permissions('confirmDeposits')
  @ApiOperation({ summary: 'Confirm a pending deposit (creates investment)' })
  confirm(@Param('id') id: string, @CurrentUser() user: User) {
    return this.deposits.confirm(id, user.id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Permissions('rejectDeposits')
  @ApiOperation({ summary: 'Reject a pending deposit (note required)' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectDepositDto,
    @CurrentUser() user: User,
  ) {
    return this.deposits.reject(id, user.id, dto);
  }
}
