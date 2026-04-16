import { Menu, Moon, Sun, MessageCircle } from "lucide-react";

interface TopBarProps {
    sidebarCollapsed: boolean;
    onMenuClick: () => void;
    breadcrumb: string;
    theme: "light" | "dark";
    onThemeToggle: () => void;
    onChatToggle: () => void;
    chatOpen: boolean;
}

export function TopBar({
    sidebarCollapsed, onMenuClick, breadcrumb, theme, onThemeToggle,
    onChatToggle, chatOpen,
}: TopBarProps) {
    return (
        <header
            style={{
                position: "fixed",
                top: 0,
                right: 0,
                left: sidebarCollapsed ? "64px" : "240px",
                height: "56px",
                backgroundColor: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 1.5rem",
                zIndex: 30,
                transition: "left 200ms ease",
            }}
            className="topbar"
        >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                    onClick={onMenuClick}
                    aria-label="Toggle navigation menu"
                    style={{
                        display: "none",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "2.25rem",
                        height: "2.25rem",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "transparent",
                        color: "var(--color-text-secondary)",
                        cursor: "pointer",
                    }}
                    className="hamburger-btn"
                >
                    <Menu size={20} aria-hidden="true" />
                </button>
            </div>

            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                }}
            >
                <span style={{ color: "var(--color-text-muted)" }}>Eurolens</span>
                <span style={{ color: "var(--color-text-muted)", margin: "0 0.5rem" }}>/</span>
                <span>{breadcrumb}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <button
                    onClick={onChatToggle}
                    aria-label={chatOpen ? "Close AI chat" : "Open AI chat"}
                    aria-expanded={chatOpen}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "2.25rem",
                        height: "2.25rem",
                        border: `1px solid ${chatOpen ? "var(--color-brand-300)" : "var(--color-border)"}`,
                        borderRadius: "var(--radius-md)",
                        backgroundColor: chatOpen
                            ? "color-mix(in srgb, var(--color-brand-500) 10%, transparent)"
                            : "var(--color-surface)",
                        color: chatOpen ? "var(--color-brand-600)" : "var(--color-text-secondary)",
                        cursor: "pointer",
                        transition: "all 150ms ease",
                        position: "relative",
                    }}
                    onMouseOver={(e) => {
                        if (!chatOpen) {
                            e.currentTarget.style.backgroundColor = "var(--color-surface-hover)";
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!chatOpen) {
                            e.currentTarget.style.backgroundColor = "var(--color-surface)";
                        }
                    }}
                >
                    <MessageCircle size={16} aria-hidden="true" />
                </button>
                <button
                    onClick={onThemeToggle}
                    aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "2.25rem",
                        height: "2.25rem",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text-secondary)",
                        cursor: "pointer",
                        transition: "all 150ms ease",
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-surface-hover)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-surface)";
                    }}
                >
                    {theme === "light" ? (
                        <Moon size={16} aria-hidden="true" />
                    ) : (
                        <Sun size={16} aria-hidden="true" />
                    )}
                </button>
            </div>
        </header>
    );
}