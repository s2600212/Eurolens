import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { formatPercent } from "@/lib/formatters";

interface BarSeries {
    dataKey: string;
    name: string;
    color: string;
    stackId?: string;
}

interface BaseBarChartProps {
    data: Record<string, unknown>[];
    bars: BarSeries[];
    height?: number;
    layout?: "horizontal" | "vertical";
    xDataKey?: string;
    valueFormatter?: (value: number) => string;
    showGrid?: boolean;
    showLegend?: boolean;
    colorByItem?: boolean;
    colors?: string[];
    barSize?: number;
}

function BarTooltip({
    active,
    payload,
    label,
    valueFormatter,
}: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
    valueFormatter: (v: number) => string;
}) {
    if (!active || !payload || payload.length === 0) return null;

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
            <p
                style={{
                    color: "var(--color-text-primary)",
                    margin: "0 0 0.375rem 0",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                }}
            >
                {label}
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
                            {valueFormatter(entry.value)}
                        </span>
                    </div>
                ))}
        </div>
    );
}

export function BaseBarChart({
    data, bars, height = 320, layout = "horizontal", xDataKey = "name",
    valueFormatter = (v: number) => formatPercent(v),
    showGrid = true, showLegend = true,
    colorByItem = false, colors = [], barSize,
}: BaseBarChartProps) {
    const isVertical = layout === "vertical";

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                layout={layout}
                margin={{ top: 5, right: 20, left: isVertical ? 60 : 5, bottom: 5 }}
            >
                {showGrid && (
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        horizontal={!isVertical}
                        vertical={isVertical}
                    />
                )}
                {isVertical ? (
                    <>
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
                            dataKey={xDataKey}
                            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                            stroke="var(--color-border)"
                            tickLine={false}
                            axisLine={false}
                            width={52}
                        />
                    </>
                ) : (
                    <>
                        <XAxis
                            dataKey={xDataKey}
                            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
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
                            allowDecimals
                        />
                    </>
                )}
                <Tooltip
                    content={<BarTooltip valueFormatter={valueFormatter} />}
                    cursor={{ fill: "var(--color-surface-hover)" }}
                />
                {showLegend && bars.length > 1 && (
                    <Legend
                        wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }}
                        iconType="rect"
                        iconSize={10}
                    />
                )}
                {bars.map((bar) => (
                    <Bar
                        key={bar.dataKey}
                        dataKey={bar.dataKey}
                        name={bar.name}
                        fill={bar.color}
                        stackId={bar.stackId}
                        radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                        barSize={barSize}
                    >
                        {colorByItem &&
                            data.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length] || bar.color}
                                />
                            ))}
                    </Bar>
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}