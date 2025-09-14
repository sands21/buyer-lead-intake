import Link from "next/link";
import { getServerSession } from "@/lib/auth";
import { listBuyers, getDashboardStats } from "@/lib/db/queries";

export default async function HomePage() {
  const user = await getServerSession();
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

  const { rows } = await listBuyers({
    ownerId: user.id,
    page: 1,
    limit: 5,
    sort: "updatedAt",
    order: "desc",
  });
  const recent = rows;
  const stats = await getDashboardStats(user.id);

  const topStatus =
    Object.entries(stats.statusCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "—";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-md border p-4">
          <div className="text-sm opacity-70">Total buyers</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm opacity-70">Top status</div>
          <div className="text-2xl font-semibold">{topStatus}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm opacity-70">Converted this week</div>
          <div className="text-2xl font-semibold">
            {stats.convertedThisWeek}
          </div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm opacity-70">New leads today</div>
          <div className="text-2xl font-semibold">{stats.newLeadsToday}</div>
        </div>
        <div className="rounded-md border p-4 md:col-span-1 md:col-start-5">
          <div className="text-sm opacity-70">Updated last 7 days</div>
          <div className="flex items-end gap-1 pt-2">
            {stats.updatedTrend.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-1">
                <div
                  className="w-6 rounded-sm bg-gray-200"
                  style={{ height: `${Math.min(60, d.count * 8)}px` }}
                  title={`${d.day}: ${d.count}`}
                />
                <div className="text-[10px] opacity-70">{d.day.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border">
          <div className="border-b p-3 font-medium">Status breakdown</div>
          <ul className="p-3 text-sm">
            {Object.entries(stats.statusCounts).length === 0 ? (
              <li className="opacity-70">No data</li>
            ) : (
              Object.entries(stats.statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([s, c]) => (
                  <li
                    key={s}
                    className="flex items-center justify-between py-1"
                  >
                    <span>{s}</span>
                    <span className="font-medium">{c}</span>
                  </li>
                ))
            )}
          </ul>
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
    </div>
  );
}
