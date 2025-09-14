"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { buyerCreateSchema } from "@/lib/validations/buyer";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TagInput } from "@/components/forms/TagInput";

type FormValues = z.infer<typeof buyerCreateSchema>;

export default function NewBuyerPage() {
  const form = useForm<FormValues>({
    defaultValues: {
      full_name: "",
      email: undefined,
      phone: "",
      city: "Chandigarh",
      property_type: "Apartment",
      bhk: undefined,
      purpose: "Buy",
      budget_min: undefined,
      budget_max: undefined,
      timeline: "Exploring",
      source: "Website",
      notes: "",
      tags: [],
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  async function onSubmit(values: FormValues) {
    setError(null);
    setSuccess(null);
    const parsed = buyerCreateSchema.safeParse(values);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Validation failed";
      setError(msg);
      toast.error(msg);
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/buyers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      const msg = data.error ?? "Failed to create";
      setError(msg);
      toast.error(msg);
      return;
    }
    setSuccess("Created successfully");
    toast.success("Buyer created");
    form.reset();
  }

  const watchPropertyType = form.watch("property_type");
  const showBhk =
    watchPropertyType === "Apartment" || watchPropertyType === "Villa";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">New Buyer</h1>
      {error && (
        <p className="mb-3 text-sm text-destructive" aria-live="polite">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-3 text-sm text-green-600" aria-live="polite">
          {success}
        </p>
      )}
      <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium mb-1">
            Full Name
          </label>
          <input
            id="full_name"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Full name"
            {...form.register("full_name")}
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Email"
            type="email"
            {...form.register("email")}
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone
          </label>
          <input
            id="phone"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Phone"
            {...form.register("phone")}
            disabled={submitting}
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
            disabled={submitting}
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
            disabled={submitting}
          >
            {(["Apartment", "Villa", "Plot", "Office", "Retail"] as const).map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
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
              disabled={submitting}
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
            disabled={submitting}
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
              placeholder="Budget min"
              type="number"
              {...form.register("budget_min", { valueAsNumber: true })}
              disabled={submitting}
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
              placeholder="Budget max"
              type="number"
              {...form.register("budget_max", { valueAsNumber: true })}
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="timeline" className="block text-sm font-medium mb-1">
            Timeline
          </label>
          <select
            id="timeline"
            className="rounded-md border px-3 py-2"
            {...form.register("timeline")}
            disabled={submitting}
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
            disabled={submitting}
          >
            {(["Website", "Referral", "Walk-in", "Call", "Other"] as const).map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            className="rounded-md border px-3 py-2"
            placeholder="Notes"
            rows={4}
            {...form.register("notes")}
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <TagInput
            value={form.watch("tags") ?? []}
            onChange={(next) => form.setValue("tags", next)}
            disabled={submitting}
          />
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create"}
        </Button>
      </form>
    </div>
  );
}
