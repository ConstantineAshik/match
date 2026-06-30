import {
  Calculator,
  Check,
  Copy,
  Download,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CombinationTable } from "./components/CombinationTable";
import { MatchForm } from "./components/MatchForm";
import { OddsImporter } from "./components/OddsImporter";
import { RiskWarning } from "./components/RiskWarning";
import { SummaryCards } from "./components/SummaryCards";
import { findCountry } from "./data/countries";
import type { CurrencyCode, Match } from "./types";
import {
  generateCombinations,
  validateMatch,
} from "./utils/calculations";
import {
  currencySymbol,
  formatCurrency,
} from "./utils/formatCurrency";

const MATCHES_STORAGE_KEY = "matchcombo-matches";
const SETTINGS_STORAGE_KEY = "matchcombo-settings";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createDefaultMatch = (): Match => ({
  id: createId(),
  homeTeam: findCountry("ARG"),
  awayTeam: findCountry("BRA"),
  homeOdds: 2.45,
  drawOdds: 3.2,
  awayOdds: 2.75,
  selectedOutcomes: ["HOME", "DRAW", "AWAY"],
});

const loadSavedMatches = (): Match[] => {
  try {
    const saved = localStorage.getItem(MATCHES_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as Match[]) : [];
  } catch {
    return [];
  }
};

