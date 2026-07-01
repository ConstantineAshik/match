import {
  Calculator,
  Check,
  Copy,
  Download,
  Moon,
  RotateCcw,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CombinationTable } from "./components/CombinationTable";
import { DutchingCalculator } from "./components/DutchingCalculator";
import { MatchForm } from "./components/MatchForm";
import { OddsImporter } from "./components/OddsImporter";
import { RiskWarning } from "./components/RiskWarning";
import { SummaryCards } from "./components/SummaryCards";
import { findCountry } from "./data/countries";
import type { CurrencyCode, Match } from "./types";
import {
  applyCombinationStakes,
  generateCombinations,
  hasFullOutcomeCoverage,
  validateMatch,
} from "./utils/calculations";
import { calculateDutching } from "./utils/dutching";
import {
  currencySymbol,
  formatCurrency,
} from "./utils/formatCurrency";

const MATCHES_STORAGE_KEY = "matchcombo-matches";
const SETTINGS_STORAGE_KEY = "matchcombo-settings";

type CalculationMode = "custom" | "dutching";

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
    if (!Array.isArray(parsed)) return [];
    return (parsed as Array<Match & { betAmount?: unknown }>).map(
      (savedMatch) => {
        const match = { ...savedMatch };
        delete match.betAmount;
        return match;
      },
    );
  } catch {
    return [];
  }
};

