import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateAccountantDto } from './dto/create-accountant.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users (admin)' })
  findAll() {
    return this.users.findAll();
  }

  @Get('accountants')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all accountants with permissions (admin)' })
  findAccountants() {
    return this.users.findAccountants();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by id (admin)' })
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post('accountants')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create accountant account (admin)' })
  @ApiResponse({ status: 201, description: 'Accountant created' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  createAccountant(
    @Body() dto: CreateAccountantDto,
    @CurrentUser() admin: User,
  ) {
    return this.users.createAccountant(dto, admin.id);
  }

  @Patch(':id/status/suspend')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Suspend a user account (admin)' })
  suspend(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.users.updateStatus(id, UserStatus.SUSPENDED, admin.id);
  }

  @Patch(':id/status/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reactivate a user account (admin)' })
  activate(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.users.updateStatus(id, UserStatus.ACTIVE, admin.id);
  }

  @Patch(':id/permissions')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update accountant permissions (admin)' })
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionsDto,
    @CurrentUser() admin: User,
  ) {
    return this.users.updatePermissions(id, dto, admin.id);
  }

  // ── Self-service endpoints (all roles) ─────────────────────────────

  @Patch('me/password')
  @ApiOperation({ summary: 'Change own password' })
  @ApiResponse({ status: 200, description: 'Password updated' })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.users.changePassword(user.id, dto);
  }

  @Patch('me/avatar')
  @ApiOperation({ summary: 'Upload own profile picture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', { storage: undefined }))
  uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.users.uploadAvatar(user.id, file);
  }
}
