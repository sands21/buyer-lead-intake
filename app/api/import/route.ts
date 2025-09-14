import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { buyerCsvSchema } from "@/lib/validations/buyer";
import { db } from "@/lib/db/client";
import { buyers } from "@/lib/db/schema";

export async function POST(req: Request) {
  const user = await getServerSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = buyerCsvSchema.safeParse(
    (body as { rows?: unknown })?.rows ?? []
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  if (parsed.data.length === 0) return NextResponse.json({ inserted: 0 });

  // Transactional insert
  try {
    const values = parsed.data.map((r) => ({
      fullName: r.full_name,
      email: r.email ?? null,
      phone: r.phone,
      city: r.city,
      propertyType: r.property_type,
      bhk: r.bhk ?? null,
      purpose: r.purpose,
      budgetMin: r.budget_min ?? null,
      budgetMax: r.budget_max ?? null,
      timeline: r.timeline,
      source: r.source,
      status: r.status ?? undefined,
      notes: r.notes ?? null,
      tags: r.tags ?? [],
      ownerId: user.id,
    }));

    await db.transaction(async (tx) => {
      await tx.insert(buyers).values(values);
    });

    return NextResponse.json({ inserted: values.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
