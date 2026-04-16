import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorCardProps {
    title?: string;
    message: string;
    onRetry?: () => void;
}

export function ErrorCard({
    title = "Something went wrong",
    message,
    onRetry,
}: ErrorCardProps) {
    return (
        <div
            role="alert"
            style={{
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
            }}
        >
            <div
                style={{
                    flexShrink: 0,
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "50%",
                    backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <AlertCircle size={20} style={{ color: "var(--color-error)" }} aria-hidden="true" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                    style={{
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        margin: "0 0 0.25rem 0",
                    }}
                >
                    {title}
                </h3>
                <p
                    style={{
                        fontSize: "0.875rem",
                        color: "var(--color-text-muted)",
                        margin: 0,
                        lineHeight: 1.5,
                    }}
                >
                    {message}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        style={{
                            marginTop: "0.75rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            padding: "0.5rem 1rem",
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            color: "var(--color-brand-600)",
                            backgroundColor: "color-mix(in srgb, var(--color-brand-500) 8%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--color-brand-500) 20%, transparent)",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                        }}
                    >
                        <RefreshCw size={14} aria-hidden="true" />
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
}