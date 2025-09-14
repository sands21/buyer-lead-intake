"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type SelectionContextType = {
  selected: Set<string>;
  toggle: (id: string) => void;
  clear: () => void;
};

const SelectionContext = createContext<SelectionContextType | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const value = useMemo<SelectionContextType>(
    () => ({
      selected,
      toggle: (id: string) => {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      },
      clear: () => setSelected(new Set()),
    }),
    [selected]
  );
  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("SelectionProvider missing");
  return ctx;
}

export function RowCheckbox({
  id,
  disabled,
}: {
  id: string;
  disabled?: boolean;
}) {
  const { selected, toggle } = useSelection();
  return (
    <input
      type="checkbox"
      aria-label="Select row"
      checked={selected.has(id)}
      onChange={() => toggle(id)}
      disabled={disabled}
    />
  );
}

export function BulkDeleteButton() {
  const { selected, clear } = useSelection();
  const router = useRouter();
  const count = selected.size;

  async function onDelete() {
    if (count === 0) return;
    if (!confirm(`Delete ${count} selected buyer(s)?`)) return;
    let ok = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/buyers/${id}`, { method: "DELETE" });
        if (res.ok) ok += 1;
      } catch {
        // ignore
      }
    }
    toast.success(`Deleted ${ok}/${count}`);
    clear();
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={onDelete}
      disabled={count === 0}
    >
      Delete selected {count > 0 ? `(${count})` : ""}
    </Button>
  );
}
