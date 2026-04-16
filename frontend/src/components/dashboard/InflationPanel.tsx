import { useCountryInflation } from "@/hooks/useInflation";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { BaseLineChart } from "@/components/charts/BaseLineChart";
import { TimeRangeSelector } from "@/components/ui/TimeRangeSelector";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { filterByTimeRange } from "@/lib/formatters";
import { getCountryName, getCountryLabel } from "@/lib/constants";
import { getChartColor } from "@/types/chart";
import type { TimeRange } from "@/types/chart";

interface InflationPanelProps {
    countryCodes: string[];
    timeRange: TimeRange;
    onTimeRangeChange: (range: TimeRange) => void;
    aiContext?: string;
    onAskAI?: (context: string) => void;
}

export function InflationPanel({
    countryCodes, timeRange, onTimeRangeChange, aiContext, onAskAI,
}: InflationPanelProps) {
    const { data, isLoading, isError, error, refetch } = useCountryInflation(countryCodes);

    if (isLoading) return <SkeletonChart />;

    if (isError) {
        return (
            <ErrorCard
                title="Failed to load inflation data"
                message={error instanceof Error ? error.message : "Unknown error"}
                onRetry={refetch}
            />
        );
    }

    if (!data || data.length === 0) {
        return <EmptyState title="No inflation data" description="Select countries to view their HICP inflation data." />;
    }

    const dateMap = new Map<string, Record<string, unknown>>();

    for (const series of data) {
        for (const point of series.data) {
            if (!dateMap.has(point.date)) dateMap.set(point.date, { date: point.date });
            dateMap.get(point.date)![series.country] = point.value;
        }
    }

    const combined = Array.from(dateMap.values()).sort(
        (a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
    );

    const filtered = filterByTimeRange(combined as { date: string }[], timeRange);

    const lines = data.map((series, index) => ({
        dataKey: series.country,
        name: getCountryLabel(series.country),
        color: getChartColor(index),
    }));

    return (
        <ChartWrapper
            title="HICP Inflation by Country"
            subtitle="Harmonised Index of Consumer Prices, annual rate of change"
            ariaLabel={`Line chart showing HICP inflation for ${countryCodes.map(getCountryName).join(", ")}`}
            aiContext={aiContext}
            onAskAI={onAskAI}
            actions={<TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} options={["1Y", "2Y", "5Y"]} />}
        >
            <BaseLineChart data={filtered as Record<string, unknown>[]} lines={lines} />
        </ChartWrapper>
    );
}