const escapeCsv = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`;

function App() {
  const [matches, setMatches] = useState<Match[]>(loadSavedMatches);
  const [stake, setStake] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}",
      ) as { stake?: number };
      return saved.stake && saved.stake > 0 ? saved.stake : 20;
    } catch {
      return 20;
    }
  });
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}",
      ) as { currency?: CurrencyCode };
      return saved.currency ?? "BDT";
    } catch {
      return "BDT";
    }
  });
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("matchcombo-theme");
    return saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ stake, currency }),
    );
  }, [currency, stake]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("matchcombo-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const hasValidStake = Number.isFinite(stake) && stake > 0;
  const hasValidMatches =
    matches.length >= 2 &&
    matches.every((match) => validateMatch(match).length === 0);
  const combinations = useMemo(
    () => generateCombinations(matches, stake),
    [matches, stake],
  );
  const totalStake = combinations.length * stake;
  const lowestReturn = combinations.length
    ? Math.min(...combinations.map((item) => item.returnAmount))
    : 0;
  const highestReturn = combinations.length
    ? Math.max(...combinations.map((item) => item.returnAmount))
    : 0;

  const showToast = (message: string) => setToast(message);

  const addMatch = () => {
    if (matches.length >= 10) {
      showToast("A maximum of 10 matches keeps calculations responsive.");
      return;
    }
    setMatches((current) => [...current, createDefaultMatch()]);
  };

  const importOddsMatches = (importedMatches: Match[]) => {
    const existingIds = new Set(matches.map((match) => match.id));
    const uniqueMatches = importedMatches.filter((match, index, allMatches) => {
      return (
        !existingIds.has(match.id) &&
        allMatches.findIndex((item) => item.id === match.id) === index
      );
    });
    const availableSlots = Math.max(10 - matches.length, 0);
    const matchesToAdd = uniqueMatches.slice(0, availableSlots);

    if (!matchesToAdd.length) {
      showToast(
        availableSlots === 0
          ? "Remove a match first—the calculator supports up to 10."
          : "Those matches are already in the calculator.",
      );
      return;
    }

    setMatches((current) => [...current, ...matchesToAdd]);
    showToast(
      `${matchesToAdd.length} current ${
        matchesToAdd.length === 1 ? "match" : "matches"
      } imported with 1X2 odds.`,
    );
  };

  const resetAll = () => {
    if (
      !window.confirm(
        "Reset all matches, odds, and calculator settings to their defaults?",
      )
    ) {
      return;
    }
    setMatches([]);
    setStake(20);
    setCurrency("BDT");
    showToast("Calculator reset.");
  };

  const buildCopyText = () => {
    const lines = [
      "MatchCombo Calculator",
      `Total Stake: ${formatCurrency(totalStake, currency)}`,
      `Combinations: ${combinations.length}`,
      "",
    ];
    combinations.forEach((combination, index) => {
      const resultLabel =
        combination.profitLoss >= 0 ? "Profit" : "Loss";
      const otherCombinationsLoss =
        combination.stake * Math.max(combinations.length - 1, 0);
      lines.push(
        `${index + 1}. ${combination.outcomes
          .map((outcome) => outcome.label)
          .join(" + ")}`,
        `Combined odds: ${combination.combinedOdds.toFixed(3)}`,
        `Winning return: ${formatCurrency(combination.returnAmount, currency)}`,
        `Other combinations lost: ${formatCurrency(
          otherCombinationsLoss,
          currency,
        )}`,
        `${resultLabel}: ${formatCurrency(
          Math.abs(combination.profitLoss),
          currency,
        )}`,
        "",
      );
    });
    return lines.join("\n");
  };

  const copyResults = async () => {
    if (!combinations.length) return;
    try {
      await navigator.clipboard.writeText(buildCopyText());
      showToast("Results copied to clipboard.");
    } catch {
      showToast("Clipboard access was unavailable.");
    }
  };

  const downloadCsv = () => {
    if (!combinations.length) return;
    const headers = [
      "#",
      "Combination",
      "Combined Odds",
      `Stake (${currency})`,
      `Winning Return (${currency})`,
      `Other Combinations Lost (${currency})`,
      `Profit/Loss (${currency})`,
      "Status",
    ];
    const rows = combinations.map((combination, index) => [
      index + 1,
      combination.outcomes.map((outcome) => outcome.label).join(" + "),
      combination.combinedOdds.toFixed(6),
      combination.stake.toFixed(2),
      combination.returnAmount.toFixed(2),
      (
        combination.stake * Math.max(combinations.length - 1, 0)
      ).toFixed(2),
      combination.profitLoss.toFixed(2),
      combination.profitLoss > 0
        ? "Profit"
        : combination.profitLoss < 0
          ? "Loss"
          : "Break-even",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => escapeCsv(value)).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `matchcombo-results-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("CSV downloaded.");
  };

  return (
    <div className="min-h-screen overflow-x-hidden pb-24 sm:pb-10">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_12%_10%,rgba(163,230,53,.15),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(56,189,248,.11),transparent_25%)]"
      />

      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-ink-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-ink-900 text-lime-300 shadow-glow dark:bg-lime-400 dark:text-ink-950">
              <Calculator size={18} strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-sm font-black leading-none tracking-tight text-slate-950 dark:text-white">
                MatchCombo
              </span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Calculator
              </span>
            </span>
          </a>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 sm:flex">
              <ShieldCheck size={13} />
              Analysis only
            </span>
            <button
              type="button"
              onClick={() => setIsDark((current) => !current)}
              className="icon-button bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label={isDark ? "Use light theme" : "Use dark theme"}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="relative py-9 sm:py-12">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-lime-700 dark:border-lime-500/20 dark:bg-lime-500/10 dark:text-lime-300">
              <Sparkles size={13} />
              Clear math. Every combination.
            </div>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-6xl">
              See the whole ticket,{" "}
              <span className="text-lime-600 dark:text-lime-400">
                before the result.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
              Enter your own 1X2 odds and instantly map every accumulator,
              return range, and uncovered-outcome risk. No predictions, no
              betting connection—just calculation.
            </p>
          </div>
        </section>

        <OddsImporter
          existingMatchIds={matches.map((match) => match.id)}
          onImport={importOddsMatches}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(310px,.65fr)]">
          <MatchForm
            matches={matches}
            onMatchesChange={setMatches}
            onAddMatch={addMatch}
          />

          <aside className="space-y-4 lg:sticky lg:top-5">
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-kicker">Calculation setup</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                    Stake & currency
                  </h2>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300">
                  <WalletCards size={18} />
                </span>
              </div>

              <div className="mt-5 grid grid-cols-[1fr_106px] gap-3">
                <div>
                  <label className="field-label" htmlFor="stake">
                    Stake per combination
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                      {currencySymbol(currency)}
                    </span>
                    <input
                      id="stake"
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      step="0.01"
                      value={stake || ""}
                      onChange={(event) => setStake(Number(event.target.value))}
                      className="input-field w-full pl-8 font-extrabold"
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="currency">
                    Currency
                  </label>
                  <select
                    id="currency"
                    className="input-field w-full cursor-pointer font-extrabold"
                    value={currency}
                    onChange={(event) =>
                      setCurrency(event.target.value as CurrencyCode)
                    }
                  >
                    <option value="BDT">BDT</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              {!hasValidStake && (
                <p className="mt-2 text-xs font-semibold text-red-500">
                  Stake must be greater than 0.
                </p>
              )}

              <div className="my-5 h-px bg-slate-100 dark:bg-slate-700" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Combinations
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                    {combinations.length.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total stake
                  </p>
                  <p className="mt-1 text-2xl font-black text-lime-600 dark:text-lime-400">
                    {formatCurrency(totalStake, currency)}
                  </p>
                </div>
              </div>

              {(!hasValidMatches || !hasValidStake) && (
                <div className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold leading-5 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                  {matches.length < 2
                    ? "Import or add at least two matches to generate combinations."
                    : "Fix the highlighted input errors to generate combinations."}
                </div>
              )}
            </div>

            <RiskWarning matches={matches} />

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={copyResults}
                disabled={!combinations.length}
                className="button-secondary flex-col px-2 py-3"
              >
                <Copy size={15} />
                Copy
              </button>
              <button
                type="button"
                onClick={downloadCsv}
                disabled={!combinations.length}
                className="button-secondary flex-col px-2 py-3"
              >
                <Download size={15} />
                CSV
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="button-secondary flex-col px-2 py-3 hover:border-red-200 hover:text-red-500 dark:hover:border-red-900"
              >
                <RotateCcw size={15} />
                Reset
              </button>
            </div>
          </aside>
        </div>

        <div className="mt-10 space-y-10">
          <SummaryCards
            matchCount={matches.length}
            combinations={combinations}
            stake={stake}
            currency={currency}
          />
          <CombinationTable
            combinations={combinations}
            currency={currency}
          />
        </div>

        <footer className="mt-12 border-t border-slate-200 py-8 text-center dark:border-slate-800">
          <div className="mx-auto flex max-w-2xl items-start justify-center gap-2 text-xs leading-5 text-slate-400">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            <p>
              MatchCombo is a calculation and analysis tool only. It does not
              place bets, connect to gambling services, or provide predictions
              or gambling advice.
            </p>
          </div>
        </footer>
      </main>

      <div className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-2xl border border-white/10 bg-ink-900/95 px-4 py-3 text-white shadow-2xl backdrop-blur sm:hidden">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {combinations.length} combinations
          </p>
          <p className="mt-0.5 text-sm font-black">
            Stake {formatCurrency(totalStake, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Return range
          </p>
          <p className="mt-0.5 text-xs font-extrabold text-lime-300">
            {formatCurrency(lowestReturn, currency)} –{" "}
            {formatCurrency(highestReturn, currency)}
          </p>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-xl bg-ink-900 px-4 py-3 text-xs font-bold text-white shadow-2xl dark:bg-white dark:text-ink-950"
        >
          <Check size={15} className="text-lime-400 dark:text-lime-600" />
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
