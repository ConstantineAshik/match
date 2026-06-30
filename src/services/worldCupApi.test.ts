import { describe, expect, it } from "vitest";
import {
  getWorldCupDateBounds,
  worldCupEventToMatch,
  type WorldCupApiEvent,
} from "./worldCupApi";

describe("World Cup data client", () => {
  it("uses the timestamp format required by The Odds API", () => {
    const bounds = getWorldCupDateBounds();
    const requiredFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

    expect(bounds.from).toMatch(requiredFormat);
    expect(bounds.to).toMatch(requiredFormat);
  });

  it("converts complete bookmaker 1X2 odds into a calculator match", () => {
    const event: WorldCupApiEvent = {
      id: "world-cup-1",
      sport_title: "FIFA World Cup",
      commence_time: "2026-06-30T18:00:00Z",
      home_team: "France",
      away_team: "Sweden",
      bookmakers: [
        {
          key: "example",
          title: "Example Bookmaker",
          last_update: "2026-06-30T10:00:00Z",
          markets: [
            {
              key: "h2h",
              outcomes: [
                { name: "Sweden", price: 3.4 },
                { name: "Draw", price: 3.1 },
                { name: "France", price: 2.05 },
              ],
            },
          ],
        },
      ],
    };

    const match = worldCupEventToMatch(event);
    expect(match?.homeOdds).toBe(2.05);
    expect(match?.drawOdds).toBe(3.1);
    expect(match?.awayOdds).toBe(3.4);
    expect(match?.selectedOutcomes).toEqual(["HOME", "DRAW", "AWAY"]);
  });
});
