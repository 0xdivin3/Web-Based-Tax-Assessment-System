// src/app/(admin)/audit/page.tsx
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { Shield } from "lucide-react";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, tin: true } },
      admin: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const actionColor: Record<string, string> = {
    REVIEW_APPROVE: "bg-green-100 text-green-700",
    REVIEW_QUERY:   "bg-orange-100 text-orange-700",
    REVIEW_REJECT:  "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={22} className="text-gray-500"/>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
      </div>

      <Card>
        {logs.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No audit records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Taxpayer</th>
                  <th className="px-5 py-3">Admin</th>
                  <th className="px-5 py-3">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(log.createdAt)}</td>
                    <td className="px-5 py-3">
                      <Badge className={actionColor[log.action] ?? "bg-gray-100 text-gray-600"}>
                        {log.action.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{log.user.firstName} {log.user.lastName}</p>
                      <p className="text-xs text-gray-400 font-mono">{log.user.tin}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {log.admin ? `${log.admin.firstName} ${log.admin.lastName}` : "System"}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {log.entity} <span className="font-mono">{log.entityId.slice(0, 8)}…</span>
                    </td>
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
