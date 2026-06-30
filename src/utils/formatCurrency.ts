import type { CurrencyCode } from "../types";

const currencySymbols: Record<CurrencyCode, string> = {
  BDT: "৳",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export const formatCurrency = (
  value: number,
  currency: CurrencyCode,
  showSign = false,
) => {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : showSign && value > 0 ? "+" : "";
  return `${sign}${currencySymbols[currency]}${absolute.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const currencySymbol = (currency: CurrencyCode) =>
  currencySymbols[currency];
