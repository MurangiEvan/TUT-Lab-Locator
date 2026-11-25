// Creates an admin account that signs in with an email address, or promotes an
// existing account with that email to admin.
//
//   npm run create-admin -- admin@tut.ac.za
//
// Set ADMIN_PASSWORD to choose the password; otherwise a random one is
// generated and printed once. An existing account keeps its password unless
// ADMIN_PASSWORD is set.
const crypto = require('crypto');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const bcrypt = require('bcryptjs');
const { PrismaClient, UserRole } = require('@prisma/client');

const prisma = new PrismaClient();
const email = (process.argv[2] ?? '').trim().toLowerCase();
const name = process.argv[3] ?? 'TUT Labs Admin';

async function main() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: npm run create-admin -- <email> [display name]');
  }

  const chosenPassword = process.env.ADMIN_PASSWORD;
  if (chosenPassword !== undefined && chosenPassword.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const password = chosenPassword ?? (existing ? undefined : crypto.randomBytes(12).toString('base64url'));
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: UserRole.ADMIN, ...(passwordHash ? { passwordHash } : {}) },
    });
    console.log(`${email} is now an admin${passwordHash ? ' and its password was updated' : ''}.`);
  } else {
    await prisma.user.create({ data: { email, name, passwordHash, role: UserRole.ADMIN } });
    console.log(`Created admin account ${email}.`);
  }

  if (password && !chosenPassword) {
    console.log(`Temporary password: ${password}`);
    console.log('Sign in at /login (Admin tab), then change it via "Forgot password?".');
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
