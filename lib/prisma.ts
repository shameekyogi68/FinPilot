import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import path from "path"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const adapter = new PrismaLibSql({
  url: `file:${path.join(process.cwd(), 'dev.db')}`,
})

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
