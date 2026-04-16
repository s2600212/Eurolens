import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Overview } from "@/pages/Overview";
import { InterestRates } from "@/pages/InterestRates";
import { Inflation } from "@/pages/Inflation";
import { GDP } from "@/pages/GDP";
import { Unemployment } from "@/pages/Unemployment";
import { Compare } from "@/pages/Compare";
import "./index.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
            refetchOnWindowFocus: false,
        },
    },
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppShell />}>
                        <Route path="/" element={<Overview />} />
                        <Route path="/rates" element={<InterestRates />} />
                        <Route path="/inflation" element={<Inflation />} />
                        <Route path="/gdp" element={<GDP />} />
                        <Route path="/unemployment" element={<Unemployment />} />
                        <Route path="/compare" element={<Compare />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>
);