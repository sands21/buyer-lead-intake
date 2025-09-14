import Link from "next/link";
import { getServerSession } from "@/lib/auth";
import { listBuyers } from "@/lib/db/queries";

export default async function HomePage() {
  const user = await getServerSession();
  // Public landing if not logged in
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Buyer Lead Intake</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your buyers and track progress.
        </p>
        <Link href="/buyers" className="underline">
          Go to Buyers
        </Link>
      </div>
    );
  }

  // Fetch first page for quick stats and recent
  const { rows, total } = await listBuyers({
    ownerId: user.id,
    page: 1,
    limit: 5,
    sort: "updatedAt",
    order: "desc",
  });
  const recent = rows;

  // Compute quick breakdowns from recent + total (simple; for large data a dedicated query would be better)
  const statusCounts = recent.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-md border p-4">
          <div className="text-sm opacity-70">Total buyers</div>
          <div className="text-2xl font-semibold">{total}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm opacity-70">Recently updated</div>
          <div className="text-2xl font-semibold">{recent.length}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm opacity-70">Top status (last 5)</div>
          <div className="text-2xl font-semibold">
            {Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
              "—"}
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="flex items-center justify-between border-b p-3">
          <div className="font-medium">Recent activity</div>
          <Link href="/buyers" className="text-sm underline">
            View all
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pl-3">Name</th>
              <th className="py-2">Phone</th>
              <th className="py-2">City</th>
              <th className="py-2">Status</th>
              <th className="py-2 pr-3 text-right">Updated</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-muted-foreground"
                >
                  No recent activity
                </td>
              </tr>
            ) : (
              recent.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 pl-3">{r.fullName}</td>
                  <td className="py-2">{r.phone}</td>
                  <td className="py-2">{r.city}</td>
                  <td className="py-2">{r.status}</td>
                  <td className="py-2 pr-3 text-right">
                    {new Date(
                      r.updatedAt ?? r.createdAt ?? Date.now()
                    ).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
