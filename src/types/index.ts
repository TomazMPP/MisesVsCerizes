export interface PricePoint {
  date: string;
  value: number;
}

export interface AssetData {
  name: string;
  color: string;
  data: PricePoint[];
  initialValue: number;
  currentValue: number;
  returnPercent: number;
}

export interface BenchmarkData {
  cdi: PricePoint[];
  ipcaPlus5: PricePoint[];
  dolarPlus4: PricePoint[];
  poupanca: PricePoint[];
  ipca: PricePoint[];
  ifix: PricePoint[];
}

export interface ChartDataPoint {
  date: string;
  bitcoin: number;
  ibovespa: number;
  cdi?: number;
  ipcaPlus5?: number;
  dolarPlus4?: number;
  poupanca?: number;
  ipca?: number;
  ifix?: number;
}

export interface PeriodReturns {
  currentMonth: number;
  yearToDate: number;
  last3Months: number;
  last6Months: number;
  last12Months: number;
  last24Months: number;
  sinceInception: number;
}

export interface ConsistencyStats {
  positiveMonths: number;
  negativeMonths: number;
  bestMonth: number;
  worstMonth: number;
}

export interface AssetTableData {
  name: string;
  color: string;
  returns: PeriodReturns;
  consistency: ConsistencyStats;
}

export interface ApiResponse {
  bitcoin: AssetData;
  ibovespa: AssetData;
  benchmarks: BenchmarkData;
  chartData: ChartDataPoint[];
  tableData: AssetTableData[];
  lastUpdate: string;
}
