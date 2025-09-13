import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  check,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

// buyers table
export const buyers = pgTable(
  "buyers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 80 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 15 }).notNull(),
    city: text("city").notNull(),
    propertyType: text("property_type").notNull(),
    bhk: text("bhk"),
    purpose: text("purpose").notNull(),
    budgetMin: integer("budget_min"),
    budgetMax: integer("budget_max"),
    timeline: text("timeline").notNull(),
    source: text("source").notNull(),
    status: text("status").notNull().default("New"),
    notes: text("notes"),
    tags: text("tags")
      .array()
      .default(sql`'{}'::text[]`),
    ownerId: uuid("owner_id").notNull(), // REFERENCES auth.users(id)
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => {
    return {
      // Indexes
      emailIdx: index("buyers_email_idx").on(table.email),
      phoneIdx: index("buyers_phone_idx").on(table.phone),
      ownerIdx: index("buyers_owner_id_idx").on(table.ownerId),
      updatedAtIdx: index("buyers_updated_at_idx").on(table.updatedAt),
      // Constraints mirroring architecture.md
      fullNameLength: check(
        "buyers_full_name_length",
        sql`char_length(${table.fullName}) >= 2`
      ),
      phoneFormat: check(
        "buyers_phone_format",
        sql`${table.phone} ~ '^[0-9]{10,15}$'`
      ),
      cityCheck: check(
        "buyers_city_check",
        sql`${table.city} IN ('Chandigarh','Mohali','Zirakpur','Panchkula','Other')`
      ),
      propertyTypeCheck: check(
        "buyers_property_type_check",
        sql`${table.propertyType} IN ('Apartment','Villa','Plot','Office','Retail')`
      ),
      bhkCheck: check(
        "buyers_bhk_check",
        sql`${table.bhk} IS NULL OR ${table.bhk} IN ('1','2','3','4','Studio')`
      ),
      purposeCheck: check(
        "buyers_purpose_check",
        sql`${table.purpose} IN ('Buy','Rent')`
      ),
      budgetMinCheck: check(
        "buyers_budget_min_check",
        sql`${table.budgetMin} IS NULL OR ${table.budgetMin} >= 0`
      ),
      budgetMaxCheck: check(
        "buyers_budget_max_check",
        sql`${table.budgetMax} IS NULL OR ${table.budgetMin} IS NULL OR ${table.budgetMax} >= ${table.budgetMin}`
      ),
      timelineCheck: check(
        "buyers_timeline_check",
        sql`${table.timeline} IN ('0-3m','3-6m','>6m','Exploring')`
      ),
      sourceCheck: check(
        "buyers_source_check",
        sql`${table.source} IN ('Website','Referral','Walk-in','Call','Other')`
      ),
      statusCheck: check(
        "buyers_status_check",
        sql`${table.status} IN ('New','Qualified','Contacted','Visited','Negotiation','Converted','Dropped')`
      ),
      notesLength: check(
        "buyers_notes_length",
        sql`${table.notes} IS NULL OR char_length(${table.notes}) <= 1000`
      ),
    };
  }
);

// buyer_history table
export const buyerHistory = pgTable(
  "buyer_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => buyers.id, { onDelete: "cascade" }),
    changedBy: uuid("changed_by").notNull(), // REFERENCES auth.users(id)
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow(),
    diff: jsonb("diff").$type<Record<string, unknown>>().notNull(),
  },
  (table) => {
    return {
      buyerIdx: index("buyer_history_buyer_id_idx").on(table.buyerId),
      changedByIdx: index("buyer_history_changed_by_idx").on(table.changedBy),
      changedAtIdx: index("buyer_history_changed_at_idx").on(table.changedAt),
    };
  }
);
