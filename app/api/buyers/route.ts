import { NextResponse } from "next/server";
import { buyerCreateSchema } from "@/lib/validations/buyer";
import { getServerSession } from "@/lib/auth";
import { createBuyer } from "@/lib/db/queries";
import { buyers } from "@/lib/db/schema";

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
  };
}

export async function POST(req: Request) {
  const user = await getServerSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
