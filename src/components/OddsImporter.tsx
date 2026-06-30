import {
  CalendarDays,
  Check,
  ChevronDown,
  CloudDownload,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { fetchWorldCupMatches } from "../services/worldCupApi";
import type { Match } from "../types";

type OddsImporterProps = {
  existingMatchIds: string[];
  onImport: (matches: Match[]) => void;
};

const formatKickoff = (dateTime?: string) => {
  if (!dateTime) return "Time unavailable";
  return new Intl.DateTimeFormat("en-BD", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateTime));
};

export function OddsImporter({
  existingMatchIds,
  onImport,
}: OddsImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestsRemaining, setRequestsRemaining] = useState<number>();

  const loadWorldCup = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchWorldCupMatches();
      setMatches(result.matches);
      setSelectedIds([]);
      setRequestsRemaining(result.requestsRemaining);
      if (!result.matches.length) {
        setError(
          "No World Cup fixtures with complete 1X2 odds were found in the next seven days.",
        );
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load World Cup data.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMatch = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((matchId) => matchId !== id)
        : [...current, id],
    );
  };

  const selectableMatches = matches.filter(
    (match) => !existingMatchIds.includes(match.id),
  );
  const allSelected =
    selectableMatches.length > 0 &&
    selectedIds.length === selectableMatches.length;

  const importSelected = () => {
    onImport(matches.filter((match) => selectedIds.includes(match.id)));
    setSelectedIds([]);
  };

  return (
    <section className="card mb-8 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center gap-3 p-4 text-left sm:gap-4 sm:p-6"
        aria-expanded={isOpen}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300 sm:size-11">
          <Trophy size={21} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-base font-black text-slate-950 dark:text-white sm:text-lg">
              FIFA World Cup matches
            </span>
            <span className="hidden rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 sm:inline">
              Live odds
            </span>
          </span>
          <span className="mt-1 block text-xs leading-5 text-slate-400">
            Fetch the next seven days and select at least two matches.
          </span>
        </span>
        <ChevronDown
          size={19}
          className={`shrink-0 text-slate-400 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 p-4 dark:border-slate-700 sm:p-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/[.07] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <Trophy size={18} />
              </span>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  World Cup 2026 · 1X2
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                  Current European-region bookmaker prices supplied by The Odds
                  API.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadWorldCup()}
              disabled={loading}
              className="button-primary w-full whitespace-nowrap sm:w-auto"
            >
              {loading ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : matches.length ? (
                <RefreshCw size={15} />
              ) : (
                <CloudDownload size={15} />
              )}
              {loading
                ? "Loading matches…"
                : matches.length
                  ? "Refresh World Cup"
                  : "Fetch World Cup data"}
            </button>
          </div>

          {requestsRemaining !== undefined && (
            <p className="mt-2 text-right text-[10px] font-semibold text-slate-400">
              {requestsRemaining} API requests remaining
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              {error}
            </div>
          )}

          {matches.length > 0 && (
            <div className="mt-5">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {matches.length} World Cup matches
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Choose two or more for combination calculations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIds(
                      allSelected
                        ? []
                        : selectableMatches.map((match) => match.id),
                    )
                  }
                  className="shrink-0 text-xs font-extrabold text-sky-600 hover:underline dark:text-sky-300"
                >
                  {allSelected ? "Clear all" : "Select all"}
                </button>
              </div>

              <div className="space-y-2">
                {matches.map((match) => {
                  const alreadyAdded = existingMatchIds.includes(match.id);
                  const isSelected = selectedIds.includes(match.id);

                  return (
                    <article
                      key={match.id}
                      className={`rounded-2xl border p-3 transition sm:p-4 ${
                        isSelected
                          ? "border-sky-300 bg-sky-50/60 ring-1 ring-sky-300 dark:border-sky-500/40 dark:bg-sky-500/[.06] dark:ring-sky-500/40"
                          : "border-slate-200 dark:border-slate-700"
                      } ${alreadyAdded ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => toggleMatch(match.id)}
                          aria-label={`Select ${match.homeTeam.name} vs ${match.awayTeam.name}`}
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition ${
                            isSelected
                              ? "border-sky-500 bg-sky-500 text-white"
                              : "border-slate-300 bg-white dark:border-slate-600 dark:bg-ink-900"
                          }`}
                        >
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 dark:text-white">
                                {match.homeTeam.name}{" "}
                                <span className="font-medium text-slate-400">
                                  vs
                                </span>{" "}
                                {match.awayTeam.name}
                              </p>
                              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                                <CalendarDays size={11} />
                                <span>{formatKickoff(match.dateTime)}</span>
                                <span>•</span>
                                <span>{match.oddsSource?.bookmaker}</span>
                                {alreadyAdded && (
                                  <span className="font-black text-emerald-500">
                                    Added
                                  </span>
                                )}
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                ["1", match.homeOdds],
                                ["X", match.drawOdds],
                                ["2", match.awayOdds],
                              ].map(([label, price]) => (
                                <div
                                  key={label}
                                  className="min-w-14 rounded-xl bg-slate-100 px-2 py-1.5 text-center dark:bg-slate-700"
                                >
                                  <span className="block text-[8px] font-black text-slate-400">
                                    {label}
                                  </span>
                                  <span className="block text-xs font-black text-slate-800 dark:text-white">
                                    {Number(price).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-ink-900/70 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {selectedIds.length} selected
                  {selectedIds.length === 1 && " · Select one more match"}
                </p>
                <button
                  type="button"
                  onClick={importSelected}
                  disabled={selectedIds.length < 2}
                  className="button-primary w-full sm:w-auto"
                >
                  <CloudDownload size={15} />
                  Add selected matches
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 flex items-start gap-2 text-[10px] leading-4 text-slate-400">
            <ShieldCheck size={12} className="mt-0.5 shrink-0" />
            Odds are third-party informational data, not predictions or advice.
          </div>
        </div>
      )}
    </section>
  );
}
