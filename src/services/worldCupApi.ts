import type { Match, Team } from "../types";

const THE_ODDS_API_KEY = "3f7d74094814341b87fbb87797709dc2";
const WORLD_CUP_ODDS_URL =
  "https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds";

type ApiOutcome = {
  name: string;
  price: number;
};

type ApiBookmaker = {
  key: string;
  title: string;
  last_update: string;
  markets: Array<{
    key: string;
    outcomes: ApiOutcome[];
  }>;
};

export type WorldCupApiEvent = {
  id: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: ApiBookmaker[];
};

type WorldCupFetchResult = {
  matches: Match[];
  requestsRemaining?: number;
};

const apiTimestamp = (date: Date) =>
  date.toISOString().replace(/\.\d{3}Z$/, "Z");

export const getWorldCupDateBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setSeconds(end.getSeconds() - 1);
  return { from: apiTimestamp(start), to: apiTimestamp(end) };
};

const parseApiError = async (response: Response) => {
  try {
    const body = (await response.json()) as {
      message?: string;
      error_code?: string;
    };
    if (body.message) return body.message;
    if (body.error_code) return body.error_code.replace(/_/g, " ");
  } catch {
    // Fall through to the HTTP status message.
  }
  return `The World Cup data request failed with HTTP ${response.status}.`;
};

const teamCode = (name: string) => {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1].slice(0, 2)}`.toUpperCase();
  }
  return (words[0] ?? "TEAM").slice(0, 3).toUpperCase();
};

const team = (name: string): Team => ({
  name,
  code: teamCode(name),
  flag: "⚽",
});

const localDateTime = (isoDate: string) => {
  const date = new Date(isoDate);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const bookmakerOdds = (event: WorldCupApiEvent, bookmaker: ApiBookmaker) => {
  const market = bookmaker.markets.find((item) => item.key === "h2h");
  if (!market) return undefined;
  const home = market.outcomes.find(
    (outcome) => outcome.name === event.home_team,
  )?.price;
  const draw = market.outcomes.find(
    (outcome) => outcome.name.toLowerCase() === "draw",
  )?.price;
  const away = market.outcomes.find(
    (outcome) => outcome.name === event.away_team,
  )?.price;

  if (
    !home ||
    !draw ||
    !away ||
    ![home, draw, away].every(
      (price) => Number.isFinite(price) && price > 1,
    )
  ) {
    return undefined;
  }
  return { home, draw, away };
};

export const worldCupEventToMatch = (
  event: WorldCupApiEvent,
): Match | undefined => {
  const availableBookmakers = event.bookmakers
    .filter((bookmaker) => bookmakerOdds(event, bookmaker))
    .sort((a, b) => a.title.localeCompare(b.title));
  const bookmaker = availableBookmakers[0];
  if (!bookmaker) return undefined;

  const odds = bookmakerOdds(event, bookmaker);
  if (!odds) return undefined;

  return {
    id: `odds-${event.id}`,
    title: `${event.home_team} vs ${event.away_team} · FIFA World Cup`,
    homeTeam: team(event.home_team),
    awayTeam: team(event.away_team),
    dateTime: localDateTime(event.commence_time),
    homeOdds: odds.home,
    drawOdds: odds.draw,
    awayOdds: odds.away,
    selectedOutcomes: ["HOME", "DRAW", "AWAY"],
    oddsSource: {
      bookmaker: bookmaker.title,
      updatedAt: bookmaker.last_update,
    },
  };
};

const numericHeader = (value: string | null) => {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const fetchWorldCupMatches =
  async (): Promise<WorldCupFetchResult> => {
    const { from, to } = getWorldCupDateBounds();
    const url = new URL(WORLD_CUP_ODDS_URL);
    url.searchParams.set("apiKey", THE_ODDS_API_KEY);
    url.searchParams.set("regions", "eu");
    url.searchParams.set("markets", "h2h");
    url.searchParams.set("oddsFormat", "decimal");
    url.searchParams.set("dateFormat", "iso");
    url.searchParams.set("commenceTimeFrom", from);
    url.searchParams.set("commenceTimeTo", to);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    const events = (await response.json()) as WorldCupApiEvent[];
    const matches = events
      .map(worldCupEventToMatch)
      .filter((match): match is Match => Boolean(match))
      .sort(
        (a, b) =>
          new Date(a.dateTime ?? "").getTime() -
          new Date(b.dateTime ?? "").getTime(),
      );

    return {
      matches,
      requestsRemaining: numericHeader(
        response.headers.get("x-requests-remaining"),
      ),
    };
  };
