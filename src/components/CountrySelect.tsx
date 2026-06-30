import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { countries } from "../data/countries";
import type { Team } from "../types";

type CountrySelectProps = {
  value: Team;
  onChange: (team: Team) => void;
  label: string;
  excludeCode?: string;
};

export function CountrySelect({
  value,
  onChange,
  label,
  excludeCode,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return countries.filter(
      (country) =>
        country.code !== excludeCode &&
        (!normalizedQuery ||
          country.name.toLowerCase().includes(normalizedQuery) ||
          country.code.toLowerCase().includes(normalizedQuery)),
    );
  }, [excludeCode, query]);

  return (
    <div className="relative" ref={containerRef}>
      <label className="field-label">{label}</label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((current) => !current);
          setQuery("");
        }}
        className="input-field flex w-full items-center justify-between text-left"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="text-xl" aria-hidden="true">
            {value.flag}
          </span>
          <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
            {value.name}
          </span>
          <span className="text-xs font-bold text-slate-400">{value.code}</span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-2 w-full min-w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-ink-800">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 dark:bg-ink-900">
              <Search size={15} className="text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search country or code"
                className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto p-1.5"
            aria-label={label}
          >
            {filteredCountries.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={country.code === value.code}
                  onClick={() => {
                    onChange(country);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700/70"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1 font-medium">{country.name}</span>
                  <span className="text-xs font-bold text-slate-400">
                    {country.code}
                  </span>
                  {country.code === value.code && (
                    <Check size={15} className="text-lime-500" />
                  )}
                </button>
              </li>
            ))}
            {filteredCountries.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-slate-400">
                No countries found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
