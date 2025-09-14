import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({
  createBuyer: vi.fn(),
  listBuyers: vi.fn(),
}));

import { POST } from "@/app/api/buyers/route";
import { getServerSession } from "@/lib/auth";
import { createBuyer } from "@/lib/db/queries";

const validBody = {
  full_name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  city: "Chandigarh",
  property_type: "Apartment",
  bhk: "2",
  purpose: "Buy",
  budget_min: 100,
  budget_max: 200,
  timeline: "0-3m",
  source: "Website",
  notes: "",
  tags: ["lead"],
};

describe("POST /api/buyers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    (getServerSession as unknown as vi.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/buyers", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(401);
  });

  it("validates input and returns 400 for bad body", async () => {
    (getServerSession as unknown as vi.Mock).mockResolvedValue({ id: "u1" });
    const req = new Request("http://localhost/api/buyers", {
      method: "POST",
      body: JSON.stringify({ ...validBody, full_name: "" }),
    });
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(data.error).toBeDefined();
  });

  it("creates buyer and returns 201", async () => {
    (getServerSession as unknown as vi.Mock).mockResolvedValue({ id: "u1" });
    (createBuyer as unknown as vi.Mock).mockResolvedValue({
      id: "b1",
      fullName: "John Doe",
    });
    const req = new Request("http://localhost/api/buyers", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    expect(data.id).toBe("b1");
  });
});
