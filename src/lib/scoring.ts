import type { DealScore } from '@/types';

export const SCORING_WEIGHTS = {
  collateral_quality: 0.35,
  ltv_score: 0.25,
  personal_balance_sheet: 0.20,
  downside_recovery: 0.20,
} as const;

export const SCORING_LABELS: Record<string, string> = {
  collateral_quality: 'Collateral Quality',
  ltv_score: 'LTV / Loan-to-Value',
  personal_balance_sheet: 'Personal Balance Sheet / PG Strength',
  downside_recovery: 'Downside Recovery ("What can we actually get?")',
};

export const SCORING_DESCRIPTIONS: Record<string, string> = {
  collateral_quality:
    'Quality, liquidity, and marketability of the pledged collateral. Consider asset type, condition, location, demand, and ease of liquidation.',
  ltv_score:
    'Loan-to-value ratio relative to realistic collateral valuation. Lower LTV = higher score. Consider both current value and stressed scenarios.',
  personal_balance_sheet:
    'Strength of the personal guarantee. Net worth, liquidity, other assets, credit history, and willingness/ability to support the loan.',
  downside_recovery:
    'If everything goes wrong, what can we realistically recover? Consider legal enforceability, liquidation timeline, costs, and net recovery estimate.',
};

export function calculateCompositeScore(score: Partial<DealScore>): number {
  const factors = [
    { value: score.collateral_quality, weight: SCORING_WEIGHTS.collateral_quality },
    { value: score.ltv_score, weight: SCORING_WEIGHTS.ltv_score },
    { value: score.personal_balance_sheet, weight: SCORING_WEIGHTS.personal_balance_sheet },
    { value: score.downside_recovery, weight: SCORING_WEIGHTS.downside_recovery },
  ];

  let totalWeight = 0;
  let weightedSum = 0;

  for (const factor of factors) {
    if (factor.value != null) {
      weightedSum += factor.value * factor.weight;
      totalWeight += factor.weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

export function getScoreVerdict(composite: number): {
  label: string;
  color: string;
  description: string;
} {
  if (composite >= 8) {
    return {
      label: 'Strong Deal',
      color: 'text-green-400',
      description: 'Excellent risk profile. Recommend proceeding.',
    };
  }
  if (composite >= 6) {
    return {
      label: 'Acceptable',
      color: 'text-yellow-400',
      description: 'Moderate risk. Review conditions and mitigants carefully.',
    };
  }
  if (composite >= 4) {
    return {
      label: 'Marginal',
      color: 'text-orange-400',
      description: 'Elevated risk. Requires strong mitigants or restructuring.',
    };
  }
  return {
    label: 'Pass',
    color: 'text-red-400',
    description: 'Risk exceeds appetite. Consider declining or major restructure.',
  };
}
