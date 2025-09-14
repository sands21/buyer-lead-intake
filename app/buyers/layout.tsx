import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";

export default async function BuyersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();
  if (!user) redirect("/login?redirect=/buyers");
  return <>{children}</>;
}
