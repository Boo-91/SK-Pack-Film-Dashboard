import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { PackingCapacityRow } from '../types/packing';
import { CapacityStatusLabel } from './StatusVisuals';

interface OrderDetailDrawerProps {
  record: PackingCapacityRow | null;
  onClose: () => void;
}

export function OrderDetailDrawer({ record, onClose }: OrderDetailDrawerProps) {
  useEffect(() => {
    if (!record) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [record, onClose]);

  const extraEntries = record?.rawRow ? Object.entries(record.rawRow) : [];

  return (
    <AnimatePresence>
      {record && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-[#0B0720]/75 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md glass-sidebar border-l border-[#D1B8FF]/18 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-[-24px_0_64px_-16px_rgba(106,47,200,0.4)]"
            role="dialog"
            aria-modal="true"
            aria-label={`Capacity record for ${record.dateLabel}`}
          >
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D1B8FF]/14">
                <div>
                  <h3 className="text-lg font-semibold text-[#F2E9FF]">
                    {record.dateLabel} ({record.weekday})
                  </h3>
                  <p className="text-xs text-[#D1B8FF]/70 mt-0.5 font-mono">
                    {record.weekNo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-[#D1B8FF]/70 hover:text-[#F2E9FF] rounded-lg hover:bg-[#6A2FC8]/25 transition-colors duration-150 cursor-pointer"
                  aria-label="Close record details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <CapacityStatusLabel status={record.status} />
                <span className="text-xs font-mono tabular-nums text-[#D1B8FF]/75">
                  {record.completionPct}% Input / Plan
                </span>
              </div>

              {/* Volume & Item Progress */}
              <div className="py-4 border-y border-[#D1B8FF]/12 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#D1B8FF]">
                      Input Qty&apos;s vs. Plan Qty&apos;s
                    </span>
                    <span className="font-mono tabular-nums text-[#F2E9FF] font-semibold">
                      {record.inputQty.toLocaleString()} /{' '}
                      {record.planQty.toLocaleString()} ({record.completionPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, record.completionPct)}%`,
                      }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-[#6A2FC8] to-[#9D71E8] shadow-[0_0_12px_rgba(157,113,232,0.75)]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#D1B8FF]">
                      Finished Items vs. Planned Items
                    </span>
                    <span className="font-mono tabular-nums text-[#F2E9FF] font-semibold">
                      {record.finishedItems} / {record.plannedItems} (
                      {record.itemCompletionPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, record.itemCompletionPct)}%`,
                      }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.65)]"
                    />
                  </div>
                </div>
              </div>

              {/* Exact Sheet Metrics */}
              <dl className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                <div>
                  <dt className="text-xs text-[#D1B8FF]/65">Trade Qty&apos;s</dt>
                  <dd className="font-mono tabular-nums font-medium text-[#F2E9FF] mt-0.5">
                    {record.tradeQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#D1B8FF]/65">
                    Remain Rework Qty&apos;s
                  </dt>
                  <dd
                    className={`font-mono tabular-nums font-semibold mt-0.5 ${
                      record.remainReworkQty < 0
                        ? 'text-rose-400'
                        : 'text-[#F2E9FF]'
                    }`}
                  >
                    {record.remainReworkQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#D1B8FF]/65">PPA NG Qty&apos;s</dt>
                  <dd className="font-mono tabular-nums font-medium text-[#F2E9FF] mt-0.5">
                    {record.ppaNgQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#D1B8FF]/65">OQC NG Qty&apos;s</dt>
                  <dd className="font-mono tabular-nums font-medium text-[#F2E9FF] mt-0.5">
                    {record.oqcNgQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#D1B8FF]/65">
                    Total&apos;s NG Qty&apos;s
                  </dt>
                  <dd className="font-mono tabular-nums font-semibold text-amber-300 mt-0.5">
                    {record.totalNgQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#D1B8FF]/65">Week No.</dt>
                  <dd className="font-mono font-medium text-[#F2E9FF] mt-0.5">
                    {record.weekNo}
                  </dd>
                </div>
              </dl>

              {extraEntries.length > 0 && (
                <div className="pt-4 border-t border-[#D1B8FF]/12">
                  <p className="text-xs font-medium text-[#D1B8FF]/70 mb-2">
                    Raw Spreadsheet Row
                  </p>
                  <dl className="divide-y divide-[#D1B8FF]/10 text-xs">
                    {extraEntries.map(([k, v]) => (
                      <div
                        key={k}
                        className="py-1.5 flex items-start justify-between gap-4"
                      >
                        <dt className="text-[#D1B8FF]/65 shrink-0">{k}</dt>
                        <dd className="text-[#F2E9FF] font-mono text-right break-all">
                          {v || '—'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-[#D1B8FF]/14">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 px-4 text-sm font-medium rounded-lg btn-violet-glow cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
