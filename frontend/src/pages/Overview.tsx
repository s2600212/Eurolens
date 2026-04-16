import { useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useECBRates } from "@/hooks/useECBRates";
import { useEurozoneInflation, useAllCountryLatestInflation } from "@/hooks/useInflation";
import { useLatestGDP } from "@/hooks/useGDP";
import { useEurozoneUnemployment } from "@/hooks/useUnemployment";
import { useAppShell } from "@/components/layout/AppShell";
import { KPICard } from "@/components/ui/KPICard";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { BaseLineChart } from "@/components/charts/BaseLineChart";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonChart, SkeletonKPICard } from "@/components/ui/Skeleton";
import { formatPercent, formatDelta, formatDeltaGDP } from "@/lib/formatters";
import { EU_COUNTRIES, getCountryFlag } from "@/lib/constants";
import { CHART_COLORS } from "@/types/chart";

const allCountryCodes = EU_COUNTRIES.map((c) => c.code);

/** For rates/inflation: going up is bad (red), going down is good (green) */
function rateSentiment(delta?: { direction: "up" | "down" | "flat" }): "positive" | "negative" | "neutral" {
    if (!delta) return "neutral";
    if (delta.direction === "down") return "positive";
    if (delta.direction === "up") return "negative";
    return "neutral";
}

/** For GDP: going up is good (green), going down is bad (red) */
function gdpSentiment(delta?: { direction: "up" | "down" | "flat" }): "positive" | "negative" | "neutral" {
    if (!delta) return "neutral";
    if (delta.direction === "up") return "positive";
    if (delta.direction === "down") return "negative";
    return "neutral";
}

/** For unemployment: going down is good (green), going up is bad (red) */
function unemploymentSentiment(delta?: { direction: "up" | "down" | "flat" }): "positive" | "negative" | "neutral" {
    if (!delta) return "neutral";
    if (delta.direction === "down") return "positive";
    if (delta.direction === "up") return "negative";
    return "neutral";
}

/** Unemployment delta: down is green, up is red */
function formatDeltaUnemployment(current: number | null, previous: number | null): {
    text: string;
    direction: "up" | "down" | "flat";
    color: string;
} {
    if (current === null || previous === null) {
        return { text: "—", direction: "flat", color: "var(--color-text-muted)" };
    }

    const delta = current - previous;
    const absDelta = Math.abs(delta);

    if (absDelta < 0.01) {
        return { text: "0.00pp", direction: "flat", color: "var(--color-text-muted)" };
    }

    const sign = delta > 0 ? "+" : "−";
    return {
        text: `${sign}${absDelta.toFixed(2)}pp`,
        direction: delta > 0 ? "up" : "down",
        color: delta > 0 ? "var(--color-error)" : "var(--color-success)",
    };
}

