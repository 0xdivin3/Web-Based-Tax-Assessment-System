// src/app/(admin)/taxpayers/page.tsx
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { Users } from "lucide-react";

export default async function TaxpayersPage() {
  const taxpayers = await prisma.user.findMany({
    where: { role: "TAXPAYER" },
    include: { _count: { select: { taxReturns: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Taxpayer Registry</h1>
        <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {taxpayers.length} registered
        </span>
      </div>

      <Card>
        {taxpayers.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Users size={36} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-400 text-sm">No taxpayers registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">TIN</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">State</th>
                  <th className="px-5 py-3">Returns</th>
                  <th className="px-5 py-3">Verified</th>
                  <th className="px-5 py-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {taxpayers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{t.firstName} {t.lastName}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{t.tin ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{t.email}</td>
                    <td className="px-5 py-3 text-gray-500">{t.state ?? "—"}</td>
                    <td className="px-5 py-3">{t._count.taxReturns}</td>
                    <td className="px-5 py-3">
                      <Badge className={t.isVerified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                        {t.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
