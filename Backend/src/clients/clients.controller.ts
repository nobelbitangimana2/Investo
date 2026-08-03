import {
  Controller,
  Get,
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
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ClientsService } from './clients.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { User } from '@prisma/client';

@ApiTags('clients')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'List clients — searchable, paginated' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.clients.findAll(pagination, search);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own profile (client)' })
  getMe(@CurrentUser() user: User) {
    return this.clients.getMyProfile(user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get client profile + full history (admin/accountant)' })
  findOne(@Param('id') id: string) {
    return this.clients.findOne(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile + optional avatar upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfileDto })
  @UseInterceptors(FileInterceptor('avatar', { storage: undefined }))
  updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.clients.updateMyProfile(user.id, dto, file);
  }
}
