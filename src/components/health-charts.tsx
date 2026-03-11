"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import type { HealthTrend } from "@/lib/health-scores";

const CATEGORY_COLORS: Record<string, string> = {
  uptime: "#10b981",
  patching: "#3b82f6",
  backups: "#f59e0b",
  security: "#8b5cf6",
};

const CATEGORY_LABELS: Record<string, string> = {
  uptime: "Uptime",
  patching: "Patching",
  backups: "Backups",
  security: "Security",
};

interface HealthTrendChartProps {
  data: HealthTrend[];
}

export function HealthTrendChart({ data }: HealthTrendChartProps) {
  return (
    <div role="img" aria-label="IT-gezondheid trend grafiek: toont uptime, patching, backups en security scores over tijd">
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis
          domain={[40, 100]}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          formatter={(value, name) => [
            `${String(value)}%`,
            CATEGORY_LABELS[String(name)] ?? String(name),
          ]}
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Legend
          formatter={(value: string) => CATEGORY_LABELS[value] ?? value}
          iconType="circle"
        />
        {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}

interface ScoreRingProps {
  score: number;
  label: string;
  color: string;
}

export function ScoreRing({ score, label, color }: ScoreRingProps) {
  const data = [
    { name: label, value: score, fill: color },
  ];

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label}: ${score} procent`}>
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="100%"
            startAngle={90}
            endAngle={90 - (score / 100) * 360}
            data={data}
            barSize={8}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={4}
              background={{ fill: "#f3f4f6" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground mt-1">
        {label}
      </span>
    </div>
  );
}
