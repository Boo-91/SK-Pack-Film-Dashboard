import type {
  DailyIssueRow,
  IssueSeverity,
  MonthlyIssueRow,
  MonthlyIssueStatus,
} from '../types/packing.ts';
import { parseCsvText } from './sheetParser.ts';

export const DEFAULT_DAILY_ISSUES_TAB = 'Daily Internal Issues';
export const DEFAULT_MONTHLY_ISSUES_TAB = 'Monthly Internal Issues';

export const BASELINE_DAILY_ISSUES_CSV = `Date,User,Error Case,Qty's Error,Month,Condition,Case Severity,Year,TPK no.,Remark
16/9/26,Line - B,Without Item label,2,9,General,Major,2026,TPK2609-0426,
16/9/26,Line - C,Without QR,1,9,General,Major,2026,TPK2609-0314,
18/9/26,Line New  - 1,Increase Item,2,9,General,Miner,2026,TPK2609-0444,Extra Back Film
18/9/26,Line - G,Without QR,2,9,General,Major,2026,TPK2609-0765,
21/9/26,Line - G,No back film,1,9,General,Major,2026,TPK2609-0801,
22/9/26,Line - E,Without QR,10,9,General,Major,2026,Relabel,
22/9/26,Line - A ,Without QR,1,9,Trade,Major,2026,TPK2609-0822,
23/9/26,Line - D,Without QR,2,9,Trade,Major,2026,TPK2609-0921,
23/9/26,Line - B,Without Item label,1,9,General,Major,2026,TPK2609-0425,
23/9/26,Line - B,Incomplete package,1,9,General,Major,2026,TPK2609-0425,no ส.ข.บ
23/9/26,Line - G,Without Item label,1,9,General,Major,2026,TPK2609-1107,
24/9/26,Line - A ,Without BAR,1,9,Trade,Major,2026,TPK2609-1005,
24/9/26,Line - A ,Incomplete package,1,9,General,Major,2026,TPK2609-1087,Alcohol ထုပ်မပါ
24/9/26,Line - A ,Without QR,1,9,General,Major,2026,TPK2609-0315,
24/9/26,Line - A ,Without Item label,1,9,General,Major,2026,TPK2609-0315,
24/9/26,Line - A ,Without QR,2,9,General,Major,2026,TPK2609-1319,
25/9/26,Line New  - 1,Without Price,3,9,General,Major,2026,TPK2609-1123,
25/9/26,Line - G,No Film UC-S05,1,9,Trade,Major,2026,TPK2609-1009,
25/9/26,Line - A ,Without Item label,2,9,General,Major,2026,TPK2609-1021,
25/9/26,Line - G,Without BAR,4,9,Trade,Major,2026,TPK2609-1009,
25/9/26,Line New  - 1,Without QR,1,9,General,Major,2026,TPK2609-1285,
25/9/26,Line - G,Without Item label,1,9,General,Major,2026,TPK2609-1100,
25/9/26,Line New  - 1,Without QR,3,9,General,Major,2026,TPK2609-1105,
26/9/26,Line - F,Without QR,1,9,Trade,Major,2026,TPK2609-1271,
26/9/26,Line - D,Without BAR,1,9,Trade,Major,2026,TPK2609-1223,
26/9/26,Line New  - 1,Without BAR,6,9,General,Major,2026,TPK2609-1218,
27/9/26,Line - C,Without QR,3,9,General,Major,2026,TPK2609-1356,
30/9/26,Line - C,No Film S0A,1,9,Trade,Major,2026,TPK2609-1601,
2/10/26,Line - D,Without QR,2,10,General,Major,2026,TPK2609-1591,
2/10/26,Line - D,Without QR,2,10,Trade,Major,2026,TPK2609-1691,
3/10/26,Line - G,Without Item label,1,10,Trade,Major,2026,TPK2609-1887,
5/10/26,Line New  - 1,Without QR,3,10,General,Major,2026,TPK2609-1894,
6/10/26,Line - B,Increase Item,1,10,General,Miner,2026,TPK2609-2075,
7/10/26,Line - E,Without QR,3,10,Trade,Major,2026,TPK2610-0124,
10/10/26,Line - B,Incomplete package,1,10,Trade,Major,2026,TPK2610-097,D30 sticker မပါ
14/10/26,Line - C,Incomplete package,3,10,General,Major,2026,TPK2610-0458,အပြာချောင်းမပါ
14/10/26,Line - B,Without Item label,1,10,General,Major,2026,TPK2610-0514,
14/10/26,Line - B,No back film,1,10,General,Major,2026,TPK2610-0514,
22/10/26,Line - C,Without QR,2,10,General,Major,2026,TPK2610-1049,
28/10/26,Line - C,No Film S0A,1,10,General,Major,2026,TPK2610-1182,
29/10/26,Line - G,Incomplete package,3,10,General,Miner,2026,TPK2610-1188,တိပ်ကြည် sticker မပါ
31/10/26,Line - E,No Film S0A,1,10,General,Major,2026,TPK2610-1067,
31/10/26,Line - F,Without QR,13,10,General,Major,2026,TPK2610-1382,
3/11/26,Line - E,No back film,2,11,General,Major,2026,TPK2610-1589,
4/11/26,Line - G,No back film,1,11,Trade,Major,2026,TPK2610-1574,
7/11/26,Line - G,Increase Item,1,11,Trade,Major,2026,TPK2610-0638,
10/11/26,Line - C,Without QR,1,11,General,Major,2026,TPK2610-0380,
11/11/26,Line - G,Reverse sticker,1,11,General,Miner,2026,TPK2610-0393,`;

