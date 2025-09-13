import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          Buyer Lead Intake
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/buyers">Buyers</Link>
          </Button>
          <Button size="sm" variant="outline">
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}
