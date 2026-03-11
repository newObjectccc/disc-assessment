import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password },
  })
  console.log('Seed completed. Admin credentials: admin / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
