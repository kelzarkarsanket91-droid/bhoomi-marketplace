import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calculator,
  Percent,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  calculateLoan,
  calculateStampDutyAndTaxes,
  calculateRbiLtvLimits,
  getLenderComparisonQuotes,
  estimateBorrowerAffordability,
} from '@bhoomi/finance';

export function FinancePage() {
  const [searchParams] = useSearchParams();
  const initialPrice = parseFloat(searchParams.get('price') || '5000000');

  // Sliders
  const [propertyPrice, setPropertyPrice] = useState<number>(initialPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [annualRate, setAnnualRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);

  // Affordability estimator state
  const [monthlyIncome, setMonthlyIncome] = useState<number>(100000);
  const [existingEmi, setExistingEmi] = useState<number>(10000);

  // Amortization table view mode
  const [viewMonthly, setViewMonthly] = useState<boolean>(false);
  const [isAmortizationOpen, setIsAmortizationOpen] = useState<boolean>(true);

  // Calculations
  const loanResult = calculateLoan({
    propertyPrice,
    downPaymentPercent,
    annualInterestRate: annualRate,
    tenureYears,
  });

  const rbiLimits = calculateRbiLtvLimits(propertyPrice);
  const taxes = calculateStampDutyAndTaxes(propertyPrice, { isMunicipalCorporation: true });
  const lenderQuotes = getLenderComparisonQuotes(propertyPrice, downPaymentPercent, tenureYears);
  const affordability = estimateBorrowerAffordability(monthlyIncome, existingEmi, annualRate, tenureYears);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 text-xs font-bold mb-3">
          <Calculator className="w-4 h-4" />
          <span>Isolated Financial Feature Module</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900 dark:text-white">
          Real Estate Mortgage & EMI Engine
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Calculate equated monthly installments, comprehensive year-by-year amortization schedules, RBI loan-to-value limits, and live bank partner comparisons for Nagpur and Wardha properties.
        </p>
      </div>

      {/* CALCULATOR & LIVE METRICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sliders Card (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Loan Parameters
          </h2>

          {/* Property Price */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-slate-600 dark:text-slate-300">Property Price:</span>
              <span className="text-brand-700 dark:text-brand-400 font-mono font-bold text-base">
                ₹{(propertyPrice / 100000).toFixed(2)} Lakhs (₹{propertyPrice.toLocaleString('en-IN')})
              </span>
            </div>
            <input
              type="range"
              min={500000}
              max={30000000}
              step={100000}
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />
          </div>

          {/* Down Payment Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <div>
                <span className="text-slate-600 dark:text-slate-300">Down Payment ({downPaymentPercent}%):</span>
                <span className="text-[10px] text-slate-400 block">{rbiLimits.rbiSlab}</span>
              </div>
              <span className="text-brand-700 dark:text-brand-400 font-mono font-bold text-base">
                ₹{loanResult.downPaymentAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />
          </div>

          {/* Interest Rate Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-slate-600 dark:text-slate-300">Annual Interest Rate (%):</span>
              <span className="text-brand-700 dark:text-brand-400 font-mono font-bold text-base">
                {annualRate}% p.a.
              </span>
            </div>
            <input
              type="range"
              min={6.5}
              max={14.0}
              step={0.1}
              value={annualRate}
              onChange={(e) => setAnnualRate(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />
          </div>

          {/* Tenure Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-slate-600 dark:text-slate-300">Loan Tenure (Years):</span>
              <span className="text-brand-700 dark:text-brand-400 font-mono font-bold text-base">
                {tenureYears} Years ({loanResult.tenureMonths} Months)
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Summary KPI Card (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-brand-900 to-slate-900 text-white shadow-2xl space-y-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">
              Equated Monthly Installment
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white mt-1">
              ₹{loanResult.monthlyEmi.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-300">Payable every month for {tenureYears} years</span>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-300">Principal Loan Amount:</span>
              <span className="font-mono font-bold">₹{loanResult.loanAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-300">Total Interest Payable:</span>
              <span className="font-mono font-bold text-amber-300">
                ₹{loanResult.totalInterestPayable.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-300">Total Overall Payment:</span>
              <span className="font-mono font-bold">₹{loanResult.totalPayment.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-300">Loan-To-Value (LTV):</span>
              <span className="font-mono font-bold text-emerald-300">{loanResult.loanToValueRatio}%</span>
            </div>
          </div>

          {/* Stamp Duty & Acquisition Estimate */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md space-y-2 text-xs">
            <div className="font-bold text-emerald-300 uppercase tracking-wide">
              Govt Stamp Duty & Registration:
            </div>
            <div className="flex justify-between">
              <span>Stamp Duty ({taxes.stampDutyPercent}%):</span>
              <span className="font-mono">₹{taxes.stampDutyAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Registration (1% capped):</span>
              <span className="font-mono">₹{taxes.registrationAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10">
              <span>Total Property Acquisition:</span>
              <span className="font-mono">₹{taxes.totalAcquisitionCost.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BANK PARTNER COMPARISONS TABLE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              Partner Bank Rates & Instant Quotes
            </h2>
            <p className="text-xs text-slate-500">
              Config-driven lender quotes based on your ₹{(loanResult.loanAmount / 100000).toFixed(1)} Lakh loan requirement
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 self-start sm:self-auto">
            5 Institutional Lenders
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {lenderQuotes.map((q) => (
            <div
              key={q.lender.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between hover:border-brand-500 transition space-y-3"
            >
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {q.lender.name}
                </h4>
                <div className="text-xs font-bold text-brand-700 dark:text-brand-400 mt-1">
                  {q.interestRate}% p.a.
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-[11px] text-slate-500">Monthly EMI:</div>
                <div className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  ₹{q.monthlyEmi.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400">Processing Fee: ₹{q.processingFee.toLocaleString('en-IN')}</div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => alert(`Pre-approval request initiated with ${q.lender.name}. Our banking desk will call you with in-principle approval details.`)}
                  className="w-full py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-brand-700 hover:text-white text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-bold transition shadow-sm"
                >
                  Apply Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AMORTIZATION SCHEDULE TABLE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setIsAmortizationOpen(!isAmortizationOpen)}
            className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white"
          >
            <span>Complete Amortization Schedule</span>
            {isAmortizationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setViewMonthly(false)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                !viewMonthly ? 'bg-brand-700 text-white' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              Yearly Summary
            </button>
            <button
              onClick={() => setViewMonthly(true)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewMonthly ? 'bg-brand-700 text-white' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              Monthly Rows ({loanResult.monthlyAmortization.length})
            </button>
          </div>
        </div>

        {isAmortizationOpen && (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                <tr>
                  <th className="p-3">{viewMonthly ? 'Month' : 'Year'}</th>
                  <th className="p-3">Principal Paid (₹)</th>
                  <th className="p-3">Interest Paid (₹)</th>
                  <th className="p-3">Total Installment (₹)</th>
                  <th className="p-3">Closing Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-slate-700 dark:text-slate-300">
                {viewMonthly
                  ? loanResult.monthlyAmortization.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-sans font-semibold">Month {row.month}</td>
                        <td className="p-3">₹{row.principalPaid.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-amber-600 dark:text-amber-400">
                          ₹{row.interestPaid.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 font-bold">₹{row.emi.toLocaleString('en-IN')}</td>
                        <td className="p-3">₹{row.closingBalance.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  : loanResult.yearlyAmortization.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-sans font-semibold">Year {row.year}</td>
                        <td className="p-3">₹{row.principalPaid.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-amber-600 dark:text-amber-400">
                          ₹{row.interestPaid.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 font-bold">₹{row.totalPaid.toLocaleString('en-IN')}</td>
                        <td className="p-3">₹{row.endingBalance.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BORROWER AFFORDABILITY (FOIR) ENGINE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
            Borrower Net Income Affordability (FOIR 50% Rule)
          </h2>
          <p className="text-xs text-slate-500">
            Estimate maximum eligible loan sanctioned based on Indian banking FOIR standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Net In-Hand Monthly Income (₹)
            </label>
            <input
              type="number"
              step={5000}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Existing Monthly EMI Outflow (Car/Personal) (₹)
            </label>
            <input
              type="number"
              step={1000}
              value={existingEmi}
              onChange={(e) => setExistingEmi(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <div>
            <span className="text-xs text-slate-500">Max Allowable Monthly EMI:</span>
            <span className="block font-bold text-lg font-mono text-slate-900 dark:text-white mt-0.5">
              ₹{affordability.maxAllowableEmi.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-xs text-brand-700 dark:text-brand-300">Estimated Max Loan Eligibility:</span>
            <span className="block font-extrabold text-xl font-mono text-brand-800 dark:text-brand-300 mt-0.5">
              ₹{(affordability.estimatedMaxLoanAffordability / 100000).toFixed(1)} Lakhs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
