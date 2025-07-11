import {
  users,
  farms,
  produceItems,
  inventories,
  orders,
  orderItems,
  messages,
  reviews,
  type User,
  type InsertUser,
  type Farm,
  type InsertFarm,
  type ProduceItem,
  type InsertProduceItem,
  type Inventory,
  type InsertInventory,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Message,
  type InsertMessage,
  type Review,
  type InsertReview,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc, asc, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Farm operations
  getFarm(id: number): Promise<Farm | undefined>;
  getFarms(): Promise<Farm[]>;
  getFarmsByOwner(ownerId: number): Promise<Farm[]>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: number, farm: Partial<InsertFarm>): Promise<Farm>;
  deleteFarm(id: number): Promise<void>;
  getAllFarmsWithOwners(): Promise<any[]>;

  // Produce operations
  getProduceItem(id: number): Promise<ProduceItem | undefined>;
  getProduceItemsByFarm(farmId: number): Promise<ProduceItem[]>;
  searchProduceItems(query?: string, category?: string): Promise<ProduceItem[]>;
  createProduceItem(item: InsertProduceItem): Promise<ProduceItem>;
  updateProduceItem(id: number, item: Partial<InsertProduceItem>): Promise<ProduceItem>;
  deleteProduceItem(id: number): Promise<void>;
  getAllProduceWithFarms(): Promise<any[]>;

  // Inventory operations
  getInventory(produceItemId: number): Promise<Inventory | undefined>;
  updateInventory(produceItemId: number, inventory: Partial<InsertInventory>): Promise<Inventory>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByBuyer(buyerId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  getAllOrdersWithBuyers(): Promise<any[]>;

  // Order item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getConversation(userId1: number, userId2: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message>;
  getUnreadMessageCount(userId: number): Promise<number>;

  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByFarm(farmId: number): Promise<Review[]>;
  getReviewsByBuyer(buyerId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: Partial<InsertReview>): Promise<Review>;
  deleteReview(id: number): Promise<void>;
  calculateFarmRating(farmId: number): Promise<{ rating: number; count: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Farm operations
  async getFarm(id: number): Promise<Farm | undefined> {
    const [farm] = await db.select().from(farms).where(eq(farms.id, id));
    return farm;
  }

  async getFarms(): Promise<Farm[]> {
    return await db
      .select()
      .from(farms)
      .orderBy(asc(farms.name));
  }

  async getFarmsByOwner(ownerId: number): Promise<Farm[]> {
    return await db.select().from(farms).where(eq(farms.ownerId, ownerId));
  }

  async createFarm(farm: InsertFarm): Promise<Farm> {
    const [newFarm] = await db.insert(farms).values(farm).returning();
    return newFarm;
  }

  async updateFarm(id: number, farm: Partial<InsertFarm>): Promise<Farm> {
    const [updatedFarm] = await db
      .update(farms)
      .set({ ...farm, updatedAt: new Date() })
      .where(eq(farms.id, id))
      .returning();
    return updatedFarm;
  }

  async deleteFarm(id: number): Promise<void> {
    await db.delete(farms).where(eq(farms.id, id));
  }

  async getAllFarmsWithOwners(): Promise<any[]> {
    return await db
      .select({
        id: farms.id,
        name: farms.name,
        description: farms.description,
        address: farms.address,
        city: farms.city,
        state: farms.state,
        zipCode: farms.zipCode,
        latitude: farms.latitude,
        longitude: farms.longitude,
        imageUrl: farms.imageUrl,
        website: farms.website,
        phoneNumber: farms.phoneNumber,
        isOrganic: farms.isOrganic,
        isActive: farms.isActive,
        createdAt: farms.createdAt,
        updatedAt: farms.updatedAt,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(farms)
      .leftJoin(users, eq(farms.ownerId, users.id))
      .orderBy(desc(farms.createdAt));
  }

  // Produce operations
  async getProduceItem(id: number): Promise<ProduceItem | undefined> {
    const [item] = await db.select().from(produceItems).where(eq(produceItems.id, id));
    return item;
  }

  async getProduceItemsByFarm(farmId: number): Promise<any[]> {
    return await db
      .select({
        id: produceItems.id,
        name: produceItems.name,
        description: produceItems.description,
        category: produceItems.category,
        variety: produceItems.variety,
        pricePerUnit: produceItems.pricePerUnit,
        unit: produceItems.unit,
        imageUrl: produceItems.imageUrl,
        isOrganic: produceItems.isOrganic,
        isSeasonal: produceItems.isSeasonal,
        isHeirloom: produceItems.isHeirloom,
        harvestDate: produceItems.harvestDate,
        farmId: produceItems.farmId,
        isActive: produceItems.isActive,
        createdAt: produceItems.createdAt,
        updatedAt: produceItems.updatedAt,
        inventory: {
          quantityAvailable: inventories.quantityAvailable,
          lastUpdated: inventories.lastUpdated,
        }
      })
      .from(produceItems)
      .leftJoin(inventories, eq(produceItems.id, inventories.produceItemId))
      .where(and(eq(produceItems.farmId, farmId), eq(produceItems.isActive, true)))
      .orderBy(asc(produceItems.name));
  }

  async searchProduceItems(query?: string, category?: string): Promise<any[]> {
    console.log('Searching for:', { query, category });
    
    let conditions = [eq(produceItems.isActive, true)];
    
    if (query && query.trim()) {
      const searchTerm = `%${query.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(produceItems.name, searchTerm),
          ilike(produceItems.description, searchTerm),
          ilike(produceItems.variety, searchTerm)
        )
      );
    }
    
    if (category && category !== 'all') {
      conditions.push(eq(produceItems.category, category));
    }

    const result = await db
      .select({
        id: produceItems.id,
        name: produceItems.name,
        description: produceItems.description,
        category: produceItems.category,
        variety: produceItems.variety,
        pricePerUnit: produceItems.pricePerUnit,
        unit: produceItems.unit,
        imageUrl: produceItems.imageUrl,
        isOrganic: produceItems.isOrganic,
        isSeasonal: produceItems.isSeasonal,
        isHeirloom: produceItems.isHeirloom,
        farmId: produceItems.farmId,
        farm: {
          id: farms.id,
          name: farms.name,
          city: farms.city,
          state: farms.state,
          address: farms.address,
          latitude: farms.latitude,
          longitude: farms.longitude,
          isOrganic: farms.isOrganic,
        },
        inventory: {
          quantityAvailable: inventories.quantityAvailable,
          lastUpdated: inventories.lastUpdated,
        }
      })
      .from(produceItems)
      .leftJoin(farms, eq(produceItems.farmId, farms.id))
      .leftJoin(inventories, eq(produceItems.id, inventories.produceItemId))
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(produceItems.createdAt));
    
    console.log('Search result count:', result.length);
    return result;
  }

  async createProduceItem(item: InsertProduceItem): Promise<ProduceItem> {
    const [newItem] = await db.insert(produceItems).values(item).returning();
    return newItem;
  }

  async updateProduceItem(id: number, item: Partial<InsertProduceItem>): Promise<ProduceItem> {
    const [updatedItem] = await db
      .update(produceItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(produceItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteProduceItem(id: number): Promise<void> {
    // First delete the inventory record
    await db.delete(inventories).where(eq(inventories.produceItemId, id));
    // Then delete the produce item
    await db.delete(produceItems).where(eq(produceItems.id, id));
  }

  async getAllProduceWithFarms(): Promise<any[]> {
    return await db
      .select({
        id: produceItems.id,
        name: produceItems.name,
        description: produceItems.description,
        category: produceItems.category,
        variety: produceItems.variety,
        unit: produceItems.unit,
        pricePerUnit: produceItems.pricePerUnit,
        imageUrl: produceItems.imageUrl,
        isOrganic: produceItems.isOrganic,
        isSeasonal: produceItems.isSeasonal,
        isHeirloom: produceItems.isHeirloom,
        harvestDate: produceItems.harvestDate,
        isActive: produceItems.isActive,
        createdAt: produceItems.createdAt,
        updatedAt: produceItems.updatedAt,
        farm: {
          id: farms.id,
          name: farms.name,
          city: farms.city,
          state: farms.state,
        },
      })
      .from(produceItems)
      .leftJoin(farms, eq(produceItems.farmId, farms.id))
      .orderBy(desc(produceItems.createdAt));
  }

  // Inventory operations
  async getInventory(produceItemId: number): Promise<Inventory | undefined> {
    const [inventory] = await db
      .select()
      .from(inventories)
      .where(eq(inventories.produceItemId, produceItemId));
    return inventory;
  }

  async updateInventory(produceItemId: number, inventory: Partial<InsertInventory>): Promise<Inventory> {
    // Try to insert first, if it exists, update it
    try {
      const [newInventory] = await db
        .insert(inventories)
        .values({ 
          produceItemId, 
          quantityAvailable: inventory.quantityAvailable || 0,
          lastUpdated: new Date() 
        })
        .returning();
      return newInventory;
    } catch (error) {
      // If insert fails due to unique constraint, update existing record
      const [updatedInventory] = await db
        .update(inventories)
        .set({ ...inventory, lastUpdated: new Date() })
        .where(eq(inventories.produceItemId, produceItemId))
        .returning();
      return updatedInventory;
    }
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByBuyer(buyerId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.buyerId, buyerId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getAllOrdersWithBuyers(): Promise<any[]> {
    return await db
      .select({
        id: orders.id,
        totalAmount: orders.totalAmount,
        status: orders.status,
        deliveryMethod: orders.deliveryMethod,
        deliveryAddress: orders.deliveryAddress,
        deliveryDate: orders.deliveryDate,
        paymentStatus: orders.paymentStatus,
        paymentIntentId: orders.paymentIntentId,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        buyer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(orders)
      .leftJoin(users, eq(orders.buyerId, users.id))
      .orderBy(desc(orders.createdAt));
  }

  // Order item operations
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message;
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db
      .select()
      .from(messages)
      .where(and(eq(messages.receiverId, userId), eq(messages.isRead, false)));
    return result.length;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async getReviewsByFarm(farmId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.farmId, farmId), eq(reviews.isActive, true)))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByBuyer(buyerId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.buyerId, buyerId), eq(reviews.isActive, true)))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    
    // Update farm rating and count
    await this.updateFarmRating(review.farmId);
    
    return newReview;
  }

  async updateReview(id: number, review: Partial<InsertReview>): Promise<Review> {
    const [updatedReview] = await db
      .update(reviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    
    // Update farm rating and count
    await this.updateFarmRating(updatedReview.farmId);
    
    return updatedReview;
  }

  async deleteReview(id: number): Promise<void> {
    const [deletedReview] = await db
      .update(reviews)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    
    // Update farm rating and count
    if (deletedReview) {
      await this.updateFarmRating(deletedReview.farmId);
    }
  }

  async calculateFarmRating(farmId: number): Promise<{ rating: number; count: number }> {
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${reviews.rating})::decimal(3,2)`,
        count: sql<number>`COUNT(*)::integer`,
      })
      .from(reviews)
      .where(and(eq(reviews.farmId, farmId), eq(reviews.isActive, true)));
    
    return {
      rating: result[0]?.avgRating || 0,
      count: result[0]?.count || 0,
    };
  }

  private async updateFarmRating(farmId: number): Promise<void> {
    const { rating, count } = await this.calculateFarmRating(farmId);
    await db
      .update(farms)
      .set({ rating: rating.toString(), reviewCount: count })
      .where(eq(farms.id, farmId));
  }
}

export const storage = new DatabaseStorage();
