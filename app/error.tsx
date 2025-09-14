"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for now. Could be hooked to monitoring later.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
      <p className="mb-4 text-sm opacity-80">
        An unexpected error occurred. You can try again.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
      >
        Try again
      </button>
    </div>
  );
}
