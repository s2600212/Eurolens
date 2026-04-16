import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "./Skeleton";

interface KPICardProps {
    label: string;
    value: string;
    delta?: {
        text: string;
        direction: "up" | "down" | "flat";
        color: string;
    };
    subtitle?: string;
    loading?: boolean;
    /** "positive" = green border, "negative" = red border, "neutral" = gray border */
    sentiment?: "positive" | "negative" | "neutral";
}

function getBorderColor(sentiment?: "positive" | "negative" | "neutral"): string {
    switch (sentiment) {
        case "positive":
            return "var(--color-success)";
        case "negative":
            return "var(--color-error)";
        case "neutral":
            return "var(--color-border-strong)";
        default:
            return "var(--color-border)";
    }
}

export function KPICard({ label, value, delta, subtitle, loading, sentiment }: KPICardProps) {
    if (loading) {
        return (
            <article
                style={{
                    backgroundColor: "var(--color-surface)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.25rem",
                    boxShadow: "var(--shadow-sm)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <Skeleton width="50%" height="0.75rem" style={{ marginBottom: "0.75rem" }} />
                <Skeleton width="40%" height="2rem" style={{ marginBottom: "0.5rem" }} />
                <Skeleton width="55%" height="0.75rem" />
            </article>
        );
    }

    const borderColor = getBorderColor(sentiment);

    const DeltaIcon =
        delta?.direction === "up"
            ? TrendingUp
            : delta?.direction === "down"
                ? TrendingDown
                : Minus;

    return (
        <article
            style={{
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--color-border)",
                borderTop: `3px solid ${borderColor}`,
            }}
        >
            <h3
                style={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 0.5rem 0",
                }}
            >
                {label}
            </h3>
            <p
                style={{
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    margin: "0 0 0.375rem 0",
                    lineHeight: 1.2,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value}
            </p>
            {delta && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <DeltaIcon size={14} style={{ color: delta.color }} aria-hidden="true" />
                    <span
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            color: delta.color,
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {delta.text}
                    </span>
                    {subtitle && (
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
            {!delta && subtitle && (
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                    {subtitle}
                </p>
            )}
        </article>
    );
}