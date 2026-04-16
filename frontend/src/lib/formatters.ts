import { format, parseISO, subYears, isAfter } from "date-fns";
import type { TimeRange } from "@/types/chart";

export function formatPercent(value: number | null | undefined, decimals = 2): string {
    if (value === null || value === undefined || isNaN(value)) return "—";
    return `${value.toFixed(decimals)}%`;
}

export function formatDelta(current: number | null, previous: number | null): {
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

export function formatDeltaGDP(current: number | null, previous: number | null): {
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
        color: delta > 0 ? "var(--color-success)" : "var(--color-error)",
    };
}

export function formatDate(dateStr: string, pattern = "MMM yyyy"): string {
    try {
        const date = parseISO(dateStr);
        return format(date, pattern);
    } catch {
        return dateStr;
    }
}

export function formatDateFull(dateStr: string): string {
    return formatDate(dateStr, "dd MMM yyyy");
}

export function formatYear(dateStr: string): string {
    return formatDate(dateStr, "yyyy");
}

export function getTimeRangeCutoff(range: TimeRange): Date | null {
    const now = new Date();
    switch (range) {
        case "1Y":
            return subYears(now, 1);
        case "2Y":
            return subYears(now, 2);
        case "5Y":
            return subYears(now, 5);
        case "ALL":
            return null;
    }
}

export function filterByTimeRange<T extends { date: string }>(
    data: T[],
    range: TimeRange
): T[] {
    const cutoff = getTimeRangeCutoff(range);
    if (!cutoff) return data;

    return data.filter((d) => {
        try {
            return isAfter(parseISO(d.date), cutoff);
        } catch {
            return false;
        }
    });
}