import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export async function GET(req: Request) {
  const user = await getServerSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam || 10), 1), 50);

  // DISTINCT tag suggestions for this owner; optionally filter by q
  const like = `%${q}%`;
  const result = await db.execute(
    sql` 
      SELECT DISTINCT tag
      FROM (
        SELECT UNNEST(tags) AS tag
        FROM buyers
        WHERE owner_id = ${user.id}
      ) t
      ${q ? sql`WHERE tag ILIKE ${like}` : sql``}
      ORDER BY tag
      LIMIT ${limit}
    `
  );

  const rows = result as unknown as Array<{ tag: string | null }>;
  const tags = rows
    .map((r: { tag: string | null }) => r.tag)
    .filter(
      (t: string | null): t is string => typeof t === "string" && t.length > 0
    );

  return NextResponse.json({ tags });
}
