import type {
  CapacityStatus,
  ColumnMatchInfo,
  PackingCapacityRow,
} from '../types/packing.ts';

export const TEMPLATE_HEADERS = [
  'Weekday',
  'Date:',
  "Plan Qty's",
  "Input Qty's",
  "Trade Qty's",
  'Week No.',
  'No. of Planned Items',
  'No. of Finished Items',
  "Remain Rework Qty's",
  "PPA NG Qty's",
  "OQC NG Qty's",
  "Total's NG Qty's",
];

// Baseline CSV matching the user's attached SK Pack Film Packing Capacity spreadsheet
export const BASELINE_PACKING_CSV = `Weekday,Date:,Plan Qty's,Input Qty's,Trade Qty's,Week No.,No. of Planned Items,No. of Finished Items,Remain Rework Qty's,PPA NG Qty's,OQC NG Qty's,Total's NG Qty's
Thu,1 Oct 26,"44,204","44,204","8,944",W40,53,53,0,30,49,79
Fri,2 Oct 26,"46,196","46,196","10,313",W41,55,55,0,26,32,58
Sat,3 Oct 26,"47,160","47,160","5,637",W41,32,32,0,13,16,29
Sun,4 Oct 26,0,0,0,W41,0,0,0,0,0,0
Mon,5 Oct 26,"54,767","54,767","1,026",W41,46,46,0,30,18,48
Tue,6 Oct 26,"28,124","28,124","2,634",W41,23,23,0,12,9,21
Wed,7 Oct 26,"44,977","44,977",767,W41,20,20,0,12,9,21
Thu,8 Oct 26,"30,377","30,377","5,498",W41,22,22,0,16,8,24
Fri,9 Oct 26,"38,768","38,768","9,176",W42,25,25,0,54,12,66
Sat,10 Oct 26,"35,343","35,343",609,W42,25,25,0,31,10,41
Sun,11 Oct 26,0,0,0,W42,0,0,0,0,0,0
Mon,12 Oct 26,"34,739","34,739","2,918",W42,28,28,0,24,10,34
Tue,13 Oct 26,"35,370","35,370","2,725",W42,52,52,0,40,12,52
Wed,14 Oct 26,"42,475","42,475","2,779",W42,21,21,0,10,8,18
Thu,15 Oct 26,"36,878","36,878","5,271",W42,27,27,0,17,3,20
Fri,16 Oct 26,"34,518","34,518","1,786",W43,20,20,0,20,4,24
Sat,17 Oct 26,"27,433","27,433","4,633",W43,39,39,0,29,3,32
Sun,18 Oct 26,0,0,0,W43,0,0,0,0,0,0
Mon,19 Oct 26,"30,881","30,881",486,W43,47,47,0,28,14,42
Tue,20 Oct 26,"43,502","43,502","9,554",W43,31,31,0,19,14,33
Wed,21 Oct 26,"46,459","46,459","3,441",W43,27,27,0,14,11,25
Thu,22 Oct 26,"45,790","45,790","10,115",W43,41,41,0,22,10,32
Fri,23 Oct 26,"49,906","49,906","1,080",W44,41,41,0,25,6,31
Sat,24 Oct 26,0,0,0,W44,0,0,0,0,0,0
Sun,25 Oct 26,0,0,0,W44,0,0,0,0,0,0
Mon,26 Oct 26,0,0,0,W44,0,0,0,0,0,0
Tue,27 Oct 26,"29,921","29,921",0,W44,15,15,0,16,3,19
Wed,28 Oct 26,"50,705","50,705","6,241",W44,33,33,0,29,18,47
Thu,29 Oct 26,"51,139","51,139","8,417",W44,51,51,0,26,16,42
Fri,30 Oct 26,"34,220","34,220",0,W45,33,33,0,29,8,37
Sat,31 Oct 26,"23,171","23,171","7,227",W45,18,18,0,12,3,15
Sun,1 Nov 26,"57,451","57,451","3,577",W45,29,29,0,28,12,40
Mon,2 Nov 26,"14,305","14,305",160,W45,18,18,0,12,5,17
Tue,3 Nov 26,"64,952","64,952","8,720",W45,52,52,0,41,20,61
Wed,4 Nov 26,53,53,0,W45,1,1,0,0,0,0
Thu,5 Nov 26,"26,100","26,100",745,W45,10,10,0,8,3,11
Fri,6 Nov 26,"39,115","39,115",494,W46,22,22,0,19,4,23
Sat,7 Nov 26,"45,842","45,842","2,026",W46,42,42,0,26,14,40
Sun,8 Nov 26,0,0,0,W46,0,0,0,0,0,0
Mon,9 Nov 26,"28,231","28,231","1,150",W46,25,25,-303,19,3,22
Tue,10 Nov 26,"45,121","45,121",479,W46,24,24,-2,20,4,24
Wed,11 Nov 26,"32,856","32,856","2,131",W46,38,38,-65,27,11,38
Thu,12 Nov 26,"46,668","46,668","5,233",W46,34,34,0,30,4,34
Fri,13 Nov 26,"43,978","43,978",26,W47,52,52,0,41,5,46
Sat,14 Nov 26,"40,696","40,696","5,252",W47,43,43,0,17,3,20
Sun,15 Nov 26,"34,548","11,233",513,W47,25,6,0,22,0,22
Mon,16 Nov 26,"14,031",6,0,W47,7,0,0,6,0,6
Tue,17 Nov 26,"1,199",0,0,W47,3,0,0,0,0,0
Wed,18 Nov 26,"22,015",13,0,W47,26,0,0,13,0,13
Thu,19 Nov 26,"21,726",22,0,W47,27,0,0,22,0,22
Fri,20 Nov 26,0,0,0,W48,0,0,0,0,0,0
Sat,21 Nov 26,"18,197",5,0,W48,13,0,0,5,0,5
Sun,22 Nov 26,"5,687",3,0,W48,3,0,0,3,0,3
Mon,23 Nov 26,0,0,0,W48,0,0,0,0,0,0
Tue,24 Nov 26,0,0,0,W48,0,0,0,0,0,0
Wed,25 Nov 26,0,0,0,W48,0,0,0,0,0,0
Thu,26 Nov 26,0,0,0,W48,0,0,0,0,0,0
Fri,27 Nov 26,0,0,0,W49,0,0,0,0,0,0
Sat,28 Nov 26,0,0,0,W49,0,0,0,0,0,0
Sun,29 Nov 26,0,0,0,W49,0,0,0,0,0,0
Mon,30 Nov 26,0,0,0,W49,0,0,0,0,0,0
Tue,1 Dec 26,0,0,0,W49,0,0,0,0,0,0`;

