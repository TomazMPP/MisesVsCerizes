import { NextResponse } from 'next/server';
import {
  fetchBitcoinData,
  fetchIbovespaData,
  fetchCDIData,
  fetchIPCAData,
  fetchDolarData,
  fetchPoupancaData,
  fetchIFIXData,
} from '@/lib/api';
import {
  pricesToPortfolioValues,
  calculateCDIAccumulated,
  calculateIPCAPlus5Accumulated,
  calculateDolarPlus4Accumulated,
  calculatePoupancaAccumulated,
  calculateIPCAAccumulated,
  mergeDataForChart,
  calculateReturnPercent,
  calculateAssetStatistics,
  calculateMonthlyIndicatorStatistics,
} from '@/lib/calculations';
import { INITIAL_INVESTMENT, COLORS } from '@/lib/constants';
import { ApiResponse, AssetTableData } from '@/types';

export const revalidate = 3600; // Revalidate every 1 hour

export async function GET() {
  try {
    // Fetch all data in parallel
    const [bitcoinPrices, ibovespaPrices, cdiRates, ipcaRates, dolarPrices, poupancaRates, ifixPrices] =
      await Promise.all([
        fetchBitcoinData(),
        fetchIbovespaData(),
        fetchCDIData(),
        fetchIPCAData(),
        fetchDolarData(),
        fetchPoupancaData(),
        fetchIFIXData(),
      ]);

    // Convert prices to portfolio values
    const bitcoinValues = pricesToPortfolioValues(bitcoinPrices);
    const ibovespaValues = pricesToPortfolioValues(ibovespaPrices);

    // Calculate benchmark values
    const cdiValues = calculateCDIAccumulated(cdiRates);

    // Get all dates for monthly benchmarks calculation
    const allDates = [...new Set([
      ...bitcoinValues.map(p => p.date),
      ...ibovespaValues.map(p => p.date),
    ])].sort();

    const ipcaPlus5Values = calculateIPCAPlus5Accumulated(ipcaRates, allDates);
    const dolarPlus4Values = calculateDolarPlus4Accumulated(dolarPrices);
    const poupancaValues = calculatePoupancaAccumulated(poupancaRates, allDates);
    const ipcaValues = calculateIPCAAccumulated(ipcaRates, allDates);
    const ifixValues = pricesToPortfolioValues(ifixPrices);

    // Merge all data for chart
    const chartData = mergeDataForChart(
      bitcoinValues,
      ibovespaValues,
      cdiValues,
      ipcaPlus5Values,
      dolarPlus4Values,
      poupancaValues,
      ipcaValues,
      ifixValues
    );

    // Get current values (last data point)
    const bitcoinCurrent = bitcoinValues[bitcoinValues.length - 1]?.value || INITIAL_INVESTMENT;
    const ibovespaCurrent = ibovespaValues[ibovespaValues.length - 1]?.value || INITIAL_INVESTMENT;

    // Calculate statistics for tables
    const bitcoinStats = calculateAssetStatistics(bitcoinValues);
    const ibovespaStats = calculateAssetStatistics(ibovespaValues);
    const cdiStats = calculateAssetStatistics(cdiValues);
    const dolarPlus4Stats = calculateAssetStatistics(dolarPlus4Values);
    const poupancaStats = calculateMonthlyIndicatorStatistics(poupancaRates, poupancaValues);
    const ifixStats = calculateAssetStatistics(ifixValues);

    // Use monthly indicator calculation for IPCA (based on available months of data)
    const ipcaStats = calculateMonthlyIndicatorStatistics(ipcaRates, ipcaValues);

    // For IPCA+5%, calculate monthly rates with spread (5% a.a. = ~0.407% per month)
    const monthlySpread = (Math.pow(1.05, 1 / 12) - 1) * 100;
    const ipcaPlus5Rates = ipcaRates.map(rate => ({
      date: rate.date,
      value: rate.value + monthlySpread,
    }));
    const ipcaPlus5Stats = calculateMonthlyIndicatorStatistics(ipcaPlus5Rates, ipcaPlus5Values);

    const tableData: AssetTableData[] = [
      { name: 'Bitcoin', color: COLORS.bitcoin, ...bitcoinStats },
      { name: 'Ibovespa', color: COLORS.ibovespa, ...ibovespaStats },
      { name: 'CDI', color: COLORS.cdi, ...cdiStats },
      { name: 'Poupança', color: COLORS.poupanca, ...poupancaStats },
      { name: 'IFIX', color: COLORS.ifix, ...ifixStats },
      { name: 'IPCA', color: COLORS.ipca, ...ipcaStats },
      { name: 'IPCA + 5%', color: COLORS.ipcaPlus5, ...ipcaPlus5Stats },
      { name: 'Dólar + 4%', color: COLORS.dolarPlus4, ...dolarPlus4Stats },
    ];

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
        poupanca: poupancaValues,
        ipca: ipcaValues,
        ifix: ifixValues,
      },
      chartData,
      tableData,
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
}
