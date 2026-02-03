'use client';

import { useEffect, useState } from 'react';
import { Scoreboard, MainChart, BenchmarkChart, StatCard, Loading, RentabilidadeTable, ConsistenciaTable } from '@/components';
import { ApiResponse } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/data');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.details || result.error || 'Failed to fetch data');
        }
        
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">Erro ao carregar dados</div>
        <p className="text-muted text-center max-w-lg mx-auto mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 border border-gray-700 rounded hover:bg-gray-900 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const lastUpdate = new Date(data.lastUpdate);
  const formattedUpdate = format(lastUpdate, "dd 'de' MMMM 'de' yyyy 'as' HH:mm", {
    locale: ptBR,
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Scoreboard */}
        <section className="mb-16">
          <Scoreboard
            bitcoinValue={data.bitcoin.currentValue}
            ibovespaValue={data.ibovespa.currentValue}
            bitcoinReturn={data.bitcoin.returnPercent}
            ibovespaReturn={data.ibovespa.returnPercent}
          />
        </section>

        {/* Main Chart */}
        <section className="mb-16">
          <MainChart data={data.chartData} />
        </section>

        {/* Benchmark Comparison */}
        <section className="mb-16">
          <BenchmarkChart data={data.chartData} />
        </section>

 {/* Stats */}
        <section className="mb-16 max-w-md mx-auto">
          <StatCard data={data.chartData} />
        </section>
        
        {/* Analytics Tables */}
        {data.tableData && (
          <div className="grid grid-cols-1 gap-8 mb-16">
            <section>
              <RentabilidadeTable data={data.tableData} />
            </section>
            <section>
              <ConsistenciaTable data={data.tableData} />
            </section>
          </div>
        )}

       

        {/* Footer */}
        <footer className="text-center text-muted text-xs">
          <p>Ultima atualizacao: {formattedUpdate}</p>
          <p className="mt-2">
            Dados: Binance, Yahoo Finance, Banco Central do Brasil
          </p>
          <p className="mt-4 text-gray-700">
            Aposta iniciada em 24/06/2024 | R$ 100.000 cada
          </p>
        </footer>
      </div>
    </main>
  );
}