export function buildCsvTemplate(): string {
  return BASELINE_PACKING_CSV;
}

export function extractGoogleSheetInfo(input: string): {
  spreadsheetId: string | null;
  gid: string | null;
  publishedUrl: string | null;
} {
  const trimmed = input.trim();
  if (!trimmed) return { spreadsheetId: null, gid: null, publishedUrl: null };

  const gidMatch = trimmed.match(/[?#&]gid=([0-9]+)/);

  // Handle "File -> Share -> Publish to web" links (/spreadsheets/d/e/2PACX-.../pubhtml or /pub?output=csv)
  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch) {
    const base = `https://docs.google.com/spreadsheets/d/e/${pubMatch[1]}/pub`;
    const params = new URLSearchParams({ output: 'csv' });
    if (gidMatch?.[1]) {
      params.set('gid', gidMatch[1]);
      params.set('single', 'true');
    }
    return {
      spreadsheetId: pubMatch[1],
      gid: gidMatch ? gidMatch[1] : null,
      publishedUrl: `${base}?${params.toString()}`,
    };
  }

  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return { spreadsheetId: trimmed, gid: null, publishedUrl: null };
  }

  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

  return {
    spreadsheetId: idMatch ? idMatch[1] : null,
    gid: gidMatch ? gidMatch[1] : null,
    publishedUrl: null,
  };
}

