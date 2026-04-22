import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { credential } = await request.json();
    if (!credential) return NextResponse.json({ error: 'Missing credential' }, { status: 400 });

    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const payload = await res.json();

    if (payload.error || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId && payload.aud !== clientId) {
      return NextResponse.json({ error: 'Token audience mismatch' }, { status: 401 });
    }

    const { email, name } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPass = await bcrypt.hash(crypto.randomUUID(), 10);
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          phone: null,
          password: randomPass,
          role: 'customer',
        },
      });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const { password: _, ...safeUser } = user;

    return NextResponse.json({ token, user: safeUser });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