export const BASELINE_MONTHLY_ISSUES_CSV = `No.,% NG,NG,Output,Year
Jan,0.040%,423,"1,063,368",2026
Feb,0.020%,285,"1,404,077",2026
Mar,0.018%,198,"1,104,709",2026
Apr,0.002%,15,"787,778",2026
May,0.012%,143,"1,158,511",2026
Jun,0.010%,127,"1,263,428",2026
Jul,0.028%,325,"1,166,905",2026
Aug,0.023%,341,"1,501,828",2026
Sep,0.029%,369,1264366,2026
Oct,0.004%,38,987023,2026
Nov,,,,2026
Dec,,,,2026`;

function cleanKey(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/['’`:.%]/g, '')
    .replace(/\s+/g, ' ');
}

function findColumn(headers: string[], aliases: string[]): number {
  const normalized = headers.map(cleanKey);
  for (const alias of aliases) {
    const exact = normalized.indexOf(alias);
    if (exact !== -1) return exact;
  }
  for (const alias of aliases) {
    const partial = normalized.findIndex((h) => h.includes(alias));
    if (partial !== -1) return partial;
  }
  return -1;
}

function parseNumeric(raw: string | undefined, fallback = 0): number {
  if (!raw) return fallback;
  const cleaned = raw.replace(/,/g, '').replace(/%/g, '').trim();
  if (!cleaned) return fallback;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSpacing(val: string): string {
  return val.trim().replace(/\s+/g, ' ');
}

function normalizeSeverity(raw: string): IssueSeverity {
  const lower = raw.trim().toLowerCase();
  if (lower.includes('major')) return 'Major';
  if (lower.includes('minor') || lower.includes('miner')) return 'Minor';
  return 'Other';
}

function parseIssueDateSortKey(
  dateStr: string,
  monthHint: number,
  yearHint: number,
  fallbackIndex: number
): number {
  const cleaned = dateStr.trim();
  if (!cleaned) return fallbackIndex;

  // Match D/M/YY or DD/MM/YYYY (e.g. "16/9/26", "2/10/26")
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const p1 = Number.parseInt(slashMatch[1], 10);
    const p2 = Number.parseInt(slashMatch[2], 10);
    const yrRaw = Number.parseInt(slashMatch[3], 10);
    const year = yrRaw < 100 ? 2000 + yrRaw : yrRaw;

    // Use Month hint if available, otherwise assume day-first (DD/MM/YY)
    let day = p1;
    let monthNum = p2;
    if (monthHint >= 1 && monthHint <= 12) {
      if (p1 === monthHint && p2 !== monthHint) {
        monthNum = p1;
        day = p2;
      } else {
        day = p1;
        monthNum = p2;
      }
    }
    return new Date(year, monthNum - 1, day).getTime();
  }

  // Match ISO "YYYY-MM-DD"
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return new Date(
      Number.parseInt(isoMatch[1], 10),
      Number.parseInt(isoMatch[2], 10) - 1,
      Number.parseInt(isoMatch[3], 10)
    ).getTime();
  }

  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate()
    ).getTime();
  }

  if (yearHint > 0 && monthHint >= 1 && monthHint <= 12) {
    return new Date(yearHint, monthHint - 1, 1).getTime();
  }
  return fallbackIndex;
}

