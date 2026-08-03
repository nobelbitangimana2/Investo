import { SetMetadata } from '@nestjs/common';
import { AccountantPermission } from '@prisma/client';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...perms: (keyof AccountantPermission)[]) =>
  SetMetadata(PERMISSIONS_KEY, perms);
