import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { setPendingChartContext } from "@/hooks/useChat";

const pageTitles: Record<string, string> = {
    "/": "Overview",
    "/rates": "Interest Rates",
    "/inflation": "Inflation",
    "/gdp": "GDP",
    "/unemployment": "Unemployment",
    "/compare": "Compare",
};

interface AppShellContextType {
    openChatWithContext: (context: string) => void;
}

const AppShellContext = createContext<AppShellContextType>({
    openChatWithContext: () => { },
});

export function useAppShell() {
    return useContext(AppShellContext);
}

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() =>
        typeof window !== "undefined" ? window.matchMedia(query).matches : false
    );

    useEffect(() => {
        const mql = window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [query]);

    return matches;
}

export function AppShell() {
    const location = useLocation();
    const isTablet = useMediaQuery("(max-width: 1023px)");
    const isMobile = useMediaQuery("(max-width: 767px)");

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("eurolens-theme");
            if (stored === "dark" || stored === "light") return stored;
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return "light";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("eurolens-theme", theme);
    }, [theme]);

    useEffect(() => {
        if (isTablet && !isMobile) setSidebarCollapsed(true);
    }, [isTablet, isMobile]);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    }, []);

    const toggleChat = useCallback(() => {
        setChatOpen((prev) => !prev);
    }, []);

    const openChatWithContext = useCallback((context: string) => {
        setPendingChartContext(context);
        setChatOpen(true);
    }, []);

    const breadcrumb = pageTitles[location.pathname] || "Page";
    const effectiveCollapsed = isMobile ? true : sidebarCollapsed;
    const sidebarWidth = isMobile ? 0 : effectiveCollapsed ? 64 : 240;

    return (
        <AppShellContext.Provider value={{ openChatWithContext }}>
            <div style={{ minHeight: "100vh" }}>
                {!isMobile && (
                    <Sidebar
                        collapsed={effectiveCollapsed}
                        onToggle={() => setSidebarCollapsed((prev) => !prev)}
                        mobileOpen={false}
                        onMobileClose={() => { }}
                    />
                )}

                {isMobile && (
                    <Sidebar
                        collapsed={false}
                        onToggle={() => { }}
                        mobileOpen={mobileOpen}
                        onMobileClose={() => setMobileOpen(false)}
                    />
                )}

                <TopBar
                    sidebarCollapsed={effectiveCollapsed}
                    onMenuClick={() => setMobileOpen((prev) => !prev)}
                    breadcrumb={breadcrumb}
                    theme={theme}
                    onThemeToggle={toggleTheme}
                    onChatToggle={toggleChat}
                    chatOpen={chatOpen}
                />

                <main
                    style={{
                        marginLeft: sidebarWidth,
                        paddingTop: "56px",
                        transition: "margin-left 200ms ease",
                        minHeight: "100vh",
                    }}
                >
                    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem" }}>
                        <Outlet />
                    </div>
                </main>

                <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />

                <style>{`
          @media (max-width: 767px) {
            .topbar { left: 0 !important; }
            .hamburger-btn { display: flex !important; }
            .sidebar { width: 240px !important; transform: translateX(-100%); }
            .sidebar.sidebar-mobile-open { transform: translateX(0) !important; }
            .sidebar-toggle { display: none !important; }
          }
        `}</style>
            </div>
        </AppShellContext.Provider>
    );
}