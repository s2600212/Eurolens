import { useECBRates } from "./useECBRates";
import { useCountryInflation } from "./useInflation";
import { useMultipleGDP } from "./useGDP";

export function useCountryComparison(countryA: string, countryB: string) {
    const countries = [countryA, countryB].filter(Boolean);

    const ratesQuery = useECBRates();
    const inflationQuery = useCountryInflation(countries);
    const gdpQuery = useMultipleGDP(countries);

    const isLoading =
        ratesQuery.isLoading || inflationQuery.isLoading || gdpQuery.isLoading;
    const isError =
        ratesQuery.isError || inflationQuery.isError || gdpQuery.isError;
    const error = ratesQuery.error || inflationQuery.error || gdpQuery.error;

    return {
        rates: ratesQuery.data,
        inflation: inflationQuery.data,
        gdp: gdpQuery.data,
        isLoading,
        isError,
        error,
        refetch: () => {
            ratesQuery.refetch();
            inflationQuery.refetch();
            gdpQuery.refetch();
        },
    };
}