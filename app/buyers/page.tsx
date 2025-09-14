import Link from "next/link";
import { getServerSession } from "@/lib/auth";
import { listBuyers } from "@/lib/db/queries";
import { redirect } from "next/navigation";
import { StatusQuickActions } from "@/components/tables/StatusQuickActions";
import {
  BulkDeleteButton,
  RowCheckbox,
  SelectionProvider,
} from "@/components/tables/Selection";

type Filters = {
  search: string | null;
  page: number;
  city?: string | null;
  propertyType?: string | null;
  status?: string | null;
  timeline?: string | null;
  updatedFrom?: string | null;
  updatedTo?: string | null;
};

async function fetchBuyers({
  search,
  page,
  city,
  propertyType,
  status,
  timeline,
  updatedFrom,
  updatedTo,
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
    updatedFrom: updatedFrom || undefined,
    updatedTo: updatedTo || undefined,
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
  const updatedFrom = (searchParams.updatedFrom as string | undefined) ?? null;
  const updatedTo = (searchParams.updatedTo as string | undefined) ?? null;

  // Await searchParams access where needed for dynamic rendering
  const resolvedSearchParams = {
    page,
    search,
    city,
    propertyType,
    status,
    timeline,
    updatedFrom,
    updatedTo,
  };

  const { rows, total } = await fetchBuyers(resolvedSearchParams);
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

  // activeFilters was previously computed but unused; removed to satisfy lint

  return (
    <SelectionProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Buyers</h1>
          <div className="flex items-center gap-3">
            <Link
              href={{
                pathname: "/api/export",
                query: {
                  ...(search ? { search } : {}),
                  ...(city ? { city } : {}),
                  ...(propertyType ? { propertyType } : {}),
                  ...(status ? { status } : {}),
                  ...(timeline ? { timeline } : {}),
                },
              }}
              className="underline"
            >
              Export CSV
            </Link>
            <Link href="/buyers/new" className="underline">
              New
            </Link>
          </div>
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
          <input
            type="date"
            name="updatedFrom"
            defaultValue={updatedFrom ?? ""}
            className="rounded-md border px-3 py-2"
            aria-label="Updated from"
          />
          <input
            type="date"
            name="updatedTo"
            defaultValue={updatedTo ?? ""}
            className="rounded-md border px-3 py-2"
            aria-label="Updated to"
          />
          <button type="submit" className="rounded-md border px-3 py-2">
            Search
          </button>
          {(updatedFrom || updatedTo) && (
            <Link
              href={{
                pathname: "/buyers",
                query: {
                  ...(search ? { search } : {}),
                  ...(city ? { city } : {}),
                  ...(propertyType ? { propertyType } : {}),
                  ...(status ? { status } : {}),
                  ...(timeline ? { timeline } : {}),
                  ...(page ? { page } : {}),
                },
              }}
              className="text-sm underline opacity-70"
            >
              Clear dates
            </Link>
          )}
        </form>

        <div className="flex items-center justify-between">
          <div className="text-sm opacity-70">Select rows to delete</div>
          <BulkDeleteButton />
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 w-8"></th>
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
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No buyers found
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 w-8 align-top">
                    <RowCheckbox id={r.id} />
                  </td>
                  <td className="py-2">{r.fullName}</td>
                  <td className="py-2">{r.phone}</td>
                  <td className="py-2">{r.city}</td>
                  <td className="py-2">
                    <StatusQuickActions
                      id={r.id}
                      status={r.status}
                      updatedAtISO={(r.updatedAt
                        ? new Date(r.updatedAt)
                        : new Date()
                      ).toISOString()}
                    />
                  </td>
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
    </SelectionProvider>
  );
}
