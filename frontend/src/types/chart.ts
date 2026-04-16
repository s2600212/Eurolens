export type TimeRange = "1Y" | "2Y" | "5Y" | "ALL";

export type ChartType = "grouped" | "stacked";

export interface ChartColor {
    name: string;
    hex: string;
}

export const CHART_COLORS: ChartColor[] = [
    { name: "teal", hex: "#14b8a6" },
    { name: "blue", hex: "#3b82f6" },
    { name: "orange", hex: "#f97316" },
    { name: "gold", hex: "#eab308" },
    { name: "purple", hex: "#8b5cf6" },
    { name: "rose", hex: "#f43f5e" },
    { name: "emerald", hex: "#10b981" },
    { name: "cyan", hex: "#06b6d4" },
    { name: "amber", hex: "#f59e0b" },
    { name: "indigo", hex: "#6366f1" },
];

export function getChartColor(index: number): string {
    return CHART_COLORS[index % CHART_COLORS.length].hex;
}