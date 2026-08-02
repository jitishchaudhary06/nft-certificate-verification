const { PrismaClient } = require("@prisma/client");

async function main() {
  const p = new PrismaClient();
  try {
    const r = await p.$queryRaw`SELECT 1 as ok`;
    const users = await p.user.count();
    console.log("OK", JSON.stringify(r), "users=", users);
  } catch (e) {
    console.log("FAIL", String(e.message).slice(0, 250));
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
}

main();
