const { PrismaClient } = require('@prisma/client');
try {
  new PrismaClient({ config: { datasource: { url: "file:./dev.db" } } });
  console.log("Success with config");
} catch(e) {
  console.error(e.message);
}
