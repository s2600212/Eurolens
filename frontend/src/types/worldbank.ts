export interface WorldBankResponse {
    page: number;
    pages: number;
    per_page: number;
    total: number;
    sourceid: string;
    lastupdated: string;
}

export interface WorldBankIndicator {
    id: string;
    value: string;
}

export interface WorldBankCountry {
    id: string;
    value: string;
}

export interface WorldBankDataPoint {
    indicator: WorldBankIndicator;
    country: WorldBankCountry;
    countryiso3code: string;
    date: string;
    value: number | null;
    unit: string;
    obs_status: string;
    decimal: number;
}

export interface GDPDataPoint {
    year: number;
    value: number;
    country: string;
    countryName: string;
}

export interface GDPCountryData {
    country: string;
    countryName: string;
    data: GDPDataPoint[];
    latest: number | null;
    fiveYearAvg: number | null;
    tenYearTrend: GDPDataPoint[];
}