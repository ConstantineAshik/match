import {
  AlertTriangle,
  CheckCircle2,
  Layers3,
  ShieldAlert,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { CurrencyCode } from "../types";
import type { DutchingResult } from "../utils/dutching";
import { formatCurrency } from "../utils/formatCurrency";

type DutchingCalculatorProps = {
  result: DutchingResult;
  currency: CurrencyCode;
  isFullyCovered: boolean;
};

export function DutchingCalculator({
  result,
  currency,
  isFullyCovered,
}: DutchingCalculatorProps) {
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const pageCount = Math.max(
    Math.ceil(result.allocations.length / pageSize),
    1,
  );
  const pageStart = (page - 1) * pageSize;
  const visibleAllocations = result.allocations.slice(
    pageStart,
    pageStart + pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [result.allocations]);

  const isReady = result.status === "ready";
  const isNoLossValid =
    isReady && isFullyCovered && result.noLossMathematically;
  const status = !isReady
    ? {
        title: "Allocation unavailable",
        description: getErrorMessage(result, currency),
        icon: AlertTriangle,
        tone:
          "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100",
      }
    : !isFullyCovered
      ? {
          title: "No-loss result is not valid",
          description:
            "At least one match has an uncovered result. The allocation below only balances the combinations currently included.",
          icon: ShieldAlert,
          tone:
            "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-100",
        }
      : isNoLossValid
        ? {
            title: "No-loss is possible",
            description:
              "Every covered winning combination returns at least the total allocated stake after currency rounding.",
            icon: CheckCircle2,
            tone:
              "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-100",
          }
        : {
            title: "No-loss is not possible",
            description:
              "The lowest winning return is below the total allocated stake at these odds.",
            icon: ShieldAlert,
            tone:
              "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-100",
          };
  const StatusIcon = status.icon;

  return (
    <section aria-labelledby="dutching-heading">
      <div className="mb-4">
        <p className="section-kicker">Automatic stake split</p>
        <h2 id="dutching-heading" className="section-title">
          Dutching results
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
          Stakes are optimized for the highest possible minimum return, while
          respecting your minimum bet and two-decimal currency rounding.
        </p>
      </div>

      <div className={`flex gap-3 rounded-2xl border p-4 ${status.tone}`}>
        <StatusIcon className="mt-0.5 shrink-0" size={21} />
        <div>
          <p className="text-sm font-extrabold">{status.title}</p>
          <p className="mt-1 text-xs leading-5 opacity-80">
            {status.description}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-sm font-extrabold">Important conditions</p>
            <p className="mt-1 text-xs leading-5">
              This calculation only works if all possible outcomes are covered.
              <br />
              If any missing outcome exists, the no-loss result is not valid.
              <br />
              Odds may change before bet placement.
            </p>
            <p className="mt-2 border-t border-amber-200 pt-2 text-[11px] leading-5 opacity-80 dark:border-amber-800">
              Bookmaker limits, payout caps, taxes, fees, rounding rules,
              cancelled matches, and void selections are not included and can
              change the real result.
            </p>
          </div>
        </div>
      </div>

      {isReady && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryItem
              label="Combinations"
              value={result.allocations.length.toLocaleString()}
              meta={`${(result.impliedProbability * 100).toFixed(2)}% implied total`}
              icon={Layers3}
              accent="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
            />
            <SummaryItem
              label="Total allocated"
              value={formatCurrency(result.totalStake, currency)}
              meta={`${formatCurrency(result.unallocated, currency)} unallocated`}
              icon={WalletCards}
              accent="bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300"
            />
            <SummaryItem
              label="Guaranteed return"
              value={formatCurrency(result.guaranteedReturn, currency)}
              meta={`target ${formatCurrency(result.targetReturn, currency)}`}
              icon={Target}
              accent="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
            />
            <SummaryItem
              label="Worst-case net"
              value={formatCurrency(result.minimumProfit, currency, true)}
              meta={`best ${formatCurrency(result.maximumProfit, currency, true)}`}
              icon={TrendingUp}
              accent={
                result.minimumProfit >= 0
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
              }
              valueTone={
                result.minimumProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-500"
              }
            />
          </div>

          <div className="card mt-6 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-400">
                Showing {pageStart + 1}–
                {Math.min(
                  pageStart + pageSize,
                  result.allocations.length,
                )}{" "}
                of {result.allocations.length.toLocaleString()}
              </p>
              {pageCount > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="button-secondary min-h-8 px-3 py-1"
                    disabled={page === 1}
                    onClick={() =>
                      setPage((current) => Math.max(current - 1, 1))
                    }
                  >
                    Previous
                  </button>
                  <span className="text-[10px] font-black text-slate-400">
                    {page}/{pageCount}
                  </span>
                  <button
                    type="button"
                    className="button-secondary min-h-8 px-3 py-1"
                    disabled={page === pageCount}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(current + 1, pageCount),
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {visibleAllocations.map((combination, index) => (
                <article key={combination.id} className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Combination{" "}
                    {String(pageStart + index + 1).padStart(2, "0")}
                  </p>
                  <OutcomeChips combination={combination} />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Metric label="Combined odds">
                      {combination.combinedOdds.toFixed(3)}
                    </Metric>
                    <Metric label="Bet this amount" alignRight>
                      {formatCurrency(combination.stake, currency)}
                    </Metric>
                    <Metric label="Winning return">
                      {formatCurrency(combination.returnAmount, currency)}
                    </Metric>
                    <Metric label="Net result" alignRight>
                      <span
                        className={
                          combination.profitLoss >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500"
                        }
                      >
                        {formatCurrency(
                          combination.profitLoss,
                          currency,
                          true,
                        )}
                      </span>
                    </Metric>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:border-slate-700 dark:bg-ink-900/70">
                    <th className="px-5 py-3.5">#</th>
                    <th className="px-5 py-3.5">Combination</th>
                    <th className="px-5 py-3.5 text-right">Combined odds</th>
                    <th className="px-5 py-3.5 text-right">Bet amount</th>
                    <th className="px-5 py-3.5 text-right">Winning return</th>
                    <th className="px-5 py-3.5 text-right">Net profit/loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleAllocations.map((combination, index) => (
                    <tr
                      key={combination.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4 text-xs font-bold text-slate-400">
                        {String(pageStart + index + 1).padStart(2, "0")}
                      </td>
                      <td className="px-5 py-4">
                        <OutcomeChips combination={combination} />
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-bold text-slate-700 dark:text-slate-200">
                        {combination.combinedOdds.toFixed(3)}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-black text-amber-600 dark:text-amber-400">
                        {formatCurrency(combination.stake, currency)}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-extrabold text-slate-950 dark:text-white">
                        {formatCurrency(
                          combination.returnAmount,
                          currency,
                        )}
                      </td>
                      <td
                        className={`px-5 py-4 text-right text-sm font-black ${
                          combination.profitLoss >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500"
                        }`}
                      >
                        {formatCurrency(
                          combination.profitLoss,
                          currency,
                          true,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function SummaryItem({
  label,
  value,
  meta,
  icon: Icon,
  accent,
  valueTone = "text-slate-950 dark:text-white",
}: {
  label: string;
  value: string;
  meta: string;
  icon: typeof Layers3;
  accent: string;
  valueTone?: string;
}) {
  return (
    <article className="card min-w-0 p-4">
      <div className={`mb-3 grid size-8 place-items-center rounded-xl ${accent}`}>
        <Icon size={16} />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-lg font-black tracking-tight sm:text-xl ${valueTone}`}
        title={value}
      >
        {value}
      </p>
      <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
        {meta}
      </p>
    </article>
  );
}

function OutcomeChips({
  combination,
}: {
  combination: DutchingResult["allocations"][number];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 md:mt-0">
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
  );
}

function Metric({
  label,
  alignRight = false,
  children,
}: {
  label: string;
  alignRight?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl bg-slate-50 p-3 dark:bg-ink-900/60 ${
        alignRight ? "text-right" : ""
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
        {children}
      </p>
    </div>
  );
}

function getErrorMessage(
  result: DutchingResult,
  currency: CurrencyCode,
): string {
  if (result.status === "invalid-budget") {
    return "Total betting money must be greater than 0.";
  }
  if (result.status === "invalid-minimum") {
    return "Minimum bet cannot be negative.";
  }
  if (result.status === "insufficient-budget") {
    return `The budget cannot fund every minimum bet. At least ${formatCurrency(
      result.minimumRequired,
      currency,
    )} is required.`;
  }
  if (result.status === "invalid-odds") {
    return "Every combined odd must be a finite decimal value greater than 1.";
  }
  return "Import or add at least two valid matches to generate combinations.";
}
