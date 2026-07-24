import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function updateProfileName() {
  try {
    const updated = await prisma.profile.upsert({
      where: { id: 1 },
      update: { name: "Shameek Yogi" },
      create: {
        id: 1,
        name: "Shameek Yogi",
        currency: "INR",
        monthly_income: 0,
        savings_target: 0,
        theme: "dark",
        ai_enabled: true,
      },
    })
    console.log("Successfully updated profile name to:", updated.name)
  } catch (error) {
    console.error("Error updating profile name:", error)
  } finally {
    await prisma.$disconnect()
  }
}

updateProfileName()
