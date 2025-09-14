"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function TagInput({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<number>(-1);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    let aborted = false;
    const q = input.trim();
    if (!q) {
      setSuggestions([]);
      setHighlight(-1);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/tags?q=${encodeURIComponent(q)}&limit=8`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (aborted) return;
        const tags = Array.isArray(d.tags) ? (d.tags as string[]) : [];
        setSuggestions(tags.filter((t) => !value.includes(t)));
        setHighlight(-1);
      })
      .catch(() => {
        if (!aborted) setSuggestions([]);
      });
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [input, value]);

  function addTag(tag: string) {
    const t = tag.trim();
    if (!t) return;
    if (!value.includes(t)) onChange([...value, t]);
    setInput("");
    setSuggestions([]);
    setHighlight(-1);
  }
  function addTagFromInput() {
    addTag(input);
  }
  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && highlight < suggestions.length) {
        addTag(suggestions[highlight]);
      } else {
        addTagFromInput();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="opacity-70 hover:opacity-100"
              aria-label={`Remove ${t}`}
              disabled={disabled}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="rounded-md border px-3 py-2"
            placeholder="Add tag and press Enter"
            disabled={disabled}
            aria-autocomplete="list"
          />
          <Button type="button" onClick={addTagFromInput} disabled={disabled}>
            Add
          </Button>
        </div>
        {suggestions.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white p-1 text-sm shadow"
            role="listbox"
          >
            {suggestions.map((s, idx) => (
              <li
                key={s}
                className={`cursor-pointer rounded px-2 py-1 ${
                  idx === highlight ? "bg-gray-100" : ""
                }`}
                role="option"
                aria-selected={idx === highlight}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => {
                  // prevent input blur
                  e.preventDefault();
                  addTag(s);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
