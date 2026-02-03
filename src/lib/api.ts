import { PricePoint } from '@/types';
import { START_DATE, API_ENDPOINTS, BCB_SERIES } from './constants';
import { format } from 'date-fns';

// Helper to format date for BCB API (dd/MM/yyyy)
function formatDateBCB(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

// Helper to format date for display (yyyy-MM-dd)
function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// Common fetch with retry and headers
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    ...options.headers,
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        next: { revalidate: 86400 }, // Default cache
      });

      if (response.ok) return response;
      
      // If we get a 403 or 429, wait longer
      if (response.status === 403 || response.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
      
      // BCB often returns 500s or timeouts, simple retry helps
      if (i === retries - 1) return response; // Return last error response
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  
  throw new Error('Failed after retries');
}

// Fetch Bitcoin historical data from Binance API
export async function fetchBitcoinData(): Promise<PricePoint[]> {
  const startDate = new Date(START_DATE);
  const endDate = new Date();

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  // Binance klines endpoint - returns OHLCV data
  // Using BTCBRL pair for Brazilian Real prices
  const url = `${API_ENDPOINTS.binance}/klines?symbol=BTCBRL&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=1000`;

  try {
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      console.warn(`Binance API error: ${response.status}, trying fallback...`);
      return fetchBitcoinFromYahoo();
    }

    const data = await response.json();

    // Binance klines format: [openTime, open, high, low, close, volume, closeTime, ...]
    const prices: PricePoint[] = data.map((kline: (string | number)[]) => ({
      date: formatDateISO(new Date(kline[0] as number)),
      value: parseFloat(kline[4] as string), // Close price
    }));

    return prices;
  } catch (err) {
    console.error('Binance API failed', err);
    return fetchBitcoinFromCoinGecko();
  }
}

// Fallback: Fetch Bitcoin from CoinGecko
async function fetchBitcoinFromCoinGecko(): Promise<PricePoint[]> {
  const startDate = new Date(START_DATE);
  const endDate = new Date();

  const from = Math.floor(startDate.getTime() / 1000);
  const to = Math.floor(endDate.getTime() / 1000);

  const url = `${API_ENDPOINTS.coingecko}/coins/bitcoin/market_chart/range?vs_currency=brl&from=${from}&to=${to}`;

  try {
    // CoinGecko requires a User-Agent or it may block/401
    const response = await fetchWithRetry(url, {}, 3);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    // CoinGecko format: { prices: [[timestamp_ms, price], ...] }
    if (!data.prices) throw new Error('CoinGecko no prices data');

    const prices: PricePoint[] = data.prices.map((item: number[]) => ({
      date: formatDateISO(new Date(item[0])),
      value: item[1],
    }));

    return prices;
  } catch (err) {
    console.error('CoinGecko API failed', err);
    return fetchBitcoinFromYahoo();
  }
}

// Fallback: Fetch Bitcoin from Yahoo Finance (BTC-USD * BRL=X)
// Yahoo BTC-BRL is often broken/404, so we calculate it or try a different ticker
async function fetchBitcoinFromYahoo(): Promise<PricePoint[]> {
  const startDate = new Date(START_DATE);
  const endDate = new Date();

  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);

  // Try fetching BTC-USD
  const urlBtc = `${API_ENDPOINTS.yahoo}/BTC-USD?period1=${period1}&period2=${period2}&interval=1d`;
  // Try fetching USD-BRL (BRL=X)
  const urlBrl = `${API_ENDPOINTS.yahoo}/BRL=X?period1=${period1}&period2=${period2}&interval=1d`;

  const [resBtc, resBrl] = await Promise.all([
    fetchWithRetry(urlBtc),
    fetchWithRetry(urlBrl)
  ]);

  if (!resBtc.ok || !resBrl.ok) {
    throw new Error(`Yahoo Finance BTC/BRL API error`);
  }

  const dataBtc = await resBtc.json();
  const dataBrl = await resBrl.json();

  const cBtc = dataBtc.chart.result[0];
  const cBrl = dataBrl.chart.result[0];

  const mapBrl = new Map<string, number>();
  cBrl.timestamp.forEach((ts: number, i: number) => {
    const date = formatDateISO(new Date(ts * 1000));
    const val = cBrl.indicators.quote[0].close[i];
    if (val) mapBrl.set(date, val);
  });

  const prices: PricePoint[] = [];
  let lastBrlRate = 5.50; // Better initial guess

  // Sort timestamps just in case
  const sortedIndices = cBtc.timestamp.map((t: number, i: number) => ({ t, i }))
    .sort((a: any, b: any) => a.t - b.t);

  sortedIndices.forEach(({ t, i }: { t: number, i: number }) => {
    const date = formatDateISO(new Date(t * 1000));
    const btcUsd = cBtc.indicators.quote[0].close[i];
    
    // Update last known rate if available for this date
    if (mapBrl.has(date)) {
      lastBrlRate = mapBrl.get(date)!;
    }
    
    if (btcUsd) {
      prices.push({
        date: date,
        value: btcUsd * lastBrlRate
      });
    }
  });

  return prices;
}

