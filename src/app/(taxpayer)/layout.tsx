// src/app/(taxpayer)/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TaxpayerNav } from "@/components/layout/TaxpayerNav";

export default async function TaxpayerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TaxpayerNav
        name={session.user.name ?? ""}
        tin={session.user.tin}
      />
      <main className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