export function parseRowsToDailyIssues(rows: string[][]): DailyIssueRow[] {
  if (!rows || rows.length === 0) return [];

  let headerIdx = 0;
  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const joined = rows[r].map(cleanKey).join(' ');
    if (
      joined.includes('error case') ||
      joined.includes('case severity') ||
      joined.includes('tpk no')
    ) {
      headerIdx = r;
      break;
    }
  }

  const headers = rows[headerIdx];
  const idx = {
    date: findColumn(headers, ['date']),
    user: findColumn(headers, ['user', 'line', 'station']),
    errorCase: findColumn(headers, ['error case', 'issue', 'defect']),
    qtyError: findColumn(headers, ['qtys error', 'qty error', 'qty', 'error qty']),
    month: findColumn(headers, ['month']),
    condition: findColumn(headers, ['condition', 'type']),
    severity: findColumn(headers, ['case severity', 'severity']),
    year: findColumn(headers, ['year']),
    tpkNo: findColumn(headers, ['tpk no', 'tpk', 'lot no']),
    remark: findColumn(headers, ['remark', 'remarks', 'note']),
  };

  const dataRows = rows.slice(headerIdx + 1).filter((row) => {
    if (!row.some((c) => c.trim() !== '')) return false;
    const first = (row[idx.date !== -1 ? idx.date : 0] ?? '').trim().toLowerCase();
    if (!first) return false;
    if (/\b(total|grand total|subtotal|summary|average)\b/.test(first)) {
      return false;
    }
    return true;
  });

  return dataRows.map((row, i) => {
    const get = (col: number) =>
      col !== -1 && col < row.length ? (row[col] ?? '').trim() : '';

    const dateLabel = get(idx.date);
    const user = normalizeSpacing(get(idx.user)) || 'Unassigned';
    const errorCase = normalizeSpacing(get(idx.errorCase)) || 'Unspecified';
    const qtyError = Math.round(parseNumeric(get(idx.qtyError), 0));
    const month = Math.round(parseNumeric(get(idx.month), 0));
    const condition = normalizeSpacing(get(idx.condition)) || 'General';
    const severityRaw = normalizeSpacing(get(idx.severity)) || 'Major';
    const severity = normalizeSeverity(severityRaw);
    const year = Math.round(parseNumeric(get(idx.year), 2026));
    const tpkNo = normalizeSpacing(get(idx.tpkNo)) || '—';
    const remark = get(idx.remark).trim();

    return {
      id: `issue-${i}-${dateLabel}-${tpkNo}`,
      dateLabel,
      dateSortKey: parseIssueDateSortKey(dateLabel, month, year, i),
      user,
      errorCase,
      qtyError,
      month,
      condition,
      severity,
      severityRaw,
      year,
      tpkNo,
      remark,
    };
  });
}

const MONTH_ORDER = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

export function deriveMonthlyIssueStatus(params: {
  ngPct: number;
  ngQty: number;
  outputQty: number;
}): MonthlyIssueStatus {
  const { ngPct, ngQty, outputQty } = params;
  if (outputQty === 0 && ngQty === 0) return 'Pending';
  if (ngPct >= 0.025) return 'High NG';
  if (ngPct >= 0.015) return 'Watch';
  return 'On Target';
}

