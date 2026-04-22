import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueData,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.user.count({ where: { role: 'customer' } }),
    prisma.product.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        items: { take: 1, select: { name: true } },
      },
    }),
    prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      _sum: { quantity: true },
      _count: { productId: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
      where: { productId: { not: null } },
    }),
  ]);

  return NextResponse.json({
    totalOrders,
    totalCustomers,
    totalProducts,
    totalRevenue: revenueData._sum.total || 0,
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      customer: o.user?.name || 'Guest',
      product: o.items[0]?.name || '—',
      amount: o.total,
      status: o.status,
      date: o.createdAt,
    })),
    topProducts: topProducts.map(p => ({
      name: p.name,
      sold: p._sum.quantity || 0,
    })),
  });
}
