import {
  differenceInDays,
  parseISO,
  subMonths,
  startOfMonth,
  startOfYear,
  endOfMonth,
  format,
  isSameMonth,
  isAfter,
  isBefore
} from 'date-fns';
import { PricePoint, ChartDataPoint, PeriodReturns, ConsistencyStats } from '@/types';
import { INITIAL_INVESTMENT, START_DATE } from './constants';

export function calculateAssetStatistics(
  data: PricePoint[]
): { returns: PeriodReturns; consistency: ConsistencyStats } {
  if (data.length === 0) {
    return {
      returns: {
        currentMonth: 0,
        yearToDate: 0,
        last3Months: 0,
        last6Months: 0,
        last12Months: 0,
        last24Months: 0,
        sinceInception: 0,
      },
      consistency: {
        positiveMonths: 0,
        negativeMonths: 0,
        bestMonth: 0,
        worstMonth: 0,
      },
    };
  }

  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const latestPoint = sortedData[sortedData.length - 1];
  const latestDate = parseISO(latestPoint.date);
  const latestValue = latestPoint.value;

  // Helper to find value at specific date or closest before
  const findValueAtDate = (targetDate: Date): number | null => {
    const targetStr = format(targetDate, 'yyyy-MM-dd');
    let closest: PricePoint | null = null;
    
    for (const point of sortedData) {
      if (point.date > targetStr) break;
      closest = point;
    }
    
    return closest ? closest.value : null;
  };

  const calculateReturn = (initial: number, final: number) => {
    return ((final - initial) / initial) * 100;
  };

  // Period Returns
  const startOfCurrentMonth = startOfMonth(latestDate);
  const startOfCurrentYear = startOfYear(latestDate);
  
  // For period returns like "last 3 months", we compare with the value 3 months ago
  const date3MonthsAgo = subMonths(latestDate, 3);
  const date6MonthsAgo = subMonths(latestDate, 6);
  const date12MonthsAgo = subMonths(latestDate, 12);
  const date24MonthsAgo = subMonths(latestDate, 24);

  // We need the value at the END of the previous month for "current month" return
  // If we just started the month, this is the first value of current month or last of prev month
  const valueStartMonth = findValueAtDate(subMonths(startOfCurrentMonth, 0)) || sortedData[0].value;
  // Actually standard way is: Return of Month M = (Price End M / Price End M-1) - 1
  // So for current month (M), we need Price End M-1.
  // The 'findValueAtDate' finds the last price <= date.
  // So 'subMonths(startOfCurrentMonth, 0)' is start of month. We need 1 day before.
  const dateEndOfPrevMonth = new Date(startOfCurrentMonth);
  dateEndOfPrevMonth.setDate(dateEndOfPrevMonth.getDate() - 1);
  const valueEndOfPrevMonth = findValueAtDate(dateEndOfPrevMonth) || sortedData[0].value;
  
  const valueStartYear = findValueAtDate(new Date(startOfCurrentYear.getFullYear(), 0, 0)) || sortedData[0].value; // Dec 31st of prev year
  const value3MonthsAgo = findValueAtDate(date3MonthsAgo) || sortedData[0].value;
  const value6MonthsAgo = findValueAtDate(date6MonthsAgo) || sortedData[0].value;
  const value12MonthsAgo = findValueAtDate(date12MonthsAgo) || sortedData[0].value;
  const value24MonthsAgo = findValueAtDate(date24MonthsAgo) || sortedData[0].value;
  const valueInception = sortedData[0].value;

  const returns: PeriodReturns = {
    currentMonth: calculateReturn(valueEndOfPrevMonth, latestValue),
    yearToDate: calculateReturn(valueStartYear, latestValue),
    last3Months: calculateReturn(value3MonthsAgo, latestValue),
    last6Months: calculateReturn(value6MonthsAgo, latestValue),
    last12Months: calculateReturn(value12MonthsAgo, latestValue),
    last24Months: calculateReturn(value24MonthsAgo, latestValue),
    sinceInception: calculateReturn(valueInception, latestValue),
  };

  // Consistency (Monthly Returns)
  const monthlyReturns: number[] = [];
  
  // Group by month
  const monthMap = new Map<string, PricePoint[]>();
  for (const point of sortedData) {
    const monthKey = point.date.substring(0, 7); // YYYY-MM
    if (!monthMap.has(monthKey)) monthMap.set(monthKey, []);
    monthMap.get(monthKey)!.push(point);
  }

  // Calculate return for each completed month + current month
  // We need the closing price of the PREVIOUS month to calculate the return of the CURRENT month.
  const sortedMonths = Array.from(monthMap.keys()).sort();
  
  for (let i = 0; i < sortedMonths.length; i++) {
    const currentMonthKey = sortedMonths[i];
    const currentMonthPoints = monthMap.get(currentMonthKey)!;
    const finalPrice = currentMonthPoints[currentMonthPoints.length - 1].value;
    
    let initialPrice: number;
    
    if (i === 0) {
      // First month: use first data point of the month/dataset
      initialPrice = currentMonthPoints[0].value;
    } else {
      // Subsequent months: used last price of previous month
      const prevMonthKey = sortedMonths[i - 1];
      const prevMonthPoints = monthMap.get(prevMonthKey)!;
      initialPrice = prevMonthPoints[prevMonthPoints.length - 1].value;
    }

    if (initialPrice > 0) {
      monthlyReturns.push(calculateReturn(initialPrice, finalPrice));
    }
  }

  const positiveMonths = monthlyReturns.filter(r => r > 0).length;
  const negativeMonths = monthlyReturns.filter(r => r < 0).length; // < 0, ignore 0
  const maxReturn = Math.max(...monthlyReturns);
  const minReturn = Math.min(...monthlyReturns);

  const consistency: ConsistencyStats = {
    positiveMonths,
    negativeMonths: sortedMonths.length - positiveMonths, // Including flat months as 'not positive' or strictly negative? User image shows 'Meses negativos'. Usually 0 is neutral. Let's count strictly negative.
    // Wait, user image shows sum of pos + neg = total months? 151+1 = 152.
    // I'll count strictly negative.
    bestMonth: monthlyReturns.length > 0 ? maxReturn : 0,
    worstMonth: monthlyReturns.length > 0 ? minReturn : 0,
  };
  
  // Re-adjust negative months to match total count logic if needed, or just strictly < 0.
  consistency.negativeMonths = monthlyReturns.filter(r => r < 0).length;

  return { returns, consistency };
}

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
