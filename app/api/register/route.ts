import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';
import { isValidStudentNumber, studentEmailFromNumber } from '@/lib/student-email';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, studentNumber, password } = body;

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof studentNumber !== 'string' ||
    !isValidStudentNumber(studentNumber) ||
    typeof password !== 'string' ||
    password.length < 6
  ) {
    return NextResponse.json(
      { error: 'Enter your name, a valid student number, and a password of at least 6 characters.' },
      { status: 400 }
    );
  }

  const email = studentEmailFromNumber(studentNumber);
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return NextResponse.json({ error: 'Account already exists.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      passwordHash,
      role: 'STUDENT',
    },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}
