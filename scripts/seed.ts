import { db } from "../server/db";
import { users, farms, produceItems, inventories } from "../shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Create users
    console.log("👥 Creating users...");
    
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Create farmers
    const farmer1 = await db.insert(users).values({
      email: "sarah.johnson@greenvalley.com",
      password: hashedPassword,
      firstName: "Sarah",
      lastName: "Johnson",
      role: "farmer",
      phone: "(555) 123-4567",
      address: "123 Farm Road",
      city: "Greenville",
      state: "CA",
      zipCode: "95123",
    }).returning();

    const farmer2 = await db.insert(users).values({
      email: "emma.rodriguez@berrypatch.com",
      password: hashedPassword,
      firstName: "Emma",
      lastName: "Rodriguez",
      role: "farmer",
      phone: "(555) 234-5678",
      address: "456 Berry Lane",
      city: "Farmington",
      state: "CA",
      zipCode: "95124",
    }).returning();

    // Create a buyer
    const buyer1 = await db.insert(users).values({
      email: "john.doe@email.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Doe",
      role: "buyer",
      phone: "(555) 345-6789",
      address: "789 Main Street",
      city: "Townsville",
      state: "CA",
      zipCode: "95125",
    }).returning();

    console.log(`✅ Created ${farmer1.length + farmer2.length + buyer1.length} users`);

    // Create farms
    console.log("🚜 Creating farms...");
    
    const farm1 = await db.insert(farms).values({
      ownerId: farmer1[0].id,
      name: "Green Valley Farm",
      description: "Organic vegetables and herbs grown with sustainable farming practices. Family-owned for 3 generations, we specialize in heirloom varieties and seasonal produce.",
      address: "123 Farm Road",
      city: "Greenville",
      state: "CA",
      zipCode: "95123",
      latitude: "37.2431",
      longitude: "-121.7767",
      imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
      website: "https://greenvalleyfarm.com",
      phoneNumber: "(555) 123-4567",
      isOrganic: true,
    }).returning();

    const farm2 = await db.insert(farms).values({
      ownerId: farmer2[0].id,
      name: "Berry Patch Farm",
      description: "Specializing in seasonal berries and stone fruits. Known for the sweetest strawberries in the county. Pick-your-own available during season.",
      address: "456 Berry Lane",
      city: "Farmington",
      state: "CA",
      zipCode: "95124",
      latitude: "37.2531",
      longitude: "-121.7867",
      imageUrl: "https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
      website: "https://berrypatchfarm.com",
      phoneNumber: "(555) 234-5678",
      isOrganic: false,
    }).returning();

    console.log(`✅ Created ${farm1.length + farm2.length} farms`);

    // Create produce items
    console.log("🥕 Creating produce items...");
    
    const produceData = [
      // Green Valley Farm produce
      {
        farmId: farm1[0].id,
        name: "Fresh Organic Carrots",
        description: "Sweet, crunchy carrots grown in rich valley soil. Perfect for snacking, salads, or cooking.",
        category: "vegetables",
        variety: "Nantes",
        unit: "lb",
        pricePerUnit: "4.50",
        imageUrl: "https://images.unsplash.com/photo-1445282768818-728615cc910a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        isOrganic: true,
        isSeasonal: false,
        isHeirloom: false,
        harvestDate: new Date("2024-12-20"),
      },
      {
        farmId: farm1[0].id,
        name: "Mixed Salad Greens",
        description: "Fresh blend of lettuce, arugula, and spinach. Harvested daily for maximum freshness.",
        category: "vegetables",
        variety: "Mixed",
        unit: "bag",
        pricePerUnit: "3.25",
        imageUrl: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        isOrganic: true,
        isSeasonal: false,
        isHeirloom: false,
        harvestDate: new Date("2024-12-22"),
      },
      {
        farmId: farm1[0].id,
        name: "Heirloom Tomatoes",
        description: "Multi-colored heirloom tomatoes with exceptional flavor. Perfect for salads and sandwiches.",
        category: "vegetables",
        variety: "Cherokee Purple",
        unit: "lb",
        pricePerUnit: "5.75",
        imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        isOrganic: true,
        isSeasonal: true,
        isHeirloom: true,
        harvestDate: new Date("2024-12-21"),
      },
      
      // Berry Patch Farm produce
      {
        farmId: farm2[0].id,
        name: "Sweet Strawberries",
        description: "Juicy, sweet strawberries at peak ripeness. Great for eating fresh or making jam.",
        category: "fruits",
        variety: "Albion",
        unit: "pint",
        pricePerUnit: "6.99",
        imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        isOrganic: false,
        isSeasonal: true,
        isHeirloom: false,
        harvestDate: new Date("2024-12-23"),
      },
      {
        farmId: farm2[0].id,
        name: "Fresh Blueberries",
        description: "Plump, sweet blueberries bursting with flavor. High in antioxidants and perfect for baking.",
        category: "fruits",
        variety: "Duke",
        unit: "pint",
        pricePerUnit: "7.50",
        imageUrl: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        isOrganic: false,
        isSeasonal: true,
        isHeirloom: false,
        harvestDate: new Date("2024-12-22"),
      },
      {
        farmId: farm2[0].id,
        name: "Farm Fresh Peaches",
        description: "Tree-ripened peaches with incredible sweetness and aroma. Only available during peak season.",
        category: "fruits",
        variety: "Elberta",
        unit: "lb",
        pricePerUnit: "8.25",
        imageUrl: "https://images.unsplash.com/photo-1629828688870-f9f4baec7fdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        isOrganic: false,
        isSeasonal: true,
        isHeirloom: false,
        harvestDate: new Date("2024-12-20"),
      },
    ];

    const createdProduce = [];
    for (const item of produceData) {
      const produce = await db.insert(produceItems).values(item).returning();
      createdProduce.push(produce[0]);
    }

    console.log(`✅ Created ${createdProduce.length} produce items`);

    // Create inventory for each produce item
    console.log("📦 Creating inventory records...");
    
    const inventoryData = createdProduce.map((item, index) => ({
      produceItemId: item.id,
      quantityAvailable: [25, 40, 15, 30, 20, 12][index] || 20,
      quantityReserved: 0,
    }));

    for (const inventory of inventoryData) {
      await db.insert(inventories).values(inventory);
    }

    console.log(`✅ Created ${inventoryData.length} inventory records`);

    console.log("🎉 Database seeding completed successfully!");
    
    console.log("\n📊 Seed Summary:");
    console.log(`   👥 Users: 3 (2 farmers, 1 buyer)`);
    console.log(`   🚜 Farms: 2`);
    console.log(`   🥕 Produce Items: ${createdProduce.length}`);
    console.log(`   📦 Inventory Records: ${inventoryData.length}`);
    
    console.log("\n🔐 Test Credentials:");
    console.log("   Farmer 1: sarah.johnson@greenvalley.com / password123");
    console.log("   Farmer 2: emma.rodriguez@berrypatch.com / password123");
    console.log("   Buyer: john.doe@email.com / password123");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Run the seed function
if (require.main === module) {
  seed()
    .then(() => {
      console.log("✅ Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

export { seed };
