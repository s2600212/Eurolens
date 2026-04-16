import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppShell } from "@/components/layout/AppShell";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { BaseLineChart } from "@/components/charts/BaseLineChart";
import { TimeRangeSelector } from "@/components/ui/TimeRangeSelector";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { useCountryUnemployment, useAllCountryLatestUnemployment } from "@/hooks/useUnemployment";
import { EU_COUNTRIES, DEFAULT_INFLATION_COUNTRIES, getCountryFlag } from "@/lib/constants";
import { formatPercent, filterByTimeRange } from "@/lib/formatters";
import { getCountryName, getCountryLabel } from "@/lib/constants";
import { getChartColor, CHART_COLORS } from "@/types/chart";
import type { TimeRange } from "@/types/chart";

const allCountryCodes = EU_COUNTRIES.map((c) => c.code);
const countryOptions = EU_COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }));

export function Unemployment() {
    const { openChatWithContext } = useAppShell();
    const [searchParams, setSearchParams] = useSearchParams();

    const countriesParam = searchParams.get("countries");
    const selectedCountries = useMemo(() => {
        if (countriesParam) return countriesParam.split(",").filter(Boolean);
        return DEFAULT_INFLATION_COUNTRIES;
    }, [countriesParam]);

    const timeRange = (searchParams.get("range") as TimeRange) || "5Y";

    const countryUnemploymentQuery = useCountryUnemployment(selectedCountries);
    const allCountryUnemploymentQuery = useAllCountryLatestUnemployment(allCountryCodes);

    // Build combined time series for the line chart
    const lineChartData = useMemo(() => {
        if (!countryUnemploymentQuery.data) return [];

        const dateMap = new Map<string, Record<string, unknown>>();

        for (const series of countryUnemploymentQuery.data) {
            for (const point of series.data) {
                if (!dateMap.has(point.date)) dateMap.set(point.date, { date: point.date });
                dateMap.get(point.date)![series.country] = point.value;
            }
        }

        const combined = Array.from(dateMap.values()).sort(
            (a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
        );

        return filterByTimeRange(combined as { date: string }[], timeRange);
    }, [countryUnemploymentQuery.data, timeRange]);

    const lines = useMemo(() => {
        if (!countryUnemploymentQuery.data) return [];
        return countryUnemploymentQuery.data.map((series, index) => ({
            dataKey: series.country,
            name: getCountryLabel(series.country),
            color: getChartColor(index),
        }));
    }, [countryUnemploymentQuery.data]);

    const barChartData = useMemo(() => {
        if (!allCountryUnemploymentQuery.data) return [];
        return allCountryUnemploymentQuery.data.map((c, index) => ({
            name: `${getCountryFlag(c.country)} ${c.countryName || c.country}`,
            unemployment: Number(c.value) || 0,
            fill: CHART_COLORS[index % CHART_COLORS.length].hex,
        }));
    }, [allCountryUnemploymentQuery.data]);

    const handleCountriesChange = useCallback(
        (countries: string[]) => {
            const params = new URLSearchParams(searchParams);
            if (countries.length > 0) params.set("countries", countries.join(","));
            else params.delete("countries");
            setSearchParams(params);
        },
        [searchParams, setSearchParams]
    );

    const handleTimeRangeChange = useCallback(
        (range: TimeRange) => {
            const params = new URLSearchParams(searchParams);
            params.set("range", range);
            setSearchParams(params);
        },
        [searchParams, setSearchParams]
    );

    return (
        <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 1.5rem 0" }}>
                Unemployment
            </h1>

            {/* Country selector */}
            <div style={{ marginBottom: "1.5rem" }}>
                <MultiSelect
                    options={countryOptions}
                    selected={selectedCountries}
                    onChange={handleCountriesChange}
                    label="Countries"
                    placeholder="Select countries..."
                    maxSelections={5}
                />
            </div>

            {/* Time series line chart */}
            <div style={{ marginBottom: "1.5rem" }}>
                {countryUnemploymentQuery.isLoading ? (
                    <SkeletonChart />
                ) : countryUnemploymentQuery.isError ? (
                    <ErrorCard
                        title="Failed to load unemployment data"
                        message={countryUnemploymentQuery.error instanceof Error ? countryUnemploymentQuery.error.message : "Unknown error"}
                        onRetry={() => countryUnemploymentQuery.refetch()}
                    />
                ) : lineChartData.length === 0 ? (
                    <EmptyState title="No unemployment data" description="Select countries to view their unemployment rate data." />
                ) : (
                    <ChartWrapper
                        title="Unemployment Rate by Country"
                        subtitle="Seasonally adjusted, percentage of active population"
                        ariaLabel={`Line chart showing unemployment rates for ${selectedCountries.map(getCountryName).join(", ")}`}
                        aiContext={`Unemployment Rate by Country chart — Line chart showing seasonally adjusted unemployment rates for ${selectedCountries.join(", ")} over the ${timeRange} time range.`}
                        onAskAI={openChatWithContext}
                        actions={
                            <TimeRangeSelector
                                value={timeRange}
                                onChange={handleTimeRangeChange}
                                options={["1Y", "2Y", "5Y"]}
                            />
                        }
                    >
                        <BaseLineChart
                            data={lineChartData as Record<string, unknown>[]}
                            lines={lines}
                        />
                    </ChartWrapper>
                )}
            </div>

            {/* Latest unemployment by country bar chart */}
            <div>
                {allCountryUnemploymentQuery.isLoading ? (
                    <SkeletonChart height={400} />
                ) : allCountryUnemploymentQuery.isError ? (
                    <ErrorCard
                        title="Failed to load country unemployment"
                        message={allCountryUnemploymentQuery.error instanceof Error ? allCountryUnemploymentQuery.error.message : "Unknown error"}
                        onRetry={() => allCountryUnemploymentQuery.refetch()}
                    />
                ) : barChartData.length === 0 ? (
                    <EmptyState title="No country data" description="Country-level unemployment data is not available." />
                ) : (
                    <ChartWrapper
                        title="Latest Unemployment by Country"
                        subtitle="Seasonally adjusted rate, sorted descending"
                        ariaLabel="Horizontal bar chart showing the latest unemployment rate for EU countries, sorted from highest to lowest"
                        aiContext="Latest Unemployment by Country chart — Horizontal bar chart showing the most recent seasonally adjusted unemployment rate for all 10 EU countries."
                        onAskAI={openChatWithContext}
                    >
                        <ResponsiveContainer width="100%" height={Math.max(300, barChartData.length * 40)}>
                            <BarChart
                                data={barChartData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 115, bottom: 5 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--color-border)"
                                    horizontal={false}
                                />
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
                                                <p style={{ margin: "0 0 0.25rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                                                    {label}
                                                </p>
                                                <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                                                    Unemployment: <strong style={{ color: "var(--color-text-primary)" }}>{formatPercent(payload[0].value as number)}</strong>
                                                </p>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="unemployment" radius={[0, 4, 4, 0]} barSize={24}>
                                    {barChartData.map((entry, index) => (
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