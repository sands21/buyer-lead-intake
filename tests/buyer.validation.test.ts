import { describe, it, expect } from "vitest";
import { buyerCreateSchema } from "@/lib/validations/buyer";

const base = {
  full_name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  city: "Chandigarh",
  property_type: "Apartment" as const,
  bhk: "2" as const,
  purpose: "Buy" as const,
  budget_min: 100,
  budget_max: 200,
  timeline: "0-3m" as const,
  source: "Website" as const,
  status: "New" as const,
  notes: "",
  tags: ["lead"],
};

describe("buyerCreateSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = buyerCreateSchema.safeParse(base);
    expect(parsed.success).toBe(true);
  });

  it("requires bhk when property_type is Apartment or Villa", () => {
    const parsed = buyerCreateSchema.safeParse({
      ...base,
      bhk: undefined,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path.join(".") === "bhk")).toBe(
        true
      );
    }
  });

  it("allows missing bhk when property_type is Plot", () => {
    const parsed = buyerCreateSchema.safeParse({
      ...base,
      property_type: "Plot",
      bhk: undefined,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects when budget_max < budget_min", () => {
    const parsed = buyerCreateSchema.safeParse({
      ...base,
      budget_min: 500,
      budget_max: 100,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some((i) => i.path.join(".") === "budget_max")
      ).toBe(true);
    }
  });
});
