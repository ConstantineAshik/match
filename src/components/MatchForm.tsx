import { Plus } from "lucide-react";
import type { Match } from "../types";
import { MatchCard } from "./MatchCard";

type MatchFormProps = {
  matches: Match[];
  onMatchesChange: (matches: Match[]) => void;
  onAddMatch: () => void;
};

export function MatchForm({
  matches,
  onMatchesChange,
  onAddMatch,
}: MatchFormProps) {
  const updateMatch = (index: number, updatedMatch: Match) => {
    onMatchesChange(
      matches.map((match, matchIndex) =>
        matchIndex === index ? updatedMatch : match,
      ),
    );
  };

  const removeMatch = (index: number) => {
    onMatchesChange(matches.filter((_, matchIndex) => matchIndex !== index));
  };

  return (
    <section aria-labelledby="matches-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Build your ticket</p>
          <h2 id="matches-heading" className="section-title">
            Match selections
          </h2>
        </div>
        <button type="button" className="button-secondary" onClick={onAddMatch}>
          <Plus size={17} />
          Add match
        </button>
      </div>
      <div className="space-y-4">
        {matches.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center dark:border-slate-700 dark:bg-ink-800/60">
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
              No matches selected
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
              Import current match data above or add matches manually. At least
              two matches are required to create combinations.
            </p>
          </div>
        )}
        {matches.map((match, index) => (
          <MatchCard
            key={match.id}
            match={match}
            index={index}
            canRemove
            onChange={(updatedMatch) => updateMatch(index, updatedMatch)}
            onRemove={() => removeMatch(index)}
          />
        ))}
      </div>
    </section>
  );
}
