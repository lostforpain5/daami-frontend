import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const admin = requireAdmin(request);
  if (admin) {
    const orders = await prisma.order.findMany({
      include: { items: true, payment: true, user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ orders });
  }

  const user = requireAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true, payment: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ orders });
}

export async function POST(request) {
  const user = requireAuth(request); // optional — guests allowed

  try {
    const { items, address, notes, paymentMethod, shipping = 0 } = await request.json();
    if (!items?.length) return NextResponse.json({ error: 'No items in order' }, { status: 400 });

    const total = items.reduce((s, i) => s + i.price * i.quantity, 0) + shipping;

    const order = await prisma.order.create({
      data: {
        userId: user?.id || null,
        total,
        shipping,
        address: JSON.stringify(address),
        notes: notes || null,
        status: 'Pending',
        items: {
          create: items.map(i => ({
            productId: i.productId || null,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
        },
        payment: {
          create: {
            method: paymentMethod || 'COD',
            status: paymentMethod === 'cod' ? 'Pending' : 'Pending',
            amount: total,
          },
        },
      },
      include: { items: true, payment: true },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
