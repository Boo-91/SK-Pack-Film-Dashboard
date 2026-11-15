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
    <section className="bg-[#0C172B] border border-[#1B2B48] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="p-5 border-b border-[#1B2B48] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Daily Packing Capacity Log
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
              Showing {records.length} {records.length === 1 ? 'day' : 'days'}
              {windowDescription ? ` · ${windowDescription}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#13223D] hover:bg-[#1A2E52] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={records.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#111F38] border border-[#223659] hover:bg-[#172A4A] hover:border-[#2E4975] disabled:opacity-50 rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Status Segmented Tabs with sliding highlight */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#081020] border border-[#162542] rounded-lg w-fit max-w-full overflow-x-auto">
          {(['All', ...CAPACITY_STATUS_ORDER] as const).map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusFilterChange(status)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tableStatusPill"
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 bg-blue-600 rounded-md"
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
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search date (e.g. 14 Nov), week (W46), weekday..."
              aria-label="Search daily capacity records"
              className="w-full h-10 pl-9 pr-3 text-sm bg-[#081020] border border-[#1E3154] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors duration-150"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={weekFilter}
              onChange={(e) => onWeekFilterChange(e.target.value)}
              aria-label="Filter by Week No."
              className="w-full h-10 px-3 text-sm bg-[#081020] border border-[#1E3154] rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors duration-150"
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
              className="w-full h-10 px-3 text-sm bg-[#081020] border border-[#1E3154] rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors duration-150"
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
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) =>
                onSortByChange(
                  e.target.value as 'date' | 'plan' | 'ng' | 'rework'
                )
              }
              aria-label="Sort daily capacity records"
              className="w-full h-10 pl-8 pr-3 text-sm bg-[#081020] border border-[#1E3154] rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors duration-150"
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
        <div className="divide-y divide-[#162542]">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="px-5 py-3 flex items-center justify-between gap-4 animate-pulse"
            >
              <div className="h-4 w-24 bg-[#182947] rounded" />
              <div className="h-4 w-32 bg-[#13223D] rounded" />
              <div className="h-4 w-24 bg-[#182947] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && records.length === 0 && (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-100">
            No capacity rows match the current filter
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Adjust your search, week, or status filter to view daily records.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors duration-150 cursor-pointer"
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
                <tr className="bg-[#091224] border-b border-[#1B2B48] text-xs font-medium text-slate-400 whitespace-nowrap">
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
              <tbody className="divide-y divide-[#162542] text-sm">
                {records.map((row) => {
                  const isToday = isRowToday(row);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => onSelectRecord(row)}
                      className={`h-10 transition-colors duration-150 cursor-pointer ${
                        isToday
                          ? 'bg-[#12294D] hover:bg-[#17335F] ring-1 ring-inset ring-sky-400/40'
                          : row.status === 'Off Day' || row.status === 'Waiting'
                            ? 'bg-[#091224]/50 hover:bg-[#13223D] text-slate-500'
                            : 'hover:bg-[#13223D]'
                      }`}
                    >
                      <td className="py-2 pl-5 pr-3 whitespace-nowrap">
                        <span
                          className={
                            isToday
                              ? 'font-semibold text-white'
                              : 'font-medium text-slate-100'
                          }
                        >
                          {row.dateLabel}
                        </span>
                        <span
                          className={`ml-2 text-xs ${
                            isToday ? 'text-sky-300' : 'text-slate-400'
                          }`}
                        >
                          {row.weekday}
                        </span>
                        {isToday && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-sky-400"
                              aria-hidden="true"
                            />
                            Today
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-2 px-3 font-mono text-xs whitespace-nowrap ${
                          isToday ? 'text-sky-300 font-medium' : 'text-slate-400'
                        }`}
                      >
                        {row.weekNo}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <CapacityStatusLabel status={row.status} />
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                        {row.planQty.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-medium text-slate-100 whitespace-nowrap">
                        {row.inputQty.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-400 whitespace-nowrap">
                        {row.tradeQty.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                        {row.finishedItems}/{row.plannedItems}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap ${
                          row.remainReworkQty < 0
                            ? 'text-red-400 font-semibold'
                            : 'text-slate-500'
                        }`}
                      >
                        {row.remainReworkQty.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-400 whitespace-nowrap">
                        {row.ppaNgQty}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-400 whitespace-nowrap">
                        {row.oqcNgQty}
                      </td>
                      <td
                        className={`py-2 pl-3 pr-5 text-right font-mono tabular-nums whitespace-nowrap ${
                          row.totalNgQty >= 40
                            ? 'text-amber-400 font-semibold'
                            : 'text-slate-300'
                        }`}
                      >
                        {row.totalNgQty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#091224] border-t-2 border-[#223659] text-sm font-semibold">
                  <td className="py-3 pl-5 pr-3 text-slate-100 whitespace-nowrap">
                    Total ({records.length}{' '}
                    {records.length === 1 ? 'day' : 'days'})
                  </td>
                  <td className="py-3 px-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                    —
                  </td>
                  <td className="py-3 px-3 text-xs font-mono text-sky-400 whitespace-nowrap">
                    {totals.activeDays} active
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200 whitespace-nowrap">
                    {totals.planQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-white whitespace-nowrap">
                    {totals.inputQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                    {totals.tradeQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200 whitespace-nowrap">
                    {totals.finishedItems.toLocaleString()}/
                    {totals.plannedItems.toLocaleString()}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap ${
                      totals.remainReworkQty < 0
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {totals.remainReworkQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                    {totals.ppaNgQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                    {totals.oqcNgQty.toLocaleString()}
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right font-mono tabular-nums text-amber-400 whitespace-nowrap">
                    {totals.totalNgQty.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="md:hidden divide-y divide-[#162542]">
            {records.map((row) => {
              const isToday = isRowToday(row);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onSelectRecord(row)}
                  className={`w-full p-4 text-left transition-colors duration-150 cursor-pointer space-y-2.5 ${
                    isToday
                      ? 'bg-[#12294D] hover:bg-[#17335F] ring-1 ring-inset ring-sky-400/40'
                      : 'hover:bg-[#13223D]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-100">
                      {row.dateLabel}{' '}
                      <span
                        className={`font-normal ${
                          isToday ? 'text-sky-300' : 'text-slate-400'
                        }`}
                      >
                        · {row.weekday} · {row.weekNo}
                      </span>
                      {isToday && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-sky-400"
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
                    <span className="text-slate-500 block">Plan</span>
                    <span className="text-slate-300 font-medium">
                      {row.planQty.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Input</span>
                    <span className="text-slate-100 font-semibold">
                      {row.inputQty.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Items</span>
                    <span className="text-slate-300">
                      {row.finishedItems}/{row.plannedItems}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs font-mono tabular-nums text-slate-400 pt-1">
                  <span>
                    NG: {row.totalNgQty} (PPA {row.ppaNgQty} · OQC{' '}
                    {row.oqcNgQty})
                  </span>
                  <span
                    className={
                      row.remainReworkQty < 0
                        ? 'text-red-400 font-semibold'
                        : ''
                    }
                  >
                    Rework: {row.remainReworkQty}
                  </span>
                </div>
              </button>
              );
            })}

            <div className="p-4 bg-[#091224] border-t-2 border-[#223659] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">
                  Table Total ({records.length}{' '}
                  {records.length === 1 ? 'day' : 'days'})
                </span>
                <span className="text-xs font-mono text-sky-400">
                  {totals.activeDays} active
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                <div>
                  <span className="text-slate-500 block">Plan</span>
                  <span className="text-slate-200 font-semibold">
                    {totals.planQty.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Input</span>
                  <span className="text-white font-semibold">
                    {totals.inputQty.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Items</span>
                  <span className="text-slate-200 font-semibold">
                    {totals.finishedItems.toLocaleString()}/
                    {totals.plannedItems.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs font-mono tabular-nums text-slate-300 pt-1">
                <span>
                  NG: {totals.totalNgQty.toLocaleString()} (PPA{' '}
                  {totals.ppaNgQty.toLocaleString()} · OQC{' '}
                  {totals.oqcNgQty.toLocaleString()})
                </span>
                <span
                  className={
                    totals.remainReworkQty < 0
                      ? 'text-red-400 font-semibold'
                      : 'text-emerald-400 font-semibold'
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
