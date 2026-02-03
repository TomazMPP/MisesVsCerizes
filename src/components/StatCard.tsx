'use client';

import { formatCurrency, formatPercent } from '@/lib/calculations';
import { INITIAL_INVESTMENT } from '@/lib/constants';
import { ChartDataPoint } from '@/types';

interface StatCardProps {
  data: ChartDataPoint[];
}

interface AssetStat {
  name: string;
  currentValue: number;
  returnPercent: number;
  color: string;
}

export function StatCard({ data }: StatCardProps) {
  if (data.length === 0) return null;

  const lastPoint = data[data.length - 1];

  const assets: AssetStat[] = [
    {
      name: 'Bitcoin',
      currentValue: lastPoint.bitcoin,
      returnPercent: ((lastPoint.bitcoin - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: 'text-white',
    },
    {
      name: 'Ibovespa',
      currentValue: lastPoint.ibovespa,
      returnPercent: ((lastPoint.ibovespa - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: 'text-gray-400',
    },
    {
      name: 'CDI',
      currentValue: lastPoint.cdi || INITIAL_INVESTMENT,
      returnPercent: (((lastPoint.cdi || INITIAL_INVESTMENT) - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: 'text-gray-500',
    },
    {
      name: 'IPCA + 5%',
      currentValue: lastPoint.ipcaPlus5 || INITIAL_INVESTMENT,
      returnPercent: (((lastPoint.ipcaPlus5 || INITIAL_INVESTMENT) - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: 'text-gray-500',
    },
    {
      name: 'Dolar + 4%',
      currentValue: lastPoint.dolarPlus4 || INITIAL_INVESTMENT,
      returnPercent: (((lastPoint.dolarPlus4 || INITIAL_INVESTMENT) - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: 'text-gray-500',
    },
  ];

  // Sort by return percentage descending
  const sortedAssets = [...assets].sort((a, b) => b.returnPercent - a.returnPercent);

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4 text-center">Ranking</h2>
      <div className="space-y-3">
        {sortedAssets.map((asset, index) => (
          <div
            key={asset.name}
            className="flex items-center justify-between p-3 border border-gray-800 rounded"
          >
            <div className="flex items-center gap-3">
              <span className="text-muted text-sm w-6">{index + 1}.</span>
              <span className={`font-medium ${asset.color}`}>{asset.name}</span>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">{formatCurrency(asset.currentValue)}</p>
              <p
                className={`font-mono text-xs ${
                  asset.returnPercent >= 0 ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {formatPercent(asset.returnPercent)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
