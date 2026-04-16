import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
    options: SelectOption[];
    label?: string;
    placeholder?: string;
}

export function Select({ options, label, placeholder, id, ...props }: SelectProps) {
    const selectId = id || `select-${label?.replace(/\s/g, "-").toLowerCase()}`;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {label && (
                <label
                    htmlFor={selectId}
                    style={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                    }}
                >
                    {label}
                </label>
            )}
            <div style={{ position: "relative", display: "inline-flex" }}>
                <select
                    id={selectId}
                    style={{
                        appearance: "none",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text-primary)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.5rem 2.25rem 0.5rem 0.75rem",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        minWidth: "8rem",
                        lineHeight: 1.4,
                    }}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={14}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        right: "0.625rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-text-muted)",
                        pointerEvents: "none",
                    }}
                />
            </div>
        </div>
    );
}