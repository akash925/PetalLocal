import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table - supports farmer, buyer, admin roles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 20 }).notNull().default("buyer"), // farmer, buyer, admin
  profileImageUrl: text("profile_image_url"),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Farms table
export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  imageUrl: text("image_url"),
  website: text("website"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  isOrganic: boolean("is_organic").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Produce items table
export const produceItems = pgTable("produce_items", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").references(() => farms.id).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // vegetables, fruits, herbs, bakery, etc.
  variety: varchar("variety", { length: 100 }),
  unit: varchar("unit", { length: 20 }).notNull(), // lb, pint, bunch, each, etc.
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isOrganic: boolean("is_organic").default(false),
  isSeasonal: boolean("is_seasonal").default(false),
  isHeirloom: boolean("is_heirloom").default(false),
  harvestDate: timestamp("harvest_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory table
export const inventories = pgTable("inventories", {
  id: serial("id").primaryKey(),
  produceItemId: integer("produce_item_id").references(() => produceItems.id).notNull(),
  quantityAvailable: integer("quantity_available").notNull().default(0),
  quantityReserved: integer("quantity_reserved").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, confirmed, preparing, ready, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryMethod: varchar("delivery_method", { length: 50 }).notNull(), // pickup, delivery
  deliveryAddress: text("delivery_address"),
  deliveryDate: timestamp("delivery_date"),
  specialInstructions: text("special_instructions"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, paid, failed, refunded
  paymentIntentId: text("payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  produceItemId: integer("produce_item_id").references(() => produceItems.id).notNull(),
  quantity: integer("quantity").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Messages table for farmer-to-buyer communication
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  farms: many(farms),
  orders: many(orders),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
}));

export const farmsRelations = relations(farms, ({ one, many }) => ({
  owner: one(users, { fields: [farms.ownerId], references: [users.id] }),
  produceItems: many(produceItems),
}));

export const produceItemsRelations = relations(produceItems, ({ one, many }) => ({
  farm: one(farms, { fields: [produceItems.farmId], references: [farms.id] }),
  inventory: one(inventories),
  orderItems: many(orderItems),
}));

export const inventoriesRelations = relations(inventories, ({ one }) => ({
  produceItem: one(produceItems, { fields: [inventories.produceItemId], references: [produceItems.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.id] }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  produceItem: one(produceItems, { fields: [orderItems.produceItemId], references: [produceItems.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { 
    fields: [messages.senderId], 
    references: [users.id],
    relationName: "sentMessages"
  }),
  receiver: one(users, { 
    fields: [messages.receiverId], 
    references: [users.id],
    relationName: "receivedMessages"
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFarmSchema = createInsertSchema(farms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  zipCode: z.string().min(1, "ZIP code is required"),
  name: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phoneNumber: z.string().optional(),
  website: z.string().optional(),
});

export const insertProduceItemSchema = createInsertSchema(produceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventorySchema = createInsertSchema(inventories).omit({
  id: true,
  lastUpdated: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Farm = typeof farms.$inferSelect;
export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type ProduceItem = typeof produceItems.$inferSelect;
export type InsertProduceItem = z.infer<typeof insertProduceItemSchema>;
export type Inventory = typeof inventories.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