export function Overview() {
    const { openChatWithContext } = useAppShell();
    const ratesQuery = useECBRates();
    const inflationQuery = useEurozoneInflation();
    const countryInflationQuery = useAllCountryLatestInflation(allCountryCodes);
    const gdpQuery = useLatestGDP(allCountryCodes);
    const unemploymentQuery = useEurozoneUnemployment();

    const combinedTimeSeries = useMemo(() => {
        if (!ratesQuery.data || !inflationQuery.data) return [];

        const dateMap = new Map<string, { date: string; mroRate?: number; inflation?: number }>();

        for (const point of ratesQuery.data.mro) {
            if (!dateMap.has(point.date)) dateMap.set(point.date, { date: point.date });
            dateMap.get(point.date)!.mroRate = point.value;
        }

        for (const point of inflationQuery.data.data) {
            if (!dateMap.has(point.date)) dateMap.set(point.date, { date: point.date });
            dateMap.get(point.date)!.inflation = point.value;
        }

        return Array.from(dateMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }, [ratesQuery.data, inflationQuery.data]);

    const inflationBarData = useMemo(() => {
        if (!countryInflationQuery.data) return [];
        return countryInflationQuery.data.map((c, index) => ({
            name: `${getCountryFlag(c.country)} ${c.countryName || c.country}`,
            inflation: Number(c.value) || 0,
            fill: CHART_COLORS[index % CHART_COLORS.length].hex,
        }));
    }, [countryInflationQuery.data]);

    const latestEurozoneGDP = useMemo(() => {
        if (!gdpQuery.data || gdpQuery.data.length === 0) return { value: null, year: null };
        const de = gdpQuery.data.find((c) => c.country === "DE");
        return { value: de?.value ?? null, year: de?.year ?? null };
    }, [gdpQuery.data]);

    const mroRate = ratesQuery.data?.latestMRO;
    const depositRate = ratesQuery.data?.latestDeposit;
    const mroOneYearAgo = ratesQuery.data?.mroOneYearAgo;
    const depositOneYearAgo = ratesQuery.data?.depositOneYearAgo;
    const latestInflation = inflationQuery.data?.latest;
    const inflationOneYearAgo = inflationQuery.data?.oneYearAgo;
    const latestUnemployment = unemploymentQuery.data?.latest;
    const unemploymentOneYearAgo = unemploymentQuery.data?.oneYearAgo;

    const mroDelta = formatDelta(mroRate ?? null, mroOneYearAgo ?? null);
    const depositDelta = formatDelta(depositRate ?? null, depositOneYearAgo ?? null);
    const inflationDelta = formatDelta(latestInflation ?? null, inflationOneYearAgo ?? null);
    const gdpDelta = latestEurozoneGDP.value !== null ? formatDeltaGDP(latestEurozoneGDP.value, 0) : undefined;
    const unemploymentDelta = formatDeltaUnemployment(latestUnemployment ?? null, unemploymentOneYearAgo ?? null);

    return (
        <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 1.5rem 0" }}>
                Overview
            </h1>

            {/* KPI Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                }}
            >
                {ratesQuery.isLoading ? (
                    <>
                        <SkeletonKPICard />
                        <SkeletonKPICard />
                    </>
                ) : ratesQuery.isError ? (
                    <div style={{ gridColumn: "span 2" }}>
                        <ErrorCard title="Failed to load ECB rates" message={ratesQuery.error instanceof Error ? ratesQuery.error.message : "Unknown error"} onRetry={() => ratesQuery.refetch()} />
                    </div>
                ) : (
                    <>
                        <KPICard
                            label="ECB MRO Rate"
                            value={formatPercent(mroRate)}
                            delta={mroDelta}
                            subtitle="vs 1 year ago"
                            sentiment={rateSentiment(mroDelta)}
                        />
                        <KPICard
                            label="Deposit Facility Rate"
                            value={formatPercent(depositRate)}
                            delta={depositDelta}
                            subtitle="vs 1 year ago"
                            sentiment={rateSentiment(depositDelta)}
                        />
                    </>
                )}

                {inflationQuery.isLoading ? (
                    <SkeletonKPICard />
                ) : inflationQuery.isError ? (
                    <ErrorCard title="Failed to load inflation" message={inflationQuery.error instanceof Error ? inflationQuery.error.message : "Unknown error"} onRetry={() => inflationQuery.refetch()} />
                ) : (
                    <KPICard
                        label="Eurozone Inflation"
                        value={formatPercent(latestInflation)}
                        delta={inflationDelta}
                        subtitle="vs 1 year ago"
                        sentiment={rateSentiment(inflationDelta)}
                    />
                )}

                {gdpQuery.isLoading ? (
                    <SkeletonKPICard />
                ) : gdpQuery.isError ? (
                    <ErrorCard title="Failed to load GDP data" message={gdpQuery.error instanceof Error ? gdpQuery.error.message : "Unknown error"} onRetry={() => gdpQuery.refetch()} />
                ) : (
                    <KPICard
                        label="EU GDP Growth (DE)"
                        value={formatPercent(latestEurozoneGDP.value)}
                        delta={gdpDelta}
                        subtitle={latestEurozoneGDP.year ? `Year ${latestEurozoneGDP.year}` : undefined}
                        sentiment={gdpSentiment(gdpDelta)}
                    />
                )}

                {unemploymentQuery.isLoading ? (
                    <SkeletonKPICard />
                ) : unemploymentQuery.isError ? (
                    <ErrorCard title="Failed to load unemployment" message={unemploymentQuery.error instanceof Error ? unemploymentQuery.error.message : "Unknown error"} onRetry={() => unemploymentQuery.refetch()} />
                ) : (
                    <KPICard
                        label="Eurozone Unemployment"
                        value={formatPercent(latestUnemployment, 1)}
                        delta={unemploymentDelta}
                        subtitle="vs 1 year ago"
                        sentiment={unemploymentSentiment(unemploymentDelta)}
                    />
                )}
            </div>

            {/* MRO vs Inflation line chart */}
            <div style={{ marginBottom: "1.5rem" }}>
                {ratesQuery.isLoading || inflationQuery.isLoading ? (
                    <SkeletonChart />
                ) : ratesQuery.isError || inflationQuery.isError ? (
                    <ErrorCard title="Failed to load chart data" message="Unable to display the combined rates and inflation chart." onRetry={() => { ratesQuery.refetch(); inflationQuery.refetch(); }} />
                ) : combinedTimeSeries.length === 0 ? (
                    <EmptyState title="No chart data" description="Combined rate and inflation data is not available." />
                ) : (
                    <ChartWrapper
                        title="ECB MRO Rate vs Eurozone Inflation"
                        subtitle="Last 5 years"
                        ariaLabel="Line chart showing ECB MRO rate and Eurozone HICP inflation over the last 5 years"
                        aiContext="ECB MRO Rate vs Eurozone Inflation chart — This line chart shows the ECB 3-month interest rate (MRO proxy) and Eurozone HICP inflation over the last 5 years on a shared percentage scale."
                        onAskAI={openChatWithContext}
                    >
                        <BaseLineChart
                            data={combinedTimeSeries as Record<string, unknown>[]}
                            lines={[
                                { dataKey: "mroRate", name: "MRO Rate", color: "var(--color-chart-teal)" },
                                { dataKey: "inflation", name: "HICP Inflation", color: "var(--color-chart-orange)" },
                            ]}
                        />
                    </ChartWrapper>
                )}
            </div>

            {/* Country inflation bar chart */}
            <div>
                {countryInflationQuery.isLoading ? (
                    <SkeletonChart height={400} />
                ) : countryInflationQuery.isError ? (
                    <ErrorCard title="Failed to load country inflation" message={countryInflationQuery.error instanceof Error ? countryInflationQuery.error.message : "Unknown error"} onRetry={() => countryInflationQuery.refetch()} />
                ) : inflationBarData.length === 0 ? (
                    <EmptyState title="No country data" description="Country-level inflation data is not available." />
                ) : (
                    <ChartWrapper
                        title="Latest Inflation by Country"
                        subtitle="HICP annual rate, sorted descending"
                        ariaLabel="Horizontal bar chart showing the latest HICP inflation rate for 10 EU countries, sorted from highest to lowest"
                        aiContext="Latest Inflation by Country chart — This horizontal bar chart shows the most recent HICP annual inflation rate for all 10 EU countries, sorted from highest to lowest."
                        onAskAI={openChatWithContext}
                    >
                        <ResponsiveContainer width="100%" height={Math.max(300, inflationBarData.length * 40)}>
                            <BarChart
                                data={inflationBarData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 115, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                                <XAxis
                                    type="number"
                                    tickFormatter={(v) => `${v}%`}
                                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                    stroke="var(--color-border)"
                                    tickLine={false}
                                    axisLine={{ stroke: "var(--color-border)" }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                                    stroke="var(--color-border)"
                                    tickLine={false}
                                    axisLine={false}
                                    width={110}
                                />
                                <Tooltip
                                    cursor={{ fill: "var(--color-surface-hover)" }}
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload || payload.length === 0) return null;
                                        return (
                                            <div
                                                style={{
                                                    backgroundColor: "var(--color-surface)",
                                                    border: "1px solid var(--color-border)",
                                                    borderRadius: "var(--radius-md)",
                                                    padding: "0.5rem 0.75rem",
                                                    boxShadow: "var(--shadow-lg)",
                                                    fontSize: "0.8125rem",
                                                }}
                                            >
                                                <p style={{ margin: "0 0 0.25rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</p>
                                                <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                                                    Inflation: <strong style={{ color: "var(--color-text-primary)" }}>{formatPercent(payload[0].value as number)}</strong>
                                                </p>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="inflation" radius={[0, 4, 4, 0]} barSize={24}>
                                    {inflationBarData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                )}
            </div>
        </div>
    );
}