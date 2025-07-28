import { pgTable, serial, integer, text, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { orders, users } from "./schema";

export const refundRequests = pgTable("refund_requests", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  requesterType: text("requester_type", { enum: ["buyer", "seller"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "declined"] }).default("pending").notNull(),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processedById: integer("processed_by_id").references(() => users.id),
});

export const insertRefundRequestSchema = createInsertSchema(refundRequests).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  processedById: true,
});

export const refundRequestActionSchema = z.object({
  action: z.enum(["approve", "decline"]),
  adminNotes: z.string().optional(),
});

export type RefundRequest = typeof refundRequests.$inferSelect;
export type InsertRefundRequest = z.infer<typeof insertRefundRequestSchema>;
export type RefundRequestAction = z.infer<typeof refundRequestActionSchema>;