export function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const text = csvText.replace(/^\uFEFF/, '');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((cell) => cell !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function cleanHeaderKey(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/['’`:.]/g, '')
    .replace(/\s+/g, ' ');
}

const FIELD_CONFIG: Array<{
  field: keyof Omit<
    PackingCapacityRow,
    'id' | 'dateSortKey' | 'completionPct' | 'itemCompletionPct' | 'status' | 'rawRow'
  >;
  expectedHeader: string;
  aliases: string[];
}> = [
  {
    field: 'weekday',
    expectedHeader: 'Weekday',
    aliases: ['weekday', 'day', 'day of week'],
  },
  {
    field: 'dateLabel',
    expectedHeader: 'Date:',
    aliases: ['date', 'packing date', 'prod date', 'work date'],
  },
  {
    field: 'planQty',
    expectedHeader: "Plan Qty's",
    aliases: ['plan qtys', 'plan qty', 'planned qty', 'plan quantity', 'plan'],
  },
  {
    field: 'inputQty',
    expectedHeader: "Input Qty's",
    aliases: ['input qtys', 'input qty', 'actual qty', 'input quantity', 'input'],
  },
  {
    field: 'tradeQty',
    expectedHeader: "Trade Qty's",
    aliases: ['trade qtys', 'trade qty', 'trade quantity', 'trade'],
  },
  {
    field: 'weekNo',
    expectedHeader: 'Week No.',
    aliases: ['week no', 'week number', 'week', 'wk'],
  },
  {
    field: 'plannedItems',
    expectedHeader: 'No. of Planned Items',
    aliases: ['no of planned items', 'planned items', 'plan items', 'total planned items'],
  },
  {
    field: 'finishedItems',
    expectedHeader: 'No. of Finished Items',
    aliases: ['no of finished items', 'finished items', 'completed items', 'done items'],
  },
  {
    field: 'remainReworkQty',
    expectedHeader: "Remain Rework Qty's",
    aliases: ['remain rework qtys', 'remain rework qty', 'rework qty', 'remain rework', 'rework'],
  },
  {
    field: 'ppaNgQty',
    expectedHeader: "PPA NG Qty's",
    aliases: ['ppa ng qtys', 'ppa ng qty', 'ppa ng', 'ppa'],
  },
  {
    field: 'oqcNgQty',
    expectedHeader: "OQC NG Qty's",
    aliases: ['oqc ng qtys', 'oqc ng qty', 'oqc ng', 'oqc'],
  },
  {
    field: 'totalNgQty',
    expectedHeader: "Total's NG Qty's",
    aliases: ['totals ng qtys', 'total ng qtys', 'total ng qty', 'total ng', 'totals ng'],
  },
];

function findHeaderIndex(
  headers: string[],
  aliases: string[]
): { index: number; header: string | null } {
  const normalizedHeaders = headers.map(cleanHeaderKey);
  for (const alias of aliases) {
    const exactIdx = normalizedHeaders.indexOf(alias);
    if (exactIdx !== -1) {
      return { index: exactIdx, header: headers[exactIdx] };
    }
  }
  for (const alias of aliases) {
    const partialIdx = normalizedHeaders.findIndex((h) => h.includes(alias));
    if (partialIdx !== -1) {
      return { index: partialIdx, header: headers[partialIdx] };
    }
  }
  return { index: -1, header: null };
}

function parseNumber(val: string | undefined, fallback = 0): number {
  if (!val) return fallback;
  const cleaned = val.replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseDateSortKey(dateLabel: string, fallbackIndex: number): number {
  const cleaned = dateLabel.trim();
  if (!cleaned) return fallbackIndex;

  // Match "14 Nov 26", "14-Nov-26", "14/Nov/2026"
  const match = cleaned.match(/^(\d{1,2})[\s\-/]+([A-Za-z]+)[\s\-/]+(\d{2,4})$/);
  if (match) {
    const day = Number.parseInt(match[1], 10);
    const monthKey = match[2].slice(0, 3).toLowerCase();
    const monthIdx = MONTH_INDEX[monthKey];
    const yrRaw = Number.parseInt(match[3], 10);
    const year = yrRaw < 100 ? 2000 + yrRaw : yrRaw;
    if (monthIdx !== undefined) {
      return new Date(year, monthIdx, day).getTime();
    }
  }

  // Match ISO "YYYY-MM-DD" as local date (avoid UTC midnight shift)
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number.parseInt(isoMatch[1], 10);
    const monthIdx = Number.parseInt(isoMatch[2], 10) - 1;
    const day = Number.parseInt(isoMatch[3], 10);
    return new Date(year, monthIdx, day).getTime();
  }

  // Match numeric "DD/MM/YYYY" or "MM/DD/YYYY"
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const p1 = Number.parseInt(slashMatch[1], 10);
    const p2 = Number.parseInt(slashMatch[2], 10);
    const yrRaw = Number.parseInt(slashMatch[3], 10);
    const year = yrRaw < 100 ? 2000 + yrRaw : yrRaw;
    // If first part > 12 it is DD/MM, otherwise assume MM/DD unless second > 12
    const isDayFirst = p1 > 12;
    const monthIdx = (isDayFirst ? p2 : p1) - 1;
    const day = isDayFirst ? p1 : p2;
    if (monthIdx >= 0 && monthIdx <= 11) {
      return new Date(year, monthIdx, day).getTime();
    }
  }

  const direct = new Date(cleaned);
  if (!Number.isNaN(direct.getTime())) {
    return new Date(
      direct.getFullYear(),
      direct.getMonth(),
      direct.getDate()
    ).getTime();
  }
  return fallbackIndex;
}

export interface WeekWindowMeta {
  lastWeek: string | null;
  currentWeek: string | null;
  nextWeek: string | null;
  orderedWindowWeeks: string[];
  roleByWeek: Record<string, 'Last Week' | 'Current Week' | 'Next Week'>;
}

export function getThreeWeekWindow(
  records: PackingCapacityRow[],
  referenceDate: Date = new Date()
): WeekWindowMeta {
  if (records.length === 0) {
    return {
      lastWeek: null,
      currentWeek: null,
      nextWeek: null,
      orderedWindowWeeks: [],
      roleByWeek: {},
    };
  }

  const weekRanges = new Map<
    string,
    { weekNo: string; minDate: number; maxDate: number }
  >();

  for (const row of records) {
    const wk = row.weekNo || 'Unassigned';
    const existing = weekRanges.get(wk);
    if (!existing) {
      weekRanges.set(wk, {
        weekNo: wk,
        minDate: row.dateSortKey,
        maxDate: row.dateSortKey,
      });
    } else {
      if (row.dateSortKey < existing.minDate) existing.minDate = row.dateSortKey;
      if (row.dateSortKey > existing.maxDate) existing.maxDate = row.dateSortKey;
    }
  }

  const orderedWeeks = Array.from(weekRanges.values()).sort(
    (a, b) => a.minDate - b.minDate
  );

  const todayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  // 1. Exact date range match for today
  let currentIdx = orderedWeeks.findIndex(
    (w) => w.minDate <= todayStart && todayStart <= w.maxDate
  );

  // 2. Fallback: latest week starting on or before today, or first week if all future
  if (currentIdx === -1) {
    let latestPastIdx = -1;
    for (let i = 0; i < orderedWeeks.length; i++) {
      if (orderedWeeks[i].minDate <= todayStart) {
        latestPastIdx = i;
      }
    }
    currentIdx = latestPastIdx !== -1 ? latestPastIdx : 0;
  }

  const lastWeek = currentIdx > 0 ? orderedWeeks[currentIdx - 1].weekNo : null;
  const currentWeek = orderedWeeks[currentIdx]?.weekNo ?? null;
  const nextWeek =
    currentIdx < orderedWeeks.length - 1
      ? orderedWeeks[currentIdx + 1].weekNo
      : null;

  const orderedWindowWeeks: string[] = [];
  const roleByWeek: Record<string, 'Last Week' | 'Current Week' | 'Next Week'> =
    {};

  if (lastWeek) {
    orderedWindowWeeks.push(lastWeek);
    roleByWeek[lastWeek] = 'Last Week';
  }
  if (currentWeek) {
    orderedWindowWeeks.push(currentWeek);
    roleByWeek[currentWeek] = 'Current Week';
  }
  if (nextWeek) {
    orderedWindowWeeks.push(nextWeek);
    roleByWeek[nextWeek] = 'Next Week';
  }

  return {
    lastWeek,
    currentWeek,
    nextWeek,
    orderedWindowWeeks,
    roleByWeek,
  };
}

export function getTodayCapacityRecord(
  records: PackingCapacityRow[],
  referenceDate: Date = new Date()
): PackingCapacityRow | null {
  if (records.length === 0) return null;

  const todayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  const exactMatch = records.find((r) => r.dateSortKey === todayStart);
  if (exactMatch) return exactMatch;

  const sorted = [...records].sort((a, b) => a.dateSortKey - b.dateSortKey);
  let latestPast: PackingCapacityRow | null = null;
  for (const row of sorted) {
    if (row.dateSortKey <= todayStart) {
      latestPast = row;
    }
  }
  return latestPast ?? sorted[0];
}

export interface DailyWindowMeta {
  records: PackingCapacityRow[];
  startDateLabel: string | null;
  endDateLabel: string | null;
}

export function getDailyThirtyOneDayWindow(
  records: PackingCapacityRow[],
  referenceDate: Date = new Date()
): DailyWindowMeta {
  if (records.length === 0) {
    return { records: [], startDateLabel: null, endDateLabel: null };
  }

  const endMs = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + 7
  ).getTime();

  // 23 days before today + today + 7 days after today = 31 days total
  const startMs = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - 23
  ).getTime();

  const sorted = [...records].sort((a, b) => a.dateSortKey - b.dateSortKey);

  let windowed = sorted.filter(
    (r) => r.dateSortKey >= startMs && r.dateSortKey <= endMs
  );

  if (windowed.length === 0) {
    const upToEnd = sorted.filter((r) => r.dateSortKey <= endMs);
    windowed = upToEnd.length > 0 ? upToEnd.slice(-31) : sorted.slice(0, 31);
  } else if (windowed.length > 31) {
    windowed = windowed.slice(-31);
  }

  return {
    records: windowed,
    startDateLabel: windowed[0]?.dateLabel ?? null,
    endDateLabel: windowed[windowed.length - 1]?.dateLabel ?? null,
  };
}

