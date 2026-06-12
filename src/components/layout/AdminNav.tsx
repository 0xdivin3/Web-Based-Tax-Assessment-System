// src/components/layout/AdminNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, FileStack, ClipboardEdit,
  BarChart2, Shield, LogOut
} from "lucide-react";

const links = [
  { href: "/admin/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/taxpayers",   label: "Taxpayers",    icon: Users },
  { href: "/admin/submissions", label: "Submissions",  icon: FileStack },
  { href: "/admin/assessment",  label: "Assessment",   icon: ClipboardEdit },
  { href: "/admin/reports",     label: "Reports",      icon: BarChart2 },
  { href: "/admin/audit",       label: "Audit Log",    icon: Shield },
];

export function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-gray-700">
        <p className="font-bold text-sm text-white">FIRS Admin Console</p>
        <p className="text-xs text-gray-400 mt-1 truncate">{name}</p>
        <span className="inline-block mt-1 text-xs bg-red-600 text-white px-2 py-0.5 rounded">Admin</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              pathname === href
                ? "bg-white/10 text-white font-medium"
                : "text-gray-300 hover:bg-white/5"
            )}
          >
            <Icon size={18}/>
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/5 w-full"
        >
          <LogOut size={18}/>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
