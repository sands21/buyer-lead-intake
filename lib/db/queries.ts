import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./client";
import { buyers, buyerHistory } from "./schema";

export type ListFilters = {
  ownerId: string;
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  propertyType?: string;
  status?: string;
  timeline?: string;
  sort?: "updatedAt" | "createdAt" | "fullName";
  order?: "asc" | "desc";
};

export async function listBuyers(filters: ListFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const offset = (page - 1) * limit;

  const where = [eq(buyers.ownerId, filters.ownerId)];

  if (filters.city) where.push(eq(buyers.city, filters.city));
  if (filters.propertyType)
    where.push(eq(buyers.propertyType, filters.propertyType));
  if (filters.status) where.push(eq(buyers.status, filters.status));
  if (filters.timeline) where.push(eq(buyers.timeline, filters.timeline));
  if (filters.search) {
    const q = `%${filters.search}%`;
    const searchCondition = sql`(${buyers.fullName} ILIKE ${q} OR coalesce(${buyers.email}, '') ILIKE ${q} OR ${buyers.phone} ILIKE ${q})`;
    where.push(searchCondition);
  }

  const orderByColumn =
    filters.sort === "createdAt"
      ? buyers.createdAt
      : filters.sort === "fullName"
      ? buyers.fullName
      : buyers.updatedAt;

  const rows = await db
    .select()
    .from(buyers)
    .where(and(...where))
    .orderBy(filters.order === "asc" ? orderByColumn : desc(orderByColumn))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(buyers)
    .where(and(...where));

  return { rows, total: Number(count) };
}

export async function getBuyerById(id: string, ownerId: string) {
  const [row] = await db
    .select()
    .from(buyers)
    .where(and(eq(buyers.id, id), eq(buyers.ownerId, ownerId)));
  return row ?? null;
}

export async function createBuyer(
  input: Omit<
    typeof buyers.$inferInsert,
    "ownerId" | "id" | "createdAt" | "updatedAt"
  >,
  ownerId: string
) {
  const [row] = await db
    .insert(buyers)
    .values({ ...input, ownerId })
    .returning();
  return row;
}

export async function updateBuyer(
  id: string,
  ownerId: string,
  input: Partial<typeof buyers.$inferInsert>,
  expectedUpdatedAt?: Date
) {
  // Ownership check via where clause; optimistic concurrency via updatedAt match
  const where = [eq(buyers.id, id), eq(buyers.ownerId, ownerId)];
  if (expectedUpdatedAt) {
    where.push(eq(buyers.updatedAt, expectedUpdatedAt));
  }

  const [before] = await db
    .select()
    .from(buyers)
    .where(and(eq(buyers.id, id), eq(buyers.ownerId, ownerId)));

  const [row] = await db
    .update(buyers)
    .set({ ...input, updatedAt: sql`now()` })
    .where(and(...where))
    .returning();

  if (!row) return null; // not found or concurrency conflict

  // History tracking (diff minimal: store provided fields)
  const diff: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) diff[k] = v;
  await db.insert(buyerHistory).values({
    buyerId: id,
    changedBy: ownerId,
    diff,
  });

  return { before, after: row };
}

export async function deleteBuyer(id: string, ownerId: string) {
  const [row] = await db
    .delete(buyers)
    .where(and(eq(buyers.id, id), eq(buyers.ownerId, ownerId)))
    .returning();
  return row ?? null;
}

export async function listBuyerHistory(buyerId: string) {
  const rows = await db
    .select()
    .from(buyerHistory)
    .where(eq(buyerHistory.buyerId, buyerId))
    .orderBy(desc(buyerHistory.changedAt))
    .limit(5);
  return rows;
}
