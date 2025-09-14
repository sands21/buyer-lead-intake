"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { buyerCreateSchema } from "@/lib/validations/buyer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formSchema = buyerCreateSchema.partial();
type FormValues = z.infer<typeof formSchema> & { updatedAt?: string };

export default function BuyerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  type HistoryItem = {
    id: string;
    changedAt: string;
    diff: Record<string, unknown>;
  };
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const form = useForm<FormValues>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/buyers/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load");
        setLoading(false);
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
      setLoading(false);
    }
    load();
  }, [id, form]);

  async function onSave(values: FormValues) {
    setError(null);
    setSaving(true);
    const res = await fetch(`/api/buyers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      const message = data.error ?? "Failed to save";
      setError(message);
      toast.error(message);
      return;
    }
    form.setValue("updatedAt", data.updatedAt);
    toast.success("Buyer updated");
  }

  async function onDelete() {
    if (!confirm("Delete this buyer?")) return;
    const res = await fetch(`/api/buyers/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Buyer deleted");
      router.replace("/buyers");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to delete");
    }
  }

  const watchPropertyType = form.watch("property_type");
  const showBhk =
    watchPropertyType === "Apartment" || watchPropertyType === "Villa";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">Buyer Details</h1>
      {error && (
        <p className="mb-3 text-sm text-destructive" aria-live="polite">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm opacity-70" aria-live="polite">
          Loading…
        </p>
      ) : (
        <form className="grid gap-3" onSubmit={form.handleSubmit(onSave)}>
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium mb-1"
            >
              Full Name
            </label>
            <input
              id="full_name"
              className="w-full rounded-md border px-3 py-2"
              {...form.register("full_name")}
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">
              City
            </label>
            <select
              id="city"
              className="rounded-md border px-3 py-2"
              {...form.register("city")}
              disabled={saving}
            >
              {(
                [
                  "Chandigarh",
                  "Mohali",
                  "Zirakpur",
                  "Panchkula",
                  "Other",
                ] as const
              ).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="property_type"
              className="block text-sm font-medium mb-1"
            >
              Property Type
            </label>
            <select
              id="property_type"
              className="rounded-md border px-3 py-2"
              {...form.register("property_type")}
              disabled={saving}
            >
              {(
                ["Apartment", "Villa", "Plot", "Office", "Retail"] as const
              ).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {showBhk && (
            <div>
              <label htmlFor="bhk" className="block text-sm font-medium mb-1">
                BHK
              </label>
              <select
                id="bhk"
                className="rounded-md border px-3 py-2"
                {...form.register("bhk")}
                disabled={saving}
              >
                {(["1", "2", "3", "4", "Studio"] as const).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="purpose" className="block text-sm font-medium mb-1">
              Purpose
            </label>
            <select
              id="purpose"
              className="rounded-md border px-3 py-2"
              {...form.register("purpose")}
              disabled={saving}
            >
              {(["Buy", "Rent"] as const).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="budget_min"
                className="block text-sm font-medium mb-1"
              >
                Budget min
              </label>
              <input
                id="budget_min"
                className="rounded-md border px-3 py-2"
                type="number"
                placeholder="Budget min"
                {...form.register("budget_min", { valueAsNumber: true })}
                disabled={saving}
              />
            </div>
            <div>
              <label
                htmlFor="budget_max"
                className="block text-sm font-medium mb-1"
              >
                Budget max
              </label>
              <input
                id="budget_max"
                className="rounded-md border px-3 py-2"
                type="number"
                placeholder="Budget max"
                {...form.register("budget_max", { valueAsNumber: true })}
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="timeline"
              className="block text-sm font-medium mb-1"
            >
              Timeline
            </label>
            <select
              id="timeline"
              className="rounded-md border px-3 py-2"
              {...form.register("timeline")}
              disabled={saving}
            >
              {(["0-3m", "3-6m", ">6m", "Exploring"] as const).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium mb-1">
              Source
            </label>
            <select
              id="source"
              className="rounded-md border px-3 py-2"
              {...form.register("source")}
              disabled={saving}
            >
              {(
                ["Website", "Referral", "Walk-in", "Call", "Other"] as const
              ).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              className="rounded-md border px-3 py-2"
              rows={4}
              placeholder="Notes"
              {...form.register("notes")}
              disabled={saving}
            />
          </div>

          <input type="hidden" {...form.register("updatedAt")} />

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={saving}
            >
              Delete
            </Button>
          </div>
        </form>
      )}

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
