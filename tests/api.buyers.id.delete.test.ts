import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/db/queries", () => ({
  deleteBuyer: vi.fn(),
}));

import { DELETE } from "@/app/api/buyers/[id]/route";
import { getServerSession } from "@/lib/auth";
import { deleteBuyer } from "@/lib/db/queries";

describe("DELETE /api/buyers/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    (getServerSession as vi.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/buyers/abc", {
      method: "DELETE",
    });
    const res = await DELETE(req as unknown as Request, {
      params: { id: "abc" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when buyer not found", async () => {
    (getServerSession as vi.Mock).mockResolvedValue({ id: "u1" });
    (deleteBuyer as vi.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/buyers/abc", {
      method: "DELETE",
    });
    const res = await DELETE(req as unknown as Request, {
      params: { id: "abc" },
    });
    expect(res.status).toBe(404);
  });

  it("returns 200 on successful deletion", async () => {
    (getServerSession as vi.Mock).mockResolvedValue({ id: "u1" });
    (deleteBuyer as vi.Mock).mockResolvedValue({ id: "abc" });
    const req = new Request("http://localhost/api/buyers/abc", {
      method: "DELETE",
    });
    const res = await DELETE(req as unknown as Request, {
      params: { id: "abc" },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.ok).toBe(true);
  });
});
