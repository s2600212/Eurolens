import { formatPercent, formatDate } from "@/lib/formatters";

interface TooltipPayloadItem {
    name: string;
    value: number;
    color: string;
    dataKey: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
    dateFormat?: string;
    valueFormatter?: (value: number) => string;
}

export function CustomTooltip({
    active,
    payload,
    label,
    dateFormat = "MMM yyyy",
    valueFormatter = (v: number) => formatPercent(v),
}: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div
            style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem",
                boxShadow: "var(--shadow-lg)",
                fontSize: "0.8125rem",
                minWidth: "10rem",
            }}
        >
            <p
                style={{
                    color: "var(--color-text-muted)",
                    margin: "0 0 0.5rem 0",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                }}
            >
                {label ? formatDate(label, dateFormat) : ""}
            </p>
            {payload.map((entry, index) => (
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
                                borderRadius: "50%",
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