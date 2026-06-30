import { CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { Match, OutcomeType } from "../types";

type RiskWarningProps = {
  matches: Match[];
};

const outcomeNames: Record<OutcomeType, string> = {
  HOME: "Home",
  DRAW: "Draw",
  AWAY: "Away",
};

export function RiskWarning({ matches }: RiskWarningProps) {
  if (matches.length < 2) {
    return (
      <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-200">
        <Info className="mt-0.5 shrink-0" size={20} />
        <div>
          <p className="text-sm font-extrabold">Select at least two matches</p>
          <p className="mt-1 text-xs leading-5 opacity-80">
            Combination results and outcome-risk analysis appear after two or
            more valid matches are selected.
          </p>
        </div>
      </div>
    );
  }

  const missingOutcomes = (["HOME", "DRAW", "AWAY"] as OutcomeType[]).filter(
    (outcome) =>
      matches.some((match) => !match.selectedOutcomes.includes(outcome)),
  );
  const isFullyCovered = matches.length > 0 && missingOutcomes.length === 0;

  if (isFullyCovered) {
    return (
      <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
        <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
        <div>
          <p className="text-sm font-extrabold">All 1X2 outcomes are covered</p>
          <p className="mt-1 text-xs leading-5 opacity-80">
            One combination should match the result mathematically, but its
            return may still be lower than your total stake.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100">
      <ShieldAlert className="mt-0.5 shrink-0" size={20} />
      <div>
        <p className="text-sm font-extrabold">Uncovered outcome risk</p>
        <p className="mt-1 text-xs leading-5 opacity-80">
          {missingOutcomes.map((outcome) => outcomeNames[outcome]).join(", ")}{" "}
          {missingOutcomes.length === 1 ? "is" : "are"} not covered in one or
          more matches. If an uncovered result happens, all accumulators can
          lose and your maximum loss is the full total stake.
        </p>
      </div>
    </div>
  );
}
