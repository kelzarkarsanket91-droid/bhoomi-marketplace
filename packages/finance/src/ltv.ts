export interface LtvEligibilityResult {
  propertyPrice: number;
  maxPermissibleLtvPercent: number;
  minDownPaymentRequired: number;
  maxLoanEligible: number;
  rbiSlab: string;
}

/**
 * Calculates RBI-compliant Loan-to-Value (LTV) limits and minimum down payment requirements.
 */
export function calculateRbiLtvLimits(propertyPrice: number): LtvEligibilityResult {
  let maxPermissibleLtvPercent = 75;
  let rbiSlab = 'Above ₹75 Lakhs (Max 75% LTV)';

  if (propertyPrice <= 3000000) {
    maxPermissibleLtvPercent = 90;
    rbiSlab = 'Up to ₹30 Lakhs (Affordable Housing, Max 90% LTV)';
  } else if (propertyPrice <= 7500000) {
    maxPermissibleLtvPercent = 80;
    rbiSlab = '₹30 Lakhs to ₹75 Lakhs (Mid-segment, Max 80% LTV)';
  }

  const maxLoanEligible = Math.round((propertyPrice * maxPermissibleLtvPercent) / 100);
  const minDownPaymentRequired = Math.round(propertyPrice - maxLoanEligible);

  return {
    propertyPrice,
    maxPermissibleLtvPercent,
    minDownPaymentRequired,
    maxLoanEligible,
    rbiSlab,
  };
}

/**
 * Evaluates borrower maximum loan eligibility based on monthly in-hand income
 * using typical Indian banking FOIR (Fixed Obligation to Income Ratio) standard of 50%.
 */
export function estimateBorrowerAffordability(
  monthlyIncome: number,
  existingMonthlyEmi: number,
  interestRate: number = 8.5,
  tenureYears: number = 20
) {
  const maxAllowableEmi = Math.max(0, monthlyIncome * 0.5 - existingMonthlyEmi);
  const tenureMonths = tenureYears * 12;
  const monthlyRate = interestRate / 12 / 100;

  let affordableLoan = 0;
  if (monthlyRate > 0 && maxAllowableEmi > 0) {
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    affordableLoan = Math.round((maxAllowableEmi * (factor - 1)) / (monthlyRate * factor));
  }

  return {
    monthlyIncome,
    existingMonthlyEmi,
    maxAllowableEmi: Math.round(maxAllowableEmi),
    estimatedMaxLoanAffordability: affordableLoan,
  };
}
