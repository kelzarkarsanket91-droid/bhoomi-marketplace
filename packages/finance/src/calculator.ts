import {
  LoanInput,
  LoanCalculationResult,
  AmortizationRow,
  YearlyAmortizationSummary,
  StampDutyAndTaxEstimate,
} from './types.js';

/**
 * Converts land and residential area units to standard Square Feet.
 */
export function convertToSqFt(value: number, unit: string): number {
  const normUnit = unit.toUpperCase().trim();
  switch (normUnit) {
    case 'GUNTHA':
      return Math.round(value * 1089);
    case 'ACRE':
      return Math.round(value * 43560);
    case 'SQM':
    case 'SQ_METER':
      return Math.round(value * 10.7639);
    case 'SQ_YARD':
      return Math.round(value * 9);
    case 'SQFT':
    default:
      return Math.round(value);
  }
}

/**
 * Calculates standard Equated Monthly Installment (EMI), complete amortization schedule,
 * total interest, and LTV metrics.
 */
export function calculateLoan(input: LoanInput): LoanCalculationResult {
  const { propertyPrice, downPaymentPercent, annualInterestRate, tenureYears } = input;

  const validPrice = Math.max(0, propertyPrice);
  const validDownPercent = Math.min(100, Math.max(0, downPaymentPercent));
  const downPaymentAmount = Math.round((validPrice * validDownPercent) / 100);
  const loanAmount = Math.max(0, validPrice - downPaymentAmount);

  const tenureMonths = Math.max(1, Math.round(tenureYears * 12));
  const monthlyRate = annualInterestRate > 0 ? annualInterestRate / 12 / 100 : 0;

  let monthlyEmi = 0;
  if (loanAmount > 0) {
    if (monthlyRate === 0) {
      monthlyEmi = Math.round(loanAmount / tenureMonths);
    } else {
      const factor = Math.pow(1 + monthlyRate, tenureMonths);
      monthlyEmi = Math.round((loanAmount * monthlyRate * factor) / (factor - 1));
    }
  }

  const monthlyAmortization: AmortizationRow[] = [];
  const yearlyMap = new Map<number, { principal: number; interest: number; total: number; endingBalance: number }>();

  let currentBalance = loanAmount;
  let totalInterestPayable = 0;

  for (let month = 1; month <= tenureMonths; month++) {
    const year = Math.ceil(month / 12);
    const interestForMonth = monthlyRate > 0 ? currentBalance * monthlyRate : 0;
    let principalForMonth = monthlyEmi - interestForMonth;

    if (month === tenureMonths || principalForMonth > currentBalance) {
      principalForMonth = currentBalance;
    }

    const actualPaymentThisMonth = principalForMonth + interestForMonth;
    const closingBalance = Math.max(0, currentBalance - principalForMonth);

    totalInterestPayable += interestForMonth;

    monthlyAmortization.push({
      month,
      year,
      openingBalance: Math.round(currentBalance),
      emi: Math.round(actualPaymentThisMonth),
      principalPaid: Math.round(principalForMonth),
      interestPaid: Math.round(interestForMonth),
      closingBalance: Math.round(closingBalance),
    });

    const existingYear = yearlyMap.get(year) || { principal: 0, interest: 0, total: 0, endingBalance: 0 };
    existingYear.principal += principalForMonth;
    existingYear.interest += interestForMonth;
    existingYear.total += actualPaymentThisMonth;
    existingYear.endingBalance = closingBalance;
    yearlyMap.set(year, existingYear);

    currentBalance = closingBalance;
    if (currentBalance <= 0) break;
  }

  const yearlyAmortization: YearlyAmortizationSummary[] = Array.from(yearlyMap.entries()).map(
    ([year, val]) => ({
      year,
      principalPaid: Math.round(val.principal),
      interestPaid: Math.round(val.interest),
      totalPaid: Math.round(val.total),
      endingBalance: Math.round(val.endingBalance),
    })
  );

  const roundedInterest = Math.round(totalInterestPayable);
  const totalPayment = loanAmount + roundedInterest;
  const loanToValueRatio = validPrice > 0 ? Number(((loanAmount / validPrice) * 100).toFixed(2)) : 0;

  return {
    propertyPrice: validPrice,
    downPaymentAmount,
    loanAmount,
    monthlyEmi,
    totalInterestPayable: roundedInterest,
    totalPayment,
    loanToValueRatio,
    tenureMonths,
    effectiveRate: annualInterestRate,
    yearlyAmortization,
    monthlyAmortization,
  };
}

/**
 * Calculates Maharashtra/Nagpur/Wardha specific government stamp duty, registration fees,
 * and GST estimates with statutory disclaimers.
 */
export function calculateStampDutyAndTaxes(
  propertyPrice: number,
  options?: { isUnderConstruction?: boolean; isFemaleOwner?: boolean; isMunicipalCorporation?: boolean }
): StampDutyAndTaxEstimate {
  const isFemale = options?.isFemaleOwner ?? false;
  const isUrban = options?.isMunicipalCorporation ?? true;
  const isUC = options?.isUnderConstruction ?? false;

  // Maharashtra: Urban (Nagpur NMC/NIT) is typically 7% (5% base + 1% Metro Cess + 1% LBT/Zilla Parishad),
  // Rural/Grampanchayat (Wardha/peripheral Nagpur) is typically 5-6%. Female buyers get 1% concession on residential flats.
  let stampDutyPercent = isUrban ? 7 : 6;
  if (isFemale) {
    stampDutyPercent -= 1;
  }

  const stampDutyAmount = Math.round((propertyPrice * stampDutyPercent) / 100);

  // Registration fee in Maharashtra is 1% of market value, capped at Rs. 30,000 for properties > Rs. 30 Lakhs
  const rawRegistration = (propertyPrice * 1) / 100;
  const registrationAmount = Math.min(30000, Math.round(rawRegistration));
  const registrationPercent = Number(((registrationAmount / (propertyPrice || 1)) * 100).toFixed(2));

  // GST: 0% on ready-to-move (OC received) and resale/plots. 5% on standard under-construction.
  const gstPercent = isUC ? 5 : 0;
  const gstAmount = Math.round((propertyPrice * gstPercent) / 100);

  const totalGovernmentFees = stampDutyAmount + registrationAmount + gstAmount;
  const totalAcquisitionCost = propertyPrice + totalGovernmentFees;

  return {
    propertyPrice,
    state: 'Maharashtra',
    stampDutyPercent,
    stampDutyAmount,
    registrationPercent,
    registrationAmount,
    gstPercent,
    gstAmount,
    totalGovernmentFees,
    totalAcquisitionCost,
    disclaimer:
      'Disclaimer: Tax, stamp duty, and registration values are statutory estimates based on Maharashtra Stamp Act schedules (Nagpur/Wardha jurisdiction). Actual rates are determined at sub-registrar office based on Ready Reckoner (RR) rate or agreement value, whichever is higher.',
  };
}
