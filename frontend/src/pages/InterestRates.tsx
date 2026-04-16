import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useECBRates } from "@/hooks/useECBRates";
import { useAppShell } from "@/components/layout/AppShell";
import { ECBRatesPanel } from "@/components/dashboard/ECBRatesPanel";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatPercent, formatDate, filterByTimeRange } from "@/lib/formatters";
import type { TimeRange } from "@/types/chart";

export function InterestRates() {
    const { openChatWithContext } = useAppShell();
    const [searchParams, setSearchParams] = useSearchParams();
    const timeRange = (searchParams.get("range") as TimeRange) || "5Y";

    const handleTimeRangeChange = useCallback(
        (range: TimeRange) => { setSearchParams({ range }); },
        [setSearchParams]
    );

    const { data, isLoading, isError, error, refetch } = useECBRates();

    const rateDecisions = useMemo(() => {
        if (!data) return [];

        const dateMap = new Map<string, { date: string; mro?: number; deposit?: number }>();

        for (const point of data.mro) {
            if (!dateMap.has(point.date)) dateMap.set(point.date, { date: point.date });
            dateMap.get(point.date)!.mro = point.value;
        }
        for (const point of data.deposit) {
            if (!dateMap.has(point.date)) dateMap.set(point.date, { date: point.date });
            dateMap.get(point.date)!.deposit = point.value;
        }

        const sorted = Array.from(dateMap.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return sorted.map((row, index) => {
            const prev = sorted[index + 1];
            let change = "—";
            if (prev && row.mro !== undefined && prev.mro !== undefined) {
                const diff = row.mro - prev.mro;
                if (Math.abs(diff) > 0.001) {
                    change = `${diff > 0 ? "+" : ""}${(diff * 100).toFixed(0)} bps`;
                } else {
                    change = "No change";
                }
            }
            return { ...row, change };
        });
    }, [data]);

    const filteredDecisions = useMemo(() => {
        return filterByTimeRange(rateDecisions, timeRange);
    }, [rateDecisions, timeRange]);

    return (
        <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 1.5rem 0" }}>
                Interest Rates
            </h1>

            <div style={{ marginBottom: "1.5rem" }}>
                <ECBRatesPanel
                    timeRange={timeRange}
                    onTimeRangeChange={handleTimeRangeChange}
                    aiContext={`ECB Key Interest Rates chart — Line chart showing MRO and Deposit Facility proxy rates over the ${timeRange} time range.`}
                    onAskAI={openChatWithContext}
                />
            </div>

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
                    Historical Rate Data
                </h2>

                {isLoading ? (
                    <SkeletonTable rows={10} />
                ) : isError ? (
                    <ErrorCard title="Failed to load rate data" message={error instanceof Error ? error.message : "Unknown error"} onRetry={refetch} />
                ) : filteredDecisions.length === 0 ? (
                    <EmptyState title="No rate data" description="No rate decisions found for the selected time range." />
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                            <thead>
                                <tr>
                                    {["Date", "MRO Rate", "Deposit Rate", "Change"].map((header) => (
                                        <th
                                            key={header}
                                            style={{
                                                textAlign: header === "Date" ? "left" : "right",
                                                padding: "0.625rem 0.75rem",
                                                fontWeight: 500,
                                                color: "var(--color-text-muted)",
                                                borderBottom: "2px solid var(--color-border)",
                                                fontSize: "0.75rem",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDecisions.map((row) => (
                                    <tr key={row.date}>
                                        <td style={{ padding: "0.625rem 0.75rem", color: "var(--color-text-secondary)", borderBottom: "1px solid var(--color-border)", whiteSpace: "nowrap" }}>
                                            {formatDate(row.date, "dd MMM yyyy")}
                                        </td>
                                        <td style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 600, color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border)", fontVariantNumeric: "tabular-nums" }}>
                                            {row.mro !== undefined ? formatPercent(row.mro) : "—"}
                                        </td>
                                        <td style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 600, color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border)", fontVariantNumeric: "tabular-nums" }}>
                                            {row.deposit !== undefined ? formatPercent(row.deposit) : "—"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "0.625rem 0.75rem",
                                                textAlign: "right",
                                                color: row.change.startsWith("+")
                                                    ? "var(--color-error)"
                                                    : row.change.startsWith("-")
                                                        ? "var(--color-success)"
                                                        : "var(--color-text-muted)",
                                                borderBottom: "1px solid var(--color-border)",
                                                fontWeight: 500,
                                                fontSize: "0.8125rem",
                                            }}
                                        >
                                            {row.change}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}