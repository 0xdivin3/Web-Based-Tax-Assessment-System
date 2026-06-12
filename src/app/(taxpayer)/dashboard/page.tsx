// src/app/(taxpayer)/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatNaira } from "@/lib/tax-calculator";
import { formatDate, statusColor } from "@/lib/utils";
import Link from "next/link";
import { FileText, CreditCard, Award, Bell } from "lucide-react";

export default async function TaxpayerDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [returns, notifications, user] = await Promise.all([
    prisma.taxReturn.findMany({
      where: { userId },
      orderBy: { taxYear: "desc" },
      take: 5,
      include: { payment: true },
    }),
    prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  const totalDue    = returns.reduce((s, r) => s + r.taxDue,       0);
  const totalPaid   = returns.filter(r => r.payment?.status === "PAID")
                             .reduce((s, r) => s + r.taxLiability, 0);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-gray-500 text-sm mt-1">TIN: {user?.tin ?? "Not assigned"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-gray-500 mb-1">Total Returns Filed</p>
          <p className="text-3xl font-bold text-gray-900">{returns.length}</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-green-500">
          <p className="text-sm text-gray-500 mb-1">Total Tax Paid</p>
          <p className="text-2xl font-bold text-green-700">{formatNaira(totalPaid)}</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-orange-400">
          <p className="text-sm text-gray-500 mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-orange-600">{formatNaira(totalDue)}</p>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: "/file-return",  icon: FileText,  label: "File New Return",  color: "green" },
          { href: "/payment",      icon: CreditCard, label: "Make Payment",     color: "blue" },
          { href: "/certificate",  icon: Award,      label: "View Certificates",color: "purple" },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-2 p-5 rounded-xl border bg-white hover:shadow-md transition-shadow text-center`}
          >
            <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
              <Icon size={22}/>
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent returns */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Tax Returns</h2>
          <Link href="/history" className="text-sm text-green-700 hover:underline">View all</Link>
        </div>
        {returns.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-40"/>
            <p className="text-sm">No returns filed yet.</p>
            <Link href="/file-return" className="text-sm text-green-700 hover:underline mt-1 inline-block">
              File your first return →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {returns.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {r.taxYear} — {r.taxType.replace("_", " ")}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.submittedAt ? `Submitted ${formatDate(r.submittedAt)}` : "Draft"}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={statusColor(r.status)}>{r.status}</Badge>
                  <p className="text-xs text-gray-500 mt-1">{formatNaira(r.taxLiability)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Bell size={16} className="text-orange-500"/>
            <h2 className="font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div key={n.id} className="px-5 py-4">
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-300 mt-1">{formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
