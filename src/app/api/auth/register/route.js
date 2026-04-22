import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, phone, password } = await request.json();

    if (!name || !password || (!email && !phone))
      return NextResponse.json({ error: 'Name, password and either email or phone are required' }, { status: 400 });

    const orClauses = [];
    if (email) orClauses.push({ email });
    if (phone) orClauses.push({ phone });
    const exists = await prisma.user.findFirst({ where: { OR: orClauses } });
    if (exists)
      return NextResponse.json({ error: 'Account with this email or phone already exists' }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: email || null, phone: phone || null, password: hashed, role: 'customer' },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const { password: _, ...safeUser } = user;

    return NextResponse.json({ token, user: safeUser }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
