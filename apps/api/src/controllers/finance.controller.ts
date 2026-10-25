import { Request, Response } from 'express';
import { z } from 'zod';
import {
  calculateLoan,
  calculateStampDutyAndTaxes,
  calculateRbiLtvLimits,
  getLenderComparisonQuotes,
  estimateBorrowerAffordability,
} from '@bhoomi/finance';

const calculateLoanSchema = z.object({
  propertyPrice: z.number().positive(),
  downPaymentPercent: z.number().min(0).max(100).default(20),
  annualInterestRate: z.number().min(0).max(30).default(8.5),
  tenureYears: z.number().min(1).max(35).default(20),
});

const calculateTaxesSchema = z.object({
  propertyPrice: z.number().positive(),
  isUnderConstruction: z.boolean().default(false),
  isFemaleOwner: z.boolean().default(false),
  isMunicipalCorporation: z.boolean().default(true),
});

const calculateAffordabilitySchema = z.object({
  monthlyIncome: z.number().positive(),
  existingMonthlyEmi: z.number().min(0).default(0),
  interestRate: z.number().min(1).max(30).default(8.5),
  tenureYears: z.number().min(1).max(35).default(20),
});

export function computeLoanMetrics(req: Request, res: Response) {
  try {
    const parse = calculateLoanSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const result = calculateLoan(parse.data);
    const rbiLimits = calculateRbiLtvLimits(parse.data.propertyPrice);

    return res.status(200).json({
      calculation: result,
      rbiLimits,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to compute loan schedule.' });
  }
}

export function computePropertyTaxes(req: Request, res: Response) {
  try {
    const parse = calculateTaxesSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { propertyPrice, ...options } = parse.data;
    const taxes = calculateStampDutyAndTaxes(propertyPrice, options);

    return res.status(200).json({ taxes });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to compute tax estimates.' });
  }
}

export function getLenderQuotes(req: Request, res: Response) {
  try {
    const propertyPrice = parseFloat(req.query.propertyPrice as string) || 5000000;
    const downPaymentPercent = parseFloat(req.query.downPaymentPercent as string) || 20;
    const tenureYears = parseInt(req.query.tenureYears as string) || 20;

    const quotes = getLenderComparisonQuotes(propertyPrice, downPaymentPercent, tenureYears);
    return res.status(200).json({ quotes });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve lender quotes.' });
  }
}

export function checkAffordability(req: Request, res: Response) {
  try {
    const parse = calculateAffordabilitySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { monthlyIncome, existingMonthlyEmi, interestRate, tenureYears } = parse.data;
    const affordability = estimateBorrowerAffordability(
      monthlyIncome,
      existingMonthlyEmi,
      interestRate,
      tenureYears
    );

    return res.status(200).json({ affordability });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to calculate affordability.' });
  }
}
