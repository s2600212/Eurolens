import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { CustomTooltip } from "./CustomTooltip";
import { formatDate, formatPercent } from "@/lib/formatters";

interface AreaSeries {
    dataKey: string;
    name: string;
    color: string;
    fillOpacity?: number;
    yAxisId?: string;
}

interface BaseAreaChartProps {
    data: Record<string, unknown>[];
    areas: AreaSeries[];
    height?: number;
    dateFormat?: string;
    valueFormatter?: (value: number) => string;
    showGrid?: boolean;
    showLegend?: boolean;
    dualYAxis?: boolean;
}

export function BaseAreaChart({
    data, areas, height = 320,
    dateFormat = "MMM yyyy",
    valueFormatter = (v: number) => formatPercent(v),
    showGrid = true, showLegend = true, dualYAxis = false,
}: BaseAreaChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                {areas.map((area) => (
                    <Area
                        key={area.dataKey}
                        type="monotone"
                        dataKey={area.dataKey}
                        name={area.name}
                        stroke={area.color}
                        fill={area.color}
                        fillOpacity={area.fillOpacity ?? 0.1}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        yAxisId={area.yAxisId || "left"}
                        connectNulls
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
}