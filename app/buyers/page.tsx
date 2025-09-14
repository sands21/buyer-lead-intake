import Link from "next/link";
import { getServerSession } from "@/lib/auth";
import { listBuyers } from "@/lib/db/queries";
import { redirect } from "next/navigation";

type Filters = {
  search: string | null;
  page: number;
  city?: string | null;
  propertyType?: string | null;
  status?: string | null;
  timeline?: string | null;
};

async function fetchBuyers({
  search,
  page,
  city,
  propertyType,
  status,
  timeline,
}: Filters) {
  const user = await getServerSession();
  if (!user) redirect("/login");

  return await listBuyers({
    ownerId: user.id,
    search: search || undefined,
    city: city || undefined,
    propertyType: propertyType || undefined,
    status: status || undefined,
    timeline: timeline || undefined,
    page,
    limit: 10,
  });
}

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = Number(searchParams.page ?? 1);
  const search = (searchParams.search as string | undefined) ?? null;
  const city = (searchParams.city as string | undefined) ?? null;
  const propertyType =
    (searchParams.propertyType as string | undefined) ?? null;
  const status = (searchParams.status as string | undefined) ?? null;
  const timeline = (searchParams.timeline as string | undefined) ?? null;

  const { rows, total } = await fetchBuyers({
    search,
    page,
    city,
    propertyType,
    status,
    timeline,
  });
  const totalPages = Math.max(1, Math.ceil(total / 10));

  const cityOptions = [
    "",
    "Chandigarh",
    "Mohali",
    "Zirakpur",
    "Panchkula",
    "Other",
  ] as const;
  const propertyTypeOptions = [
    "",
    "Apartment",
    "Villa",
    "Plot",
    "Office",
    "Retail",
  ] as const;
  const statusOptions = [
    "",
    "New",
    "Qualified",
    "Contacted",
    "Visited",
    "Negotiation",
    "Converted",
    "Dropped",
  ] as const;
  const timelineOptions = ["", "0-3m", "3-6m", ">6m", "Exploring"] as const;

  const activeFilters =
    [city, propertyType, status, timeline].filter(Boolean).length +
    (search ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Buyers</h1>
        <Link href="/buyers/new" className="underline">
          New
        </Link>
      </div>

      <form action="" className="flex flex-wrap gap-2 items-center">
        <input
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search name, phone, email"
          className="rounded-md border px-3 py-2"
        />
        <select
          name="city"
          defaultValue={city ?? ""}
          className="rounded-md border px-3 py-2"
        >
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c || "City"}
            </option>
          ))}
        </select>
        <select
          name="propertyType"
          defaultValue={propertyType ?? ""}
          className="rounded-md border px-3 py-2"
        >
          {propertyTypeOptions.map((c) => (
            <option key={c} value={c}>
              {c || "Property type"}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border px-3 py-2"
        >
          {statusOptions.map((c) => (
            <option key={c} value={c}>
              {c || "Status"}
            </option>
          ))}
        </select>
        <select
          name="timeline"
          defaultValue={timeline ?? ""}
          className="rounded-md border px-3 py-2"
        >
          {timelineOptions.map((c) => (
            <option key={c} value={c}>
              {c || "Timeline"}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border px-3 py-2">
          Search
        </button>
        {activeFilters > 0 && (
          <Link href="/buyers" className="text-sm underline opacity-70">
            Clear ({activeFilters})
          </Link>
        )}
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-2">Name</th>
            <th className="py-2">Phone</th>
            <th className="py-2">City</th>
            <th className="py-2">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="py-8 text-center text-sm text-muted-foreground"
              >
                No buyers found
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.fullName}</td>
                <td className="py-2">{r.phone}</td>
                <td className="py-2">{r.city}</td>
                <td className="py-2">{r.status}</td>
                <td className="py-2 text-right">
                  <Link href={`/buyers/${r.id}`} className="underline">
                    View
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={{
                pathname: "/buyers",
                query: { ...(search ? { search } : {}), page: page - 1 },
              }}
              className="underline"
            >
              Previous
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={{
                pathname: "/buyers",
                query: { ...(search ? { search } : {}), page: page + 1 },
              }}
              className="underline"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
