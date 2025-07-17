#!/usr/bin/env tsx
/**
 * Seed Neon Database
 * 
 * This script seeds the Neon database with sample data
 * for development and testing purposes.
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema';
import { logger } from '../server/services/logger';
import bcrypt from 'bcryptjs';

const neonUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!neonUrl) {
  console.log('❌ No database URL found');
  process.exit(1);
}

const pool = new Pool({ 
  connectionString: neonUrl,
  max: 5,
  connectionTimeoutMillis: 10000,
});

const db = drizzle({ client: pool, schema });

async function seedDatabase() {
  console.log('🌱 Seeding Neon database...');
  
  try {
    // Create test users
    const hashedPassword = await bcrypt.hash('admin123secure', 12);
    
    const users = await db.insert(schema.users).values([
      {
        email: 'akash@agarwalhome.com',
        password: hashedPassword,
        firstName: 'Akash',
        lastName: 'Agarwal',
        role: 'farmer',
        phone: '(555) 123-4567',
        address: '123 Farm Road',
        city: 'Palo Alto',
        state: 'CA',
        zipCode: '94301',
        isActive: true,
      },
      {
        email: 'akash.agarwal@conmitto.io',
        password: hashedPassword,
        firstName: 'Akash',
        lastName: 'Agarwal',
        role: 'admin',
        phone: '(555) 987-6543',
        address: '456 Admin Lane',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        isActive: true,
      },
      {
        email: 'buyer@example.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'buyer',
        phone: '(555) 456-7890',
        address: '789 Buyer Street',
        city: 'Mountain View',
        state: 'CA',
        zipCode: '94041',
        isActive: true,
      },
    ]).returning();
    
    console.log(`✅ Created ${users.length} users`);
    
    // Create test farms
    const farms = await db.insert(schema.farms).values([
      {
        ownerId: users[0].id, // Akash (farmer)
        name: 'Sunny Acres Farm',
        description: 'Organic vegetables and herbs grown with care in the heart of Silicon Valley',
        address: '123 Farm Road',
        city: 'Palo Alto',
        state: 'CA',
        zipCode: '94301',
        latitude: '37.4419',
        longitude: '-122.1430',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjODdDRUVCIi8+CjxyZWN0IHk9IjIwMCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM0Yzk2NGEiLz4KPGNpcmNsZSBjeD0iMzAwIiBjeT0iNzAiIHI9IjMwIiBmaWxsPSIjRkZEQjAwIi8+CjxwYXRoIGQ9Ik01MCAyMDBMOTAgMTcwTDEzMCAyMDBMOTAgMTQwTDUwIDIwMFoiIGZpbGw9IiMyMjc3MzMiLz4KPHBhdGggZD0iTTIwMCAyMDBMMjQwIDE3MEwyODAgMjAwTDI0MCAxNDBMMjAwIDIwMFoiIGZpbGw9IiMyMjc3MzMiLz4KPHRleHQgeD0iMjAwIiB5PSIyNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiPlN1bm55IEFjcmVzIEZhcm08L3RleHQ+Cjx0ZXh0IHg9IjIwMCIgeT0iMjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPk9yZ2FuaWMgUHJvZHVjZTwvdGV4dD4KPC9zdmc+',
        website: 'https://sunnyacresfarm.com',
        phoneNumber: '(555) 123-4567',
        instagramHandle: 'sunnyacresfarm',
        isOrganic: true,
        pickupAvailable: true,
        deliveryAvailable: true,
        farmToursAvailable: 'by_appointment',
        rating: '4.8',
        reviewCount: 12,
        isActive: true,
      },
      {
        ownerId: users[0].id, // Akash (farmer)
        name: 'Valley Gardens',
        description: 'Traditional farming methods producing the freshest seasonal produce',
        address: '456 Garden Lane',
        city: 'Mountain View',
        state: 'CA',
        zipCode: '94041',
        latitude: '37.3861',
        longitude: '-122.0838',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjODdDRUVCIi8+CjxyZWN0IHk9IjIwMCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM0Yzk2NGEiLz4KPGNpcmNsZSBjeD0iMzAwIiBjeT0iNzAiIHI9IjMwIiBmaWxsPSIjRkZEQjAwIi8+CjxwYXRoIGQ9Ik04MCAyMDBMMTIwIDE3MEwxNjAgMjAwTDEyMCAxNDBMODAgMjAwWiIgZmlsbD0iIzIyNzczMyIvPgo8cGF0aCBkPSJNMjQwIDIwMEwyODAgMTcwTDMyMCAyMDBMMjgwIDE0MEwyNDAgMjAwWiIgZmlsbD0iIzIyNzczMyIvPgo8dGV4dCB4PSIyMDAiIHk9IjI2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCI+VmFsbGV5IEdhcmRlbnM8L3RleHQ+Cjx0ZXh0IHg9IjIwMCIgeT0iMjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkZyZXNoIFByb2R1Y2U8L3RleHQ+Cjwvc3ZnPg==',
        website: 'https://valleygardens.com',
        phoneNumber: '(555) 234-5678',
        instagramHandle: 'valleygardens',
        isOrganic: false,
        pickupAvailable: true,
        deliveryAvailable: false,
        farmToursAvailable: 'yes',
        rating: '4.5',
        reviewCount: 8,
        isActive: true,
      },
    ]).returning();
    
    console.log(`✅ Created ${farms.length} farms`);
    
    // Create produce items
    const produceItems = await db.insert(schema.produceItems).values([
      {
        farmId: farms[0].id,
        name: 'Organic Tomatoes',
        description: 'Fresh, vine-ripened organic tomatoes perfect for salads and cooking',
        category: 'vegetables',
        variety: 'Heirloom',
        unit: 'lb',
        pricePerUnit: '4.99',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIGZpbGw9IiNGRjQ1MDAiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iNDAiIHI9IjE1IiBmaWxsPSIjMjI3NzMzIi8+CjxwYXRoIGQ9Ik04NSA0MEM4NSA0MCA5NSAyNSAxMDUgNDBDMTA1IDQwIDExNSAyNSAxMjUgNDBDMTI1IDQwIDExNSA1NSAxMDUgNDBDMTA1IDQwIDk1IDU1IDg1IDQwWiIgZmlsbD0iIzIyNzczMyIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjgwIiByPSI1IiBmaWxsPSIjRkY2NjAwIi8+CjxjaXJjbGUgY3g9IjEzMCIgY3k9IjEyMCIgcj0iNSIgZmlsbD0iI0ZGNjYwMCIvPgo8L3N2Zz4=',
        isOrganic: true,
        isSeasonal: true,
        isHeirloom: true,
        isActive: true,
      },
      {
        farmId: farms[0].id,
        name: 'Fresh Basil',
        description: 'Aromatic fresh basil, perfect for pasta, pizza, and Mediterranean dishes',
        category: 'herbs',
        variety: 'Sweet Basil',
        unit: 'bunch',
        pricePerUnit: '2.50',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGZpbGw9IiMyMjc3MzMiPgo8ZWxsaXBzZSBjeD0iMTAwIiBjeT0iNjAiIHJ4PSIzMCIgcnk9IjIwIi8+CjxlbGxpcHNlIGN4PSI3MCIgY3k9IjkwIiByeD0iMjUiIHJ5PSIxNSIvPgo8ZWxsaXBzZSBjeD0iMTMwIiBjeT0iOTAiIHJ4PSIyNSIgcnk9IjE1Ii8+CjxlbGxpcHNlIGN4PSI4NSIgY3k9IjEyMCIgcng9IjIwIiByeT0iMTIiLz4KPGVsbGlwc2UgY3g9IjExNSIgY3k9IjEyMCIgcng9IjIwIiByeT0iMTIiLz4KPGVsbGlwc2UgY3g9IjEwMCIgY3k9IjE1MCIgcng9IjE1IiByeT0iMTAiLz4KPC9nPgo8cmVjdCB4PSI5NSIgeT0iMTQwIiB3aWR0aD0iMTAiIGhlaWdodD0iNDAiIGZpbGw9IiM0Yzk2NGEiLz4KPC9zdmc+',
        isOrganic: true,
        isSeasonal: false,
        isHeirloom: false,
        isActive: true,
      },
      {
        farmId: farms[1].id,
        name: 'Sweet Corn',
        description: 'Freshly picked sweet corn, perfect for grilling or boiling',
        category: 'vegetables',
        variety: 'Silver Queen',
        unit: 'each',
        pricePerUnit: '1.25',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHg9IjcwIiB5PSI0MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEyMCIgcng9IjMwIiBmaWxsPSIjRkZEQjAwIi8+CjxnIGZpbGw9IiNGRkY0MDAiPgo8Y2lyY2xlIGN4PSI4NSIgY3k9IjYwIiByPSI0Ii8+CjxjaXJjbGUgY3g9IjEwNSIgY3k9IjYwIiByPSI0Ii8+CjxjaXJjbGUgY3g9IjExNSIgY3k9IjYwIiByPSI0Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iODAiIHI9IjQiLz4KPGNpcmNsZSBjeD0iOTUiIGN5PSI4MCIgcj0iNCIvPgo8Y2lyY2xlIGN4PSIxMTUiIGN5PSI4MCIgcj0iNCIvPgo8Y2lyY2xlIGN4PSIxMjUiIGN5PSI4MCIgcj0iNCIvPgo8Y2lyY2xlIGN4PSI4NSIgY3k9IjEwMCIgcj0iNCIvPgo8Y2lyY2xlIGN4PSIxMDUiIGN5PSIxMDAiIHI9IjQiLz4KPGNpcmNsZSBjeD0iMTE1IiBjeT0iMTAwIiByPSI0Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iMTIwIiByPSI0Ii8+CjxjaXJjbGUgY3g9Ijk1IiBjeT0iMTIwIiByPSI0Ii8+CjxjaXJjbGUgY3g9IjExNSIgY3k9IjEyMCIgcj0iNCIvPgo8Y2lyY2xlIGN4PSIxMjUiIGN5PSIxMjAiIHI9IjQiLz4KPGNpcmNsZSBjeD0iODUiIGN5PSIxNDAiIHI9IjQiLz4KPGNpcmNsZSBjeD0iMTA1IiBjeT0iMTQwIiByPSI0Ii8+CjxjaXJjbGUgY3g9IjExNSIgY3k9IjE0MCIgcj0iNCIvPgo8L2c+CjxnIGZpbGw9IiMyMjc3MzMiPgo8cGF0aCBkPSJNNjAgNDBDNjAgNDAgNzAgMjUgODAgNDBDODAgNDAgOTAgMjUgMTAwIDQwIiBzdHJva2U9IiMyMjc3MzMiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMTAwIDQwQzEwMCA0MCAxMTAgMjUgMTIwIDQwQzEyMCA0MCAxMzAgMjUgMTQwIDQwIiBzdHJva2U9IiMyMjc3MzMiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L2c+Cjwvc3ZnPg==',
        isOrganic: false,
        isSeasonal: true,
        isHeirloom: false,
        isActive: true,
      },
    ]).returning();
    
    console.log(`✅ Created ${produceItems.length} produce items`);
    
    // Create inventory records
    const inventories = await db.insert(schema.inventories).values([
      {
        produceItemId: produceItems[0].id,
        quantityAvailable: 50,
        unitOfMeasurement: 'lb',
        pricePerUnit: '4.99',
        location: 'Greenhouse A',
        isActive: true,
      },
      {
        produceItemId: produceItems[1].id,
        quantityAvailable: 25,
        unitOfMeasurement: 'bunch',
        pricePerUnit: '2.50',
        location: 'Herb Garden',
        isActive: true,
      },
      {
        produceItemId: produceItems[2].id,
        quantityAvailable: 100,
        unitOfMeasurement: 'each',
        pricePerUnit: '1.25',
        location: 'Field B',
        isActive: true,
      },
    ]).returning();
    
    console.log(`✅ Created ${inventories.length} inventory records`);
    
    // Create sample reviews
    const reviews = await db.insert(schema.reviews).values([
      {
        farmId: farms[0].id,
        buyerId: users[2].id, // Sarah (buyer)
        rating: 5,
        comment: 'Amazing quality produce! The tomatoes were perfectly ripe and the basil was so fresh.',
        orderId: null,
      },
      {
        farmId: farms[1].id,
        buyerId: users[2].id, // Sarah (buyer)
        rating: 4,
        comment: 'Good quality corn, sweet and fresh. Will definitely order again.',
        orderId: null,
      },
    ]).returning();
    
    console.log(`✅ Created ${reviews.length} reviews`);
    
    await pool.end();
    
    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Farms: ${farms.length}`);
    console.log(`   Produce Items: ${produceItems.length}`);
    console.log(`   Inventory Records: ${inventories.length}`);
    console.log(`   Reviews: ${reviews.length}`);
    console.log('');
    console.log('🔑 Test Accounts:');
    console.log('   Farmer: akash@agarwalhome.com / admin123secure');
    console.log('   Admin: akash.agarwal@conmitto.io / admin123secure');
    console.log('   Buyer: buyer@example.com / admin123secure');
    console.log('');
    console.log('🚀 Your Neon database is ready!');
    
  } catch (error) {
    logger.error('seed', 'Seeding failed', {
      error: error.message,
    });
    console.log('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase().catch(console.error);
}