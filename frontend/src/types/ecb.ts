export interface ECBRawResponse {
    header: {
        id: string;
        test: boolean;
        prepared: string;
        sender: { id: string };
    };
    dataSets: ECBDataSet[];
    structure: ECBStructure;
}

export interface ECBDataSet {
    action: string;
    validFrom: string;
    series: Record<string, ECBSeries>;
}

export interface ECBSeries {
    attributes: number[];
    observations: Record<string, [number, ...number[]]>;
}

export interface ECBStructure {
    name: string;
    dimensions: {
        series: ECBDimension[];
        observation: ECBDimension[];
    };
    attributes: {
        series: ECBAttribute[];
        observation: ECBAttribute[];
    };
}

export interface ECBDimension {
    id: string;
    name: string;
    keyPosition?: number;
    values: ECBDimensionValue[];
}

export interface ECBDimensionValue {
    id: string;
    name: string;
    start?: string;
    end?: string;
}

export interface ECBAttribute {
    id: string;
    name: string;
    values: { id: string; name: string }[];
}

export interface RateDataPoint {
    date: string;
    value: number;
}

export interface ECBRatesData {
    mro: RateDataPoint[];
    deposit: RateDataPoint[];
    latestMRO: number | null;
    latestDeposit: number | null;
    mroOneYearAgo: number | null;
    depositOneYearAgo: number | null;
}

export interface InflationDataPoint {
    date: string;
    value: number;
    country: string;
}

export interface InflationSeriesData {
    country: string;
    countryName: string;
    data: RateDataPoint[];
    latest: number | null;
    oneYearAgo: number | null;
}

export interface CombinedTimeSeriesPoint {
    date: string;
    mroRate?: number;
    depositRate?: number;
    inflation?: number;
    [key: string]: string | number | undefined;
}