function App() {
  const [matches, setMatches] = useState<Match[]>(loadSavedMatches);
  const [calculationMode, setCalculationMode] =
    useState<CalculationMode>("custom");
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
  const [combinationStakes, setCombinationStakes] = useState<
    Record<string, number>
  >(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}",
      ) as { combinationStakes?: Record<string, number> };
      return saved.combinationStakes ?? {};
    } catch {
      return {};
    }
  });
  const [dutchingBudget, setDutchingBudget] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}",
      ) as { dutchingBudget?: number };
      return saved.dutchingBudget && saved.dutchingBudget > 0
        ? saved.dutchingBudget
        : 300;
    } catch {
      return 300;
    }
  });
  const [minimumBet, setMinimumBet] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}",
      ) as { minimumBet?: number };
      return Number.isFinite(saved.minimumBet) &&
        (saved.minimumBet ?? -1) >= 0
        ? (saved.minimumBet ?? 15)
        : 15;
    } catch {
      return 15;
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
      JSON.stringify({
        stake,
        currency,
        combinationStakes,
        dutchingBudget,
        minimumBet,
      }),
    );
  }, [
    combinationStakes,
    currency,
    dutchingBudget,
    minimumBet,
    stake,
  ]);

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
  const baseCombinations = useMemo(
    () => generateCombinations(matches, 1),
    [matches],
  );
  const combinations = useMemo(
    () =>
      hasValidStake
        ? applyCombinationStakes(
            baseCombinations,
            stake,
            combinationStakes,
          )
        : [],
    [baseCombinations, combinationStakes, hasValidStake, stake],
  );
  const totalStake = combinations.reduce(
    (total, combination) => total + combination.stake,
    0,
  );
  const dutchingResult = useMemo(
    () =>
      calculateDutching(
        baseCombinations,
        dutchingBudget,
        minimumBet,
      ),
    [baseCombinations, dutchingBudget, minimumBet],
  );
  const isFullyCovered = hasFullOutcomeCoverage(matches);
  const activeCombinations =
    calculationMode === "dutching"
      ? dutchingResult.allocations
      : combinations;
  const activeTotalStake =
    calculationMode === "dutching"
      ? dutchingResult.totalStake
      : totalStake;
  const lowestReturn = activeCombinations.length
    ? Math.min(...activeCombinations.map((item) => item.returnAmount))
    : 0;
  const highestReturn = activeCombinations.length
    ? Math.max(...activeCombinations.map((item) => item.returnAmount))
    : 0;

  const showToast = (message: string) => setToast(message);

  const updateCombinationStake = (
    combinationId: string,
    nextStake: number,
  ) => {
    const safeStake =
      Number.isFinite(nextStake) && nextStake >= 0 ? nextStake : 0;
    setCombinationStakes((current) => ({
      ...current,
      [combinationId]: safeStake,
    }));
  };

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
    setCalculationMode("dutching");
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
    setCombinationStakes({});
    setDutchingBudget(300);
    setMinimumBet(15);
    setCalculationMode("custom");
    setCurrency("BDT");
    showToast("Calculator reset.");
  };

  const buildCopyText = () => {
    const lines = [
      calculationMode === "dutching"
        ? "MatchCombo Dutching Calculator"
        : "MatchCombo Calculator",
      `Total combination stake: ${formatCurrency(
        activeTotalStake,
        currency,
      )}`,
      `Combinations: ${activeCombinations.length}`,
      "",
    ];
    if (calculationMode === "dutching") {
      lines.push(
        `No-loss status: ${
          isFullyCovered && dutchingResult.noLossMathematically
            ? "Possible"
            : isFullyCovered
              ? "Not possible"
              : "Invalid — outcomes are missing"
        }`,
        "This calculation only works if all possible outcomes are covered.",
        "Odds may change before bet placement.",
        "",
      );
    }
    activeCombinations.forEach((combination, index) => {
      const resultLabel =
        combination.profitLoss >= 0 ? "Profit" : "Loss";
      const otherCombinationsLoss =
        activeTotalStake - combination.stake;
      lines.push(
        `${index + 1}. ${combination.outcomes
          .map((outcome) => outcome.label)
          .join(" + ")}`,
        `Combined odds: ${combination.combinedOdds.toFixed(3)}`,
        `Betting money: ${formatCurrency(combination.stake, currency)}`,
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
    if (!activeCombinations.length) return;
    try {
      await navigator.clipboard.writeText(buildCopyText());
      showToast("Results copied to clipboard.");
    } catch {
      showToast("Clipboard access was unavailable.");
    }
  };

  const downloadPdf = async () => {
    if (!activeCombinations.length) return;
    showToast("Creating PDF...");

    try {
      const [{ jsPDF }, { autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const document = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      const isDutching = calculationMode === "dutching";
      const title = isDutching
        ? "MatchCombo Dutching Calculator"
        : "MatchCombo Custom Stakes";
      const money = (value: number, showSign = false) => {
        const sign =
          value < 0 ? "-" : showSign && value > 0 ? "+" : "";
        return `${sign}${currency} ${Math.abs(value).toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}`;
      };

      document.setFont("helvetica", "bold");
      document.setFontSize(18);
      document.text(title, 40, 42);
      document.setFont("helvetica", "normal");
      document.setFontSize(9);
      document.setTextColor(90);
      document.text(
        `Generated ${new Date().toLocaleString("en-US")} | ${activeCombinations.length.toLocaleString()} combinations`,
        40,
        60,
      );
      document.text(
        `Total allocated: ${money(activeTotalStake)}`,
        40,
        75,
      );

      let tableStartY = 94;
      if (isDutching) {
        const noLossStatus =
          isFullyCovered && dutchingResult.noLossMathematically
            ? "Possible"
            : isFullyCovered
              ? "Not possible"
              : "Invalid - outcomes are missing";
        const summary = [
          `Budget: ${money(dutchingBudget)}`,
          `Minimum bet: ${money(minimumBet)}`,
          `Target return: ${money(dutchingResult.targetReturn)}`,
          `Guaranteed return: ${money(
            dutchingResult.guaranteedReturn,
          )}`,
          `No-loss status: ${noLossStatus}`,
        ].join("  |  ");
        document.setTextColor(40);
        document.text(summary, 40, 92);
        document.setTextColor(150, 80, 0);
        document.setFont("helvetica", "bold");
        document.text("Important:", 40, 111);
        document.setFont("helvetica", "normal");
        document.text(
          "This calculation only works if all possible outcomes are covered. If any missing outcome exists, the no-loss result is not valid. Odds may change before bet placement.",
          88,
          111,
          { maxWidth: 700 },
        );
        tableStartY = 132;
      }

      document.setTextColor(0);
      autoTable(document, {
        startY: tableStartY,
        head: [
          [
            "#",
            "Combination",
            "Combined odds",
            "Bet amount",
            "Winning return",
            "Other stakes lost",
            "Net profit/loss",
            "Status",
          ],
        ],
        body: activeCombinations.map((combination, index) => [
          index + 1,
          combination.outcomes
            .map((outcome) => outcome.shortLabel)
            .join(" + "),
          combination.combinedOdds.toFixed(3),
          money(combination.stake),
          money(combination.returnAmount),
          money(activeTotalStake - combination.stake),
          money(combination.profitLoss, true),
          combination.profitLoss > 0
            ? "Profit"
            : combination.profitLoss < 0
              ? "Loss"
              : "Break-even",
        ]),
        theme: "striped",
        styles: {
          font: "helvetica",
          fontSize: 7,
          cellPadding: 3,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [11, 18, 32],
          textColor: [190, 242, 100],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 210 },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
          7: { halign: "center" },
        },
        didDrawPage: (data) => {
          const pageCount = document.getNumberOfPages();
          document.setFontSize(7);
          document.setTextColor(130);
          document.text(
            `Created by MD Ashik | ashik3232himu@gmail.com | Page ${pageCount}`,
            data.settings.margin.left,
            document.internal.pageSize.height - 16,
          );
        },
        margin: { top: 30, right: 30, bottom: 28, left: 30 },
      });

      document.save(
        `matchcombo-${
          isDutching ? "dutching" : "custom-stakes"
        }-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      showToast("PDF downloaded.");
    } catch {
      showToast("PDF export was unavailable.");
    }
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

        <div
          className="mb-6 grid gap-2 rounded-2xl border border-slate-200 bg-white/70 p-2 shadow-sm dark:border-slate-800 dark:bg-ink-800/70 sm:grid-cols-2"
          role="tablist"
          aria-label="Calculation mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={calculationMode === "custom"}
            onClick={() => setCalculationMode("custom")}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
              calculationMode === "custom"
                ? "bg-ink-900 text-white shadow-lg dark:bg-lime-400 dark:text-ink-950"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <SlidersHorizontal size={18} className="shrink-0" />
            <span>
              <span className="block text-sm font-black">Custom stakes</span>
              <span
                className={`mt-0.5 block text-[10px] font-semibold ${
                  calculationMode === "custom"
                    ? "text-slate-300 dark:text-ink-800"
                    : "text-slate-400"
                }`}
              >
                Set every combination manually
              </span>
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={calculationMode === "dutching"}
            onClick={() => setCalculationMode("dutching")}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
              calculationMode === "dutching"
                ? "bg-ink-900 text-white shadow-lg dark:bg-lime-400 dark:text-ink-950"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <Scale size={18} className="shrink-0" />
            <span>
              <span className="block text-sm font-black">
                Dutching / auto split
              </span>
              <span
                className={`mt-0.5 block text-[10px] font-semibold ${
                  calculationMode === "dutching"
                    ? "text-slate-300 dark:text-ink-800"
                    : "text-slate-400"
                }`}
              >
                Balance returns from one total budget
              </span>
            </span>
          </button>
        </div>

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
                    {calculationMode === "dutching"
                      ? "Dutching budget"
                      : "Stake & currency"}
                  </h2>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300">
                  <WalletCards size={18} />
                </span>
              </div>

              {calculationMode === "custom" ? (
                <>
                  <div className="mt-5 grid grid-cols-[1fr_106px] gap-3">
                    <div>
                      <label className="field-label" htmlFor="stake">
                        Stake for all combinations
                      </label>
                      <MoneyInput
                        id="stake"
                        value={stake}
                        currency={currency}
                        min={0.01}
                        onChange={(value) => {
                          setStake(value);
                          setCombinationStakes({});
                        }}
                      />
                    </div>
                    <CurrencySelect
                      currency={currency}
                      onChange={setCurrency}
                    />
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-slate-400">
                    This amount updates every combination. Edit any result row
                    below to use a different amount for that combination.
                  </p>
                  {!hasValidStake && (
                    <p className="mt-2 text-xs font-semibold text-red-500">
                      Stake must be greater than 0.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-[1fr_106px] gap-3">
                    <div>
                      <label className="field-label" htmlFor="dutching-budget">
                        Total betting money
                      </label>
                      <MoneyInput
                        id="dutching-budget"
                        value={dutchingBudget}
                        currency={currency}
                        min={0.01}
                        onChange={setDutchingBudget}
                      />
                    </div>
                    <CurrencySelect
                      currency={currency}
                      onChange={setCurrency}
                    />
                    <div className="col-span-2">
                      <label className="field-label" htmlFor="minimum-bet">
                        Minimum bet per combination
                      </label>
                      <MoneyInput
                        id="minimum-bet"
                        value={minimumBet}
                        currency={currency}
                        min={0}
                        onChange={setMinimumBet}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-slate-400">
                    The calculator maximizes the lowest winning return and
                    rounds every suggested bet to two decimals.
                  </p>
                </>
              )}

              <div className="my-5 h-px bg-slate-100 dark:bg-slate-700" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Combinations
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                    {(calculationMode === "dutching"
                      ? baseCombinations.length
                      : combinations.length
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {calculationMode === "dutching"
                      ? "Budget"
                      : "Total betting money"}
                  </p>
                  <p className="mt-1 text-2xl font-black text-lime-600 dark:text-lime-400">
                    {formatCurrency(
                      calculationMode === "dutching"
                        ? dutchingBudget
                        : totalStake,
                      currency,
                    )}
                  </p>
                </div>
              </div>

              {calculationMode === "custom" &&
                (!hasValidMatches || !hasValidStake) && (
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
                disabled={!activeCombinations.length}
                className="button-secondary flex-col px-2 py-3"
              >
                <Copy size={15} />
                Copy
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                disabled={!activeCombinations.length}
                className="button-secondary flex-col px-2 py-3"
              >
                <Download size={15} />
                PDF
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

        <div
          className="mt-10 space-y-10"
          role="tabpanel"
          aria-label={
            calculationMode === "dutching"
              ? "Dutching results"
              : "Custom stake results"
          }
        >
          {calculationMode === "custom" ? (
            <>
              <SummaryCards
                matchCount={matches.length}
                combinations={combinations}
                stake={stake}
                currency={currency}
              />
              <CombinationTable
                combinations={combinations}
                currency={currency}
                onStakeChange={updateCombinationStake}
              />
            </>
          ) : (
            <DutchingCalculator
              result={dutchingResult}
              currency={currency}
              isFullyCovered={isFullyCovered}
            />
          )}
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
          <p className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">
            Created by MD Ashik ·{" "}
            <a
              href="mailto:ashik3232himu@gmail.com"
              className="text-lime-600 transition hover:text-lime-500 hover:underline dark:text-lime-400"
            >
              ashik3232himu@gmail.com
            </a>
          </p>
        </footer>
      </main>

      <div className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-2xl border border-white/10 bg-ink-900/95 px-4 py-3 text-white shadow-2xl backdrop-blur sm:hidden">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {calculationMode === "dutching"
              ? baseCombinations.length
              : activeCombinations.length}{" "}
            combinations
          </p>
          <p className="mt-0.5 text-sm font-black">
            {calculationMode === "dutching" ? "Budget" : "Stake"}{" "}
            {formatCurrency(
              calculationMode === "dutching"
                ? dutchingBudget
                : activeTotalStake,
              currency,
            )}
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

function MoneyInput({
  id,
  value,
  currency,
  min,
  onChange,
}: {
  id: string;
  value: number;
  currency: CurrencyCode;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
        {currencySymbol(currency)}
      </span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step="0.01"
        value={value || ""}
        onChange={(event) => onChange(Number(event.target.value))}
        className="input-field w-full pl-8 font-extrabold"
      />
    </div>
  );
}

function CurrencySelect({
  currency,
  onChange,
}: {
  currency: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
}) {
  return (
    <div>
      <label className="field-label" htmlFor="currency">
        Currency
      </label>
      <select
        id="currency"
        className="input-field w-full cursor-pointer font-extrabold"
        value={currency}
        onChange={(event) =>
          onChange(event.target.value as CurrencyCode)
        }
      >
        <option value="BDT">BDT</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
      </select>
    </div>
  );
}

export default App;
