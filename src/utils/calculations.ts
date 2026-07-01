import type {
  CombinationResult,
  Match,
  MatchOutcome,
  OutcomeType,
} from "../types";
import { cartesianProduct } from "./combinations";

const toOutcome = (match: Match, type: OutcomeType): MatchOutcome => {
  if (type === "HOME") {
    return {
      type,
      label: match.homeTeam.name,
      shortLabel: match.homeTeam.code,
      odds: match.homeOdds,
      matchId: match.id,
    };
  }

  if (type === "AWAY") {
    return {
      type,
      label: match.awayTeam.name,
      shortLabel: match.awayTeam.code,
      odds: match.awayOdds,
      matchId: match.id,
    };
  }

  return {
    type,
    label: `Draw (${match.homeTeam.code}–${match.awayTeam.code})`,
    shortLabel: `X ${match.homeTeam.code}/${match.awayTeam.code}`,
    odds: match.drawOdds,
    matchId: match.id,
  };
};

const ALL_OUTCOMES: OutcomeType[] = ["HOME", "DRAW", "AWAY"];

export const hasFullOutcomeCoverage = (matches: Match[]): boolean =>
  matches.length >= 2 &&
  matches.every((match) =>
    ALL_OUTCOMES.every((outcome) =>
      match.selectedOutcomes.includes(outcome),
    ),
  );

export const validateMatch = (match: Match): string[] => {
  const errors: string[] = [];
  if (match.homeTeam.name === match.awayTeam.name) {
    errors.push("Home and away teams must be different.");
  }
  if (
    !Number.isFinite(match.homeOdds) ||
    !Number.isFinite(match.drawOdds) ||
    !Number.isFinite(match.awayOdds) ||
    match.homeOdds <= 1 ||
    match.drawOdds <= 1 ||
    match.awayOdds <= 1
  ) {
    errors.push("All odds must be greater than 1.");
  }
  if (match.selectedOutcomes.length === 0) {
    errors.push("Select at least one outcome.");
  }
  return errors;
};

export const generateCombinations = (
  matches: Match[],
  stake: number,
): CombinationResult[] => {
  if (
    matches.length < 2 ||
    stake <= 0 ||
    matches.some((match) => validateMatch(match).length > 0)
  ) {
    return [];
  }

  const outcomeGroups = matches.map((match) =>
    match.selectedOutcomes.map((type) => toOutcome(match, type)),
  );
  const outcomeCombinations = cartesianProduct(outcomeGroups);
  const totalStake = outcomeCombinations.length * stake;

  return outcomeCombinations.map((outcomes) => {
    const combinedOdds = outcomes.reduce(
      (product, outcome) => product * outcome.odds,
      1,
    );
    const returnAmount = stake * combinedOdds;

    return {
      id: `combination-${outcomes
        .map((outcome) => `${outcome.matchId}-${outcome.type}`)
        .join("-")}`,
      outcomes,
      combinedOdds,
      stake,
      returnAmount,
      profitLoss: returnAmount - totalStake,
    };
  });
};

export const applyCombinationStakes = (
  combinations: CombinationResult[],
  defaultStake: number,
  stakeOverrides: Record<string, number>,
): CombinationResult[] => {
  const stakes = combinations.map((combination) => {
    const override = stakeOverrides[combination.id];
    return Number.isFinite(override) && override >= 0
      ? override
      : defaultStake;
  });
  const totalStake = stakes.reduce((total, stake) => total + stake, 0);

  return combinations.map((combination, index) => {
    const stake = stakes[index];
    const returnAmount = stake * combination.combinedOdds;

    return {
      ...combination,
      stake,
      returnAmount,
      profitLoss: returnAmount - totalStake,
    };
  });
};