// Fetch Ibovespa historical data from Yahoo Finance
export async function fetchIbovespaData(): Promise<PricePoint[]> {
  const startDate = new Date(START_DATE);
  const endDate = new Date();

  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);

  const url = `${API_ENDPOINTS.yahoo}/%5EBVSP?period1=${period1}&period2=${period2}&interval=1d`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status}`);
  }

  const data = await response.json();
  const result = data.chart.result[0];
  const timestamps = result.timestamp;
  const closes = result.indicators.quote[0].close;

  const prices: PricePoint[] = timestamps.map((ts: number, i: number) => ({
    date: formatDateISO(new Date(ts * 1000)),
    value: closes[i],
  })).filter((p: PricePoint) => p.value !== null);

  return prices;
}

// Fetch CDI data from BCB
export async function fetchCDIData(): Promise<PricePoint[]> {
  const startDate = new Date(START_DATE);
  const endDate = new Date();

  const url = `${API_ENDPOINTS.bcb}.${BCB_SERIES.cdi}/dados?formato=json&dataInicial=${formatDateBCB(startDate)}&dataFinal=${formatDateBCB(endDate)}`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`BCB API error: ${response.status}`);
  }

  const data = await response.json();

  // BCB returns {data: "dd/MM/yyyy", valor: "0.1234"}[]
  const prices: PricePoint[] = data.map((item: { data: string; valor: string }) => {
    const [day, month, year] = item.data.split('/');
    return {
      date: `${year}-${month}-${day}`,
      value: parseFloat(item.valor),
    };
  });

  return prices;
}

// Fetch IPCA data from BCB
export async function fetchIPCAData(): Promise<PricePoint[]> {
  const startDate = new Date(START_DATE);
  const endDate = new Date();

  const url = `${API_ENDPOINTS.bcb}.${BCB_SERIES.ipca}/dados?formato=json&dataInicial=${formatDateBCB(startDate)}&dataFinal=${formatDateBCB(endDate)}`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`BCB IPCA API error: ${response.status}`);
  }

  const data = await response.json();

  const prices: PricePoint[] = data.map((item: { data: string; valor: string }) => {
    const [day, month, year] = item.data.split('/');
    return {
      date: `${year}-${month}-${day}`,
      value: parseFloat(item.valor),
    };
  });

  return prices;
}

// Fetch Dollar (PTAX) data from BCB
export async function fetchDolarData(): Promise<PricePoint[]> {
  const startDate = new Date(START_DATE);
  const endDate = new Date();

  const url = `${API_ENDPOINTS.bcb}.${BCB_SERIES.dolar}/dados?formato=json&dataInicial=${formatDateBCB(startDate)}&dataFinal=${formatDateBCB(endDate)}`;

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`BCB Dolar API error: ${response.status}`);
  }

  const data = await response.json();

  const prices: PricePoint[] = data.map((item: { data: string; valor: string }) => {
    const [day, month, year] = item.data.split('/');
    return {
      date: `${year}-${month}-${day}`,
      value: parseFloat(item.valor),
    };
  });

  return prices;
}
