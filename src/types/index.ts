export type Team = {
  name: string;
  code: string;
  flag: string;
};

export type OutcomeType = "HOME" | "DRAW" | "AWAY";

export type MatchOutcome = {
  type: OutcomeType;
  label: string;
  shortLabel: string;
  odds: number;
  matchId: string;
};

export type Match = {
  id: string;
  title?: string;
  homeTeam: Team;
  awayTeam: Team;
  dateTime?: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  selectedOutcomes: OutcomeType[];
  oddsSource?: {
    provider: string;
    bookmaker: string;
    updatedAt: string;
  };
};

export type CombinationResult = {
  id: string;
  outcomes: MatchOutcome[];
  combinedOdds: number;
  stake: number;
  returnAmount: number;
  profitLoss: number;
};

export type CurrencyCode = "BDT" | "USD" | "EUR" | "GBP";

export type SortOption =
  | "lowest-return"
  | "highest-return"
  | "lowest-odds"
  | "highest-odds";

export type FilterOption = "all" | "profit" | "loss";
