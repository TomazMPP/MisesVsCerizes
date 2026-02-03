import { NextResponse } from 'next/server';
import {
  fetchBitcoinData,
  fetchIbovespaData,
  fetchCDIData,
  fetchIPCAData,
  fetchDolarData,
} from '@/lib/api';
import {
  pricesToPortfolioValues,
  calculateCDIAccumulated,
  calculateIPCAPlus5Accumulated,
  calculateDolarPlus4Accumulated,
  mergeDataForChart,
  calculateReturnPercent,
} from '@/lib/calculations';
import { INITIAL_INVESTMENT, COLORS } from '@/lib/constants';
import { ApiResponse } from '@/types';

export const revalidate = 86400; // Revalidate every 24 hours

export async function GET() {
  try {
    // Fetch all data in parallel
    const [bitcoinPrices, ibovespaPrices, cdiRates, ipcaRates, dolarPrices] =
      await Promise.all([
        fetchBitcoinData(),
        fetchIbovespaData(),
        fetchCDIData(),
        fetchIPCAData(),
        fetchDolarData(),
      ]);

    // Convert prices to portfolio values
    const bitcoinValues = pricesToPortfolioValues(bitcoinPrices);
    const ibovespaValues = pricesToPortfolioValues(ibovespaPrices);

    // Calculate benchmark values
    const cdiValues = calculateCDIAccumulated(cdiRates);

    // Get all dates for IPCA calculation
    const allDates = [...new Set([
      ...bitcoinValues.map(p => p.date),
      ...ibovespaValues.map(p => p.date),
    ])].sort();

    const ipcaPlus5Values = calculateIPCAPlus5Accumulated(ipcaRates, allDates);
    const dolarPlus4Values = calculateDolarPlus4Accumulated(dolarPrices);

    // Merge all data for chart
    const chartData = mergeDataForChart(
      bitcoinValues,
      ibovespaValues,
      cdiValues,
      ipcaPlus5Values,
      dolarPlus4Values
    );

    // Get current values (last data point)
    const bitcoinCurrent = bitcoinValues[bitcoinValues.length - 1]?.value || INITIAL_INVESTMENT;
    const ibovespaCurrent = ibovespaValues[ibovespaValues.length - 1]?.value || INITIAL_INVESTMENT;

    const response: ApiResponse = {
      bitcoin: {
        name: 'Bitcoin',
        color: COLORS.bitcoin,
        data: bitcoinValues,
        initialValue: INITIAL_INVESTMENT,
        currentValue: bitcoinCurrent,
        returnPercent: calculateReturnPercent(INITIAL_INVESTMENT, bitcoinCurrent),
      },
      ibovespa: {
        name: 'Ibovespa',
        color: COLORS.ibovespa,
        data: ibovespaValues,
        initialValue: INITIAL_INVESTMENT,
        currentValue: ibovespaCurrent,
        returnPercent: calculateReturnPercent(INITIAL_INVESTMENT, ibovespaCurrent),
      },
      benchmarks: {
        cdi: cdiValues,
        ipcaPlus5: ipcaPlus5Values,
        dolarPlus4: dolarPlus4Values,
      },
      chartData,
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
