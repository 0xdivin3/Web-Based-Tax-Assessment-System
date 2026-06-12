// src/components/ui/index.tsx
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

// Button
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}
export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:   "bg-green-700 text-white hover:bg-green-800 focus:ring-green-600",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-400",
    danger:    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost:     "text-gray-600 hover:bg-gray-100 focus:ring-gray-400",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}

// Input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>}
      <input
        id={id}
        {...props}
        className={cn(
          "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent",
          error ? "border-red-400" : "border-gray-300",
          className
        )}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// Select
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}
export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>}
      <select
        id={id}
        {...props}
        className={cn(
          "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",
          error ? "border-red-400" : "border-gray-300",
          className
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Badge
export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", className)}>
      {children}
    </span>
  );
}

// Card
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm", className)}>
      {children}
    </div>
  );
}

// Stat card
export function StatCard({ label, value, icon, color = "green" }: {
  label: string; value: string | number; icon: React.ReactNode; color?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={cn("p-3 rounded-xl", `bg-${color}-50 text-${color}-600`)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
