import { describe, expect, it } from "vitest";
import type { CombinationResult } from "../types";
import { calculateDutching } from "./dutching";

const combinationsFromOdds = (
  odds: number[],
): CombinationResult[] =>
  odds.map((combinedOdds, index) => ({
    id: `combination-${index + 1}`,
    outcomes: [],
    combinedOdds,
    stake: 0,
    returnAmount: 0,
    profitLoss: 0,
  }));

describe("calculateDutching", () => {
  it("splits the full budget to produce nearly equal returns", () => {
    const result = calculateDutching(
      combinationsFromOdds([4, 5, 10]),
      300,
      15,
    );

    expect(result.status).toBe("ready");
    expect(result.totalStake).toBe(300);
    expect(result.allocations.map((item) => item.stake)).toEqual([
      136.36, 109.09, 54.55,
    ]);
    expect(result.allocations.map((item) => item.id)).toEqual([
      "combination-1",
      "combination-2",
      "combination-3",
    ]);
    expect(result.guaranteedReturn).toBeCloseTo(545.44, 2);
    expect(result.minimumProfit).toBeCloseTo(245.44, 2);
    expect(result.noLossMathematically).toBe(true);
  });

  it("honors a binding minimum bet while maximizing the worst return", () => {
    const result = calculateDutching(
      combinationsFromOdds([2, 100]),
      100,
      15,
    );

    expect(result.status).toBe("ready");
    expect(result.allocations.map((item) => item.stake)).toEqual([85, 15]);
    expect(result.guaranteedReturn).toBe(170);
    expect(result.minimumProfit).toBe(70);
  });

  it("reports when the budget cannot fund every minimum bet", () => {
    const result = calculateDutching(
      combinationsFromOdds([4, 5]),
      20,
      15,
    );

    expect(result.status).toBe("insufficient-budget");
    expect(result.minimumRequired).toBe(30);
    expect(result.allocations).toEqual([]);
  });

  it("detects a mathematically losing dutching market", () => {
    const result = calculateDutching(
      combinationsFromOdds([1.5, 2]),
      300,
      15,
    );

    expect(result.status).toBe("ready");
    expect(result.minimumProfit).toBeLessThan(0);
    expect(result.noLossMathematically).toBe(false);
  });
});
