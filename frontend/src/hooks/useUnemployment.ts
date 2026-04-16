import { useQuery } from "@tanstack/react-query";
import {
    fetchEurozoneUnemployment,
    fetchMultipleCountryUnemployment,
} from "@/lib/api";
import { STALE_TIME, GC_TIME, getCountryName } from "@/lib/constants";
import type { RateDataPoint, InflationSeriesData } from "@/types/ecb";

function findOneYearAgo(data: RateDataPoint[]): number | null {
    if (data.length === 0) return null;

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    let closest: RateDataPoint | null = null;
    let closestDiff = Infinity;

    for (const point of data) {
        const pointDate = new Date(point.date);
        const diff = Math.abs(pointDate.getTime() - oneYearAgo.getTime());
        if (diff < closestDiff) {
            closestDiff = diff;
            closest = point;
        }
    }

    return closest?.value ?? null;
}

export function useEurozoneUnemployment() {
    return useQuery({
        queryKey: ["eurostat", "unemployment", "eurozone"],
        queryFn: async () => {
            const raw = await fetchEurozoneUnemployment();

            const data: RateDataPoint[] = (raw.data || []).sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            const latest = data.length > 0 ? data[data.length - 1].value : null;
            const oneYearAgo = findOneYearAgo(data);

            return { data, latest, oneYearAgo };
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
    });
}

export function useCountryUnemployment(countryCodes: string[]) {
    return useQuery<InflationSeriesData[]>({
        queryKey: ["eurostat", "unemployment", "countries", countryCodes.sort().join(",")],
        queryFn: async () => {
            if (countryCodes.length === 0) return [];

            const raw = await fetchMultipleCountryUnemployment(countryCodes);

            return (raw.countries || []).map((c) => {
                const data: RateDataPoint[] = (c.data || []).sort(
                    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                const latest = data.length > 0 ? data[data.length - 1].value : null;
                const oneYearAgo = findOneYearAgo(data);

                return {
                    country: c.country,
                    countryName: getCountryName(c.country),
                    data,
                    latest,
                    oneYearAgo,
                };
            });
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: countryCodes.length > 0,
    });
}

export function useAllCountryLatestUnemployment(countryCodes: string[]) {
    return useQuery({
        queryKey: ["eurostat", "unemployment", "latest-all", countryCodes.sort().join(",")],
        queryFn: async () => {
            const raw = await fetchMultipleCountryUnemployment(countryCodes);

            return (raw.countries || [])
                .map((c) => {
                    const data = (c.data || []).sort(
                        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                    );
                    const latest = data.length > 0 ? data[data.length - 1].value : null;

                    return {
                        country: c.country,
                        countryName: getCountryName(c.country),
                        value: latest,
                    };
                })
                .filter((c) => c.value !== null)
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        enabled: countryCodes.length > 0,
    });
}