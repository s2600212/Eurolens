import type { CSSProperties } from "react";

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
    style?: CSSProperties;
}

export function Skeleton({
    width = "100%",
    height = "1rem",
    borderRadius = "var(--radius-sm)",
    className = "",
    style,
}: SkeletonProps) {
    return (
        <div
            className={`animate-pulse ${className}`}
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: "var(--color-surface-active)",
                ...style,
            }}
            aria-hidden="true"
        />
    );
}

export function SkeletonKPICard() {
    return (
        <div
            style={{
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--color-border)",
            }}
        >
            <Skeleton width="40%" height="0.875rem" style={{ marginBottom: "0.75rem" }} />
            <Skeleton width="60%" height="2rem" style={{ marginBottom: "0.5rem" }} />
            <Skeleton width="50%" height="0.75rem" />
        </div>
    );
}

export function SkeletonChart({ height = 320 }: { height?: number }) {
    return (
        <div
            style={{
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--color-border)",
            }}
        >
            <Skeleton width="30%" height="1.25rem" style={{ marginBottom: "1rem" }} />
            <Skeleton width="100%" height={height} borderRadius="var(--radius-md)" />
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div
            style={{
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--color-border)",
            }}
        >
            <Skeleton width="25%" height="1.25rem" style={{ marginBottom: "1rem" }} />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                    <Skeleton width="20%" height="1rem" />
                    <Skeleton width="15%" height="1rem" />
                    <Skeleton width="15%" height="1rem" />
                    <Skeleton width="20%" height="1rem" />
                </div>
            ))}
        </div>
    );
}