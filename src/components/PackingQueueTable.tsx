import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpDown, Download, Search, X } from 'lucide-react';
import { CapacityStatus, PackingCapacityRow } from '../types/packing';
import {
  CAPACITY_STATUS_ORDER,
  CapacityStatusLabel,
} from './StatusVisuals';

interface PackingQueueTableProps {
  records: PackingCapacityRow[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: CapacityStatus | 'All';
  onStatusFilterChange: (status: CapacityStatus | 'All') => void;
  weekFilter: string;
  onWeekFilterChange: (week: string) => void;
  weekdayFilter: string;
  onWeekdayFilterChange: (weekday: string) => void;
  weeks: string[];
  weekdays: string[];
  sortBy: 'date' | 'plan' | 'ng' | 'rework';
  onSortByChange: (sort: 'date' | 'plan' | 'ng' | 'rework') => void;
  onSelectRecord: (record: PackingCapacityRow) => void;
  onResetFilters: () => void;
  isLoading: boolean;
  windowDescription?: string;
  todayRecordId?: string | null;
}

export function PackingQueueTable({
  records,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  weekFilter,
  onWeekFilterChange,
  weekdayFilter,
  onWeekdayFilterChange,
  weeks,
  weekdays,
  sortBy,
  onSortByChange,
  onSelectRecord,
  onResetFilters,
  isLoading,
  windowDescription,
  todayRecordId,
}: PackingQueueTableProps) {
  const handleExportCsv = () => {
    const headers = [
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
    const escape = (val: string | number) => {
      const s = String(val);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const lines = [
      headers.map(escape).join(','),
      ...records.map((r) =>
        [
          r.weekday,
          r.dateLabel,
          r.planQty,
          r.inputQty,
          r.tradeQty,
          r.weekNo,
          r.plannedItems,
          r.finishedItems,
          r.remainReworkQty,
          r.ppaNgQty,
          r.oqcNgQty,
          r.totalNgQty,
        ]
          .map(escape)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `packing-capacity-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'All' ||
    weekFilter !== 'All' ||
    weekdayFilter !== 'All';

  const totals = records.reduce(
    (acc, r) => {
      acc.planQty += r.planQty;
      acc.inputQty += r.inputQty;
      acc.tradeQty += r.tradeQty;
      acc.plannedItems += r.plannedItems;
      acc.finishedItems += r.finishedItems;
      acc.remainReworkQty += r.remainReworkQty;
      acc.ppaNgQty += r.ppaNgQty;
      acc.oqcNgQty += r.oqcNgQty;
      acc.totalNgQty += r.totalNgQty;
      if (r.status !== 'Off Day' && r.status !== 'Waiting') acc.activeDays += 1;
      return acc;
    },
    {
      planQty: 0,
      inputQty: 0,
      tradeQty: 0,
      plannedItems: 0,
      finishedItems: 0,
      remainReworkQty: 0,
      ppaNgQty: 0,
      oqcNgQty: 0,
      totalNgQty: 0,
      activeDays: 0,
    }
  );

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  const isRowToday = (row: PackingCapacityRow): boolean =>
    row.dateSortKey === todayStart ||
    (Boolean(todayRecordId) &&
      row.id === todayRecordId &&
      row.dateSortKey === todayStart);

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="p-5 border-b border-[#D1B8FF]/14 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#F2E9FF]">
              Daily Packing Capacity Log
            </h2>
            <p className="text-xs text-[#D1B8FF]/65 mt-0.5 font-mono tabular-nums">
              Showing {records.length} {records.length === 1 ? 'day' : 'days'}
              {windowDescription ? ` · ${windowDescription}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] bg-[#6A2FC8]/25 hover:bg-[#6A2FC8]/40 border border-[#9D71E8]/30 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={records.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium glass-control disabled:opacity-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#D1B8FF]" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Status Segmented Tabs with sliding glow highlight */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0B0720]/70 border border-[#D1B8FF]/14 rounded-xl w-fit max-w-full overflow-x-auto">
          {(['All', ...CAPACITY_STATUS_ORDER] as const).map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusFilterChange(status)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-[#F2E9FF]'
                    : 'text-[#D1B8FF]/65 hover:text-[#F2E9FF]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tableStatusPill"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 bg-gradient-to-r from-[#6A2FC8] to-[#9D71E8]/90 rounded-lg shadow-[0_0_18px_-4px_rgba(106,47,200,0.8)]"
                  />
                )}
                <span className="relative z-10">{status}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-[#9D71E8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search date (e.g. 14 Nov), week (W46), weekday..."
              aria-label="Search daily capacity records"
              className="w-full h-10 pl-9 pr-3 text-sm glass-control rounded-lg placeholder:text-[#D1B8FF]/40"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={weekFilter}
              onChange={(e) => onWeekFilterChange(e.target.value)}
              aria-label="Filter by Week No."
              className="w-full h-10 px-3 text-sm glass-control rounded-lg cursor-pointer"
            >
              <option value="All">All Weeks</option>
              {weeks.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={weekdayFilter}
              onChange={(e) => onWeekdayFilterChange(e.target.value)}
              aria-label="Filter by Weekday"
              className="w-full h-10 px-3 text-sm glass-control rounded-lg cursor-pointer"
            >
              <option value="All">All Weekdays</option>
              {weekdays.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 relative">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#9D71E8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) =>
                onSortByChange(
                  e.target.value as 'date' | 'plan' | 'ng' | 'rework'
                )
              }
              aria-label="Sort daily capacity records"
              className="w-full h-10 pl-8 pr-3 text-sm glass-control rounded-lg cursor-pointer"
            >
              <option value="date">Sort: Date</option>
              <option value="plan">Sort: Plan Qty</option>
              <option value="ng">Sort: Highest NG</option>
              <option value="rework">Sort: Rework Alert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="divide-y divide-[#D1B8FF]/10">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="px-5 py-3 flex items-center justify-between gap-4 animate-pulse"
            >
              <div className="h-4 w-24 bg-[#6A2FC8]/30 rounded" />
              <div className="h-4 w-32 bg-[#25134D]/60 rounded" />
              <div className="h-4 w-24 bg-[#9D71E8]/25 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && records.length === 0 && (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-[#F2E9FF]">
            No capacity rows match the current filter
          </p>
          <p className="text-xs text-[#D1B8FF]/65 mt-1">
            Adjust your search, week, or status filter to view daily records.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 text-xs font-medium rounded-lg btn-violet-glow cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* Desktop High-Density Table */}
      {!isLoading && records.length > 0 && (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B0720]/65 border-b border-[#D1B8FF]/14 text-xs font-medium text-[#D1B8FF]/70 whitespace-nowrap">
                  <th className="py-2.5 pl-5 pr-3 font-medium">Date:</th>
                  <th className="py-2.5 px-3 font-medium">Week No.</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">
                    Plan Qty&apos;s
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">
                    Input Qty&apos;s
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">
                    Trade Qty&apos;s
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">
                    Items (Fin/Plan)
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">
                    Remain Rework
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">PPA NG</th>
                  <th className="py-2.5 px-3 font-medium text-right">OQC NG</th>
                  <th className="py-2.5 pl-3 pr-5 font-medium text-right">
                    Total NG
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1B8FF]/10 text-sm">
                {records.map((row) => {
                  const isToday = isRowToday(row);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => onSelectRecord(row)}
                      className={`h-10 transition-colors duration-150 cursor-pointer ${
                        isToday
                          ? 'bg-[#6A2FC8]/25 hover:bg-[#6A2FC8]/35 ring-1 ring-inset ring-[#D1B8FF]/45 shadow-[inset_0_0_24px_-12px_rgba(157,113,232,0.85)]'
                          : row.status === 'Off Day' || row.status === 'Waiting'
                            ? 'bg-[#0B0720]/30 hover:bg-[#6A2FC8]/15 text-[#D1B8FF]/45'
                            : 'hover:bg-[#6A2FC8]/18'
                      }`}
                    >
                      <td className="py-2 pl-5 pr-3 whitespace-nowrap">
                        <span
                          className={
                            isToday
                              ? 'font-semibold text-[#F2E9FF]'
                              : 'font-medium text-[#F2E9FF]/90'
                          }
                        >
                          {row.dateLabel}
                        </span>
                        <span
                          className={`ml-2 text-xs ${
                            isToday
                              ? 'text-[#D1B8FF]'
                              : 'text-[#D1B8FF]/65'
                          }`}
                        >
                          {row.weekday}
                        </span>
                        {isToday && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#D1B8FF]">
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-[#D1B8FF] shadow-[0_0_8px_#D1B8FF]"
                              aria-hidden="true"
                            />
                            Today
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-2 px-3 font-mono text-xs whitespace-nowrap ${
                          isToday
                            ? 'text-[#D1B8FF] font-medium'
                            : 'text-[#D1B8FF]/65'
                        }`}
                      >
                        {row.weekNo}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <CapacityStatusLabel status={row.status} />
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/80 whitespace-nowrap">
                        {row.planQty.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-medium text-[#F2E9FF] whitespace-nowrap">
                        {row.inputQty.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/65 whitespace-nowrap">
                        {row.tradeQty.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/80 whitespace-nowrap">
                        {row.finishedItems}/{row.plannedItems}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap ${
                          row.remainReworkQty < 0
                            ? 'text-rose-400 font-semibold'
                            : 'text-[#D1B8FF]/50'
                        }`}
                      >
                        {row.remainReworkQty.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/65 whitespace-nowrap">
                        {row.ppaNgQty}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/65 whitespace-nowrap">
                        {row.oqcNgQty}
                      </td>
                      <td
                        className={`py-2 pl-3 pr-5 text-right font-mono tabular-nums whitespace-nowrap ${
                          row.totalNgQty >= 40
                            ? 'text-amber-300 font-semibold'
                            : 'text-[#D1B8FF]/80'
                        }`}
                      >
                        {row.totalNgQty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#0B0720]/70 border-t-2 border-[#9D71E8]/35 text-sm font-semibold">
                  <td className="py-3 pl-5 pr-3 text-[#F2E9FF] whitespace-nowrap">
                    Total ({records.length}{' '}
                    {records.length === 1 ? 'day' : 'days'})
                  </td>
                  <td className="py-3 px-3 text-xs font-mono text-[#D1B8FF]/60 whitespace-nowrap">
                    —
                  </td>
                  <td className="py-3 px-3 text-xs font-mono text-[#D1B8FF] whitespace-nowrap">
                    {totals.activeDays} active
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/85 whitespace-nowrap">
                    {totals.planQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#F2E9FF] whitespace-nowrap">
                    {totals.inputQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/80 whitespace-nowrap">
                    {totals.tradeQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/85 whitespace-nowrap">
                    {totals.finishedItems.toLocaleString()}/
                    {totals.plannedItems.toLocaleString()}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap ${
                      totals.remainReworkQty < 0
                        ? 'text-rose-400'
                        : 'text-emerald-300'
                    }`}
                  >
                    {totals.remainReworkQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/80 whitespace-nowrap">
                    {totals.ppaNgQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/80 whitespace-nowrap">
                    {totals.oqcNgQty.toLocaleString()}
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right font-mono tabular-nums text-amber-300 whitespace-nowrap">
                    {totals.totalNgQty.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="md:hidden divide-y divide-[#D1B8FF]/10">
            {records.map((row) => {
              const isToday = isRowToday(row);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onSelectRecord(row)}
                  className={`w-full p-4 text-left transition-colors duration-150 cursor-pointer space-y-2.5 ${
                    isToday
                      ? 'bg-[#6A2FC8]/25 hover:bg-[#6A2FC8]/35 ring-1 ring-inset ring-[#D1B8FF]/45'
                      : 'hover:bg-[#6A2FC8]/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-[#F2E9FF]">
                      {row.dateLabel}{' '}
                      <span
                        className={`font-normal ${
                          isToday ? 'text-[#D1B8FF]' : 'text-[#D1B8FF]/65'
                        }`}
                      >
                        · {row.weekday} · {row.weekNo}
                      </span>
                      {isToday && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#D1B8FF]">
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[#D1B8FF] shadow-[0_0_8px_#D1B8FF]"
                            aria-hidden="true"
                          />
                          Today
                        </span>
                      )}
                    </div>
                    <CapacityStatusLabel status={row.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                    <div>
                      <span className="text-[#D1B8FF]/55 block">Plan</span>
                      <span className="text-[#D1B8FF]/85 font-medium">
                        {row.planQty.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#D1B8FF]/55 block">Input</span>
                      <span className="text-[#F2E9FF] font-semibold">
                        {row.inputQty.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#D1B8FF]/55 block">Items</span>
                      <span className="text-[#D1B8FF]/85">
                        {row.finishedItems}/{row.plannedItems}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs font-mono tabular-nums text-[#D1B8FF]/65 pt-1">
                    <span>
                      NG: {row.totalNgQty} (PPA {row.ppaNgQty} · OQC{' '}
                      {row.oqcNgQty})
                    </span>
                    <span
                      className={
                        row.remainReworkQty < 0
                          ? 'text-rose-400 font-semibold'
                          : ''
                      }
                    >
                      Rework: {row.remainReworkQty}
                    </span>
                  </div>
                </button>
              );
            })}

            <div className="p-4 bg-[#0B0720]/70 border-t-2 border-[#9D71E8]/35 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#F2E9FF]">
                  Table Total ({records.length}{' '}
                  {records.length === 1 ? 'day' : 'days'})
                </span>
                <span className="text-xs font-mono text-[#D1B8FF]">
                  {totals.activeDays} active
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                <div>
                  <span className="text-[#D1B8FF]/55 block">Plan</span>
                  <span className="text-[#D1B8FF]/85 font-semibold">
                    {totals.planQty.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#D1B8FF]/55 block">Input</span>
                  <span className="text-[#F2E9FF] font-semibold">
                    {totals.inputQty.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#D1B8FF]/55 block">Items</span>
                  <span className="text-[#D1B8FF]/85 font-semibold">
                    {totals.finishedItems.toLocaleString()}/
                    {totals.plannedItems.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs font-mono tabular-nums text-[#D1B8FF]/80 pt-1">
                <span>
                  NG: {totals.totalNgQty.toLocaleString()} (PPA{' '}
                  {totals.ppaNgQty.toLocaleString()} · OQC{' '}
                  {totals.oqcNgQty.toLocaleString()})
                </span>
                <span
                  className={
                    totals.remainReworkQty < 0
                      ? 'text-rose-400 font-semibold'
                      : 'text-emerald-300 font-semibold'
                  }
                >
                  Rework: {totals.remainReworkQty.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
