// src/types/index.ts
import { Role, TaxType, ReturnStatus, PaymentStatus } from "@prisma/client";

export type { Role, TaxType, ReturnStatus, PaymentStatus };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tin?: string;
}

export interface DashboardStats {
  totalReturns: number;
  approvedReturns: number;
  pendingReturns: number;
  totalTaxDue: number;
  totalTaxPaid: number;
}

export interface AdminStats {
  totalTaxpayers: number;
  submissionsToday: number;
  pendingReview: number;
  revenueCollected: number;
  complianceRate: number;
}

export interface TaxReturnWithUser {
  id: string;
  taxYear: number;
  taxType: TaxType;
  status: ReturnStatus;
  totalIncome: number;
  taxLiability: number;
  taxDue: number;
  submittedAt: Date | null;
  user: {
    firstName: string;
    lastName: string;
    tin: string | null;
    email: string;
  };
}
