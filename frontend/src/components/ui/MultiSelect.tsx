import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, X, Check } from "lucide-react";

interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    label?: string;
    placeholder?: string;
    maxSelections?: number;
    id?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    label,
    placeholder = "Select...",
    maxSelections,
    id,
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectId = id || `multiselect-${label?.replace(/\s/g, "-").toLowerCase()}`;

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((s) => s !== value));
        } else {
            if (maxSelections && selected.length >= maxSelections) return;
            onChange([...selected, value]);
        }
    };

    const removeOption = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter((s) => s !== value));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const handleOptionKeyDown = (e: React.KeyboardEvent, value: string) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleOption(value);
        }
    };

    const selectedLabels = options.filter((o) => selected.includes(o.value));

    return (
        <div
            style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
            ref={containerRef}
        >
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
                    {maxSelections && (
                        <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: "normal" }}>
                            {" "}(max {maxSelections})
                        </span>
                    )}
                </label>
            )}
            <div style={{ position: "relative" }}>
                <div
                    id={selectId}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-label={label || "Select options"}
                    tabIndex={0}
                    onClick={() => setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.25rem",
                        minHeight: "2.375rem",
                        padding: "0.25rem 2.25rem 0.25rem 0.5rem",
                        backgroundColor: "var(--color-surface)",
                        border: `1px solid ${isOpen ? "var(--color-brand-400)" : "var(--color-border)"}`,
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        transition: "border-color 150ms ease",
                    }}
                >
                    {selectedLabels.length === 0 && (
                        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                            {placeholder}
                        </span>
                    )}
                    {selectedLabels.map((opt) => (
                        <span
                            key={opt.value}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                padding: "0.125rem 0.375rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                backgroundColor: "color-mix(in srgb, var(--color-brand-500) 10%, transparent)",
                                color: "var(--color-brand-700)",
                                borderRadius: "var(--radius-sm)",
                                lineHeight: 1.4,
                            }}
                        >
                            {opt.label}
                            <button
                                type="button"
                                onClick={(e) => removeOption(opt.value, e)}
                                aria-label={`Remove ${opt.label}`}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: 0,
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    color: "inherit",
                                    lineHeight: 1,
                                }}
                            >
                                <X size={12} aria-hidden="true" />
                            </button>
                        </span>
                    ))}
                    <ChevronDown
                        size={14}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            right: "0.625rem",
                            top: "50%",
                            transform: `translateY(-50%) rotate(${isOpen ? "180deg" : "0deg"})`,
                            color: "var(--color-text-muted)",
                            transition: "transform 150ms ease",
                            pointerEvents: "none",
                        }}
                    />
                </div>

                {isOpen && (
                    <ul
                        role="listbox"
                        aria-multiselectable="true"
                        style={{
                            position: "absolute",
                            zIndex: 50,
                            top: "calc(100% + 4px)",
                            left: 0,
                            right: 0,
                            maxHeight: "16rem",
                            overflowY: "auto",
                            backgroundColor: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            boxShadow: "var(--shadow-lg)",
                            padding: "0.25rem",
                            margin: 0,
                            listStyle: "none",
                        }}
                    >
                        {options.map((opt) => {
                            const isSelected = selected.includes(opt.value);
                            const isDisabled =
                                !isSelected && maxSelections !== undefined && selected.length >= maxSelections;

                            return (
                                <li
                                    key={opt.value}
                                    role="option"
                                    aria-selected={isSelected}
                                    tabIndex={0}
                                    onClick={() => !isDisabled && toggleOption(opt.value)}
                                    onKeyDown={(e) => !isDisabled && handleOptionKeyDown(e, opt.value)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "0.5rem 0.75rem",
                                        fontSize: "0.8125rem",
                                        borderRadius: "var(--radius-sm)",
                                        cursor: isDisabled ? "not-allowed" : "pointer",
                                        color: isDisabled ? "var(--color-text-muted)" : "var(--color-text-primary)",
                                        backgroundColor: isSelected
                                            ? "color-mix(in srgb, var(--color-brand-500) 8%, transparent)"
                                            : "transparent",
                                        opacity: isDisabled ? 0.5 : 1,
                                    }}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && (
                                        <Check size={14} style={{ color: "var(--color-brand-600)" }} aria-hidden="true" />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}