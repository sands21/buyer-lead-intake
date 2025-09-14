"use client";

import { useState } from "react";
import Papa from "papaparse";
import { z } from "zod";
import { buyerCsvRowSchema } from "@/lib/validations/buyer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type CsvRow = z.infer<typeof buyerCsvRowSchema>;

export default function ImportBuyersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setRows([]);
    setErrors([]);
    setResult(null);
  }

  function normalizeKey(k: string): string {
    return k.trim().toLowerCase().replace(/\s+/g, "_");
  }

  async function parseCsv() {
    if (!file) return;
    setParsing(true);
    setRows([]);
    setErrors([]);
    setResult(null);

    await new Promise<void>((resolve) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const parsedRows: CsvRow[] = [];
          const parseErrors: { row: number; message: string }[] = [];

          const data = res.data.slice(0, 200); // cap at 200
          for (let i = 0; i < data.length; i++) {
            const raw = data[i] || {};
            const norm: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(raw)) {
              norm[normalizeKey(k)] = typeof v === "string" ? v.trim() : v;
            }

            // Coerce numeric fields
            const toNum = (s: unknown) =>
              typeof s === "string" && s.length > 0 ? Number(s) : undefined;
            const candidate: CsvRow = {
              full_name: (norm.full_name as string) ?? "",
              email: (norm.email as string) ?? undefined,
              phone: (norm.phone as string) ?? "",
              city: norm.city as CsvRow["city"],
              property_type: norm.property_type as CsvRow["property_type"],
              bhk: norm.bhk as CsvRow["bhk"],
              purpose: norm.purpose as CsvRow["purpose"],
              budget_min: toNum(norm.budget_min),
              budget_max: toNum(norm.budget_max),
              timeline: norm.timeline as CsvRow["timeline"],
              source: norm.source as CsvRow["source"],
              status: norm.status as CsvRow["status"],
              notes: (norm.notes as string) ?? undefined,
              tags: Array.isArray(norm.tags)
                ? (norm.tags as string[])
                : typeof norm.tags === "string" && norm.tags
                ? (norm.tags as string)
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                : undefined,
            };

            const parsed = buyerCsvRowSchema.safeParse(candidate);
            if (!parsed.success) {
              parseErrors.push({
                row: i + 2, // account for header row
                message: parsed.error.issues[0]?.message ?? "Invalid row",
              });
            } else {
              parsedRows.push(parsed.data);
            }
          }

          setRows(parsedRows);
          setErrors(parseErrors);
          setParsing(false);
          resolve();
        },
      });
    });
  }

  async function uploadValid() {
    if (rows.length === 0) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(data.error ?? "Import failed");
      } else {
        setResult(`Imported ${data.inserted} rows successfully`);
      }
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Import Buyers (CSV)</h1>
        <Link href="/buyers" className="underline">
          Back
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        CSV must include headers: full_name, email, phone, city, property_type,
        bhk, purpose, budget_min, budget_max, timeline, source, status, notes,
        tags (tags as comma-separated). Max 200 rows.
      </p>

      <div className="flex items-center gap-2">
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <Button type="button" onClick={parseCsv} disabled={!file || parsing}>
          {parsing ? "Parsing..." : "Parse"}
        </Button>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md border p-3">
          <div className="mb-2 font-medium">
            Validation errors ({errors.length})
          </div>
          <ul className="text-sm list-disc pl-5 space-y-1">
            {errors.slice(0, 20).map((e) => (
              <li key={`${e.row}-${e.message}`}>
                Row {e.row}: {e.message}
              </li>
            ))}
            {errors.length > 20 && <li>and {errors.length - 20} more...</li>}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="text-sm">Valid rows: {rows.length}</div>
          <Button type="button" onClick={uploadValid} disabled={uploading}>
            {uploading ? "Importing..." : "Import"}
          </Button>
        </div>
      )}

      {result && <div className="text-sm">{result}</div>}
    </div>
  );
}
