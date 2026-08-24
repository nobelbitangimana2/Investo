import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows a lowercase user role when the required enum is uppercase', () => {
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'admin' } }),
      }),
    } as any;

    const reflector = new Reflector();
    reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN, Role.ACCOUNTANT]);

    const guardWithMetadata = new RolesGuard(reflector);

    expect(guardWithMetadata.canActivate(context)).toBe(true);
  });

  it('throws when the user does not have any required role', () => {
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'client' } }),
      }),
    } as any;

    const reflector = new Reflector();
    reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN, Role.ACCOUNTANT]);

    const guardWithMetadata = new RolesGuard(reflector);

    expect(() => guardWithMetadata.canActivate(context)).toThrow(ForbiddenException);
  });

  it('skips checks when no role metadata is defined', () => {
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'client' } }),
      }),
    } as any;

    const reflector = new Reflector();
    reflector.getAllAndOverride = jest.fn().mockReturnValue([]);

    const guardWithMetadata = new RolesGuard(reflector);

    expect(guardWithMetadata.canActivate(context)).toBe(true);
  });
});
