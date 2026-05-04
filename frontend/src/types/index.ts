export interface DelayRecord {
  _id: string;
  uploadId: string;
  date: string;
  month: string;
  flight: string;
  origin: string;
  hour: number | null;
  code: string;
  minutes: number;
  reasonText: string;
  shortDesc: string;
  longDesc: string;
  cat: string;
  chargeable: string;
}

export interface CodeStat {
  code: string;
  shortDesc: string;
  count: number;
  totalMinutes: number;
  avgMinutes: number;
  pct: number;
  chargeable: string;
  cat: string;
  reasons: string[];
}

export interface MonthStat    { month: string; events: number; totalMinutes: number; }
export interface HourStat     { hour: number; count: number; }
export interface CatStat      { cat: string; count: number; totalMinutes: number; }

export interface Summary {
  totalEvents: number;
  totalMinutes: number;
  avgMinutes: number;
  chargeableCount: number;
}

export interface StatsResponse {
  summary: Summary;
  byCode: CodeStat[];
  byMonth: MonthStat[];
  byHour: HourStat[];
  byCat: CatStat[];
}

export interface UploadRecord {
  _id: string;
  originalName: string;
  uploadedAt: string;
  recordCount: number;
  dateRange: { from: string; to: string };
  status: 'processing' | 'complete' | 'error';
}

export type AppMode = 'ops' | 'leadership';

export interface DelayFilters {
  origin:     string;
  cat:        string;
  chargeable: string;
  search:     string;
  from:       string;
  to:         string;
  month:      string;
  week:       string;
}

export interface AlertRecord {
  _id:    string;
  team:   string;
  message:string;
  codes:  string[];
  sentAt: string;
}

