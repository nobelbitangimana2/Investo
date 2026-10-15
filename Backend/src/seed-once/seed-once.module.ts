import { Module } from '@nestjs/common';
import { SeedOnceController } from './seed-once.controller';

@Module({ controllers: [SeedOnceController] })
export class SeedOnceModule {}
