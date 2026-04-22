import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';

export async function GET(request, { params }) {
  const { id } = await params;
  const user = requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payment: true, user: { select: { name: true, email: true, phone: true } } },
  });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (order.userId !== user.id && user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ order });
}

export async function PUT(request, { params }) {
  return PATCH(request, { params });
}

export async function PATCH(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { status, paymentStatus } = await request.json();

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(paymentStatus && { payment: { updateMany: { where: { orderId: id }, data: { status: paymentStatus } } } }),
    },
    include: { items: true, payment: true },
  });
  return NextResponse.json({ order });
}
