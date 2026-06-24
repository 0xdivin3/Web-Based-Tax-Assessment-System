// src/components/layout/TaxpayerNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, Calculator, CreditCard,
  Award, History, LogOut, Menu, X, Receipt
} from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/file-return",  label: "File Return",  icon: FileText },
  { href: "/calculator",   label: "Calculator",   icon: Calculator },
  { href: "/payment",      label: "Payments",     icon: CreditCard },
  { href: "/invoices",     label: "Invoices",     icon: Receipt },
  { href: "/certificate",  label: "Certificates", icon: Award },
  { href: "/history",      label: "History",      icon: History },
];

export function TaxpayerNav({ name, tin }: { name: string; tin?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-green-800 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-white/15 rounded-md">
            <span className="font-bold text-xs">T</span>
          </div>
          <span className="font-semibold text-sm">Taxign</span>
        </div>
        <button onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-green-800 text-white flex flex-col transform transition-transform lg:translate-x-0 lg:static lg:inset-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-green-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 bg-white/15 rounded-md">
              <span className="font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-sm">Taxign</span>
          </div>
          <p className="text-xs text-green-200 truncate">{name}</p>
          {tin && <p className="text-xs text-green-300">TIN: {tin}</p>}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                pathname === href
                  ? "bg-white/10 text-white font-medium"
                  : "text-green-100 hover:bg-white/5"
              )}
            >
              <Icon size={18}/>
              {label}
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-green-700">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-100 hover:bg-white/5 w-full"
          >
            <LogOut size={18}/>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
