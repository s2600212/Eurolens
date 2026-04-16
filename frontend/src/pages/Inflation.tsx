import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppShell } from "@/components/layout/AppShell";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { InflationPanel } from "@/components/dashboard/InflationPanel";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { useAllCountryLatestInflation } from "@/hooks/useInflation";
import { EU_COUNTRIES, DEFAULT_INFLATION_COUNTRIES, getCountryFlag } from "@/lib/constants";
import { formatPercent } from "@/lib/formatters";
import { CHART_COLORS } from "@/types/chart";
import type { TimeRange } from "@/types/chart";

const allCountryCodes = EU_COUNTRIES.map((c) => c.code);
const countryOptions = EU_COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }));

export function Inflation() {
    const { openChatWithContext } = useAppShell();
    const [searchParams, setSearchParams] = useSearchParams();

    const countriesParam = searchParams.get("countries");
    const selectedCountries = useMemo(() => {
        if (countriesParam) return countriesParam.split(",").filter(Boolean);
        return DEFAULT_INFLATION_COUNTRIES;
    }, [countriesParam]);

    const timeRange = (searchParams.get("range") as TimeRange) || "5Y";

    const countryInflationQuery = useAllCountryLatestInflation(allCountryCodes);

    const inflationBarData = useMemo(() => {
        if (!countryInflationQuery.data) return [];
        return countryInflationQuery.data.map((c, index) => ({
            name: `${getCountryFlag(c.country)} ${c.countryName || c.country}`,
            inflation: Number(c.value) || 0,
            fill: CHART_COLORS[index % CHART_COLORS.length].hex,
        }));
    }, [countryInflationQuery.data]);

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
                Inflation
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

            {/* Time series chart */}
            <div style={{ marginBottom: "1.5rem" }}>
                <InflationPanel
                    countryCodes={selectedCountries}
                    timeRange={timeRange}
                    onTimeRangeChange={handleTimeRangeChange}
                    aiContext={`HICP Inflation by Country chart — Line chart showing inflation trends for ${selectedCountries.join(", ")} over the selected time range (${timeRange}).`}
                    onAskAI={openChatWithContext}
                />
            </div>

            {/* Latest inflation by country bar chart */}
            <div>
                {countryInflationQuery.isLoading ? (
                    <SkeletonChart height={400} />
                ) : countryInflationQuery.isError ? (
                    <ErrorCard
                        title="Failed to load country inflation"
                        message={countryInflationQuery.error instanceof Error ? countryInflationQuery.error.message : "Unknown error"}
                        onRetry={() => countryInflationQuery.refetch()}
                    />
                ) : inflationBarData.length === 0 ? (
                    <EmptyState title="No country data" description="Country-level inflation data is not available." />
                ) : (
                    <ChartWrapper
                        title="Latest Inflation by Country"
                        subtitle="HICP annual rate, sorted descending"
                        ariaLabel="Horizontal bar chart showing the latest HICP inflation rate for EU countries, sorted from highest to lowest"
                        aiContext="Latest Inflation by Country chart — Horizontal bar chart showing the most recent HICP inflation rate for all 10 EU countries on the Inflation page."
                        onAskAI={openChatWithContext}
                    >
                        <ResponsiveContainer width="100%" height={Math.max(300, inflationBarData.length * 40)}>
                            <BarChart
                                data={inflationBarData}
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