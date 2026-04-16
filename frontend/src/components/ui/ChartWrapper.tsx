import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface ChartWrapperProps {
    title: string;
    subtitle?: string;
    ariaLabel: string;
    actions?: ReactNode;
    children: ReactNode;
    /** Description of this chart's data for AI context */
    aiContext?: string;
    /** Callback when "Ask AI" is clicked */
    onAskAI?: (context: string) => void;
}

export function ChartWrapper({
    title,
    subtitle,
    ariaLabel,
    actions,
    children,
    aiContext,
    onAskAI,
}: ChartWrapperProps) {
    const handleAskAI = () => {
        if (onAskAI && aiContext) {
            onAskAI(aiContext);
        }
    };

    return (
        <section
            style={{
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--color-border)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    marginBottom: "1.25rem",
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                        style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                            margin: 0,
                        }}
                    >
                        {title}
                    </h2>
                    {subtitle && (
                        <p
                            style={{
                                fontSize: "0.8125rem",
                                color: "var(--color-text-muted)",
                                margin: "0.25rem 0 0 0",
                            }}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                    {actions}
                    {onAskAI && aiContext && (
                        <button
                            onClick={handleAskAI}
                            aria-label={`Ask AI about ${title}`}
                            title="Ask AI about this chart"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                padding: "0.375rem 0.625rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color: "var(--color-brand-600)",
                                backgroundColor: "color-mix(in srgb, var(--color-brand-500) 8%, transparent)",
                                border: "1px solid color-mix(in srgb, var(--color-brand-500) 20%, transparent)",
                                borderRadius: "var(--radius-md)",
                                cursor: "pointer",
                                transition: "all 150ms ease",
                                whiteSpace: "nowrap",
                                lineHeight: 1.4,
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "color-mix(in srgb, var(--color-brand-500) 14%, transparent)";
                                e.currentTarget.style.borderColor =
                                    "color-mix(in srgb, var(--color-brand-500) 30%, transparent)";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "color-mix(in srgb, var(--color-brand-500) 8%, transparent)";
                                e.currentTarget.style.borderColor =
                                    "color-mix(in srgb, var(--color-brand-500) 20%, transparent)";
                            }}
                        >
                            <Sparkles size={12} aria-hidden="true" />
                            Ask AI
                        </button>
                    )}
                </div>
            </div>
            <div role="img" aria-label={ariaLabel}>
                {children}
            </div>
        </section>
    );
}