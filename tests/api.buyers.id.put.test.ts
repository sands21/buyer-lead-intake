import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/db/queries", () => ({
  updateBuyer: vi.fn(),
  getBuyerById: vi.fn(),
  listBuyerHistory: vi.fn(),
}));

import { PUT } from "@/app/api/buyers/[id]/route";
import { getServerSession } from "@/lib/auth";
import { updateBuyer } from "@/lib/db/queries";

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
  status: "New",
  notes: "",
  tags: ["lead"],
  updatedAt: new Date().toISOString(),
};

describe("PUT /api/buyers/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getServerSession as unknown as any).mockResolvedValue(null);
    const req = new Request("http://localhost/api/buyers/abc", {
      method: "PUT",
      body: JSON.stringify(validBody),
    });
    const res = await PUT(req as unknown as Request, { params: { id: "abc" } });
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid body", async () => {
    vi.mocked(getServerSession as unknown as any).mockResolvedValue({
      id: "u1",
    });
    const req = new Request("http://localhost/api/buyers/abc", {
      method: "PUT",
      body: JSON.stringify({ ...validBody, phone: "abc" }),
    });
    const res = await PUT(req as unknown as Request, { params: { id: "abc" } });
    expect(res.status).toBe(400);
  });

  it("returns 409 on conflict or not found", async () => {
    vi.mocked(getServerSession as unknown as any).mockResolvedValue({
      id: "u1",
    });
    vi.mocked(updateBuyer as unknown as any).mockResolvedValue(null);
    const req = new Request("http://localhost/api/buyers/abc", {
      method: "PUT",
      body: JSON.stringify(validBody),
    });
    const res = await PUT(req as unknown as Request, { params: { id: "abc" } });
    expect(res.status).toBe(409);
  });

  it("returns 200 on success", async () => {
    vi.mocked(getServerSession as unknown as any).mockResolvedValue({
      id: "u1",
    });
    vi.mocked(updateBuyer as unknown as any).mockResolvedValue({
      after: { id: "abc", updatedAt: new Date().toISOString() },
    });
    const req = new Request("http://localhost/api/buyers/abc", {
      method: "PUT",
      body: JSON.stringify(validBody),
    });
    const res = await PUT(req as unknown as Request, { params: { id: "abc" } });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.id).toBe("abc");
  });
});
