import type { ButtonHTMLAttributes, ReactNode, CSSProperties } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    children: ReactNode;
    active?: boolean;
}

const baseStyles: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.375rem",
    fontWeight: 500,
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    transition: "all 150ms ease",
    border: "1px solid transparent",
    lineHeight: 1,
    whiteSpace: "nowrap",
};

const variantStyles: Record<string, CSSProperties> = {
    primary: {
        backgroundColor: "var(--color-brand-600)",
        color: "#ffffff",
        borderColor: "var(--color-brand-600)",
    },
    secondary: {
        backgroundColor: "var(--color-surface)",
        color: "var(--color-text-secondary)",
        borderColor: "var(--color-border)",
    },
    ghost: {
        backgroundColor: "transparent",
        color: "var(--color-text-secondary)",
        borderColor: "transparent",
    },
};

const activeStyles: Record<string, CSSProperties> = {
    primary: { backgroundColor: "var(--color-brand-700)" },
    secondary: {
        backgroundColor: "var(--color-brand-50)",
        color: "var(--color-brand-700)",
        borderColor: "var(--color-brand-200)",
    },
    ghost: {
        backgroundColor: "var(--color-surface-hover)",
        color: "var(--color-brand-700)",
    },
};

const sizeStyles: Record<string, CSSProperties> = {
    sm: { fontSize: "0.75rem", padding: "0.375rem 0.75rem", height: "1.875rem" },
    md: { fontSize: "0.8125rem", padding: "0.5rem 1rem", height: "2.25rem" },
    lg: { fontSize: "0.875rem", padding: "0.625rem 1.25rem", height: "2.625rem" },
};

export function Button({
    variant = "secondary",
    size = "md",
    active = false,
    children,
    style,
    disabled,
    ...props
}: ButtonProps) {
    const computedStyle: CSSProperties = {
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...(active ? activeStyles[variant] : {}),
        ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
        ...style,
    };

    return (
        <button style={computedStyle} disabled={disabled} {...props}>
            {children}
        </button>
    );
}