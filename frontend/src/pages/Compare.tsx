import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ComparisonPanel } from "@/components/dashboard/ComparisonPanel";
import { Select } from "@/components/ui/Select";
import { EU_COUNTRIES } from "@/lib/constants";

const countryOptions = EU_COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }));

export function Compare() {
    const [searchParams, setSearchParams] = useSearchParams();

    const countryA = searchParams.get("a") || "DE";
    const countryB = searchParams.get("b") || "FR";

    const handleCountryAChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const params = new URLSearchParams(searchParams);
            params.set("a", e.target.value);
            setSearchParams(params);
        },
        [searchParams, setSearchParams]
    );

    const handleCountryBChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const params = new URLSearchParams(searchParams);
            params.set("b", e.target.value);
            setSearchParams(params);
        },
        [searchParams, setSearchParams]
    );

    return (
        <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 1.5rem 0" }}>
                Country Comparison
            </h1>

            <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                <Select options={countryOptions} value={countryA} onChange={handleCountryAChange} label="Country A" />
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: 500, paddingBottom: "0.5rem" }}>
                    vs
                </span>
                <Select options={countryOptions} value={countryB} onChange={handleCountryBChange} label="Country B" />
            </div>

            <ComparisonPanel countryA={countryA} countryB={countryB} />
        </div>
    );
}