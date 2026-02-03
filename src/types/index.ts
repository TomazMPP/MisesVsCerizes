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
}

export interface ChartDataPoint {
  date: string;
  bitcoin: number;
  ibovespa: number;
  cdi?: number;
  ipcaPlus5?: number;
  dolarPlus4?: number;
}

export interface ApiResponse {
  bitcoin: AssetData;
  ibovespa: AssetData;
  benchmarks: BenchmarkData;
  chartData: ChartDataPoint[];
  lastUpdate: string;
}
