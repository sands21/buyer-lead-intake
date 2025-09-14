"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const statusOptions = [
  "New",
  "Qualified",
  "Contacted",
  "Visited",
  "Negotiation",
  "Converted",
  "Dropped",
] as const;

export function StatusQuickActions({
  id,
  status,
  updatedAtISO,
}: {
  id: string;
  status: string; // accept any string to match server row type
  updatedAtISO: string;
}) {
  const [value, setValue] = useState<string>(status);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function onChange(next: string) {
    if (next === value) return;
    setValue(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/buyers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, updatedAt: updatedAtISO }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error ?? `Failed to update status`;
        toast.error(msg);
        // revert UI
        setValue(status);
      } else {
        toast.success("Status updated");
        router.refresh();
      }
    } catch (e) {
      toast.error((e as Error).message);
      setValue(status);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className="rounded-md border px-2 py-1 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={saving}
      aria-label="Update status"
    >
      {statusOptions.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
