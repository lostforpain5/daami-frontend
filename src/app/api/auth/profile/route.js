import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(request) {
  const user = requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, email, phone } = await request.json();
  if (!name || !email) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });

  try {
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: user.id } },
    });
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name, email, phone: phone || null },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    return NextResponse.json({ user: updated });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
