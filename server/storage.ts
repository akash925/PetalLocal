import {
  users,
  farms,
  produceItems,
  inventories,
  orders,
  orderItems,
  messages,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc, asc, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Farm operations
  getFarm(id: number): Promise<Farm | undefined>;
  getFarms(): Promise<Farm[]>;
  getFarmsByOwner(ownerId: number): Promise<Farm[]>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: number, farm: Partial<InsertFarm>): Promise<Farm>;
  deleteFarm(id: number): Promise<void>;

  // Produce operations
  getProduceItem(id: number): Promise<ProduceItem | undefined>;
  getProduceItemsByFarm(farmId: number): Promise<ProduceItem[]>;
  searchProduceItems(query?: string, category?: string): Promise<ProduceItem[]>;
  createProduceItem(item: InsertProduceItem): Promise<ProduceItem>;
  updateProduceItem(id: number, item: Partial<InsertProduceItem>): Promise<ProduceItem>;
  deleteProduceItem(id: number): Promise<void>;

  // Inventory operations
  getInventory(produceItemId: number): Promise<Inventory | undefined>;
  updateInventory(produceItemId: number, inventory: Partial<InsertInventory>): Promise<Inventory>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByBuyer(buyerId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;

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

  // Produce operations
  async getProduceItem(id: number): Promise<ProduceItem | undefined> {
    const [item] = await db.select().from(produceItems).where(eq(produceItems.id, id));
    return item;
  }

  async getProduceItemsByFarm(farmId: number): Promise<ProduceItem[]> {
    return await db
      .select()
      .from(produceItems)
      .where(and(eq(produceItems.farmId, farmId), eq(produceItems.isActive, true)))
      .orderBy(asc(produceItems.name));
  }

  async searchProduceItems(query?: string, category?: string): Promise<ProduceItem[]> {
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
      .select()
      .from(produceItems)
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
    await db.delete(produceItems).where(eq(produceItems.id, id));
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
    const [updatedInventory] = await db
      .update(inventories)
      .set({ ...inventory, lastUpdated: new Date() })
      .where(eq(inventories.produceItemId, produceItemId))
      .returning();
    return updatedInventory;
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
}

export const storage = new DatabaseStorage();
