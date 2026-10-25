import { LenderPartner } from './types.js';

export const DEFAULT_LENDER_PARTNERS: LenderPartner[] = [
  {
    id: 'sbi-home-loans',
    name: 'State Bank of India (SBI)',
    logo: '/images/lenders/sbi.svg',
    baseInterestRate: 8.35,
    maxTenureYears: 30,
    minDownPaymentPercent: 15,
    maxLoanAmount: 100000000,
    processingFeePercent: 0.35,
    processingFeeCap: 10000,
    features: ['Zero prepayment penalty', 'Concession for women borrowers', 'Special tie-up with Nagpur/Wardha builders'],
  },
  {
    id: 'hdfc-bank',
    name: 'HDFC Bank',
    logo: '/images/lenders/hdfc.svg',
    baseInterestRate: 8.5,
    maxTenureYears: 30,
    minDownPaymentPercent: 20,
    maxLoanAmount: 150000000,
    processingFeePercent: 0.5,
    processingFeeCap: 15000,
    features: ['Fast digital in-principle sanction', 'Flexible tranche disbursement', 'Plot + Construction composite loans'],
  },
  {
    id: 'icici-bank',
    name: 'ICICI Bank',
    logo: '/images/lenders/icici.svg',
    baseInterestRate: 8.6,
    maxTenureYears: 30,
    minDownPaymentPercent: 20,
    maxLoanAmount: 120000000,
    processingFeePercent: 0.5,
    processingFeeCap: 12500,
    features: ['Pre-approved home loans', 'Doorstep document pickup in Vidarbha', 'Express disbursement'],
  },
  {
    id: 'bank-of-maharashtra',
    name: 'Bank of Maharashtra (Maha Super)',
    logo: '/images/lenders/bom.svg',
    baseInterestRate: 8.3,
    maxTenureYears: 30,
    minDownPaymentPercent: 10,
    maxLoanAmount: 80000000,
    processingFeePercent: 0.25,
    processingFeeCap: 8000,
    features: ['Deep branch network in Wardha & Nagpur', 'Lowest processing fees', 'RERA registered project waivers'],
  },
  {
    id: 'axis-bank',
    name: 'Axis Bank',
    logo: '/images/lenders/axis.svg',
    baseInterestRate: 8.55,
    maxTenureYears: 30,
    minDownPaymentPercent: 20,
    maxLoanAmount: 100000000,
    processingFeePercent: 0.5,
    processingFeeCap: 15000,
    features: ['12 EMI waivers on timely repayments', 'Online document upload', 'Custom repayment structures'],
  },
];

/**
 * Compares quotes across multiple partner lenders for a given property price and tenure.
 */
export function getLenderComparisonQuotes(
  propertyPrice: number,
  downPaymentPercent: number = 20,
  tenureYears: number = 20,
  lenders: LenderPartner[] = DEFAULT_LENDER_PARTNERS
) {
  const loanAmount = Math.max(0, propertyPrice * (1 - downPaymentPercent / 100));
  const tenureMonths = tenureYears * 12;

  return lenders.map((lender) => {
    const monthlyRate = lender.baseInterestRate / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    const emi = loanAmount > 0 ? Math.round((loanAmount * monthlyRate * factor) / (factor - 1)) : 0;
    const totalInterest = Math.round(emi * tenureMonths - loanAmount);
    const rawFee = (loanAmount * lender.processingFeePercent) / 100;
    const processingFee = Math.min(lender.processingFeeCap, Math.round(rawFee));

    return {
      lender,
      loanAmount,
      tenureYears,
      interestRate: lender.baseInterestRate,
      monthlyEmi: emi,
      totalInterest,
      totalPayable: loanAmount + totalInterest,
      processingFee,
    };
  });
}
