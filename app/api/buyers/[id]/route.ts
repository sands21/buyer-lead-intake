import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { buyerUpdateSchema } from "@/lib/validations/buyer";
import {
  getBuyerById,
  updateBuyer,
  deleteBuyer,
  listBuyerHistory,
} from "@/lib/db/queries";
import { buyers } from "@/lib/db/schema";
import { allow, rateLimitKey } from "@/lib/rate-limit";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const user = await getServerSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const buyer = await getBuyerById(params.id, user.id);
  if (!buyer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const history = await listBuyerHistory(params.id);
  return NextResponse.json({ buyer, history });
}

export async function PUT(req: Request, { params }: Params) {
  const user = await getServerSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 10 updates per 10 seconds per user
  const key = rateLimitKey(user.id, `PUT /api/buyers/${params.id}`);
  if (!allow({ key, capacity: 10, windowMs: 10_000 })) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Expect snake_case body as per validation schema
  const parsed = buyerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const expectedUpdatedAtRaw = (
    body as Record<string, unknown> | null | undefined
  )?.updatedAt as string | undefined;

  let expectedUpdatedAt: Date | undefined;
  if (expectedUpdatedAtRaw) {
    try {
      expectedUpdatedAt = new Date(expectedUpdatedAtRaw);
      // Check if the date is valid
      if (isNaN(expectedUpdatedAt.getTime())) {
        expectedUpdatedAt = undefined;
      }
    } catch {
      expectedUpdatedAt = undefined;
    }
  }

  // Map to columns (camelCase to DB insert/update shape)
  type InsertShape = typeof buyers.$inferInsert;
  const payload: Partial<InsertShape> = {
    fullName: parsed.data.full_name,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone,
    city: parsed.data.city,
    propertyType: parsed.data.property_type,
    bhk: parsed.data.bhk ?? null,
    purpose: parsed.data.purpose,
    budgetMin: parsed.data.budget_min ?? null,
    budgetMax: parsed.data.budget_max ?? null,
    timeline: parsed.data.timeline,
    source: parsed.data.source,
    status: parsed.data.status,
    notes: parsed.data.notes ?? null,
    tags: parsed.data.tags ?? [],
  };

  const result = await updateBuyer(
    params.id,
    user.id,
    payload,
    expectedUpdatedAt
  );
  if (!result)
    return NextResponse.json(
      { error: "Conflict or not found" },
      { status: 409 }
    );
  return NextResponse.json(result.after);
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getServerSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const row = await deleteBuyer(params.id, user.id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
