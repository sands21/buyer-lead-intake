import { and, desc, eq, sql, gte, lte } from "drizzle-orm";
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
  updatedFrom?: string | Date;
  updatedTo?: string | Date;
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

  // Date range filters on updatedAt
  if (filters.updatedFrom) {
    const from = new Date(filters.updatedFrom);
    if (!isNaN(from.getTime())) where.push(gte(buyers.updatedAt, from));
  }
  if (filters.updatedTo) {
    const to = new Date(filters.updatedTo);
    if (!isNaN(to.getTime())) where.push(lte(buyers.updatedAt, to));
  }

  if (filters.search) {
    const q = `%${filters.search}%`;
    const searchCondition = sql`(${buyers.fullName} ILIKE ${q} OR coalesce(${buyers.email}, '') ILIKE ${q} OR ${buyers.phone} ILIKE ${q} OR coalesce(${buyers.notes}, '') ILIKE ${q})`;
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
  // First get the current record for comparison
  const [before] = await db
    .select()
    .from(buyers)
    .where(and(eq(buyers.id, id), eq(buyers.ownerId, ownerId)));

  if (!before) return null; // not found

  // Check optimistic concurrency: if expectedUpdatedAt is provided, it must match
  if (expectedUpdatedAt && before.updatedAt) {
    const currentUpdatedAt = new Date(before.updatedAt);
    const expectedTime = expectedUpdatedAt.getTime();
    const currentTime = currentUpdatedAt.getTime();

    // Allow for small timestamp differences (within 1 second)
    if (Math.abs(expectedTime - currentTime) > 1000) {
      return null; // concurrency conflict
    }
  }

  // Proceed with update
  const [row] = await db
    .update(buyers)
    .set({ ...input, updatedAt: sql`now()` })
    .where(and(eq(buyers.id, id), eq(buyers.ownerId, ownerId)))
    .returning();

  if (!row) return null; // update failed

  // History tracking with old/new values for changed fields
  const diff: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, newVal] of Object.entries(input)) {
    if (typeof newVal === "undefined") continue;
    const oldVal = (before as Record<string, unknown>)[key];
    const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
    if (changed) diff[key] = { old: oldVal ?? null, new: newVal ?? null };
  }
  if (Object.keys(diff).length > 0) {
    await db.insert(buyerHistory).values({
      buyerId: id,
      changedBy: ownerId,
      diff,
    });
  }

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
