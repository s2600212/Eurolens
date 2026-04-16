import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
    icon?: ReactNode;
    title?: string;
    description?: string;
}

export function EmptyState({
    icon,
    title = "No data available",
    description = "There is no data to display for the current selection.",
}: EmptyStateProps) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem 1.5rem",
                textAlign: "center",
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
            }}
        >
            <div
                style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-surface-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                    color: "var(--color-text-muted)",
                }}
            >
                {icon || <Inbox size={24} aria-hidden="true" />}
            </div>
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
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    margin: 0,
                    maxWidth: "24rem",
                }}
            >
                {description}
            </p>
        </div>
    );
}