import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useCountryComparison } from "@/hooks/useCountryComparison";
import { useAppShell } from "@/components/layout/AppShell";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { BaseLineChart } from "@/components/charts/BaseLineChart";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonChart, SkeletonTable } from "@/components/ui/Skeleton";
import { formatPercent } from "@/lib/formatters";
import { getCountryName, getCountryLabel } from "@/lib/constants";
import { getChartColor } from "@/types/chart";

interface ComparisonPanelProps {
    countryA: string;
    countryB: string;
}

function GDPComparisonTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { name: string; value: number; color: string; payload: Record<string, unknown> }[];
    label?: string;
}) {
    if (!active || !payload || payload.length === 0) return null;

    // Get the year from the payload data's name field
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

export function ComparisonPanel({ countryA, countryB }: ComparisonPanelProps) {
    const { openChatWithContext } = useAppShell();
    const { rates, inflation, gdp, isLoading, isError, error, refetch } =
        useCountryComparison(countryA, countryB);

    if (!countryA || !countryB) {
        return <EmptyState title="Select two countries" description="Choose two countries above to compare their economic indicators." />;
    }

    if (countryA === countryB) {
        return <EmptyState title="Select different countries" description="Please choose two different countries to compare." />;
    }

    if (isLoading) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <SkeletonChart />
                <SkeletonChart />
                <SkeletonTable rows={4} />
            </div>
        );
    }

    if (isError) {
        return (
            <ErrorCard
                title="Failed to load comparison data"
                message={error instanceof Error ? error.message : "Unknown error"}
                onRetry={refetch}
            />
        );
    }

    const nameA = getCountryName(countryA);
    const nameB = getCountryName(countryB);
    const labelA = getCountryLabel(countryA);
    const labelB = getCountryLabel(countryB);

    const inflationA = inflation?.find((i) => i.country === countryA);
    const inflationB = inflation?.find((i) => i.country === countryB);

    const inflationDateMap = new Map<string, Record<string, unknown>>();
    for (const point of inflationA?.data || []) {
        if (!inflationDateMap.has(point.date)) inflationDateMap.set(point.date, { date: point.date });
        inflationDateMap.get(point.date)![countryA] = point.value;
    }
    for (const point of inflationB?.data || []) {
        if (!inflationDateMap.has(point.date)) inflationDateMap.set(point.date, { date: point.date });
        inflationDateMap.get(point.date)![countryB] = point.value;
    }
    const inflationChartData = Array.from(inflationDateMap.values()).sort(
        (a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
    );

    const gdpA = gdp?.find((g) => g.country === countryA);
    const gdpB = gdp?.find((g) => g.country === countryB);

    const gdpYears = new Set<number>();
    for (const d of gdpA?.data || []) gdpYears.add(d.year);
    for (const d of gdpB?.data || []) gdpYears.add(d.year);
    const sortedGDPYears = Array.from(gdpYears).sort().slice(-5);

    const gdpChartData = sortedGDPYears.map((year) => ({
        name: String(year),
        [countryA]: gdpA?.data.find((d) => d.year === year)?.value ?? null,
        [countryB]: gdpB?.data.find((d) => d.year === year)?.value ?? null,
    }));

    const fiveYearAvgInflation = (series: typeof inflationA) => {
        if (!series || series.data.length === 0) return null;
        const recent = series.data.slice(-60);
        return recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    };

    const summaryRows = [
        { label: "Latest Inflation", a: formatPercent(inflationA?.latest), b: formatPercent(inflationB?.latest) },
        { label: "GDP Growth (Latest)", a: formatPercent(gdpA?.latest), b: formatPercent(gdpB?.latest) },
        { label: "5Y Avg Inflation", a: formatPercent(fiveYearAvgInflation(inflationA)), b: formatPercent(fiveYearAvgInflation(inflationB)) },
        { label: "5Y Avg GDP Growth", a: formatPercent(gdpA?.fiveYearAvg), b: formatPercent(gdpB?.fiveYearAvg) },
    ];

    const latestMRO = rates?.latestMRO;
    const colorA = getChartColor(0);
    const colorB = getChartColor(1);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <ChartWrapper
                title="Inflation Comparison"
                subtitle={`HICP inflation: ${nameA} vs ${nameB}`}
                ariaLabel={`Line chart comparing HICP inflation between ${nameA} and ${nameB}`}
                aiContext={`Inflation Comparison chart — Line chart comparing HICP inflation between ${nameA} and ${nameB}.`}
                onAskAI={openChatWithContext}
            >
                {inflationChartData.length > 0 ? (
                    <BaseLineChart
                        data={inflationChartData as Record<string, unknown>[]}
                        lines={[
                            { dataKey: countryA, name: labelA, color: colorA },
                            { dataKey: countryB, name: labelB, color: colorB },
                        ]}
                    />
                ) : (
                    <EmptyState title="No inflation data" description="Inflation data is not available for these countries." />
                )}
            </ChartWrapper>

            <ChartWrapper
                title="GDP Growth Comparison"
                subtitle={`Annual GDP growth: ${nameA} vs ${nameB}`}
                ariaLabel={`Bar chart comparing GDP growth between ${nameA} and ${nameB}`}
                aiContext={`GDP Growth Comparison chart — Bar chart comparing annual GDP growth between ${nameA} and ${nameB} over the last 5 years.`}
                onAskAI={openChatWithContext}
            >
                {gdpChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                            data={gdpChartData}
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
                                content={(props: any) => <GDPComparisonTooltip {...props} />}
                                cursor={{ fill: "var(--color-surface-hover)" }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }}
                                iconType="rect"
                                iconSize={10}
                            />
                            <Bar dataKey={countryA} name={labelA} fill={colorA} radius={[4, 4, 0, 0]} />
                            <Bar dataKey={countryB} name={labelB} fill={colorB} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyState title="No GDP data" description="GDP data is not available for these countries." />
                )}
            </ChartWrapper>

            <section
                style={{
                    backgroundColor: "var(--color-surface)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.5rem",
                    boxShadow: "var(--shadow-sm)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 1rem 0" }}>
                    Summary Statistics
                </h2>
                {latestMRO !== null && latestMRO !== undefined && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0 0 1rem 0" }}>
                        ECB MRO Reference Rate: <strong style={{ color: "var(--color-text-primary)" }}>{formatPercent(latestMRO)}</strong>
                    </p>
                )}
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                        <thead>
                            <tr>
                                {["Metric", nameA, nameB].map((header, i) => (
                                    <th
                                        key={header}
                                        style={{
                                            textAlign: i === 0 ? "left" : "right",
                                            padding: "0.625rem 0.75rem",
                                            fontWeight: 500,
                                            color: "var(--color-text-muted)",
                                            borderBottom: "1px solid var(--color-border)",
                                            fontSize: "0.75rem",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {summaryRows.map((row) => (
                                <tr key={row.label}>
                                    <td style={{ padding: "0.625rem 0.75rem", color: "var(--color-text-secondary)", borderBottom: "1px solid var(--color-border)" }}>
                                        {row.label}
                                    </td>
                                    <td style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 600, color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border)", fontVariantNumeric: "tabular-nums" }}>
                                        {row.a}
                                    </td>
                                    <td style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 600, color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border)", fontVariantNumeric: "tabular-nums" }}>
                                        {row.b}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}