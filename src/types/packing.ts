export type CapacityStatus =
  | 'Completed'
  | 'In Progress'
  | 'Planned'
  | 'Waiting'
  | 'Rework Alert'
  | 'Off Day';

export interface PackingCapacityRow {
  id: string;
  weekday: string;
  dateLabel: string;
  dateSortKey: number;
  weekNo: string;
  planQty: number;
  inputQty: number;
  tradeQty: number;
  plannedItems: number;
  finishedItems: number;
  remainReworkQty: number;
  ppaNgQty: number;
  oqcNgQty: number;
  totalNgQty: number;
  completionPct: number;
  itemCompletionPct: number;
  status: CapacityStatus;
  rawRow?: Record<string, string>;
}

export type IssueSeverity = 'Major' | 'Minor' | 'Other';

export interface DailyIssueRow {
  id: string;
  dateLabel: string;
  dateSortKey: number;
  user: string;
  errorCase: string;
  qtyError: number;
  month: number;
  condition: string;
  severity: IssueSeverity;
  severityRaw: string;
  year: number;
  tpkNo: string;
  remark: string;
}

export type MonthlyIssueStatus = 'On Target' | 'Watch' | 'High NG' | 'Pending';

export interface MonthlyIssueRow {
  id: string;
  monthLabel: string;
  monthIndex: number;
  ngPct: number;
  ngPctLabel: string;
  ngQty: number;
  outputQty: number;
  year: number;
  status: MonthlyIssueStatus;
}

export type SheetSourceMode = 'demo' | 'public-url' | 'google-oauth';

export interface SheetTabInfo {
  sheetId: number;
  title: string;
}

export interface ColumnMatchInfo {
  field: string;
  expectedHeader: string;
  matchedHeader: string | null;
}

export interface SheetConnectionState {
  mode: SheetSourceMode;
  sourceLabel: string;
  spreadsheetId?: string;
  sheetUrl?: string;
  selectedTab?: string;
  dailyIssuesTab?: string;
  monthlyIssuesTab?: string;
  dailyIssuesSynced?: boolean;
  monthlyIssuesSynced?: boolean;
  tabs?: SheetTabInfo[];
  lastSyncedAt: string;
  headers: string[];
  matchedColumns: ColumnMatchInfo[];
}