export function deriveCapacityStatus(params: {
  planQty: number;
  inputQty: number;
  plannedItems: number;
  finishedItems: number;
  remainReworkQty: number;
  dateSortKey: number;
  referenceDate?: Date;
}): CapacityStatus {
  const {
    planQty,
    inputQty,
    plannedItems,
    finishedItems,
    remainReworkQty,
    dateSortKey,
    referenceDate = new Date(),
  } = params;

  const todayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  if (planQty === 0 && inputQty === 0 && plannedItems === 0 && finishedItems === 0) {
    return dateSortKey < todayStart ? 'Off Day' : 'Waiting';
  }
  if (remainReworkQty < 0) {
    return 'Rework Alert';
  }
  if (
    (plannedItems > 0 && finishedItems >= plannedItems) ||
    (planQty > 0 && inputQty >= planQty)
  ) {
    return 'Completed';
  }
  if (inputQty > 0 || finishedItems > 0) {
    return 'In Progress';
  }
  return 'Planned';
}

export function parseRowsToCapacityData(rows: string[][]): {
  records: PackingCapacityRow[];
  headers: string[];
  matchedColumns: ColumnMatchInfo[];
} {
  if (!rows || rows.length === 0) {
    return { records: [], headers: [], matchedColumns: [] };
  }

  // Locate header row (scan up to 30 rows in case a sheet has title/summary rows above headers)
  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const joined = rows[r].map(cleanHeaderKey).join(' ');
    if (
      (joined.includes('weekday') && joined.includes('date')) ||
      joined.includes('plan qty') ||
      (joined.includes('week no') && joined.includes('input qty'))
    ) {
      headerRowIndex = r;
      break;
    }
  }

  const headers = rows[headerRowIndex].map((h, i) =>
    h.trim() ? h.trim() : `Column ${i + 1}`
  );

  const indexMap: Record<string, number> = {};
  const matchedColumns: ColumnMatchInfo[] = [];

  for (const cfg of FIELD_CONFIG) {
    const found = findHeaderIndex(headers, cfg.aliases);
    indexMap[cfg.field] = found.index;
    matchedColumns.push({
      field: cfg.field,
      expectedHeader: cfg.expectedHeader,
      matchedHeader: found.header,
    });
  }

  const dateColIdx = indexMap['dateLabel'];
  const weekdayColIdx = indexMap['weekday'];

  const dataRows = rows.slice(headerRowIndex + 1).filter((row) => {
    if (!row.some((cell) => cell.trim() !== '')) return false;

    const dateCell =
      dateColIdx !== -1 && dateColIdx < row.length
        ? row[dateColIdx].trim()
        : '';
    const weekdayCell =
      weekdayColIdx !== -1 && weekdayColIdx < row.length
        ? row[weekdayColIdx].trim()
        : '';

    const combinedLabel = `${weekdayCell} ${dateCell}`.toLowerCase();
    // Exclude spreadsheet footer/summary rows like "Total", "Grand Total", "Average"
    if (
      /\b(total|grand total|subtotal|average|avg|sum|summary)\b/.test(
        combinedLabel
      )
    ) {
      return false;
    }

    // If a Date column exists, skip rows without a date value (notes / blank divider rows)
    if (dateColIdx !== -1 && !dateCell) {
      return false;
    }

    return true;
  });

  const records: PackingCapacityRow[] = dataRows.map((row, idx) => {
    const getVal = (field: string): string => {
      const colIdx = indexMap[field];
      return colIdx !== -1 && colIdx < row.length ? (row[colIdx] ?? '').trim() : '';
    };

    const rawRow: Record<string, string> = {};
    headers.forEach((h, i) => {
      rawRow[h] = (row[i] ?? '').trim();
    });

    const weekday = getVal('weekday') || '—';
    const dateLabel = getVal('dateLabel') || `Row ${idx + 1}`;
    const weekNo = getVal('weekNo') || 'Unassigned';
    const planQty = Math.round(parseNumber(getVal('planQty'), 0));
    const inputQty = Math.round(parseNumber(getVal('inputQty'), 0));
    const tradeQty = Math.round(parseNumber(getVal('tradeQty'), 0));
    const plannedItems = Math.round(parseNumber(getVal('plannedItems'), 0));
    const finishedItems = Math.round(parseNumber(getVal('finishedItems'), 0));
    const remainReworkQty = Math.round(parseNumber(getVal('remainReworkQty'), 0));
    const ppaNgQty = Math.round(parseNumber(getVal('ppaNgQty'), 0));
    const oqcNgQty = Math.round(parseNumber(getVal('oqcNgQty'), 0));
    const parsedTotalNg = Math.round(parseNumber(getVal('totalNgQty'), -1));
    const totalNgQty =
      parsedTotalNg >= 0 ? parsedTotalNg : ppaNgQty + oqcNgQty;

    const completionPct =
      planQty > 0 ? Math.min(100, Math.round((inputQty / planQty) * 1000) / 10) : 0;
    const itemCompletionPct =
      plannedItems > 0
        ? Math.min(100, Math.round((finishedItems / plannedItems) * 1000) / 10)
        : 0;

    const dateSortKey = parseDateSortKey(dateLabel, idx);

    const status = deriveCapacityStatus({
      planQty,
      inputQty,
      plannedItems,
      finishedItems,
      remainReworkQty,
      dateSortKey,
    });

    return {
      id: `${weekNo}-${dateLabel}-${idx}`,
      weekday,
      dateLabel,
      dateSortKey,
      weekNo,
      planQty,
      inputQty,
      tradeQty,
      plannedItems,
      finishedItems,
      remainReworkQty,
      ppaNgQty,
      oqcNgQty,
      totalNgQty,
      completionPct,
      itemCompletionPct,
      status,
      rawRow,
    };
  });

  return { records, headers, matchedColumns };
}

export const INITIAL_CAPACITY_RECORDS: PackingCapacityRow[] =
  parseRowsToCapacityData(parseCsvText(BASELINE_PACKING_CSV)).records;
