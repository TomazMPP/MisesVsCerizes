// Data inicial da aposta: 24 de junho de 2024
export const START_DATE = '2024-06-24';
export const START_TIMESTAMP = 1719187200; // Unix timestamp

// Valor inicial da aposta
export const INITIAL_INVESTMENT = 100000;

// Participantes
export const PARTICIPANTS = {
  bitcoin: {
    name: 'Mises',
    asset: 'Bitcoin',
    team: 'Mises',
  },
  ibovespa: {
    name: 'Cerize',
    asset: 'Ibovespa',
    team: 'Tradicional',
  },
} as const;

// Cores do tema (minimalista P&B)
export const COLORS = {
  background: '#000000',
  foreground: '#FFFFFF',
  muted: '#888888',
  // Principais (destaque)
  bitcoin: '#FFFFFF',
  ibovespa: '#3B82F6',  // Blue-500 - destaque
  // Benchmarks secundários (cores mais suaves/escuras)
  cdi: '#D97706',       // Amber-600
  poupanca: '#7C3AED',  // Violet-600
  ifix: '#0F766E',      // Teal-700
  ipca: '#C2410C',      // Orange-700
  ipcaPlus5: '#DC2626', // Red-600
  dolarPlus4: '#059669', // Emerald-600
} as const;

// APIs
export const API_ENDPOINTS = {
  binance: 'https://api.binance.com/api/v3',
  coingecko: 'https://api.coingecko.com/api/v3',
  yahoo: 'https://query2.finance.yahoo.com/v8/finance/chart',
  bcb: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs',
} as const;

// Séries do Banco Central
export const BCB_SERIES = {
  cdi: 12,      // CDI diário
  ipca: 433,    // IPCA mensal
  dolar: 1,     // Dólar PTAX venda
  poupanca: 25, // Rendimento mensal da poupança
} as const;
