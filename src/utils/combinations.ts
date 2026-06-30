import type { MatchOutcome } from "../types";

export const cartesianProduct = (
  outcomeGroups: MatchOutcome[][],
): MatchOutcome[][] => {
  if (outcomeGroups.length === 0) return [];

  return outcomeGroups.reduce<MatchOutcome[][]>(
    (combinations, outcomes) =>
      combinations.flatMap((combination) =>
        outcomes.map((outcome) => [...combination, outcome]),
      ),
    [[]],
  );
};
