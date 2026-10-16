const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { PrismaClient, UserRole } = require('@prisma/client');

const prisma = new PrismaClient();
const studentNumber = process.argv[2];

async function main() {
  if (!studentNumber || !/^[a-zA-Z0-9.-]+$/.test(studentNumber.trim())) {
    throw new Error('Usage: npm run promote-admin -- <student-number>');
  }

  const email = `${studentNumber.trim().toLowerCase()}@tut4life.ac.za`;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`No account found for ${email}. Register the student account first.`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: UserRole.ADMIN },
  });
  console.log(`${email} is now an admin.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
