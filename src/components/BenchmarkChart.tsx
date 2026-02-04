"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartDataPoint } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BenchmarkChartProps {
  data: ChartDataPoint[];
}

type BenchmarkKey = 'bitcoin' | 'ibovespa' | 'cdi' | 'ipcaPlus5' | 'dolarPlus4' | 'poupanca' | 'ipca' | 'ifix';

interface BenchmarkConfig {
  key: BenchmarkKey;
  name: string;
  color: string;
  strokeWidth: number;
  strokeDasharray?: string;
  defaultActive: boolean;
}

const BENCHMARKS: BenchmarkConfig[] = [
  { key: 'bitcoin', name: 'Bitcoin', color: '#FFFFFF', strokeWidth: 2, defaultActive: true },
  { key: 'ibovespa', name: 'Ibovespa', color: '#60A5FA', strokeWidth: 2, defaultActive: true },
  { key: 'ifix', name: 'IFIX', color: '#2DD4BF', strokeWidth: 2, defaultActive: false },
  { key: 'cdi', name: 'CDI', color: '#FBBF24', strokeWidth: 1.5, strokeDasharray: '5 5', defaultActive: true },
  { key: 'poupanca', name: 'Poupança', color: '#A78BFA', strokeWidth: 1.5, strokeDasharray: '2 2', defaultActive: true },
  { key: 'ipca', name: 'IPCA', color: '#FB923C', strokeWidth: 1.5, strokeDasharray: '6 2', defaultActive: false },
  { key: 'ipcaPlus5', name: 'IPCA + 5%', color: '#F87171', strokeWidth: 1.5, strokeDasharray: '3 3', defaultActive: false },
  { key: 'dolarPlus4', name: 'Dólar + 4%', color: '#34D399', strokeWidth: 1.5, strokeDasharray: '8 4', defaultActive: false },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const date = parseISO(label);
  const formattedDate = format(date, "dd 'de' MMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="bg-black border border-gray-800 p-3 rounded">
      <p className="text-muted text-xs mb-2">{formattedDate}</p>
      {payload.map((entry: any, index: number) => (
        <p
          key={index}
          className="text-sm font-mono"
          style={{ color: entry.color }}
        >
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function BenchmarkChart({ data }: BenchmarkChartProps) {
  const [activeLines, setActiveLines] = useState<Set<BenchmarkKey>>(() => {
    return new Set(BENCHMARKS.filter(b => b.defaultActive).map(b => b.key));
  });

  const toggleLine = (key: BenchmarkKey) => {
    setActiveLines(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const formatXAxis = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "MMM/yy", { locale: ptBR });
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  // Filter data for performance
  const filteredData = data.filter(
    (_, index) => index % 3 === 0 || index === data.length - 1,
  );

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4 text-center">
        Comparacao com Benchmarks
      </h2>

      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {BENCHMARKS.map((benchmark) => {
          const isActive = activeLines.has(benchmark.key);
          return (
            <button
              key={benchmark.key}
              onClick={() => toggleLine(benchmark.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                isActive
                  ? 'border-transparent'
                  : 'border-gray-700 bg-transparent text-gray-500'
              }`}
              style={{
                backgroundColor: isActive ? benchmark.color : undefined,
                color: isActive ? (benchmark.color === '#FFFFFF' ? '#000000' : '#FFFFFF') : undefined,
              }}
            >
              {benchmark.name}
            </button>
          );
        })}
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#666666"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#333333" }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              stroke="#666666"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#333333" }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />

            {BENCHMARKS.map((benchmark) => (
              activeLines.has(benchmark.key) && (
                <Line
                  key={benchmark.key}
                  type="monotone"
                  dataKey={benchmark.key}
                  name={benchmark.name}
                  stroke={benchmark.color}
                  strokeWidth={benchmark.strokeWidth}
                  strokeDasharray={benchmark.strokeDasharray}
                  dot={false}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
