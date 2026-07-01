import { ArrowUpDown, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  CombinationResult,
  CurrencyCode,
  FilterOption,
  SortOption,
} from "../types";
import {
  currencySymbol,
  formatCurrency,
} from "../utils/formatCurrency";

type CombinationTableProps = {
  combinations: CombinationResult[];
  currency: CurrencyCode;
  onStakeChange: (combinationId: string, stake: number) => void;
};

export function CombinationTable({
  combinations,
  currency,
  onStakeChange,
}: CombinationTableProps) {
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const totalStake = combinations.reduce(
    (total, combination) => total + combination.stake,
    0,
  );

  const visibleCombinations = useMemo(() => {
    const filtered = combinations.filter((combination) => {
      if (filterBy === "profit") return combination.profitLoss > 0;
      if (filterBy === "loss") return combination.profitLoss < 0;
      return true;
    });

    if (sortBy === "default") return filtered;

    return [...filtered].sort((a, b) => {
      if (sortBy === "highest-return") return b.returnAmount - a.returnAmount;
      if (sortBy === "lowest-odds") return a.combinedOdds - b.combinedOdds;
      if (sortBy === "highest-odds") return b.combinedOdds - a.combinedOdds;
      return a.returnAmount - b.returnAmount;
    });
  }, [combinations, filterBy, sortBy]);

  return (
    <section aria-labelledby="results-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Every possibility</p>
          <h2 id="results-heading" className="section-title">
            Combination results
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Showing {visibleCombinations.length} of {combinations.length}
          </p>
          {combinations.length > 0 && (
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
              Edit the betting money for any combination. Each row assumes
              that exact outcome wins; “Other combos lost” is the total stake
              on every remaining combination, and the final result compares
              the winning return against your full stake.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <label className="relative flex-1 sm:flex-none">
            <span className="sr-only">Filter results</span>
            <select
              value={filterBy}
              onChange={(event) =>
                setFilterBy(event.target.value as FilterOption)
              }
              className="select-field w-full sm:w-auto"
            >
              <option value="all">All results</option>
              <option value="profit">Profit only</option>
              <option value="loss">Loss only</option>
            </select>
          </label>
          <label className="relative flex-1 sm:flex-none">
            <span className="sr-only">Sort results</span>
            <ArrowUpDown
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as SortOption)
              }
              className="select-field w-full pl-9 sm:w-auto"
            >
              <option value="default">Default order</option>
              <option value="lowest-return">Lowest return</option>
              <option value="highest-return">Highest return</option>
              <option value="lowest-odds">Lowest odds</option>
              <option value="highest-odds">Highest odds</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card overflow-hidden">
        {visibleCombinations.length > 0 ? (
          <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {visibleCombinations.map((combination) => {
                const originalIndex =
                  combinations.findIndex(
                    (item) => item.id === combination.id,
                  ) + 1;
                const otherCombinationsLoss =
                  totalStake - combination.stake;
                const isProfit = combination.profitLoss > 0;
                const isLoss = combination.profitLoss < 0;
                const status = isProfit ? "Profit" : isLoss ? "Loss" : "Even";

                return (
                  <article key={combination.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Combination {String(originalIndex).padStart(2, "0")}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                          isProfit
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : isLoss
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {combination.outcomes.map((outcome, index) => (
                        <span
                          key={`${outcome.matchId}-${outcome.type}`}
                          className="inline-flex items-center gap-1.5"
                        >
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-extrabold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                            {outcome.shortLabel}
                          </span>
                          {index < combination.outcomes.length - 1 && (
                            <span className="text-xs text-slate-300">+</span>
                          )}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-500/[.07]">
                        <label
                          className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400"
                          htmlFor={`mobile-stake-${combination.id}`}
                        >
                          Betting money
                        </label>
                        <div className="relative mt-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                            {currencySymbol(currency)}
                          </span>
                          <input
                            id={`mobile-stake-${combination.id}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={combination.stake || ""}
                            placeholder="0.00"
                            onChange={(event) =>
                              onStakeChange(
                                combination.id,
                                Number(event.target.value),
                              )
                            }
                            className="w-full rounded-lg border border-amber-200 bg-white py-1.5 pl-7 pr-2 text-sm font-black text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-amber-500/30 dark:bg-ink-800 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 dark:bg-ink-900/60">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Combined odds
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                          {combination.combinedOdds.toFixed(3)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-right dark:bg-ink-900/60">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Winning return
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(combination.returnAmount, currency)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-500/[.07]">
                        <p className="text-[9px] font-black uppercase tracking-wider text-rose-400">
                          Other combos lost
                        </p>
                        <p className="mt-1 text-sm font-black text-rose-500">
                          -{formatCurrency(otherCombinationsLoss, currency)}
                        </p>
                      </div>
                      <div
                        className={`rounded-xl p-3 text-right ${
                          isProfit
                            ? "bg-emerald-50 dark:bg-emerald-500/[.07]"
                            : isLoss
                              ? "bg-rose-50 dark:bg-rose-500/[.07]"
                              : "bg-slate-50 dark:bg-slate-700/50"
                        }`}
                      >
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Final result
                        </p>
                        <p
                          className={`mt-1 text-sm font-black ${
                            isProfit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isLoss
                                ? "text-rose-500"
                                : "text-slate-500"
                          }`}
                        >
                          {isProfit ? "Profit " : isLoss ? "Loss " : ""}
                          {formatCurrency(
                            Math.abs(combination.profitLoss),
                            currency,
                          )}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1020px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:border-slate-700 dark:bg-ink-900/70">
                  <th className="px-5 py-3.5">#</th>
                  <th className="px-5 py-3.5">Combination</th>
                  <th className="px-5 py-3.5 text-right">Combined odds</th>
                  <th className="px-5 py-3.5 text-right">Betting money</th>
                  <th className="px-5 py-3.5 text-right">Winning return</th>
                  <th className="px-5 py-3.5 text-right">
                    Other combos lost
                  </th>
                  <th className="px-5 py-3.5 text-right">Final result</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleCombinations.map((combination) => {
                  const otherCombinationsLoss =
                    totalStake - combination.stake;
                  const originalIndex =
                    combinations.findIndex((item) => item.id === combination.id) +
                    1;
                  const status =
                    combination.profitLoss > 0
                      ? "Profit"
                      : combination.profitLoss < 0
                        ? "Loss"
                        : "Even";
                  const tone =
                    combination.profitLoss > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : combination.profitLoss < 0
                        ? "text-rose-500"
                        : "text-slate-400";
                  const badge =
                    combination.profitLoss > 0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : combination.profitLoss < 0
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

                  return (
                    <tr
                      key={combination.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4 text-xs font-bold text-slate-400">
                        {String(originalIndex).padStart(2, "0")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {combination.outcomes.map((outcome, index) => (
                            <span
                              key={`${outcome.matchId}-${outcome.type}`}
                              className="inline-flex items-center gap-1.5"
                            >
                              <span
                                title={`${outcome.label} @ ${outcome.odds}`}
                                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-extrabold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                              >
                                {outcome.shortLabel}
                              </span>
                              {index < combination.outcomes.length - 1 && (
                                <span className="text-xs text-slate-300">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-bold text-slate-700 dark:text-slate-200">
                        {combination.combinedOdds.toFixed(3)}
                      </td>
                      <td className="px-5 py-4">
                        <label
                          className="relative ml-auto block w-32"
                          htmlFor={`stake-${combination.id}`}
                        >
                          <span className="sr-only">
                            Betting money for combination {originalIndex}
                          </span>
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                            {currencySymbol(currency)}
                          </span>
                          <input
                            id={`stake-${combination.id}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={combination.stake || ""}
                            placeholder="0.00"
                            onChange={(event) =>
                              onStakeChange(
                                combination.id,
                                Number(event.target.value),
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-2 text-right text-sm font-extrabold text-slate-900 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 dark:border-slate-700 dark:bg-ink-800 dark:text-white"
                          />
                        </label>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-extrabold text-slate-950 dark:text-white">
                        {formatCurrency(combination.returnAmount, currency)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="block text-sm font-extrabold text-rose-500">
                          -{formatCurrency(otherCombinationsLoss, currency)}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
                          total of other stakes
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-right text-sm font-black ${tone}`}>
                        <span className="block">
                          {combination.profitLoss < 0 ? "Loss " : combination.profitLoss > 0 ? "Profit " : ""}
                          {formatCurrency(
                            Math.abs(combination.profitLoss),
                            currency,
                          )}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
                          after full stake
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${badge}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        ) : (
          <div className="grid min-h-48 place-items-center p-8 text-center">
            <div>
              <SearchX
                size={30}
                className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
              />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                No combinations in this view
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Check your match inputs or change the result filter.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
