import * as React from "react";
import { AppHeader } from "./AppHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 rounded bg-white px-3 py-2 text-sm shadow"
      >
        Skip to content
      </a>
      <AppHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
