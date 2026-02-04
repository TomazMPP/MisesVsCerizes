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
  isPrimary: boolean;
}

export function StatCard({ data }: StatCardProps) {
  if (data.length === 0) return null;

  const lastPoint = data[data.length - 1];

  const assets: AssetStat[] = [
    {
      name: 'Bitcoin',
      currentValue: lastPoint.bitcoin,
      returnPercent: ((lastPoint.bitcoin - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: '#FFFFFF',
      isPrimary: true,
    },
    {
      name: 'Ibovespa',
      currentValue: lastPoint.ibovespa,
      returnPercent: ((lastPoint.ibovespa - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: '#3B82F6',
      isPrimary: true,
    },
    {
      name: 'CDI',
      currentValue: lastPoint.cdi || INITIAL_INVESTMENT,
      returnPercent: (((lastPoint.cdi || INITIAL_INVESTMENT) - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: '#D97706',
      isPrimary: false,
    },
    {
      name: 'Poupança',
      currentValue: lastPoint.poupanca || INITIAL_INVESTMENT,
      returnPercent: (((lastPoint.poupanca || INITIAL_INVESTMENT) - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: '#7C3AED',
      isPrimary: false,
    },
    {
      name: 'IFIX',
      currentValue: lastPoint.ifix || INITIAL_INVESTMENT,
      returnPercent: (((lastPoint.ifix || INITIAL_INVESTMENT) - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: '#0F766E',
      isPrimary: false,
    },
    {
      name: 'IPCA',
      currentValue: lastPoint.ipca || INITIAL_INVESTMENT,
      returnPercent: (((lastPoint.ipca || INITIAL_INVESTMENT) - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: '#C2410C',
      isPrimary: false,
    },
    {
      name: 'IPCA + 5%',
      currentValue: lastPoint.ipcaPlus5 || INITIAL_INVESTMENT,
      returnPercent: (((lastPoint.ipcaPlus5 || INITIAL_INVESTMENT) - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: '#DC2626',
      isPrimary: false,
    },
    {
      name: 'Dólar + 4%',
      currentValue: lastPoint.dolarPlus4 || INITIAL_INVESTMENT,
      returnPercent: (((lastPoint.dolarPlus4 || INITIAL_INVESTMENT) - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100,
      color: '#059669',
      isPrimary: false,
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
            className={`flex items-center justify-between p-3 rounded transition-all ${
              asset.isPrimary
                ? 'border-2 bg-[#0A0A0A]'
                : 'border border-gray-800'
            }`}
            style={{
              borderColor: asset.isPrimary ? asset.color : undefined,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-muted text-sm w-6">{index + 1}.</span>
              <div
                className={`rounded-full ${asset.isPrimary ? 'w-3 h-5' : 'w-2 h-4'}`}
                style={{ backgroundColor: asset.color }}
              />
              <span
                className={asset.isPrimary ? 'font-bold text-base' : 'font-medium text-sm'}
                style={{ color: asset.color }}
              >
                {asset.name}
              </span>
            </div>
            <div className="text-right">
              <p className={`font-mono ${asset.isPrimary ? 'text-base' : 'text-sm'}`}>
                {formatCurrency(asset.currentValue)}
              </p>
              <p
                className={`font-mono text-xs ${
                  asset.returnPercent >= 0 ? 'text-gray-400' : 'text-red-400'
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
