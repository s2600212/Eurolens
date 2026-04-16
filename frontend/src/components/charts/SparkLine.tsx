import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparkLineProps {
    data: { value: number }[];
    color?: string;
    width?: number;
    height?: number;
}

export function SparkLine({
    data, color = "var(--color-brand-500)", width = 80, height = 24,
}: SparkLineProps) {
    if (data.length === 0) return null;

    return (
        <div style={{ width, height, display: "inline-block" }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}