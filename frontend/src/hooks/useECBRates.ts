import { useQuery } from "@tanstack/react-query";
import { fetchECBRates } from "@/lib/api";
import { STALE_TIME, GC_TIME } from "@/lib/constants";
import type { ECBRatesData, RateDataPoint } from "@/types/ecb";

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

export function useECBRates() {
    return useQuery<ECBRatesData>({
        queryKey: ["ecb", "rates"],
        queryFn: async () => {
            const raw = await fetchECBRates();

            const mro: RateDataPoint[] = (raw.mro || []).sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            const deposit: RateDataPoint[] = (raw.deposit || []).sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            const latestMRO = mro.length > 0 ? mro[mro.length - 1].value : null;
            const latestDeposit = deposit.length > 0 ? deposit[deposit.length - 1].value : null;

            return {
                mro,
                deposit,
                latestMRO,
                latestDeposit,
                mroOneYearAgo: findOneYearAgo(mro),
                depositOneYearAgo: findOneYearAgo(deposit),
            };
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
    });
}