import { Controller, Post, Delete } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

/**
 * ONE-TIME seed endpoint.
 * POST /seed-once  → creates the two real users
 * DELETE /seed-once → removes this controller from memory (restart needed to fully remove)
 *
 * IMPORTANT: Remove this file and its module registration after first use.
 */
@Controller('seed-once')
export class SeedOnceController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async seed() {
    const adminHash  = await bcrypt.hash('admin1234', 12);
    const clientHash = await bcrypt.hash('nobel1234', 12);

    const admin = await this.prisma.user.upsert({
      where:  { email: 'brytontoni@gmail.com' },
      update: { name: 'Sonny Bryton Nishimwe', passwordHash: adminHash,  role: 'ADMIN',  emailVerified: true },
      create: { name: 'Sonny Bryton Nishimwe', email: 'brytontoni@gmail.com', passwordHash: adminHash,  role: 'ADMIN',  emailVerified: true },
    });

    const client = await this.prisma.user.upsert({
      where:  { email: 'nobelbitangimana2@gmail.com' },
      update: { name: 'Alain Bitangimana', passwordHash: clientHash, role: 'CLIENT', emailVerified: true },
      create: { name: 'Alain Bitangimana', email: 'nobelbitangimana2@gmail.com', passwordHash: clientHash, role: 'CLIENT', emailVerified: true },
    });

    return {
      success: true,
      message: 'Users created successfully.',
      users: [
        { id: admin.id,  name: admin.name,  email: admin.email,  role: admin.role },
        { id: client.id, name: client.name, email: client.email, role: client.role },
      ],
    };
  }
}
