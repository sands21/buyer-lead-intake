import { NextResponse } from "next/server";
import {
  buyerCreateSchema,
  buyerSearchParamsSchema,
} from "@/lib/validations/buyer";
import { getServerSession, isAdminUser } from "@/lib/auth";
import { createBuyer } from "@/lib/db/queries";
import { listBuyers } from "@/lib/db/queries";
import { buyers } from "@/lib/db/schema";
import { allow, rateLimitKey } from "@/lib/rate-limit";

function toCamelCase(
  input: unknown
): Omit<
  typeof buyers.$inferInsert,
  "ownerId" | "id" | "createdAt" | "updatedAt"
> {
  const v = input as Record<string, unknown>;
  if (!input)
    return {
      fullName: "",
      email: null,
      phone: "",
      city: "",
      propertyType: "",
      bhk: null,
      purpose: "",
      budgetMin: null,
      budgetMax: null,
      timeline: "",
      source: "",
      status: undefined,
      notes: null,
      tags: [],
    };
  return {
    fullName: v.full_name as string,
    email: (v.email as string | undefined) ?? null,
    phone: v.phone as string,
    city: v.city as string,
    propertyType: v.property_type as string,
    bhk: (v.bhk as string | undefined) ?? null,
    purpose: v.purpose as string,
    budgetMin: (v.budget_min as number | undefined) ?? null,
    budgetMax: (v.budget_max as number | undefined) ?? null,
    timeline: v.timeline as string,
    source: v.source as string,
    status: v.status as string | undefined,
    notes: (v.notes as string | undefined) ?? null,
    tags: (v.tags as string[] | undefined) ?? [],
    attachmentUrl: (v.attachment_url as string | undefined) ?? null,
  };
}

export async function POST(req: Request) {
  const user = await getServerSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 5 creates per 10 seconds per user
  const key = rateLimitKey(user.id, "POST /api/buyers");
  if (!allow({ key, capacity: 5, windowMs: 10_000 })) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = buyerCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const payload = toCamelCase(parsed.data);
  try {
    const created = await createBuyer(payload, user.id);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const user = await getServerSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());
  const parsed = buyerSearchParamsSchema.safeParse(query);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { rows, total } = await listBuyers({
    ownerId: user.id,
    admin: isAdminUser(user),
    ...parsed.data,
  });
  return NextResponse.json({ rows, total });
}
