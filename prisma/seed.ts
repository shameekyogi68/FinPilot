import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create default profile
  const profile = await prisma.profile.upsert({
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
  console.log('Created profile:', profile.name)

  // Create sample budgets
  const budgets = [
    { category: 'food', monthly_limit: 5000 },
    { category: 'transport', monthly_limit: 2000 },
    { category: 'shopping', monthly_limit: 3000 },
    { category: 'bills', monthly_limit: 4000 },
    { category: 'entertainment', monthly_limit: 1500 },
  ]

  for (const budget of budgets) {
    await prisma.budget.create({
      data: budget,
    })
  }
  console.log('Created sample budgets')

  // Create sample goal
  await prisma.goal.create({
    data: {
      name: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 0,
    },
  })
  console.log('Created sample goal')

  console.log('Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
