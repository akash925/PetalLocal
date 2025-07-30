import { pgTable, serial, varchar, decimal, timestamp, boolean, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Delivery Providers Configuration
export const deliveryProviders = pgTable("delivery_providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "DoorDash", "Uber Eats", "Local Delivery"
  type: varchar("type", { length: 50 }).notNull(), // "third_party", "local_fleet", "pickup_only"
  apiEndpoint: varchar("api_endpoint", { length: 255 }),
  isActive: boolean("is_active").default(true),
  serviceAreas: text("service_areas"), // JSON array of zip codes/areas served
  baseFee: decimal("base_fee", { precision: 10, scale: 2 }),
  perMileFee: decimal("per_mile_fee", { precision: 10, scale: 2 }),
  maxDeliveryDistance: integer("max_delivery_distance"), // in miles
  estimatedDeliveryTime: integer("estimated_delivery_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// QR Code Pickup System
export const pickupCodes = pgTable("pickup_codes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  qrCodeData: varchar("qr_code_data", { length: 255 }).notNull(),
  codeType: varchar("code_type", { length: 50 }).notNull(), // "receipt", "order_confirmation"
  isUsed: boolean("is_used").default(false),
  scannedAt: timestamp("scanned_at"),
  scannedBy: integer("scanned_by"), // staff member who scanned
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery Tracking
export const deliveryTracking = pgTable("delivery_tracking", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  providerId: integer("provider_id").notNull(),
  externalDeliveryId: varchar("external_delivery_id", { length: 255 }), // ID from DoorDash/Uber
  status: varchar("status", { length: 50 }).notNull(), // "pending", "assigned", "picked_up", "delivered"
  driverName: varchar("driver_name", { length: 100 }),
  driverPhone: varchar("driver_phone", { length: 20 }),
  trackingUrl: varchar("tracking_url", { length: 500 }),
  estimatedArrival: timestamp("estimated_arrival"),
  actualDelivery: timestamp("actual_delivery"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }),
  tip: decimal("tip", { precision: 10, scale: 2 }),
  deliveryNotes: text("delivery_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas for validation
export const insertDeliveryProviderSchema = createInsertSchema(deliveryProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPickupCodeSchema = createInsertSchema(pickupCodes).omit({
  id: true,
  createdAt: true,
});

export const insertDeliveryTrackingSchema = createInsertSchema(deliveryTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type DeliveryProvider = typeof deliveryProviders.$inferSelect;
export type NewDeliveryProvider = z.infer<typeof insertDeliveryProviderSchema>;
export type PickupCode = typeof pickupCodes.$inferSelect;
export type NewPickupCode = z.infer<typeof insertPickupCodeSchema>;
export type DeliveryTracking = typeof deliveryTracking.$inferSelect;
export type NewDeliveryTracking = z.infer<typeof insertDeliveryTrackingSchema>;

// Delivery Options Enum
export const DELIVERY_METHODS = {
  PICKUP: "pickup",
  LOCAL_DELIVERY: "local_delivery", 
  DOORDASH: "doordash",
  UBER_EATS: "uber_eats",
  GRUBHUB: "grubhub",
} as const;

export type DeliveryMethod = typeof DELIVERY_METHODS[keyof typeof DELIVERY_METHODS];