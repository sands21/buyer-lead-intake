import { NextResponse } from "next/server";
import { getServerSession, isAdminUser } from "@/lib/auth";
import { buyerSearchParamsSchema } from "@/lib/validations/buyer";
import { listBuyers } from "@/lib/db/queries";

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    // Escape fields containing quotes, commas, or newlines
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

export async function GET(req: Request) {
  const user = await getServerSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = buyerSearchParamsSchema.safeParse(
    Object.fromEntries(searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { rows } = await listBuyers({
    ownerId: user.id,
    admin: isAdminUser(user),
    ...parsed.data,
    limit: 1000,
  });

  const csvRows = rows.map((r) => ({
    id: r.id,
    full_name: r.fullName,
    email: r.email,
    phone: r.phone,
    city: r.city,
    property_type: r.propertyType,
    bhk: r.bhk,
    purpose: r.purpose,
    budget_min: r.budgetMin,
    budget_max: r.budgetMax,
    timeline: r.timeline,
    source: r.source,
    status: r.status,
    notes: r.notes,
    tags: r.tags?.join(";") ?? "",
    owner_id: r.ownerId,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }));

  const csv = toCsv(csvRows as Record<string, unknown>[]);
  const res = new NextResponse(csv);
  res.headers.set("Content-Type", "text/csv; charset=utf-8");
  res.headers.set("Content-Disposition", "attachment; filename=buyers.csv");
  return res;
}
