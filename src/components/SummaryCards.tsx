import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Goal,
  Layers3,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { CombinationResult, CurrencyCode } from "../types";
import { formatCurrency } from "../utils/formatCurrency";

type SummaryCardsProps = {
  matchCount: number;
  combinations: CombinationResult[];
  stake: number;
  matchBetTotal: number;
  currency: CurrencyCode;
};

export function SummaryCards({
  matchCount,
  combinations,
  stake,
  matchBetTotal,
  currency,
}: SummaryCardsProps) {
  const totalStake = combinations.length * stake;
  const lowest = combinations.length
    ? combinations.reduce((current, item) =>
        item.returnAmount < current.returnAmount ? item : current,
      )
    : undefined;
  const highest = combinations.length
    ? combinations.reduce((current, item) =>
        item.returnAmount > current.returnAmount ? item : current,
      )
    : undefined;

  const items = [
    {
      label: "Matches",
      value: matchCount.toString(),
      meta: `${formatCurrency(matchBetTotal, currency)} in match bets`,
      icon: Goal,
      accent: "text-violet-500 bg-violet-100 dark:bg-violet-500/15",
    },
    {
      label: "Combinations",
      value: combinations.length.toLocaleString(),
      meta: "possible tickets",
      icon: Layers3,
      accent: "text-sky-500 bg-sky-100 dark:bg-sky-500/15",
    },
    {
      label: "Stake / combo",
      value: formatCurrency(stake, currency),
      meta: "per combination",
      icon: Coins,
      accent: "text-amber-500 bg-amber-100 dark:bg-amber-500/15",
    },
    {
      label: "Total stake",
      value: formatCurrency(totalStake, currency),
      meta: `${combinations.length} × ${formatCurrency(stake, currency)}`,
      icon: WalletCards,
      accent: "text-lime-600 bg-lime-100 dark:bg-lime-500/15",
      featured: true,
    },
    {
      label: "Minimum return",
      value: formatCurrency(lowest?.returnAmount ?? 0, currency),
      meta: lowest?.outcomes.map((item) => item.shortLabel).join(" + ") ?? "—",
      icon: ArrowDownLeft,
      accent: "text-rose-500 bg-rose-100 dark:bg-rose-500/15",
    },
    {
      label: "Maximum return",
      value: formatCurrency(highest?.returnAmount ?? 0, currency),
      meta: highest?.outcomes.map((item) => item.shortLabel).join(" + ") ?? "—",
      icon: ArrowUpRight,
      accent: "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/15",
    },
    {
      label: "Minimum P/L",
      value: formatCurrency(lowest?.profitLoss ?? 0, currency, true),
      meta: "against total stake",
      icon: TrendingDown,
      accent: "text-rose-500 bg-rose-100 dark:bg-rose-500/15",
      valueTone:
        (lowest?.profitLoss ?? 0) < 0 ? "text-rose-500" : "text-emerald-500",
    },
    {
      label: "Maximum profit",
      value: formatCurrency(highest?.profitLoss ?? 0, currency, true),
      meta: "best-case result",
      icon: TrendingUp,
      accent: "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/15",
      valueTone:
        (highest?.profitLoss ?? 0) < 0 ? "text-rose-500" : "text-emerald-500",
    },
  ];

  return (
    <section aria-labelledby="summary-heading">
      <div className="mb-4">
        <p className="section-kicker">At a glance</p>
        <h2 id="summary-heading" className="section-title">
          Calculation summary
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.label}
              className={`card min-w-0 p-4 ${
                item.featured
                  ? "border-lime-300 bg-lime-50/70 dark:border-lime-500/40 dark:bg-lime-400/[.07]"
                  : ""
              }`}
            >
              <div
                className={`mb-3 grid size-8 place-items-center rounded-xl ${item.accent}`}
              >
                <Icon size={16} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {item.label}
              </p>
              <p
                className={`mt-1 truncate text-lg font-black tracking-tight sm:text-xl ${
                  item.valueTone ?? "text-slate-950 dark:text-white"
                }`}
                title={item.value}
              >
                {item.value}
              </p>
              <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
                {item.meta}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
