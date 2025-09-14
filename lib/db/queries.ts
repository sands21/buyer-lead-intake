import { and, desc, eq, sql, gte, lte, SQLWrapper } from "drizzle-orm";
import { db } from "./client";
import { buyers, buyerHistory } from "./schema";

export type ListFilters = {
  ownerId: string;
  admin?: boolean;
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

  const where: SQLWrapper[] = [];
  if (!filters.admin) {
    where.push(eq(buyers.ownerId, filters.ownerId));
  }

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
    const search = String(filters.search).trim();
    if (search.length > 0) {
      // Use full-text search on name, email, notes; exact/partial match fallback on phone
      const tsQuery = sql`websearch_to_tsquery('simple', ${search})`;
      const fts = sql`to_tsvector('simple', coalesce(${buyers.fullName}, '') || ' ' || coalesce(${buyers.email}, '') || ' ' || coalesce(${buyers.notes}, '')) @@ ${tsQuery}`;
      const phoneLike = sql`${buyers.phone} ILIKE ${"%" + search + "%"}`;
      where.push(sql`(${fts} OR ${phoneLike})`);
    }
  }

  const orderByColumn =
    filters.sort === "createdAt"
      ? buyers.createdAt
      : filters.sort === "fullName"
      ? buyers.fullName
      : buyers.updatedAt;

  // If FTS is used, consider ranking for ordering when no explicit sort provided
  const usingFts = Boolean(
    filters.search && String(filters.search).trim().length > 0
  );
  const rankExpr = usingFts
    ? sql`ts_rank_cd(fts, websearch_to_tsquery('simple', ${String(
        filters.search
      )}))`
    : null;

  const rows = await db
    .select()
    .from(buyers)
    .where(and(...where))
    .orderBy(
      usingFts && !filters.sort
        ? desc(rankExpr!)
        : filters.order === "asc"
        ? orderByColumn
        : desc(orderByColumn)
    )
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(buyers)
    .where(and(...where));

  return { rows, total: Number(count) };
}

export async function getBuyerById(
  id: string,
  ownerId: string,
  admin?: boolean
) {
  const conditions: SQLWrapper[] = [eq(buyers.id, id)];
  if (!admin) conditions.push(eq(buyers.ownerId, ownerId));
  const [row] = await db
    .select()
    .from(buyers)
    .where(and(...conditions));
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
  expectedUpdatedAt?: Date,
  admin?: boolean
) {
  // First get the current record for comparison
  const beforeConditions: SQLWrapper[] = [eq(buyers.id, id)];
  if (!admin) beforeConditions.push(eq(buyers.ownerId, ownerId));
  const [before] = await db
    .select()
    .from(buyers)
    .where(and(...beforeConditions));

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
  const updateConditions: SQLWrapper[] = [eq(buyers.id, id)];
  if (!admin) updateConditions.push(eq(buyers.ownerId, ownerId));
  const [row] = await db
    .update(buyers)
    .set({ ...input, updatedAt: sql`now()` })
    .where(and(...updateConditions))
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

export async function deleteBuyer(
  id: string,
  ownerId: string,
  admin?: boolean
) {
  const conditions: SQLWrapper[] = [eq(buyers.id, id)];
  if (!admin) conditions.push(eq(buyers.ownerId, ownerId));
  const [row] = await db
    .delete(buyers)
    .where(and(...conditions))
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

// Dashboard stats
export type DashboardStats = {
  total: number;
  statusCounts: Record<string, number>;
  updatedTrend: { day: string; count: number }[];
  convertedThisWeek: number;
  newLeadsToday: number;
};

export async function getDashboardStats(
  ownerId: string
): Promise<DashboardStats> {
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(buyers)
    .where(eq(buyers.ownerId, ownerId));

  const statusRows = await db
    .select({ status: buyers.status, count: sql<number>`count(*)` })
    .from(buyers)
    .where(eq(buyers.ownerId, ownerId))
    .groupBy(buyers.status);

  const statusCounts: Record<string, number> = {};
  for (const r of statusRows) statusCounts[r.status] = Number(r.count);

  const trendResult = await db.execute(
    sql`SELECT date_trunc('day', updated_at) AS day, count(*)::int AS count
        FROM buyers
        WHERE owner_id = ${ownerId} AND updated_at >= now() - interval '6 days'
        GROUP BY 1
        ORDER BY 1`
  );
  const rowsRaw = trendResult as unknown as Array<{
    day: string;
    count: number;
  }>;

  const map = new Map<string, number>();
  for (const r of rowsRaw) {
    const d = new Date(r.day);
    const key = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    )
      .toISOString()
      .slice(0, 10);
    map.set(key, Number(r.count));
  }
  const today = new Date();
  const days: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ day: key, count: map.get(key) ?? 0 });
  }

  // Converted this week
  const convRes = await db.execute(
    sql`SELECT count(*)::int AS count FROM buyers WHERE owner_id = ${ownerId} AND status = 'Converted' AND updated_at >= date_trunc('week', now())`
  );
  const convertedThisWeek = Number(
    (convRes as unknown as Array<{ count: number }>)[0]?.count ?? 0
  );

  // New leads today
  const newRes = await db.execute(
    sql`SELECT count(*)::int AS count FROM buyers WHERE owner_id = ${ownerId} AND created_at >= date_trunc('day', now())`
  );
  const newLeadsToday = Number(
    (newRes as unknown as Array<{ count: number }>)[0]?.count ?? 0
  );

  return {
    total: Number(total),
    statusCounts,
    updatedTrend: days,
    convertedThisWeek,
    newLeadsToday,
  };
}
