"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buyerCreateSchema } from "@/lib/validations/buyer";
import { Button } from "@/components/ui/button";

const formSchema = buyerCreateSchema.partial();
type FormValues = z.infer<typeof formSchema> & { updatedAt?: string };

export default function BuyerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  type HistoryItem = {
    id: string;
    changedAt: string;
    diff: Record<string, unknown>;
  };
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const form = useForm<FormValues>({});

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/buyers/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load");
        return;
      }
      setHistory(data.history ?? []);
      form.reset({
        full_name: data.buyer.fullName,
        email: data.buyer.email ?? undefined,
        phone: data.buyer.phone,
        city: data.buyer.city,
        property_type: data.buyer.propertyType,
        bhk: data.buyer.bhk ?? undefined,
        purpose: data.buyer.purpose,
        budget_min: data.buyer.budgetMin ?? undefined,
        budget_max: data.buyer.budgetMax ?? undefined,
        timeline: data.buyer.timeline,
        source: data.buyer.source,
        status: data.buyer.status,
        notes: data.buyer.notes ?? undefined,
        tags: data.buyer.tags ?? [],
        updatedAt: data.buyer.updatedAt,
      });
    }
    load();
  }, [id, form]);

  async function onSave(values: FormValues) {
    setError(null);
    const res = await fetch(`/api/buyers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      return;
    }
    form.setValue("updatedAt", data.updatedAt);
  }

  async function onDelete() {
    if (!confirm("Delete this buyer?")) return;
    const res = await fetch(`/api/buyers/${id}`, { method: "DELETE" });
    if (res.ok) router.replace("/buyers");
  }

  const watchPropertyType = form.watch("property_type");
  const showBhk =
    watchPropertyType === "Apartment" || watchPropertyType === "Villa";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">Buyer Details</h1>
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <form className="grid gap-3" onSubmit={form.handleSubmit(onSave)}>
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium mb-1">
            Full Name
          </label>
          <input
            id="full_name"
            className="w-full rounded-md border px-3 py-2"
            {...form.register("full_name")}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-md border px-3 py-2"
            {...form.register("email")}
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone
          </label>
          <input
            id="phone"
            className="w-full rounded-md border px-3 py-2"
            {...form.register("phone")}
          />
        </div>

        <select
          className="rounded-md border px-3 py-2"
          {...form.register("city")}
        >
          {(
            ["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"] as const
          ).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border px-3 py-2"
          {...form.register("property_type")}
        >
          {(["Apartment", "Villa", "Plot", "Office", "Retail"] as const).map(
            (c) => (
              <option key={c} value={c}>
                {c}
              </option>
            )
          )}
        </select>

        {showBhk && (
          <select
            className="rounded-md border px-3 py-2"
            {...form.register("bhk")}
          >
            {(["1", "2", "3", "4", "Studio"] as const).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        <select
          className="rounded-md border px-3 py-2"
          {...form.register("purpose")}
        >
          {(["Buy", "Rent"] as const).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-md border px-3 py-2"
            type="number"
            placeholder="Budget min"
            {...form.register("budget_min", { valueAsNumber: true })}
          />
          <input
            className="rounded-md border px-3 py-2"
            type="number"
            placeholder="Budget max"
            {...form.register("budget_max", { valueAsNumber: true })}
          />
        </div>

        <select
          className="rounded-md border px-3 py-2"
          {...form.register("timeline")}
        >
          {(["0-3m", "3-6m", ">6m", "Exploring"] as const).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border px-3 py-2"
          {...form.register("source")}
        >
          {(["Website", "Referral", "Walk-in", "Call", "Other"] as const).map(
            (c) => (
              <option key={c} value={c}>
                {c}
              </option>
            )
          )}
        </select>

        <textarea
          className="rounded-md border px-3 py-2"
          rows={4}
          placeholder="Notes"
          {...form.register("notes")}
        />

        <input type="hidden" {...form.register("updatedAt")} />

        <div className="flex items-center gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Recent changes</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((h) => {
              const entries = Object.entries(
                h.diff as Record<string, { old: unknown; new: unknown }>
              );
              return (
                <li key={h.id} className="rounded border p-2">
                  <div className="mb-1 opacity-70">
                    {new Date(h.changedAt).toLocaleString()}
                  </div>
                  {entries.length === 0 ? (
                    <div className="italic opacity-70">No field changes</div>
                  ) : (
                    <ul className="list-disc pl-5 space-y-1">
                      {entries.map(([field, val]) => (
                        <li key={field}>
                          <span className="font-medium">{field}</span>:{" "}
                          {JSON.stringify(val.old)} → {JSON.stringify(val.new)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
