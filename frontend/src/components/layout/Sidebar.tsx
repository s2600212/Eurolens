import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Percent, TrendingUp, BarChart3,
    GitCompareArrows, ChevronLeft, ChevronRight, Users,
} from "lucide-react";

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

const navItems = [
    { path: "/", label: "Overview", icon: LayoutDashboard },
    { path: "/rates", label: "Interest Rates", icon: Percent },
    { path: "/inflation", label: "Inflation", icon: TrendingUp },
    { path: "/gdp", label: "GDP", icon: BarChart3 },
    { path: "/unemployment", label: "Unemployment", icon: Users },
    { path: "/compare", label: "Compare", icon: GitCompareArrows },
];

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
    const location = useLocation();

    return (
        <>
            {mobileOpen && (
                <div
                    style={{ position: "fixed", inset: 0, zIndex: 40, backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={onMobileClose}
                    aria-hidden="true"
                />
            )}

            <aside
                role="navigation"
                aria-label="Main navigation"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: collapsed ? "64px" : "240px",
                    backgroundColor: "var(--color-sidebar-bg)",
                    borderRight: "1px solid var(--color-sidebar-border)",
                    transition: "width 200ms ease, transform 200ms ease",
                    zIndex: 50,
                    display: "flex",
                    flexDirection: "column",
                    transform: mobileOpen ? "translateX(0)" : undefined,
                    overflowX: "hidden",
                }}
                className={`sidebar ${mobileOpen ? "sidebar-mobile-open" : ""}`}
            >
                {/* Logo */}
                <div
                    style={{
                        height: "56px",
                        display: "flex",
                        alignItems: "center",
                        padding: collapsed ? "0 1rem" : "0 1.25rem",
                        borderBottom: "1px solid var(--color-sidebar-border)",
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "var(--color-brand-500)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.125rem", lineHeight: 1 }}>
                            E
                        </span>
                    </div>
                    {!collapsed && (
                        <span
                            style={{
                                marginLeft: "0.75rem",
                                fontSize: "1.125rem",
                                fontWeight: 700,
                                color: "var(--color-sidebar-text-active)",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Eurolens
                        </span>
                    )}
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "0.75rem 0.5rem", overflowY: "auto" }}>
                    <ul
                        style={{
                            listStyle: "none",
                            margin: 0,
                            padding: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.125rem",
                        }}
                    >
                        {navItems.map((item) => {
                            const isActive =
                                item.path === "/"
                                    ? location.pathname === "/"
                                    : location.pathname.startsWith(item.path);
                            const Icon = item.icon;

                            return (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        onClick={onMobileClose}
                                        title={collapsed ? item.label : undefined}
                                        aria-label={collapsed ? item.label : undefined}
                                        aria-current={isActive ? "page" : undefined}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.75rem",
                                            padding: collapsed ? "0.625rem" : "0.625rem 0.75rem",
                                            borderRadius: "var(--radius-md)",
                                            fontSize: "0.875rem",
                                            fontWeight: isActive ? 600 : 400,
                                            color: isActive
                                                ? "var(--color-sidebar-text-active)"
                                                : "var(--color-sidebar-text)",
                                            backgroundColor: isActive
                                                ? "var(--color-sidebar-active-bg)"
                                                : "transparent",
                                            textDecoration: "none",
                                            transition: "all 150ms ease",
                                            justifyContent: collapsed ? "center" : "flex-start",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            position: "relative",
                                        }}
                                        onMouseOver={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.backgroundColor = "var(--color-sidebar-hover)";
                                                e.currentTarget.style.color = "var(--color-sidebar-text-hover)";
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.backgroundColor = "transparent";
                                                e.currentTarget.style.color = "var(--color-sidebar-text)";
                                            }
                                        }}
                                    >
                                        {isActive && (
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    left: 0,
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    width: "3px",
                                                    height: "60%",
                                                    borderRadius: "0 2px 2px 0",
                                                    backgroundColor: "var(--color-sidebar-active-indicator)",
                                                }}
                                                aria-hidden="true"
                                            />
                                        )}
                                        <Icon size={20} aria-hidden="true" style={{ flexShrink: 0 }} />
                                        {!collapsed && <span>{item.label}</span>}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Collapse toggle */}
                <div
                    style={{
                        padding: "0.75rem 0.5rem",
                        borderTop: "1px solid var(--color-sidebar-border)",
                        flexShrink: 0,
                    }}
                    className="sidebar-toggle"
                >
                    <button
                        onClick={onToggle}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: collapsed ? "center" : "flex-start",
                            gap: "0.75rem",
                            width: "100%",
                            padding: "0.625rem 0.75rem",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "transparent",
                            color: "var(--color-sidebar-text)",
                            cursor: "pointer",
                            fontSize: "0.8125rem",
                            transition: "all 150ms ease",
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--color-sidebar-hover)";
                            e.currentTarget.style.color = "var(--color-sidebar-text-hover)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "var(--color-sidebar-text)";
                        }}
                    >
                        {collapsed ? (
                            <ChevronRight size={18} aria-hidden="true" />
                        ) : (
                            <>
                                <ChevronLeft size={18} aria-hidden="true" />
                                <span>Collapse</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}