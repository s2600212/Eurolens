import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useMultipleGDP } from "@/hooks/useGDP";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { SparkLine } from "@/components/charts/SparkLine";
import { formatPercent } from "@/lib/formatters";
import { getCountryName, getCountryLabel } from "@/lib/constants";
import { getChartColor } from "@/types/chart";
import { Button } from "@/components/ui/Button";
import type { ChartType } from "@/types/chart";

interface GDPPanelProps {
    countryCodes: string[];
    chartType: ChartType;
    onChartTypeChange: (type: ChartType) => void;
    onAskAI?: (context: string) => void;
}

function GDPTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { name: string; value: number; color: string; payload: Record<string, unknown> }[];
    label?: string;
}) {
    if (!active || !payload || payload.length === 0) return null;

    const year = String(payload[0]?.payload?.name ?? label ?? "");

    return (
        <div
            style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.625rem 0.75rem",
                boxShadow: "var(--shadow-lg)",
                fontSize: "0.8125rem",
                maxHeight: "300px",
                overflowY: "auto",
            }}
        >
            <p style={{ margin: "0 0 0.375rem 0", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {year}
            </p>
            {payload
                .filter((entry) => entry.value !== null && entry.value !== undefined)
                .map((entry, index) => (
                    <div
                        key={index}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "1rem",
                            padding: "0.125rem 0",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            <span
                                style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "2px",
                                    backgroundColor: entry.color,
                                    flexShrink: 0,
                                }}
                            />
                            <span style={{ color: "var(--color-text-secondary)" }}>{entry.name}</span>
                        </div>
                        <span
                            style={{
                                fontWeight: 600,
                                color: "var(--color-text-primary)",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {formatPercent(entry.value)}
                        </span>
                    </div>
                ))}
        </div>
    );
}

export function GDPPanel({ countryCodes, chartType, onChartTypeChange, onAskAI }: GDPPanelProps) {
    const { data, isLoading, isError, error, refetch } = useMultipleGDP(countryCodes);

    if (isLoading) return <SkeletonChart height={400} />;

    if (isError) {
        return (
            <ErrorCard
                title="Failed to load GDP data"
                message={error instanceof Error ? error.message : "Unknown error"}
                onRetry={refetch}
            />
        );
    }

    if (!data || data.length === 0) {
        return <EmptyState title="No GDP data" description="GDP data is not available for the selected countries." />;
    }

    const allYears = new Set<number>();
    for (const country of data) {
        for (const d of country.data) allYears.add(d.year);
    }
    const sortedYears = Array.from(allYears).sort((a, b) => a - b).slice(-5);

    const chartData = sortedYears.map((year) => {
        const row: Record<string, unknown> = { name: String(year) };
        for (const country of data) {
            const point = country.data.find((d) => d.year === year);
            row[country.country] = point?.value ?? null;
        }
        return row;
    });

    const bars = data.map((country, index) => ({
        dataKey: country.country,
        name: getCountryLabel(country.country),
        color: getChartColor(index),
        stackId: chartType === "stacked" ? "stack" : undefined,
    }));

    return (
        <ChartWrapper
            title="GDP Growth by Country"
            subtitle="Annual GDP growth rate (%)"
            ariaLabel={`${chartType === "grouped" ? "Grouped" : "Stacked"} bar chart showing GDP growth for EU countries`}
            aiContext={`GDP Growth by Country chart — ${chartType === "grouped" ? "Grouped" : "Stacked"} bar chart showing annual GDP growth rates for selected EU countries over the last 5 years.`}
            onAskAI={onAskAI}
            actions={
                <nav role="group" aria-label="Chart type selection" style={{ display: "flex", gap: "0.25rem" }}>
                    <Button size="sm" variant="ghost" active={chartType === "grouped"} onClick={() => onChartTypeChange("grouped")} aria-pressed={chartType === "grouped"}>
                        Grouped
                    </Button>
                    <Button size="sm" variant="ghost" active={chartType === "stacked"} onClick={() => onChartTypeChange("stacked")} aria-pressed={chartType === "stacked"}>
                        Stacked
                    </Button>
                </nav>
            }
        >
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
                        stroke="var(--color-border)"
                        tickLine={false}
                        axisLine={{ stroke: "var(--color-border)" }}
                    />
                    <YAxis
                        tickFormatter={(v) => `${v.toFixed(1)}%`}
                        tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                        stroke="var(--color-border)"
                        tickLine={false}
                        axisLine={false}
                        width={50}
                    />
                    <Tooltip
                        content={(props: any) => <GDPTooltip {...props} />}
                        cursor={{ fill: "var(--color-surface-hover)" }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }}
                        iconType="rect"
                        iconSize={10}
                    />
                    {bars.map((bar) => (
                        <Bar
                            key={bar.dataKey}
                            dataKey={bar.dataKey}
                            name={bar.name}
                            fill={bar.color}
                            stackId={bar.stackId}
                            radius={[4, 4, 0, 0]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: "0.75rem",
                    marginTop: "1.25rem",
                    paddingTop: "1.25rem",
                    borderTop: "1px solid var(--color-border)",
                }}
            >
                {data.map((country, index) => (
                    <div
                        key={country.country}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--color-surface-hover)",
                        }}
                    >
                        <span
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: getChartColor(index),
                                flexShrink: 0,
                            }}
                        />
                        <span
                            style={{
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color: "var(--color-text-secondary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {country.country}
                        </span>
                        <SparkLine
                            data={country.tenYearTrend.map((d) => ({ value: d.value }))}
                            color={getChartColor(index)}
                        />
                    </div>
                ))}
            </div>
        </ChartWrapper>
    );
}