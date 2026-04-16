import { API_BASE_URL } from "./constants";

export class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public statusText?: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

async function fetchFromBackend<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new ApiError(
                `Request failed: ${response.statusText}`,
                response.status,
                response.statusText
            );
        }

        const data = await response.json();
        return data as T;
    } catch (error) {
        if (error instanceof ApiError) throw error;

        if (error instanceof TypeError && error.message.includes("fetch")) {
            throw new ApiError("Unable to connect to the server. Please check your connection.");
        }

        throw new ApiError(
            error instanceof Error ? error.message : "An unexpected error occurred"
        );
    }
}

export async function fetchECBRates(): Promise<{
    mro: { date: string; value: number }[];
    deposit: { date: string; value: number }[];
}> {
    return fetchFromBackend("/ecb/rates");
}

export async function fetchEurozoneInflation(): Promise<{
    data: { date: string; value: number }[];
}> {
    return fetchFromBackend("/ecb/inflation/eurozone");
}

export async function fetchCountryInflation(
    countryCode: string
): Promise<{
    country: string;
    data: { date: string; value: number }[];
}> {
    return fetchFromBackend(`/ecb/inflation/country/${countryCode}`);
}

export async function fetchMultipleCountryInflation(
    countryCodes: string[]
): Promise<{
    countries: {
        country: string;
        data: { date: string; value: number }[];
    }[];
}> {
    const params = countryCodes.join(",");
    return fetchFromBackend(`/ecb/inflation/countries?codes=${params}`);
}

export async function fetchCountryGDP(
    countryCode: string
): Promise<{
    country: string;
    countryName: string;
    data: { year: number; value: number }[];
}> {
    return fetchFromBackend(`/worldbank/gdp/${countryCode}`);
}

export async function fetchMultipleCountryGDP(
    countryCodes: string[]
): Promise<{
    countries: {
        country: string;
        countryName: string;
        data: { year: number; value: number }[];
    }[];
}> {
    const params = countryCodes.join(",");
    return fetchFromBackend(`/worldbank/gdp?codes=${params}`);
}

export async function fetchEurozoneUnemployment(): Promise<{
    data: { date: string; value: number }[];
}> {
    return fetchFromBackend("/eurostat/unemployment/eurozone");
}

export async function fetchCountryUnemployment(
    countryCode: string
): Promise<{
    country: string;
    data: { date: string; value: number }[];
}> {
    return fetchFromBackend(`/eurostat/unemployment/country/${countryCode}`);
}

export async function fetchMultipleCountryUnemployment(
    countryCodes: string[]
): Promise<{
    countries: {
        country: string;
        data: { date: string; value: number }[];
    }[];
}> {
    const params = countryCodes.join(",");
    return fetchFromBackend(`/eurostat/unemployment/countries?codes=${params}`);
}