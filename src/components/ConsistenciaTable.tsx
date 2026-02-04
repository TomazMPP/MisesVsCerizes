'use client';

import { AssetTableData } from '@/types';
import { formatPercent } from '@/lib/calculations';

interface Props {
  data: AssetTableData[];
}

export function ConsistenciaTable({ data }: Props) {
  return (
    <div className="w-full bg-[#111111] border border-[#222222] rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">Consistência</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-400 font-medium border-b border-[#222222]">
            <tr>
              <th className="py-3 px-4">Ativo</th>
              <th className="py-3 px-4 text-center">Meses positivos</th>
              <th className="py-3 px-4 text-center">Meses negativos</th>
              <th className="py-3 px-4 text-right">Maior retorno</th>
              <th className="py-3 px-4 text-right">Menor retorno</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {data.map((asset) => {
              const totalMonths = asset.consistency.positiveMonths + asset.consistency.negativeMonths;
              const posPercent = totalMonths > 0 ? (asset.consistency.positiveMonths / totalMonths) * 100 : 0;
              const negPercent = totalMonths > 0 ? (asset.consistency.negativeMonths / totalMonths) * 100 : 0;
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
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col">
                       <span className="text-white font-bold">{asset.consistency.positiveMonths}</span>
                       <span className="text-xs text-gray-500">{posPercent.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col">
                       <span className="text-white font-bold">{asset.consistency.negativeMonths}</span>
                       <span className="text-xs text-gray-500">{negPercent.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-green-400">
                     {formatPercent(asset.consistency.bestMonth)}
                  </td>
                  <td className="py-3 px-4 text-right text-red-400">
                     {formatPercent(asset.consistency.worstMonth)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
