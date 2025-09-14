"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { buyerCreateSchema } from "@/lib/validations/buyer";
import { z } from "zod";
import { Button } from "@/components/ui/button";

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

  async function onSubmit(values: FormValues) {
    setError(null);
    setSuccess(null);
    const parsed = buyerCreateSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validation failed");
      return;
    }
    const res = await fetch("/api/buyers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create");
      return;
    }
    setSuccess("Created successfully");
    form.reset();
  }

  const watchPropertyType = form.watch("property_type");
  const showBhk =
    watchPropertyType === "Apartment" || watchPropertyType === "Villa";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">New Buyer</h1>
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      {success && <p className="mb-3 text-sm text-green-600">{success}</p>}
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
            placeholder="Budget min"
            type="number"
            {...form.register("budget_min", { valueAsNumber: true })}
          />
          <input
            className="rounded-md border px-3 py-2"
            placeholder="Budget max"
            type="number"
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
          placeholder="Notes"
          rows={4}
          {...form.register("notes")}
        />

        <Button type="submit">Create</Button>
      </form>
    </div>
  );
}
