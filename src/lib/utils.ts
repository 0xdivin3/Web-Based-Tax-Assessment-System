// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT:        "bg-gray-100 text-gray-700",
    SUBMITTED:    "bg-blue-100 text-blue-700",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
    APPROVED:     "bg-green-100 text-green-700",
    QUERIED:      "bg-orange-100 text-orange-700",
    REJECTED:     "bg-red-100 text-red-700",
    PENDING:      "bg-yellow-100 text-yellow-700",
    PAID:         "bg-green-100 text-green-700",
    FAILED:       "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function nigerianStates(): string[] {
  return [
    "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue",
    "Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu",
    "FCT - Abuja","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina",
    "Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo",
    "Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
  ];
}
