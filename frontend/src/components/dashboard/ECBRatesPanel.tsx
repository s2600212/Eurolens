import { useECBRates } from "@/hooks/useECBRates";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { BaseLineChart } from "@/components/charts/BaseLineChart";
import { TimeRangeSelector } from "@/components/ui/TimeRangeSelector";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { filterByTimeRange } from "@/lib/formatters";
import type { TimeRange } from "@/types/chart";

interface ECBRatesPanelProps {
    timeRange: TimeRange;
    onTimeRangeChange: (range: TimeRange) => void;
    aiContext?: string;
    onAskAI?: (context: string) => void;
}

export function ECBRatesPanel({ timeRange, onTimeRangeChange, aiContext, onAskAI }: ECBRatesPanelProps) {
    const { data, isLoading, isError, error, refetch } = useECBRates();

    if (isLoading) return <SkeletonChart />;

    if (isError) {
        return (
            <ErrorCard
                title="Failed to load ECB rates"
                message={error instanceof Error ? error.message : "Unknown error"}
                onRetry={refetch}
            />
        );
    }

    if (!data || (data.mro.length === 0 && data.deposit.length === 0)) {
        return <EmptyState title="No rate data" description="ECB rate data is not available at this time." />;
    }

    const dateMap = new Map<string, { date: string; mroRate?: number; depositRate?: number }>();

    for (const point of data.mro) {
        if (!dateMap.has(point.date)) dateMap.set(point.date, { date: point.date });
        dateMap.get(point.date)!.mroRate = point.value;
    }
    for (const point of data.deposit) {
        if (!dateMap.has(point.date)) dateMap.set(point.date, { date: point.date });
        dateMap.get(point.date)!.depositRate = point.value;
    }

    const combined = Array.from(dateMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const filtered = filterByTimeRange(combined, timeRange);

    return (
        <ChartWrapper
            title="ECB Key Interest Rates"
            subtitle="Main Refinancing Operations (MRO) and Deposit Facility rates"
            ariaLabel="Line chart showing ECB MRO and Deposit Facility interest rates over time"
            aiContext={aiContext}
            onAskAI={onAskAI}
            actions={<TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />}
        >
            <BaseLineChart
                data={filtered as Record<string, unknown>[]}
                lines={[
                    { dataKey: "mroRate", name: "MRO Rate", color: "var(--color-chart-teal)" },
                    { dataKey: "depositRate", name: "Deposit Rate", color: "var(--color-chart-blue)", strokeDasharray: "5 5" },
                ]}
            />
        </ChartWrapper>
    );
}