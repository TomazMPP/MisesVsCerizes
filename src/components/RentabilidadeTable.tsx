'use client';

import { AssetTableData } from '@/types';
import { formatPercent } from '@/lib/calculations';

interface Props {
  data: AssetTableData[];
}

export function RentabilidadeTable({ data }: Props) {
  return (
    <div className="w-full bg-[#111111] border border-[#222222] rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">Rentabilidade histórica</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-400 font-medium border-b border-[#222222]">
            <tr>
              <th className="py-3 px-4">Ativo</th>
              <th className="py-3 px-4 text-right">No mês</th>
              <th className="py-3 px-4 text-right">No ano</th>
              <th className="py-3 px-4 text-right">3M</th>
              <th className="py-3 px-4 text-right">6M</th>
              <th className="py-3 px-4 text-right">12M</th>
              <th className="py-3 px-4 text-right">24M</th>
              <th className="py-3 px-4 text-right">Inicio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {data.map((asset) => {
              const isPrimary = asset.name === 'Bitcoin' || asset.name === 'Ibovespa';
              return (
              <tr
                key={asset.name}
                className={`transition-colors ${isPrimary ? 'bg-[#0A0A0A]' : 'hover:bg-[#1A1A1A]'}`}
              >
                <td className="py-3 px-4 font-medium flex items-center gap-2">
                  <div
                    className={`rounded-full ${isPrimary ? 'w-3 h-5' : 'w-2 h-4'}`}
                    style={{ backgroundColor: asset.color }}
                  />
                  <span
                    className={isPrimary ? 'font-bold' : ''}
                    style={{ color: asset.color }}
                  >
                    {asset.name}
                  </span>
                </td>
                <td className={`py-3 px-4 text-right ${asset.returns.currentMonth >= 0 ? 'text-white' : 'text-red-400'}`}>
                   {formatPercent(asset.returns.currentMonth)}
                </td>
                <td className={`py-3 px-4 text-right ${asset.returns.yearToDate >= 0 ? 'text-white' : 'text-red-400'}`}>
                   {formatPercent(asset.returns.yearToDate)}
                </td>
                <td className={`py-3 px-4 text-right ${asset.returns.last3Months >= 0 ? 'text-white' : 'text-red-400'}`}>
                   {formatPercent(asset.returns.last3Months)}
                </td>
                <td className={`py-3 px-4 text-right ${asset.returns.last6Months >= 0 ? 'text-white' : 'text-red-400'}`}>
                   {formatPercent(asset.returns.last6Months)}
                </td>
                <td className={`py-3 px-4 text-right ${asset.returns.last12Months >= 0 ? 'text-white' : 'text-red-400'}`}>
                   {formatPercent(asset.returns.last12Months)}
                </td>
                <td className={`py-3 px-4 text-right ${asset.returns.last24Months >= 0 ? 'text-white' : 'text-red-400'}`}>
                   {formatPercent(asset.returns.last24Months)}
                </td>
                <td className={`py-3 px-4 text-right ${asset.returns.sinceInception >= 0 ? 'text-white' : 'text-red-400'}`}>
                   {formatPercent(asset.returns.sinceInception)}
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
