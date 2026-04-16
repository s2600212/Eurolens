interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "error" | "warning" | "info";
}

const variantColors: Record<string, { bg: string; text: string }> = {
    default: { bg: "var(--color-surface-hover)", text: "var(--color-text-secondary)" },
    success: {
        bg: "color-mix(in srgb, var(--color-success) 10%, transparent)",
        text: "var(--color-success)",
    },
    error: {
        bg: "color-mix(in srgb, var(--color-error) 10%, transparent)",
        text: "var(--color-error)",
    },
    warning: {
        bg: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
        text: "var(--color-warning)",
    },
    info: {
        bg: "color-mix(in srgb, var(--color-brand-500) 10%, transparent)",
        text: "var(--color-brand-700)",
    },
};

export function Badge({ children, variant = "default" }: BadgeProps) {
    const colors = variantColors[variant];

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.125rem 0.5rem",
                fontSize: "0.6875rem",
                fontWeight: 600,
                borderRadius: "9999px",
                backgroundColor: colors.bg,
                color: colors.text,
                lineHeight: 1.5,
                letterSpacing: "0.02em",
            }}
        >
            {children}
        </span>
    );
}