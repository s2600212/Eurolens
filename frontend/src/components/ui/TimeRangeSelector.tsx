import { Button } from "./Button";
import type { TimeRange } from "@/types/chart";

interface TimeRangeSelectorProps {
    value: TimeRange;
    onChange: (range: TimeRange) => void;
    options?: TimeRange[];
}

export function TimeRangeSelector({
    value,
    onChange,
    options = ["1Y", "2Y", "5Y", "ALL"],
}: TimeRangeSelectorProps) {
    return (
        <nav role="group" aria-label="Time range selection" style={{ display: "flex", gap: "0.25rem" }}>
            {options.map((range) => (
                <Button
                    key={range}
                    size="sm"
                    variant="ghost"
                    active={value === range}
                    onClick={() => onChange(range)}
                    aria-pressed={value === range}
                >
                    {range}
                </Button>
            ))}
        </nav>
    );
}