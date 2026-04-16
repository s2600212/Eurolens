import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { CustomTooltip } from "./CustomTooltip";
import { formatDate, formatPercent } from "@/lib/formatters";

interface LineSeries {
    dataKey: string;
    name: string;
    color: string;
    strokeDasharray?: string;
    yAxisId?: string;
}

interface BaseLineChartProps {
    data: Record<string, unknown>[];
    lines: LineSeries[];
    height?: number;
    dateFormat?: string;
    valueFormatter?: (value: number) => string;
    showGrid?: boolean;
    showLegend?: boolean;
    dualYAxis?: boolean;
}

export function BaseLineChart({
    data, lines, height = 320,
    dateFormat = "MMM yyyy",
    valueFormatter = (v: number) => formatPercent(v),
    showGrid = true, showLegend = true, dualYAxis = false,
}: BaseLineChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                {showGrid && (
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                )}
                <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatDate(v, "MMM yy")}
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    stroke="var(--color-border)"
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    interval="preserveStartEnd"
                    minTickGap={40}
                />
                <YAxis
                    yAxisId="left"
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    stroke="var(--color-border)"
                    tickLine={false}
                    axisLine={false}
                    width={48}
                />
                {dualYAxis && (
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                        stroke="var(--color-border)"
                        tickLine={false}
                        axisLine={false}
                        width={48}
                    />
                )}
                <Tooltip
                    content={
                        <CustomTooltip dateFormat={dateFormat} valueFormatter={valueFormatter} />
                    }
                    cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
                />
                {showLegend && (
                    <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }} iconType="circle" iconSize={8} />
                )}
                {lines.map((line) => (
                    <Line
                        key={line.dataKey}
                        type="monotone"
                        dataKey={line.dataKey}
                        name={line.name}
                        stroke={line.color}
                        strokeWidth={2}
                        strokeDasharray={line.strokeDasharray}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        yAxisId={line.yAxisId || "left"}
                        connectNulls
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}