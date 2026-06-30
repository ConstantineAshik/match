import { describe, expect, it } from "vitest";
import { findCountry } from "../data/countries";
import type { Match } from "../types";
import { generateCombinations } from "./calculations";

describe("generateCombinations", () => {
  it("does not generate combinations for a single match", () => {
    const match: Match = {
      id: "single",
      homeTeam: findCountry("FRA"),
      awayTeam: findCountry("SWE"),
      homeOdds: 2.1,
      drawOdds: 3.2,
      awayOdds: 3.4,
      selectedOutcomes: ["HOME", "DRAW", "AWAY"],
    };

    expect(generateCombinations([match], 20)).toEqual([]);
  });

  it("generates eight three-match combinations with total-stake profit/loss", () => {
    const matches: Match[] = [
      {
        id: "1",
        homeTeam: findCountry("CIV"),
        awayTeam: findCountry("NOR"),
        homeOdds: 3.655,
        drawOdds: 3.555,
        awayOdds: 2.172,
        selectedOutcomes: ["HOME", "AWAY"],
      },
      {
        id: "2",
        homeTeam: findCountry("FRA"),
        awayTeam: findCountry("SWE"),
        homeOdds: 1.335,
        drawOdds: 6.21,
        awayOdds: 9.5,
        selectedOutcomes: ["HOME", "AWAY"],
      },
      {
        id: "3",
        homeTeam: findCountry("MEX"),
        awayTeam: findCountry("ECU"),
        homeOdds: 2.325,
        drawOdds: 2.972,
        awayOdds: 4.02,
        selectedOutcomes: ["HOME", "AWAY"],
      },
    ];

    const results = generateCombinations(matches, 20);
    const lowest = results.reduce((a, b) =>
      a.returnAmount < b.returnAmount ? a : b,
    );

    expect(results).toHaveLength(8);
    expect(lowest.outcomes.map((outcome) => outcome.shortLabel)).toEqual([
      "NOR",
      "FRA",
      "MEX",
    ]);
    expect(lowest.returnAmount).toBeCloseTo(134.83, 2);
    expect(lowest.profitLoss).toBeCloseTo(-25.17, 2);
  });
});
