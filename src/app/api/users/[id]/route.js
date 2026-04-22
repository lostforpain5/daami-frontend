import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request, { params }) {
  const { id } = await params;
  const auth = requireAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.id !== id && auth.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true,
      orders: { include: { items: true, payment: true }, orderBy: { createdAt: 'desc' } } },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const auth = requireAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.id !== id && auth.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const data = {};
  if (body.name) data.name = body.name;
  if (body.phone) data.phone = body.phone;
  if (body.password) data.password = await bcrypt.hash(body.password, 10);
  if (body.role && auth.role === 'admin') data.role = body.role;

  const user = await prisma.user.update({
    where: { id }, data,
    select: { id: true, name: true, email: true, phone: true, role: true },
  });
  return NextResponse.json({ user });
}

export async function DELETE(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
