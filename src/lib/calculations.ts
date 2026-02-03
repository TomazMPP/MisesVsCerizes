import { PricePoint, ChartDataPoint } from '@/types';
import { INITIAL_INVESTMENT, START_DATE } from './constants';
import { differenceInDays, parseISO } from 'date-fns';

// Calculate portfolio value based on price change
export function calculatePortfolioValue(
  initialPrice: number,
  currentPrice: number,
  initialInvestment: number = INITIAL_INVESTMENT
): number {
  return initialInvestment * (currentPrice / initialPrice);
}

// Calculate return percentage
export function calculateReturnPercent(
  initialValue: number,
  currentValue: number
): number {
  return ((currentValue - initialValue) / initialValue) * 100;
}

// Calculate CDI accumulated value
// CDI daily rate is given as annual %, need to convert to daily
export function calculateCDIAccumulated(
  cdiData: PricePoint[],
  initialInvestment: number = INITIAL_INVESTMENT
): PricePoint[] {
  let accumulated = initialInvestment;
  const result: PricePoint[] = [];

  for (const point of cdiData) {
    // CDI Series 12 is already the daily rate in %
    // Example: 0.043739 means 0.043739% per day
    const dailyRatePercent = point.value;
    accumulated = accumulated * (1 + dailyRatePercent / 100);

    result.push({
      date: point.date,
      value: accumulated,
    });
  }

  return result;
}

// Calculate IPCA + 5% a.a. accumulated value
// IPCA is monthly, we add 5% a.a. spread (approximately 0.407% per month)
export function calculateIPCAPlus5Accumulated(
  ipcaData: PricePoint[],
  allDates: string[],
  initialInvestment: number = INITIAL_INVESTMENT
): PricePoint[] {
  const monthlySpread = Math.pow(1.05, 1 / 12) - 1; // 5% a.a. converted to monthly
  let accumulated = initialInvestment;
  const result: PricePoint[] = [];

  // Create a map of month -> IPCA value
  const ipcaByMonth: Record<string, number> = {};
  for (const point of ipcaData) {
    const monthKey = point.date.substring(0, 7); // YYYY-MM
    ipcaByMonth[monthKey] = point.value;
  }

  let lastMonth = '';
  for (const date of allDates) {
    const monthKey = date.substring(0, 7);

    // Only apply IPCA once per month (on first day of new month data)
    if (monthKey !== lastMonth && ipcaByMonth[monthKey] !== undefined) {
      const monthlyIPCA = ipcaByMonth[monthKey] / 100;
      accumulated = accumulated * (1 + monthlyIPCA + monthlySpread);
      lastMonth = monthKey;
    }

    result.push({
      date,
      value: accumulated,
    });
  }

  return result;
}

// Calculate Dollar + 4% a.a. accumulated value
export function calculateDolarPlus4Accumulated(
  dolarData: PricePoint[],
  initialInvestment: number = INITIAL_INVESTMENT
): PricePoint[] {
  if (dolarData.length === 0) return [];

  const initialDolar = dolarData[0].value;
  const startDate = parseISO(START_DATE);

  return dolarData.map((point) => {
    const currentDate = parseISO(point.date);
    const daysPassed = differenceInDays(currentDate, startDate);

    // Dollar variation
    const dolarVariation = point.value / initialDolar;

    // 4% a.a. spread accumulated linearly
    const spreadAccumulated = 1 + 0.04 * (daysPassed / 365);

    const value = initialInvestment * dolarVariation * spreadAccumulated;

    return {
      date: point.date,
      value,
    };
  });
}

// Transform asset prices to portfolio values
export function pricesToPortfolioValues(
  prices: PricePoint[],
  initialInvestment: number = INITIAL_INVESTMENT
): PricePoint[] {
  if (prices.length === 0) return [];

  const initialPrice = prices[0].value;

  return prices.map((point) => ({
    date: point.date,
    value: calculatePortfolioValue(initialPrice, point.value, initialInvestment),
  }));
}

// Merge all data into chart format
export function mergeDataForChart(
  bitcoinValues: PricePoint[],
  ibovespaValues: PricePoint[],
  cdiValues: PricePoint[],
  ipcaPlus5Values: PricePoint[],
  dolarPlus4Values: PricePoint[]
): ChartDataPoint[] {
  // Get all unique dates
  const allDates = new Set<string>();

  bitcoinValues.forEach((p) => allDates.add(p.date));
  ibovespaValues.forEach((p) => allDates.add(p.date));
  cdiValues.forEach((p) => allDates.add(p.date));
  dolarPlus4Values.forEach((p) => allDates.add(p.date));

  const sortedDates = Array.from(allDates).sort();

  // Create lookup maps
  const btcMap = new Map(bitcoinValues.map((p) => [p.date, p.value]));
  const ibovMap = new Map(ibovespaValues.map((p) => [p.date, p.value]));
  const cdiMap = new Map(cdiValues.map((p) => [p.date, p.value]));
  const ipcaMap = new Map(ipcaPlus5Values.map((p) => [p.date, p.value]));
  const dolarMap = new Map(dolarPlus4Values.map((p) => [p.date, p.value]));

  // Merge data, using previous value for missing dates
  let lastBtc = INITIAL_INVESTMENT;
  let lastIbov = INITIAL_INVESTMENT;
  let lastCdi = INITIAL_INVESTMENT;
  let lastIpca = INITIAL_INVESTMENT;
  let lastDolar = INITIAL_INVESTMENT;

  return sortedDates.map((date) => {
    if (btcMap.has(date)) lastBtc = btcMap.get(date)!;
    if (ibovMap.has(date)) lastIbov = ibovMap.get(date)!;
    if (cdiMap.has(date)) lastCdi = cdiMap.get(date)!;
    if (ipcaMap.has(date)) lastIpca = ipcaMap.get(date)!;
    if (dolarMap.has(date)) lastDolar = dolarMap.get(date)!;

    return {
      date,
      bitcoin: Math.round(lastBtc),
      ibovespa: Math.round(lastIbov),
      cdi: Math.round(lastCdi),
      ipcaPlus5: Math.round(lastIpca),
      dolarPlus4: Math.round(lastDolar),
    };
  });
}

// Format currency for display
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format percentage for display
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
