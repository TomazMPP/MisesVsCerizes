'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartDataPoint } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MainChartProps {
  data: ChartDataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const date = parseISO(label);
  const formattedDate = format(date, "dd 'de' MMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="bg-black border border-gray-800 p-3 rounded">
      <p className="text-muted text-xs mb-2">{formattedDate}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm font-mono" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function MainChart({ data }: MainChartProps) {
  // Format date for X axis
  const formatXAxis = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, 'MMM/yy', { locale: ptBR });
  };

  // Format Y axis
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  // Filter data to show only every Nth point for performance
  const filteredData = data.filter((_, index) => index % 3 === 0 || index === data.length - 1);

  // Determine current winner for dynamic coloring
  const lastPoint = data[data.length - 1];
  const bitcoinWins = lastPoint ? lastPoint.bitcoin > lastPoint.ibovespa : true;
  
  const bitcoinColor = bitcoinWins ? '#FFFFFF' : '#666666';
  const ibovespaColor = !bitcoinWins ? '#FFFFFF' : '#666666';

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4 text-center">
        Bitcoin vs Ibovespa
      </h2>
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
              axisLine={{ stroke: '#333333' }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              stroke="#666666"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#333333' }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (
                <span className="text-sm text-muted">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="bitcoin"
              name="Bitcoin"
              stroke={bitcoinColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: bitcoinColor }}
            />
            <Line
              type="monotone"
              dataKey="ibovespa"
              name="Ibovespa"
              stroke={ibovespaColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: ibovespaColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
