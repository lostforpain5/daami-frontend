const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  await prisma.user.upsert({
    where: { email: 'admin@daami.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@daami.com',
      phone: '9800000000',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
    },
  });

  // Demo customer
  await prisma.user.upsert({
    where: { email: 'customer@daami.com' },
    update: {},
    create: {
      name: 'Demo Customer',
      email: 'customer@daami.com',
      phone: '9800000001',
      password: await bcrypt.hash('demo123', 10),
      role: 'customer',
    },
  });

  const products = [
    {
      name: 'Classic White Oxford Shirt', slug: 'classic-white-oxford-shirt', category: 'men',
      tags: ['trending'], price: 1899, originalPrice: 2499,
      description: 'A timeless Oxford shirt crafted from premium 100% cotton.',
      images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=720&fit=crop'],
      sizes: ['Freesize', 'XL'], colors: ['White', 'Sky Blue', 'Light Gray'],
      featured: true, badge: 'Sale', material: '100% Premium Cotton', care: 'Machine wash cold',
    },
    {
      name: 'Slim Fit Chino Trousers', slug: 'slim-fit-chino-trousers', category: 'men',
      tags: [], price: 2499, originalPrice: null,
      description: 'Versatile slim-fit chinos with a modern tapered cut.',
      images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=720&fit=crop'],
      sizes: ['Freesize', 'XL'], colors: ['Khaki', 'Navy', 'Olive', 'Black'],
      featured: true, badge: null, material: '97% Cotton, 3% Elastane', care: 'Machine wash cold',
    },
    {
      name: 'Premium Crew Neck T-Shirt', slug: 'premium-crew-neck-tshirt', category: 'men',
      tags: ['trending'], price: 999, originalPrice: 1299,
      description: 'Essential everyday crew neck tee made from soft combed cotton.',
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=720&fit=crop'],
      sizes: ['Freesize', 'XL'], colors: ['White', 'Black', 'Navy', 'Charcoal'],
      featured: true, badge: 'Bestseller', material: '100% Combed Cotton', care: 'Machine wash warm',
    },
    {
      name: 'Floral Printed Kurti', slug: 'floral-printed-kurti', category: 'women',
      tags: ['trending'], price: 1599, originalPrice: 1999,
      description: 'A vibrant floral kurti made from lightweight rayon.',
      images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=720&fit=crop'],
      sizes: ['Freesize', 'XL'], colors: ['Pink Floral', 'Blue Floral', 'Red Floral'],
      featured: true, badge: 'Sale', material: '100% Rayon', care: 'Hand wash cold',
    },
    {
      name: 'Casual Wrap Maxi Dress', slug: 'casual-wrap-maxi-dress', category: 'women',
      tags: ['trending', 'new-arrivals'], price: 2099, originalPrice: 2599,
      description: 'A flowy wrap maxi dress with an adjustable tie waist.',
      images: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=720&fit=crop'],
      sizes: ['Freesize', 'XL'], colors: ['Terracotta', 'Sage Green', 'Cobalt Blue'],
      featured: true, badge: 'Sale', material: '95% Viscose, 5% Elastane', care: 'Machine wash gentle',
    },
    {
      name: 'Oversized Pullover Hoodie', slug: 'oversized-pullover-hoodie', category: 'hoodies',
      tags: ['trending'], price: 1999, originalPrice: null,
      description: 'A heavyweight streetwear hoodie with the Daami Clothing signature logo embroidery.',
      images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&h=720&fit=crop'],
      sizes: ['Freesize', 'XL'], colors: ['Black', 'Charcoal', 'Cream'],
      featured: true, badge: 'Bestseller', material: '80% Cotton, 20% Polyester', care: 'Machine wash cold',
    },
    {
      name: '"I\'m Lost Without You" Couple Sweatshirt Set', slug: 'im-lost-without-you-couple-sweatshirt',
      category: 'hoodies', tags: ['trending', 'new-arrivals'], price: 2999, originalPrice: 3499,
      description: 'Iconic matching couple sweatshirt set. He wears "I\'m lost", she wears "Without you".',
      images: ['/images/products/3cefabda-a029-4c30-a7cd-c3791b70f628.jpg'],
      sizes: ['Freesize', 'XL'], colors: ['Black', 'White', 'Ash Gray'],
      featured: true, badge: 'Bestseller', material: '80% Cotton, 20% Polyester Fleece', care: 'Machine wash cold',
    },
    {
      name: '"My Seasons" Couple Graphic Tee', slug: 'my-seasons-couple-graphic-tee',
      category: 'couple-tshirts', tags: ['trending', 'new-arrivals'], price: 1799, originalPrice: 2199,
      description: 'Matching "I\'ll give you all my life, my seasons" graphic tees.',
      images: ['/images/products/0a4949f7-81a9-4367-94fb-24025b2d7c58.jpg'],
      sizes: ['Freesize', 'XL'], colors: ['White'],
      featured: true, badge: 'Bestseller', material: '100% Premium Cotton', care: 'Machine wash cold',
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        images: JSON.stringify(p.images),
        sizes: JSON.stringify(p.sizes),
        colors: JSON.stringify(p.colors),
        tags: JSON.stringify(p.tags),
        originalPrice: p.originalPrice || null,
        badge: p.badge || null,
        rating: 4.7,
        reviews: Math.floor(Math.random() * 200) + 20,
        inStock: true,
      },
    });
  }

  const cats = [
    { slug: 'men', label: 'Men', description: "Men's clothing collection", image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=600&fit=crop', order: 1 },
    { slug: 'women', label: 'Women', description: "Women's clothing collection", image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&h=600&fit=crop', order: 2 },
    { slug: 'couple-tshirts', label: 'Couple T-Shirts', description: 'Matching couple graphic tees', image: '/images/products/0a4949f7-81a9-4367-94fb-24025b2d7c58.jpg', order: 3 },
    { slug: 'hoodies', label: 'Hoodies', description: 'Hoodies and sweatshirts', image: '/images/products/3cefabda-a029-4c30-a7cd-c3791b70f628.jpg', order: 4 },
    { slug: 'new-arrivals', label: 'New Arrivals', description: 'Fresh styles, just landed', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', order: 5 },
    { slug: 'trending', label: 'Trending', description: "What's hot right now", image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop', order: 6 },
  ];

  for (const c of cats) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  console.log('✅ Seed complete — 2 users, ' + products.length + ' products, ' + cats.length + ' categories');
}

main().catch(console.error).finally(() => prisma.$disconnect());
