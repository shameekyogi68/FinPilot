const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({ datasources: { db: { url: "file:./dev.db" } } });
  console.log("Success with datasources");
} catch(e) {
  console.error(e.message);
}
