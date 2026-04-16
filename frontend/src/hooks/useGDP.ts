import { useQuery } from "@tanstack/react-query";
import { fetchMultipleCountryGDP } from "@/lib/api";
import { STALE_TIME, GC_TIME, getCountryName } from "@/lib/constants";
import type { GDPCountryData, GDPDataPoint } from "@/types/worldbank";

export function useMultipleGDP(countryCodes: string[]) {
    return useQuery<GDPCountryData[]>({
        queryKey: ["worldbank", "gdp", countryCodes.sort().join(",")],
        queryFn: async () => {
            if (countryCodes.length === 0) return [];

            const raw = await fetchMultipleCountryGDP(countryCodes);

            return (raw.countries || []).map((c) => {
                const data: GDPDataPoint[] = (c.data || [])
                    .filter((d) => d.value !== null && d.value !== undefined)
                    .map((d) => ({
                        year: d.year,
                        value: d.value,
                        country: c.country,
                        countryName: c.countryName || getCountryName(c.country),
                    }))
                    .sort((a, b) => a.year - b.year);

                const latest = data.length > 0 ? data[data.length - 1].value : null;

                const recentFive = data.slice(-5);
                const fiveYearAvg =
                    recentFive.length > 0
                        ? recentFive.reduce((sum, d) => sum + d.value, 0) / recentFive.length
                        : null;

                const tenYearTrend = data.slice(-10);

                return {
                    country: c.country,
                    countryName: c.countryName || getCountryName(c.country),
                    data,
                    latest,
                    fiveYearAvg,
                    tenYearTrend,
                };
            });
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: countryCodes.length > 0,
    });
}

export function useLatestGDP(countryCodes: string[]) {
    return useQuery({
        queryKey: ["worldbank", "gdp", "latest", countryCodes.sort().join(",")],
        queryFn: async () => {
            const raw = await fetchMultipleCountryGDP(countryCodes);

            return (raw.countries || [])
                .map((c) => {
                    const sorted = (c.data || [])
                        .filter((d) => d.value !== null)
                        .sort((a, b) => b.year - a.year);
                    const latest = sorted[0];

                    return {
                        country: c.country,
                        countryName: c.countryName || getCountryName(c.country),
                        value: latest?.value ?? null,
                        year: latest?.year ?? null,
                    };
                })
                .filter((c) => c.value !== null);
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: countryCodes.length > 0,
    });
}