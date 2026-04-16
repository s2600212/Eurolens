import { useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, getCountryName } from "@/lib/constants";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

interface DashboardContext {
    currentPage: string;
    currentPath: string;
    liveData?: string;
    chartContext?: string;
}

const PAGE_NAMES: Record<string, string> = {
    "/": "Overview",
    "/rates": "Interest Rates",
    "/inflation": "Inflation",
    "/gdp": "GDP",
    "/unemployment": "Unemployment",
    "/compare": "Country Comparison",
};

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// Global state for chart context so ChartWrapper can set it
let pendingChartContext: string | null = null;

export function setPendingChartContext(context: string) {
    pendingChartContext = context;
}

export function consumePendingChartContext(): string | null {
    const ctx = pendingChartContext;
    pendingChartContext = null;
    return ctx;
}

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chartContext, setChartContext] = useState<string | null>(null);
    const location = useLocation();
    const queryClient = useQueryClient();
    const abortRef = useRef<AbortController | null>(null);

    const buildDashboardContext = useCallback((): DashboardContext => {
        const currentPath = location.pathname + location.search;
        const currentPage = PAGE_NAMES[location.pathname] || "Unknown";

        const liveDataParts: string[] = [];

        // ECB Rates
        const ratesData = queryClient.getQueryData<{
            mro: { date: string; value: number }[];
            deposit: { date: string; value: number }[];
            latestMRO: number | null;
            latestDeposit: number | null;
        }>(["ecb", "rates"]);

        if (ratesData) {
            if (ratesData.latestMRO !== null) {
                liveDataParts.push(`ECB 3-month rate (MRO proxy): ${ratesData.latestMRO.toFixed(2)}%`);
            }
            if (ratesData.latestDeposit !== null) {
                liveDataParts.push(`ECB day-to-day rate (deposit proxy): ${ratesData.latestDeposit.toFixed(2)}%`);
            }
        }

        // Eurozone inflation
        const inflationEZ = queryClient.getQueryData<{
            data: { date: string; value: number }[];
            latest: number | null;
        }>(["ecb", "inflation", "eurozone"]);

        if (inflationEZ?.latest !== null && inflationEZ?.latest !== undefined) {
            liveDataParts.push(`Eurozone HICP inflation (latest): ${inflationEZ.latest.toFixed(1)}%`);
        }

        // Country inflation
        const queryCache = queryClient.getQueryCache().getAll();
        for (const query of queryCache) {
            const key = query.queryKey;

            if (
                Array.isArray(key) &&
                key[0] === "ecb" &&
                key[1] === "inflation" &&
                key[2] === "countries"
            ) {
                const data = query.state.data as
                    | { country: string; data: { date: string; value: number }[]; latest: number | null }[]
                    | undefined;

                if (data && Array.isArray(data)) {
                    const countryValues = data
                        .filter((c) => c.latest !== null)
                        .map((c) => `${getCountryName(c.country)}: ${c.latest!.toFixed(1)}%`)
                        .join(", ");
                    if (countryValues) {
                        liveDataParts.push(`Country inflation (latest): ${countryValues}`);
                    }
                }
            }

            // GDP data
            if (
                Array.isArray(key) &&
                key[0] === "worldbank" &&
                key[1] === "gdp" &&
                key[2] !== "latest"
            ) {
                const data = query.state.data as
                    | { country: string; countryName: string; latest: number | null }[]
                    | undefined;

                if (data && Array.isArray(data)) {
                    const gdpValues = data
                        .filter((c) => c.latest !== null)
                        .map(
                            (c) =>
                                `${c.countryName || getCountryName(c.country)}: ${c.latest!.toFixed(2)}%`
                        )
                        .join(", ");
                    if (gdpValues) {
                        liveDataParts.push(`GDP growth (latest): ${gdpValues}`);
                    }
                }
            }

            // Unemployment data
            if (
                Array.isArray(key) &&
                key[0] === "eurostat" &&
                key[1] === "unemployment"
            ) {
                if (key[2] === "eurozone") {
                    const data = query.state.data as
                        | { latest: number | null; oneYearAgo: number | null }
                        | undefined;

                    if (data?.latest !== null && data?.latest !== undefined) {
                        liveDataParts.push(
                            `Eurozone unemployment rate (latest): ${data.latest.toFixed(1)}%`
                        );
                    }
                }

                if (key[2] === "countries") {
                    const data = query.state.data as
                        | { country: string; latest: number | null }[]
                        | undefined;

                    if (data && Array.isArray(data)) {
                        const values = data
                            .filter((c) => c.latest !== null)
                            .map((c) => `${getCountryName(c.country)}: ${c.latest!.toFixed(1)}%`)
                            .join(", ");
                        if (values) {
                            liveDataParts.push(`Country unemployment (latest): ${values}`);
                        }
                    }
                }
            }
        }

        // Consume any pending chart context
        const activeChartContext = chartContext || consumePendingChartContext();

        return {
            currentPage,
            currentPath,
            liveData: liveDataParts.length > 0 ? liveDataParts.join("\n") : undefined,
            chartContext: activeChartContext || undefined,
        };
    }, [location, queryClient, chartContext]);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isLoading) return;

            setError(null);

            const userMessage: ChatMessage = {
                id: generateId(),
                role: "user",
                content: content.trim(),
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);

            const history = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const dashboardContext = buildDashboardContext();

            // Clear chart context after using it
            setChartContext(null);

            abortRef.current = new AbortController();

            try {
                const response = await fetch(`${API_BASE_URL}/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: content.trim(),
                        history,
                        dashboardContext,
                    }),
                    signal: abortRef.current.signal,
                });

                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(
                        body.error || `Request failed with status ${response.status}`
                    );
                }

                const data = await response.json();

                const assistantMessage: ChatMessage = {
                    id: generateId(),
                    role: "assistant",
                    content: data.reply,
                    timestamp: Date.now(),
                };

                setMessages((prev) => [...prev, assistantMessage]);
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") return;

                const errorMsg =
                    err instanceof Error ? err.message : "Something went wrong.";
                setError(errorMsg);
            } finally {
                setIsLoading(false);
                abortRef.current = null;
            }
        },
        [messages, isLoading, buildDashboardContext]
    );

    const clearChat = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        setMessages([]);
        setError(null);
        setIsLoading(false);
        setChartContext(null);
    }, []);

    const setActiveChartContext = useCallback((ctx: string | null) => {
        setChartContext(ctx);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearChat,
        setActiveChartContext,
        chartContext,
    };
}