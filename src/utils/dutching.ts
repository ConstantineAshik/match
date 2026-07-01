import type { CombinationResult } from "../types";

export type DutchingStatus =
  | "ready"
  | "no-combinations"
  | "invalid-budget"
  | "invalid-minimum"
  | "insufficient-budget"
  | "invalid-odds";

export type DutchingResult = {
  status: DutchingStatus;
  allocations: CombinationResult[];
  totalBudget: number;
  totalStake: number;
  unallocated: number;
  effectiveMinimumBet: number;
  minimumRequired: number;
  targetReturn: number;
  guaranteedReturn: number;
  minimumProfit: number;
  maximumProfit: number;
  impliedProbability: number;
  noLossMathematically: boolean;
};

const CURRENCY_FACTOR = 100;
const EPSILON = 1e-9;

const emptyResult = (
  status: DutchingStatus,
  totalBudget: number,
  effectiveMinimumBet = 0,
  minimumRequired = 0,
): DutchingResult => ({
  status,
  allocations: [],
  totalBudget,
  totalStake: 0,
  unallocated: Math.max(totalBudget, 0),
  effectiveMinimumBet,
  minimumRequired,
  targetReturn: 0,
  guaranteedReturn: 0,
  minimumProfit: 0,
  maximumProfit: 0,
  impliedProbability: 0,
  noLossMathematically: false,
});

export const calculateDutching = (
  combinations: CombinationResult[],
  totalMoney: number,
  minimumBet: number,
): DutchingResult => {
  if (!combinations.length) {
    return emptyResult("no-combinations", totalMoney);
  }
  if (!Number.isFinite(totalMoney) || totalMoney <= 0) {
    return emptyResult("invalid-budget", totalMoney);
  }
  if (!Number.isFinite(minimumBet) || minimumBet < 0) {
    return emptyResult("invalid-minimum", totalMoney);
  }
  if (
    combinations.some(
      (combination) =>
        !Number.isFinite(combination.combinedOdds) ||
        combination.combinedOdds <= 1,
    )
  ) {
    return emptyResult("invalid-odds", totalMoney);
  }

  const budgetCents = Math.floor(
    totalMoney * CURRENCY_FACTOR + EPSILON,
  );
  const minimumCents = Math.ceil(
    minimumBet * CURRENCY_FACTOR - EPSILON,
  );
  const usableBudget = budgetCents / CURRENCY_FACTOR;
  const effectiveMinimumBet = minimumCents / CURRENCY_FACTOR;
  const minimumRequired =
    effectiveMinimumBet * combinations.length;

  if (minimumCents * combinations.length > budgetCents) {
    return emptyResult(
      "insufficient-budget",
      usableBudget,
      effectiveMinimumBet,
      minimumRequired,
    );
  }

  const impliedProbability = combinations.reduce(
    (total, combination) => total + 1 / combination.combinedOdds,
    0,
  );
  const unconstrainedTarget = usableBudget / impliedProbability;
  const requiredStake = (targetReturn: number) =>
    combinations.reduce(
      (total, combination) =>
        total +
        Math.max(
          effectiveMinimumBet,
          targetReturn / combination.combinedOdds,
        ),
      0,
    );

  let lowerTarget = 0;
  let upperTarget = unconstrainedTarget;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const candidate = (lowerTarget + upperTarget) / 2;
    if (requiredStake(candidate) <= usableBudget + EPSILON) {
      lowerTarget = candidate;
    } else {
      upperTarget = candidate;
    }
  }

  const exactStakes = combinations.map((combination) =>
    Math.max(
      effectiveMinimumBet,
      lowerTarget / combination.combinedOdds,
    ),
  );
  const stakeCents = exactStakes.map((stake) =>
    Math.max(
      minimumCents,
      Math.floor(stake * CURRENCY_FACTOR + EPSILON),
    ),
  );
  const allocatedCents = stakeCents.reduce(
    (total, amount) => total + amount,
    0,
  );
  const remainingCents = Math.max(budgetCents - allocatedCents, 0);
  const roundingPriority = exactStakes
    .map((stake, index) => ({
      index,
      fraction:
        stake * CURRENCY_FACTOR -
        Math.floor(stake * CURRENCY_FACTOR + EPSILON),
    }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let cent = 0; cent < remainingCents; cent += 1) {
    const target = roundingPriority[cent % roundingPriority.length];
    stakeCents[target.index] += 1;
  }

  const totalStake =
    stakeCents.reduce((total, amount) => total + amount, 0) /
    CURRENCY_FACTOR;
  const allocations = combinations.map((combination, index) => {
    const stake = stakeCents[index] / CURRENCY_FACTOR;
    const returnAmount = stake * combination.combinedOdds;
    return {
      ...combination,
      stake,
      returnAmount,
      profitLoss: returnAmount - totalStake,
    };
  });
  const returns = allocations.map(
    (combination) => combination.returnAmount,
  );
  const profits = allocations.map(
    (combination) => combination.profitLoss,
  );
  const guaranteedReturn = Math.min(...returns);
  const minimumProfit = Math.min(...profits);

  return {
    status: "ready",
    allocations,
    totalBudget: usableBudget,
    totalStake,
    unallocated: Math.max(usableBudget - totalStake, 0),
    effectiveMinimumBet,
    minimumRequired,
    targetReturn: lowerTarget,
    guaranteedReturn,
    minimumProfit,
    maximumProfit: Math.max(...profits),
    impliedProbability,
    noLossMathematically: minimumProfit >= -0.005,
  };
};
