// src/lib/tax-calculator.ts
// Nigeria PAYE Tax Calculation (CITA / PITA)

export interface TaxBand {
  limit: number;
  rate: number;
}

// Nigeria 2024 Personal Income Tax bands (annual)
export const NIGERIA_TAX_BANDS: TaxBand[] = [
  { limit: 300_000,   rate: 0.07 },  // 7% on first ₦300,000
  { limit: 300_000,   rate: 0.11 },  // 11% on next ₦300,000
  { limit: 500_000,   rate: 0.15 },  // 15% on next ₦500,000
  { limit: 500_000,   rate: 0.19 },  // 19% on next ₦500,000
  { limit: 1_600_000, rate: 0.21 },  // 21% on next ₦1,600,000
  { limit: Infinity,  rate: 0.24 },  // 24% on balance
];

export const PERSONAL_RELIEF = 200_000; // ₦200,000 fixed
export const PERSONAL_RELIEF_PCT = 0.01; // 1% of gross income
export const PENSION_RATE = 0.08; // 8% of gross (employee)

export interface TaxComputationInput {
  grossIncome: number;
  otherIncome?: number;
  pensionContribution?: number; // manual override
  otherDeductions?: number;
}

export interface TaxComputationResult {
  grossIncome: number;
  otherIncome: number;
  totalIncome: number;
  personalRelief: number;
  pensionRelief: number;
  otherDeductions: number;
  totalDeductions: number;
  taxableIncome: number;
  taxLiability: number;
  effectiveRate: number;
  breakdown: { band: string; amount: number; tax: number }[];
}

export function computeTax(input: TaxComputationInput): TaxComputationResult {
  const gross = input.grossIncome;
  const other = input.otherIncome ?? 0;
  const total = gross + other;

  // Reliefs
  const personalRelief = PERSONAL_RELIEF + gross * PERSONAL_RELIEF_PCT;
  const pensionRelief = input.pensionContribution ?? gross * PENSION_RATE;
  const otherDeductions = input.otherDeductions ?? 0;
  const totalDeductions = personalRelief + pensionRelief + otherDeductions;

  const taxableIncome = Math.max(0, total - totalDeductions);

  // Progressive tax bands
  let remaining = taxableIncome;
  let taxLiability = 0;
  const breakdown: { band: string; amount: number; tax: number }[] = [];

  for (const band of NIGERIA_TAX_BANDS) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, band.limit);
    const tax = taxable * band.rate;
    breakdown.push({
      band: `${(band.rate * 100).toFixed(0)}%`,
      amount: taxable,
      tax,
    });
    taxLiability += tax;
    remaining -= taxable;
  }

  const effectiveRate = taxableIncome > 0 ? taxLiability / taxableIncome : 0;

  return {
    grossIncome: gross,
    otherIncome: other,
    totalIncome: total,
    personalRelief,
    pensionRelief,
    otherDeductions,
    totalDeductions,
    taxableIncome,
    taxLiability,
    effectiveRate,
    breakdown,
  };
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function generateTIN(): string {
  const digits = Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  return digits;
}

export function generateCertificateNo(year: number): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FIRS-${year}-${rand}`;
}
