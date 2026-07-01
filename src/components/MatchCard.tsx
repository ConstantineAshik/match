import { CalendarDays, Trash2 } from "lucide-react";
import type { Match, OutcomeType } from "../types";
import { validateMatch } from "../utils/calculations";
import { CountrySelect } from "./CountrySelect";

type MatchCardProps = {
  match: Match;
  index: number;
  onChange: (match: Match) => void;
  onRemove: () => void;
};

const outcomeConfig: Array<{
  type: OutcomeType;
  label: string;
  abbreviation: string;
  oddsKey: "homeOdds" | "drawOdds" | "awayOdds";
}> = [
  { type: "HOME", label: "Home win", abbreviation: "1", oddsKey: "homeOdds" },
  { type: "DRAW", label: "Draw", abbreviation: "X", oddsKey: "drawOdds" },
  { type: "AWAY", label: "Away win", abbreviation: "2", oddsKey: "awayOdds" },
];

export function MatchCard({
  match,
  index,
  onChange,
  onRemove,
}: MatchCardProps) {
  const errors = validateMatch(match);

  const toggleOutcome = (type: OutcomeType) => {
    const isSelected = match.selectedOutcomes.includes(type);
    onChange({
      ...match,
      selectedOutcomes: isSelected
        ? match.selectedOutcomes.filter((outcome) => outcome !== type)
        : [...match.selectedOutcomes, type],
    });
  };

  return (
    <article className="card group overflow-visible p-4 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-ink-900 text-sm font-black text-lime-300 dark:bg-lime-400 dark:text-ink-950">
            {index + 1}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Match {index + 1}
            </p>
            <h3 className="mt-0.5 font-bold text-slate-900 dark:text-white">
              {match.homeTeam.code}{" "}
              <span className="font-medium text-slate-400">vs</span>{" "}
              {match.awayTeam.code}
            </h3>
            {match.oddsSource && (
              <p
                className="mt-1 text-[10px] font-bold text-sky-600 dark:text-sky-300"
                title={`Updated ${new Date(
                  match.oddsSource.updatedAt,
                ).toLocaleString()}`}
              >
                Odds by {match.oddsSource.bookmaker}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          title="Remove match"
          className="icon-button text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CountrySelect
          label="Home team"
          value={match.homeTeam}
          excludeCode={match.awayTeam.code}
          onChange={(homeTeam) =>
            onChange({ ...match, homeTeam, oddsSource: undefined })
          }
        />
        <CountrySelect
          label="Away team"
          value={match.awayTeam}
          excludeCode={match.homeTeam.code}
          onChange={(awayTeam) =>
            onChange({ ...match, awayTeam, oddsSource: undefined })
          }
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor={`title-${match.id}`}>
            Match title <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id={`title-${match.id}`}
            className="input-field w-full"
            value={match.title ?? ""}
            placeholder={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
            onChange={(event) =>
              onChange({ ...match, title: event.target.value })
            }
          />
        </div>
        <div>
          <label className="field-label" htmlFor={`date-${match.id}`}>
            <CalendarDays size={13} /> Date & time
          </label>
          <input
            id={`date-${match.id}`}
            type="datetime-local"
            className="input-field w-full"
            value={match.dateTime ?? ""}
            onChange={(event) =>
              onChange({ ...match, dateTime: event.target.value })
            }
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="field-label mb-0">1X2 odds & coverage</p>
          <p className="text-[11px] font-semibold text-slate-400">
            Tap to include
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {outcomeConfig.map(({ type, label, abbreviation, oddsKey }) => {
            const isSelected = match.selectedOutcomes.includes(type);
            return (
              <div
                key={type}
                className={`relative rounded-2xl border p-2.5 transition sm:p-3 ${
                  isSelected
                    ? "border-lime-400 bg-lime-50/80 ring-1 ring-lime-400 dark:bg-lime-400/10"
                    : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-ink-900/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleOutcome(type)}
                  className="mb-2 flex w-full items-center gap-2 text-left"
                  aria-pressed={isSelected}
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-lg text-xs font-black ${
                      isSelected
                        ? "bg-lime-400 text-ink-950"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {abbreviation}
                  </span>
                  <span className="truncate text-xs font-bold text-slate-600 dark:text-slate-300">
                    {label}
                  </span>
                </button>
                <label className="sr-only" htmlFor={`${oddsKey}-${match.id}`}>
                  {label} odds
                </label>
                <input
                  id={`${oddsKey}-${match.id}`}
                  type="number"
                  min="1.01"
                  step="0.001"
                  inputMode="decimal"
                  value={match[oddsKey] || ""}
                  onChange={(event) =>
                    onChange({
                      ...match,
                      [oddsKey]: Number(event.target.value),
                      oddsSource: undefined,
                    })
                  }
                  onClick={(event) => event.stopPropagation()}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm font-extrabold text-slate-900 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 dark:border-slate-700 dark:bg-ink-800 dark:text-white"
                />
              </div>
            );
          })}
        </div>
      </div>

      {errors.length > 0 && (
        <p className="mt-3 text-xs font-semibold text-red-500">
          {errors.join(" ")}
        </p>
      )}
    </article>
  );
}
