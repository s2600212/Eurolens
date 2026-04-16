export const API_BASE_URL = "/api";

export interface CountryInfo {
    code: string;
    name: string;
    flag: string;
    iso3?: string;
}

export const EU_COUNTRIES: CountryInfo[] = [
    { code: "DE", name: "Germany", flag: "🇩🇪", iso3: "DEU" },
    { code: "FR", name: "France", flag: "🇫🇷", iso3: "FRA" },
    { code: "IT", name: "Italy", flag: "🇮🇹", iso3: "ITA" },
    { code: "ES", name: "Spain", flag: "🇪🇸", iso3: "ESP" },
    { code: "PL", name: "Poland", flag: "🇵🇱", iso3: "POL" },
    { code: "NL", name: "Netherlands", flag: "🇳🇱", iso3: "NLD" },
    { code: "SE", name: "Sweden", flag: "🇸🇪", iso3: "SWE" },
    { code: "FI", name: "Finland", flag: "🇫🇮", iso3: "FIN" },
    { code: "AT", name: "Austria", flag: "🇦🇹", iso3: "AUT" },
    { code: "BE", name: "Belgium", flag: "🇧🇪", iso3: "BEL" },
];

export const COUNTRY_MAP: Record<string, string> = Object.fromEntries(
    EU_COUNTRIES.map((c) => [c.code, c.name])
);

export const FLAG_MAP: Record<string, string> = Object.fromEntries(
    EU_COUNTRIES.map((c) => [c.code, c.flag])
);

export function getCountryName(code: string): string {
    return COUNTRY_MAP[code] || code;
}

export function getCountryFlag(code: string): string {
    return FLAG_MAP[code] || "";
}

export function getCountryLabel(code: string): string {
    const flag = getCountryFlag(code);
    const name = getCountryName(code);
    return flag ? `${flag} ${name}` : name;
}

export const DEFAULT_INFLATION_COUNTRIES = ["DE", "FR", "IT", "ES", "PL"];

export const TIME_RANGE_OPTIONS = [
    { value: "1Y", label: "1Y" },
    { value: "2Y", label: "2Y" },
    { value: "5Y", label: "5Y" },
    { value: "ALL", label: "All" },
] as const;

export const STALE_TIME = 5 * 60 * 1000;
export const GC_TIME = 30 * 60 * 1000;