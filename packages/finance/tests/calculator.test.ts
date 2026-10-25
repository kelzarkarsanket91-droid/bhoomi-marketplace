import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLoan, calculateStampDutyAndTaxes, calculateRbiLtvLimits, getLenderComparisonQuotes } from '../dist/index.js';

test('calculateLoan: calculates accurate EMI and balance reduction for standard ₹50 Lakh loan', () => {
  const result = calculateLoan({
    propertyPrice: 5000000,
    downPaymentPercent: 20, // ₹10 Lakhs down, ₹40 Lakhs loan
    annualInterestRate: 8.5,
    tenureYears: 20,
  });

  assert.equal(result.propertyPrice, 5000000);
  assert.equal(result.downPaymentAmount, 1000000);
  assert.equal(result.loanAmount, 4000000);
  assert.equal(result.tenureMonths, 240);

  // For ₹40L at 8.5% for 20 years, EMI is approximately ₹34,713
  assert.ok(result.monthlyEmi > 34600 && result.monthlyEmi < 34800, `EMI ${result.monthlyEmi} within expected range`);
  assert.ok(result.totalInterestPayable > 4300000, 'Total interest calculated correctly');
  assert.equal(result.yearlyAmortization.length, 20);
  assert.equal(result.monthlyAmortization.length, 240);
  assert.equal(result.monthlyAmortization[239].closingBalance, 0);
});

test('calculateLoan: handles 0% interest without division by zero', () => {
  const result = calculateLoan({
    propertyPrice: 120000,
    downPaymentPercent: 0,
    annualInterestRate: 0,
    tenureYears: 1, // 12 months
  });

  assert.equal(result.loanAmount, 120000);
  assert.equal(result.monthlyEmi, 10000);
  assert.equal(result.totalInterestPayable, 0);
});

test('calculateStampDutyAndTaxes: computes Maharashtra urban & rural rates with female discount', () => {
  const urbanMale = calculateStampDutyAndTaxes(10000000, { isMunicipalCorporation: true, isFemaleOwner: false });
  assert.equal(urbanMale.stampDutyPercent, 7);
  assert.equal(urbanMale.stampDutyAmount, 700000);
  assert.equal(urbanMale.registrationAmount, 30000); // capped at 30k

  const urbanFemale = calculateStampDutyAndTaxes(10000000, { isMunicipalCorporation: true, isFemaleOwner: true });
  assert.equal(urbanFemale.stampDutyPercent, 6);
  assert.equal(urbanFemale.stampDutyAmount, 600000);
});

test('calculateRbiLtvLimits: enforces RBI slabs (90% for affordable, 80% mid, 75% luxury)', () => {
  const affordable = calculateRbiLtvLimits(2500000);
  assert.equal(affordable.maxPermissibleLtvPercent, 90);
  assert.equal(affordable.minDownPaymentRequired, 250000);

  const mid = calculateRbiLtvLimits(6000000);
  assert.equal(mid.maxPermissibleLtvPercent, 80);

  const luxury = calculateRbiLtvLimits(12000000);
  assert.equal(luxury.maxPermissibleLtvPercent, 75);
});

test('getLenderComparisonQuotes: produces quotes for all default partners', () => {
  const quotes = getLenderComparisonQuotes(5000000, 20, 20);
  assert.equal(quotes.length, 5);
  quotes.forEach((q) => {
    assert.ok(q.monthlyEmi > 0);
    assert.ok(q.processingFee <= q.lender.processingFeeCap);
  });
});