export function parseRowsToMonthlyIssues(rows: string[][]): MonthlyIssueRow[] {
  if (!rows || rows.length === 0) return [];

  let headerIdx = 0;
  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const joined = rows[r].map(cleanKey).join(' ');
    if (
      (joined.includes('no') || joined.includes('month')) &&
      joined.includes('ng') &&
      joined.includes('output')
    ) {
      headerIdx = r;
      break;
    }
  }

  const headers = rows[headerIdx];
  const idx = {
    month: findColumn(headers, ['no', 'month']),
    ngPct: findColumn(headers, ['% ng', 'ng %', 'pct ng', 'ng']),
    ngQty: findColumn(headers, ['ng']),
    outputQty: findColumn(headers, ['output', 'total output']),
    year: findColumn(headers, ['year']),
  };

  // Avoid matching "% NG" column twice when looking for "NG" count column
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
  const exactNgPctIdx = normalizedHeaders.findIndex((h) => h === '% ng');
  const exactNgIdx = normalizedHeaders.findIndex((h) => h === 'ng');
  const resolvedNgPctIdx = exactNgPctIdx !== -1 ? exactNgPctIdx : idx.ngPct;
  const resolvedNgIdx =
    exactNgIdx !== -1
      ? exactNgIdx
      : normalizedHeaders.findIndex((h, index) => index !== resolvedNgPctIdx && h.includes('ng'));

  const dataRows = rows.slice(headerIdx + 1).filter((row) => {
    if (!row.some((c) => c.trim() !== '')) return false;
    const label = (row[idx.month !== -1 ? idx.month : 0] ?? '').trim().toLowerCase();
    if (!label) return false;
    if (/\b(total|grand total|subtotal|summary|average)\b/.test(label)) {
      return false;
    }
    return true;
  });

  return dataRows.map((row, i) => {
    const get = (col: number) =>
      col !== -1 && col < row.length ? (row[col] ?? '').trim() : '';

    const monthLabel = get(idx.month !== -1 ? idx.month : 0) || `M${i + 1}`;
    const mIdx = MONTH_ORDER.indexOf(monthLabel.slice(0, 3).toLowerCase());
    const monthIndex = mIdx !== -1 ? mIdx + 1 : i + 1;

    const ngQty = Math.round(parseNumeric(get(resolvedNgIdx), 0));
    const outputQty = Math.round(parseNumeric(get(idx.outputQty), 0));
    const rawPctStr = get(resolvedNgPctIdx);

    let ngPct = parseNumeric(rawPctStr, -1);
    if (ngPct < 0) {
      ngPct = outputQty > 0 ? (ngQty / outputQty) * 100 : 0;
    }

    const ngPctLabel =
      outputQty === 0 && ngQty === 0
        ? '—'
        : rawPctStr && rawPctStr.includes('%')
          ? rawPctStr
          : `${ngPct.toFixed(3)}%`;

    const year = Math.round(parseNumeric(get(idx.year), 2026));
    const status = deriveMonthlyIssueStatus({ ngPct, ngQty, outputQty });

    return {
      id: `monthly-${year}-${monthLabel}-${i}`,
      monthLabel,
      monthIndex,
      ngPct,
      ngPctLabel,
      ngQty,
      outputQty,
      year,
      status,
    };
  });
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function getIssueYearMonth(row: DailyIssueRow): {
  year: number;
  month: number;
  key: string;
  label: string;
} {
  const parsedDate = new Date(row.dateSortKey);
  const hasValidDate =
    !Number.isNaN(parsedDate.getTime()) && row.dateSortKey > 1000000;
  const month =
    row.month >= 1 && row.month <= 12
      ? row.month
      : hasValidDate
        ? parsedDate.getMonth() + 1
        : 0;
  const year =
    row.year >= 2000
      ? row.year
      : hasValidDate
        ? parsedDate.getFullYear()
        : 0;

  const key =
    year > 0 && month > 0
      ? `${year}-${String(month).padStart(2, '0')}`
      : 'unknown';
  const label =
    year > 0 && month > 0
      ? `${SHORT_MONTHS[month - 1] ?? `M${month}`} ${year}`
      : 'Unknown';

  return { year, month, key, label };
}

export function getCurrentYearMonth(referenceDate = new Date()): {
  year: number;
  month: number;
  key: string;
  label: string;
} {
  const month = referenceDate.getMonth() + 1;
  const year = referenceDate.getFullYear();
  return {
    year,
    month,
    key: `${year}-${String(month).padStart(2, '0')}`,
    label: `${SHORT_MONTHS[month - 1] ?? `M${month}`} ${year}`,
  };
}

export function getCurrentMonthDailyIssues(
  records: DailyIssueRow[],
  referenceDate = new Date()
): {
  records: DailyIssueRow[];
  month: number;
  year: number;
  monthLabel: string;
} {
  const current = getCurrentYearMonth(referenceDate);
  const filtered = records.filter(
    (row) => getIssueYearMonth(row).key === current.key
  );

  return {
    records: filtered,
    month: current.month,
    year: current.year,
    monthLabel: current.label,
  };
}

export const INITIAL_DAILY_ISSUES: DailyIssueRow[] = parseRowsToDailyIssues(
  parseCsvText(BASELINE_DAILY_ISSUES_CSV)
);

export const INITIAL_MONTHLY_ISSUES: MonthlyIssueRow[] =
  parseRowsToMonthlyIssues(parseCsvText(BASELINE_MONTHLY_ISSUES_CSV));

