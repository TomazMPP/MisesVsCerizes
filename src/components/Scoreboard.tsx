'use client';

import { formatCurrency, formatPercent } from '@/lib/calculations';
import { PARTICIPANTS } from '@/lib/constants';

interface ScoreboardProps {
  bitcoinValue: number;
  ibovespaValue: number;
  bitcoinReturn: number;
  ibovespaReturn: number;
}

export function Scoreboard({
  bitcoinValue,
  ibovespaValue,
  bitcoinReturn,
  ibovespaReturn,
}: ScoreboardProps) {
  const bitcoinWinning = bitcoinValue > ibovespaValue;
  const difference = Math.abs(bitcoinValue - ibovespaValue);
  const differencePercent = Math.abs(bitcoinReturn - ibovespaReturn);

  return (
    <div className="w-full">
      {/* Title */}
      <h1 className="text-center text-2xl md:text-4xl font-bold tracking-tight mb-2">
        MISES VS CERIZE
      </h1>
      <p className="text-center text-muted text-sm mb-8">
        R$ 100.000 desde 24/06/2024
      </p>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Bitcoin Side */}
        <div
          className={`text-right transition-opacity duration-300 ${
            bitcoinWinning ? 'opacity-100' : 'opacity-50'
          }`}
        >
          <p className="text-muted text-xs uppercase tracking-wider mb-1">
            {PARTICIPANTS.bitcoin.name}
          </p>
          <p className="text-2xl md:text-4xl font-bold font-mono">
            {formatCurrency(bitcoinValue)}
          </p>
          <p
            className={`text-sm font-mono ${
              bitcoinReturn >= 0 ? 'text-white' : 'text-gray-500'
            }`}
          >
            {formatPercent(bitcoinReturn)}
          </p>
          <p className="text-muted text-xs mt-1">{PARTICIPANTS.bitcoin.asset}</p>
        </div>

        {/* VS Divider */}
        <div className="text-center">
          <div className="text-muted text-lg font-light">vs</div>
          <div className="text-xs text-muted mt-2">
            Diferenca
            <br />
            <span className="text-white font-mono">
              {formatCurrency(difference)}
            </span>
            <br />
            <span className="text-muted font-mono">
              ({differencePercent.toFixed(1)}pp)
            </span>
          </div>
        </div>

        {/* Ibovespa Side */}
        <div
          className={`text-left transition-opacity duration-300 ${
            !bitcoinWinning ? 'opacity-100' : 'opacity-50'
          }`}
        >
          <p className="text-muted text-xs uppercase tracking-wider mb-1">
            {PARTICIPANTS.ibovespa.name}
          </p>
          <p className="text-2xl md:text-4xl font-bold font-mono">
            {formatCurrency(ibovespaValue)}
          </p>
          <p
            className={`text-sm font-mono ${
              ibovespaReturn >= 0 ? 'text-white' : 'text-gray-500'
            }`}
          >
            {formatPercent(ibovespaReturn)}
          </p>
          <p className="text-muted text-xs mt-1">{PARTICIPANTS.ibovespa.asset}</p>
        </div>
      </div>

      {/* Winner indicator */}
      <div className="text-center mt-6">
        <span className="text-muted text-xs uppercase tracking-wider">
          Vencendo:{' '}
        </span>
        <span className="text-white font-medium">
          {bitcoinWinning ? PARTICIPANTS.bitcoin.asset : PARTICIPANTS.ibovespa.asset}
        </span>
      </div>
    </div>
  );
}
