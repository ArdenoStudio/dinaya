import {
  pgTable,
  pgEnum,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  uuid,
  time,
  date,
  smallint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["free", "pro"]);
export const clientStageEnum = pgEnum("client_stage", [
  "lead",
  "prospect",
  "active",
  "churned",
]);
export const roleEnum = pgEnum("role", ["owner", "staff"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
  "refunded",
]);

// ─── Clients (CRM) ────────────────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  stage: clientStageEnum("stage").default("lead").notNull(),
  source: varchar("source", { length: 100 }),
  tags: text("tags").array(),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientNotes = pgTable("client_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Businesses ───────────────────────────────────────────────────────────────

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  plan: planEnum("plan").default("free").notNull(),
  planExpiresAt: timestamp("plan_expires_at"),
  payhereEnabled: boolean("payhere_enabled").default(false).notNull(),
  payhereMerchantId: varchar("payhere_merchant_id", { length: 100 }),
  payhereMerchantSecret: text("payhere_merchant_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Users (business owners + staff) ─────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").default("owner").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Services ─────────────────────────────────────────────────────────────────

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  priceLkr: integer("price_lkr").notNull().default(0),
  requiresPayment: boolean("requires_payment").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Staff ────────────────────────────────────────────────────────────────────

export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Staff ↔ Services (many-to-many) ─────────────────────────────────────────

export const staffServices = pgTable("staff_services", {
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
});

// ─── Availability (recurring weekly schedule) ─────────────────────────────────

export const availability = pgTable("availability", {
  id: uuid("id").defaultRandom().primaryKey(),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayOfWeek: smallint("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});

// ─── Availability Overrides (holidays, one-off changes) ───────────────────────

export const availabilityOverrides = pgTable("availability_overrides", {
  id: uuid("id").defaultRandom().primaryKey(),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  isBlocked: boolean("is_blocked").default(true).notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  reason: varchar("reason", { length: 200 }),
});

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  clientName: varchar("client_name", { length: 100 }).notNull(),
  clientPhone: varchar("client_phone", { length: 20 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  amountLkr: integer("amount_lkr").notNull(),
  payhereOrderId: varchar("payhere_order_id", { length: 100 }).notNull().unique(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  payherePayload: jsonb("payhere_payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const businessesRelations = relations(businesses, ({ many }) => ({
  users: many(users),
  services: many(services),
  staff: many(staff),
  bookings: many(bookings),
  clients: many(clients),
}));

export const usersRelations = relations(users, ({ one }) => ({
  business: one(businesses, { fields: [users.businessId], references: [businesses.id] }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  business: one(businesses, { fields: [services.businessId], references: [businesses.id] }),
  staffServices: many(staffServices),
  bookings: many(bookings),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  business: one(businesses, { fields: [staff.businessId], references: [businesses.id] }),
  staffServices: many(staffServices),
  availability: many(availability),
  availabilityOverrides: many(availabilityOverrides),
  bookings: many(bookings),
}));

export const staffServicesRelations = relations(staffServices, ({ one }) => ({
  staff: one(staff, { fields: [staffServices.staffId], references: [staff.id] }),
  service: one(services, { fields: [staffServices.serviceId], references: [services.id] }),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  staff: one(staff, { fields: [availability.staffId], references: [staff.id] }),
}));

export const availabilityOverridesRelations = relations(availabilityOverrides, ({ one }) => ({
  staff: one(staff, { fields: [availabilityOverrides.staffId], references: [staff.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  business: one(businesses, { fields: [bookings.businessId], references: [businesses.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
  staff: one(staff, { fields: [bookings.staffId], references: [staff.id] }),
  client: one(clients, { fields: [bookings.clientId], references: [clients.id] }),
  payment: one(payments, { fields: [bookings.id], references: [payments.bookingId] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  business: one(businesses, { fields: [clients.businessId], references: [businesses.id] }),
  bookings: many(bookings),
  notes: many(clientNotes),
}));

export const clientNotesRelations = relations(clientNotes, ({ one }) => ({
  client: one(clients, { fields: [clientNotes.clientId], references: [clients.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
export type Availability = typeof availability.$inferSelect;
export type AvailabilityOverride = typeof availabilityOverrides.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type ClientNote = typeof clientNotes.$inferSelect;
