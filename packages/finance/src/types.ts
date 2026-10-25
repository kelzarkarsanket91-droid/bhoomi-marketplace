export interface LoanInput {
  propertyPrice: number;
  downPaymentPercent: number; // e.g. 20 for 20%
  annualInterestRate: number; // e.g. 8.5 for 8.5%
  tenureYears: number; // e.g. 20
}

export interface AmortizationRow {
  month: number;
  year: number;
  openingBalance: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface YearlyAmortizationSummary {
  year: number;
  principalPaid: number;
  interestPaid: number;
  totalPaid: number;
  endingBalance: number;
}

export interface LoanCalculationResult {
  propertyPrice: number;
  downPaymentAmount: number;
  loanAmount: number;
  monthlyEmi: number;
  totalInterestPayable: number;
  totalPayment: number;
  loanToValueRatio: number;
  tenureMonths: number;
  effectiveRate: number;
  yearlyAmortization: YearlyAmortizationSummary[];
  monthlyAmortization: AmortizationRow[];
}

export interface LenderPartner {
  id: string;
  name: string;
  logo: string;
  baseInterestRate: number; // e.g. 8.35
  maxTenureYears: number; // e.g. 30
  minDownPaymentPercent: number; // e.g. 15 (85% LTV)
  maxLoanAmount: number;
  processingFeePercent: number;
  processingFeeCap: number;
  features: string[];
  contactUrl?: string;
}

export interface StampDutyAndTaxEstimate {
  propertyPrice: number;
  state: string; // e.g. Maharashtra
  stampDutyPercent: number; // e.g. 6% (or 7% with metro cess in Nagpur/Wardha)
  stampDutyAmount: number;
  registrationPercent: number; // e.g. 1% (capped at 30,000 INR)
  registrationAmount: number;
  gstPercent: number; // 0% on ready-to-move/plots, 5% on under-construction non-affordable, 1% affordable
  gstAmount: number;
  totalGovernmentFees: number;
  totalAcquisitionCost: number;
  disclaimer: string;
}
