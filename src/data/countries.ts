import type { Team } from "../types";

const countryData: Array<[string, string, string]> = [
  ["Argentina", "ARG", "AR"],
  ["Brazil", "BRA", "BR"],
  ["France", "FRA", "FR"],
  ["Germany", "GER", "DE"],
  ["Spain", "ESP", "ES"],
  ["Portugal", "POR", "PT"],
  ["England", "ENG", "GB"],
  ["Netherlands", "NED", "NL"],
  ["Italy", "ITA", "IT"],
  ["Belgium", "BEL", "BE"],
  ["Croatia", "CRO", "HR"],
  ["Switzerland", "SUI", "CH"],
  ["Sweden", "SWE", "SE"],
  ["Norway", "NOR", "NO"],
  ["Denmark", "DEN", "DK"],
  ["Poland", "POL", "PL"],
  ["Serbia", "SRB", "RS"],
  ["Austria", "AUT", "AT"],
  ["Ukraine", "UKR", "UA"],
  ["Türkiye", "TUR", "TR"],
  ["Morocco", "MAR", "MA"],
  ["Senegal", "SEN", "SN"],
  ["Ghana", "GHA", "GH"],
  ["Nigeria", "NGA", "NG"],
  ["Cameroon", "CMR", "CM"],
  ["Ivory Coast", "CIV", "CI"],
  ["Egypt", "EGY", "EG"],
  ["Algeria", "ALG", "DZ"],
  ["Tunisia", "TUN", "TN"],
  ["South Africa", "RSA", "ZA"],
  ["Mexico", "MEX", "MX"],
  ["United States", "USA", "US"],
  ["Canada", "CAN", "CA"],
  ["Ecuador", "ECU", "EC"],
  ["Uruguay", "URU", "UY"],
  ["Colombia", "COL", "CO"],
  ["Chile", "CHI", "CL"],
  ["Paraguay", "PAR", "PY"],
  ["Peru", "PER", "PE"],
  ["Japan", "JPN", "JP"],
  ["South Korea", "KOR", "KR"],
  ["Australia", "AUS", "AU"],
  ["Saudi Arabia", "KSA", "SA"],
  ["Qatar", "QAT", "QA"],
  ["Iran", "IRN", "IR"],
  ["Iraq", "IRQ", "IQ"],
  ["New Zealand", "NZL", "NZ"],
];

const flagFromCode = (code: string) =>
  [...code]
    .map((character) =>
      String.fromCodePoint(127397 + character.charCodeAt(0)),
    )
    .join("");

export const countries: Team[] = countryData.map(([name, code, iso]) => ({
  name,
  code,
  flag: flagFromCode(iso),
}));

export const findCountry = (code: string) =>
  countries.find((country) => country.code === code) ?? countries[0];
