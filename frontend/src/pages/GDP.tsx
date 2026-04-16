import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppShell } from "@/components/layout/AppShell";
import { GDPPanel } from "@/components/dashboard/GDPPanel";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { EU_COUNTRIES } from "@/lib/constants";
import type { ChartType } from "@/types/chart";

const allCountryCodes = EU_COUNTRIES.map((c) => c.code);
const countryOptions = EU_COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }));

export function GDP() {
    const { openChatWithContext } = useAppShell();
    const [searchParams, setSearchParams] = useSearchParams();

    const countriesParam = searchParams.get("countries");
    const selectedCountries = useMemo(() => {
        if (countriesParam) return countriesParam.split(",").filter(Boolean);
        return allCountryCodes;
    }, [countriesParam]);

    const [chartType, setChartType] = useState<ChartType>("grouped");

    const handleCountriesChange = useCallback(
        (countries: string[]) => {
            const params = new URLSearchParams(searchParams);
            if (countries.length > 0 && countries.length < allCountryCodes.length) {
                params.set("countries", countries.join(","));
            } else {
                params.delete("countries");
            }
            setSearchParams(params);
        },
        [searchParams, setSearchParams]
    );

    return (
        <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 1.5rem 0" }}>
                GDP Growth
            </h1>

            <div style={{ marginBottom: "1.5rem" }}>
                <MultiSelect options={countryOptions} selected={selectedCountries} onChange={handleCountriesChange} label="Countries" placeholder="Select countries..." />
            </div>

            <GDPPanel countryCodes={selectedCountries} chartType={chartType} onChartTypeChange={setChartType} onAskAI={openChatWithContext} />
        </div>
    );
}