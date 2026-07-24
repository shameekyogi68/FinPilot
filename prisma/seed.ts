import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Ensuring clean profile for Shameek Yogi...')

  await prisma.profile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Shameek Yogi',
      email: null,
      currency: 'INR',
      monthly_income: 0,
      savings_target: 0,
      theme: 'dark',
      default_month_view: 'current',
      ai_enabled: true,
    },
  })
  console.log('Clean profile verified for Shameek Yogi')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
