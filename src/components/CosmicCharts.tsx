import React, { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface DonutSegmentInput {
  id: string;
  label: string;
  subLabel?: string;
  count: number;
  valueText?: string;
  color: string;
  highlightColor?: string;
}

interface CosmicDonutChartProps {
  segments: DonutSegmentInput[];
  totalCount: number;
  totalLabel: string;
  activeFilter: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
}

export function CosmicDonutChart({
  segments,
  totalCount,
  totalLabel,
  activeFilter,
  onSelect,
  ariaLabel,
}: CosmicDonutChartProps) {
  const uid = useId().replace(/:/g, '');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const activeCount = segments.filter((s) => s.count > 0).length;

  let cumulativeOffset = 0;
  const computedSegments = segments.map((seg) => {
    const ratio = totalCount > 0 ? seg.count / totalCount : 0;
    const rawLen = ratio * circumference;
    const gap =
      activeCount > 1 && rawLen > 0 ? Math.min(4.5, rawLen * 0.25) : 0;
    const drawLen = Math.max(0, rawLen - gap);
    const dashOffset = -(cumulativeOffset + gap / 2);
    cumulativeOffset += rawLen;
    return {
      ...seg,
      ratio,
      rawLen,
      drawLen,
      dashOffset,
      pct: totalCount > 0 ? Math.round(ratio * 100) : 0,
    };
  });

  const focusedId =
    hoveredId ?? (activeFilter !== 'All' ? activeFilter : null);
  const focusedSeg = focusedId
    ? computedSegments.find((s) => s.id === focusedId) ?? null
    : null;

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 w-full min-w-0">
      {/* Orbital Cosmic Ring */}
      <div className="relative w-36 h-36 xl:w-40 xl:h-40 shrink-0 flex items-center justify-center">
        {/* Ambient behind-ring glow */}
        <div
          aria-hidden="true"
          className="absolute inset-4 rounded-full blur-xl opacity-45 pointer-events-none transition-colors duration-300"
          style={{
            background: focusedSeg
              ? `radial-gradient(circle, ${focusedSeg.color}55 0%, transparent 72%)`
              : 'radial-gradient(circle, rgba(106,47,200,0.45) 0%, transparent 72%)',
          }}
        />

        <svg
          viewBox="0 0 168 168"
          className="w-full h-full -rotate-90 overflow-visible"
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            {computedSegments.map((seg, idx) => (
              <linearGradient
                key={seg.id}
                id={`${uid}-grad-${idx}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={seg.highlightColor || seg.color}
                  stopOpacity="1"
                />
                <stop offset="100%" stopColor={seg.color} stopOpacity="0.78" />
              </linearGradient>
            ))}
          </defs>

          {/* Outer dotted orbital reference ring */}
          <circle
            cx="84"
            cy="84"
            r="76"
            fill="none"
            stroke="rgba(209, 184, 255, 0.16)"
            strokeWidth="1"
            strokeDasharray="2 5"
          />

          {/* Recessed cosmic track channel */}
          <circle
            cx="84"
            cy="84"
            r={radius}
            fill="none"
            stroke="rgba(11, 7, 32, 0.8)"
            strokeWidth="20"
          />
          <circle
            cx="84"
            cy="84"
            r={radius + 10}
            fill="none"
            stroke="rgba(209, 184, 255, 0.08)"
            strokeWidth="1"
          />
          <circle
            cx="84"
            cy="84"
            r={radius - 10}
            fill="none"
            stroke="rgba(209, 184, 255, 0.1)"
            strokeWidth="1"
          />

          {totalCount > 0 &&
            computedSegments.map((seg, idx) => {
              if (seg.drawLen <= 0) return null;
              const isHighlighted =
                focusedId === null || focusedId === seg.id;
              const isFocused = focusedId === seg.id;

              return (
                <motion.circle
                  key={seg.id}
                  cx="84"
                  cy="84"
                  r={radius}
                  fill="none"
                  stroke={`url(#${uid}-grad-${idx})`}
                  strokeLinecap={seg.drawLen > 12 ? 'round' : 'butt'}
                  initial={{
                    strokeDasharray: `0 ${circumference}`,
                    opacity: 0,
                  }}
                  animate={{
                    strokeDasharray: `${seg.drawLen} ${circumference}`,
                    strokeDashoffset: seg.dashOffset,
                    strokeWidth: isFocused ? 21 : 17,
                    opacity: isHighlighted ? 1 : 0.22,
                  }}
                  transition={{
                    duration: 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    filter: isFocused
                      ? `drop-shadow(0 0 10px ${seg.color}AA)`
                      : `drop-shadow(0 0 4px ${seg.color}44)`,
                  }}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredId(seg.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() =>
                    onSelect(activeFilter === seg.id ? 'All' : seg.id)
                  }
                />
              );
            })}
        </svg>

        {/* Frosted Center Glass Lens */}
        <div className="absolute w-[70px] h-[70px] xl:w-[78px] xl:h-[78px] rounded-full bg-[#0B0720]/75 border border-[#D1B8FF]/18 backdrop-blur-md shadow-[inset_0_1px_0_rgba(242,233,255,0.16)] flex flex-col items-center justify-center pointer-events-none px-1.5 text-center">
          <AnimatePresence mode="wait">
            {focusedSeg ? (
              <motion.div
                key={focusedSeg.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.14 }}
                className="flex flex-col items-center"
              >
                <span
                  className="text-base xl:text-lg font-bold font-mono tabular-nums leading-tight"
                  style={{ color: focusedSeg.color }}
                >
                  {focusedSeg.pct}%
                </span>
                <span className="text-[10px] font-medium text-[#F2E9FF]/90 truncate max-w-[60px] xl:max-w-[66px] mt-0.5">
                  {focusedSeg.label}
                </span>
                <span className="text-[9px] xl:text-[10px] font-mono tabular-nums text-[#D1B8FF]/65">
                  {focusedSeg.count} {totalLabel.toLowerCase()}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="total"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.14 }}
                className="flex flex-col items-center"
              >
                <span className="text-xl xl:text-2xl font-bold text-[#F2E9FF] font-mono tabular-nums leading-tight">
                  {totalCount}
                </span>
                <span className="text-[10px] xl:text-[11px] font-medium text-[#D1B8FF]/70 mt-0.5">
                  {totalLabel}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Interactive Legend with Micro Share Bars (always on right side for sm+) */}
      <div className="w-full sm:w-0 sm:flex-1 min-w-0 space-y-1">
        {computedSegments.map((seg) => {
          const isSelected = activeFilter === seg.id;
          const isHovered = hoveredId === seg.id;
          return (
            <button
              key={seg.id}
              type="button"
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelect(isSelected ? 'All' : seg.id)}
              className={`w-full min-w-0 py-1.5 px-2 text-left rounded-xl transition-all duration-150 cursor-pointer overflow-hidden ${
                isSelected
                  ? 'bg-[#6A2FC8]/35 ring-1 ring-inset ring-[#9D71E8]/55 shadow-[0_0_16px_-6px_rgba(157,113,232,0.7)]'
                  : isHovered
                    ? 'bg-[#6A2FC8]/20'
                    : 'hover:bg-[#6A2FC8]/15'
              }`}
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 transition-transform duration-150"
                      style={{
                        backgroundColor: seg.color,
                        boxShadow: `0 0 10px ${seg.color}AA`,
                        transform:
                          isHovered || isSelected ? 'scale(1.2)' : 'scale(1)',
                      }}
                      aria-hidden="true"
                    />
                    <span className="text-[13px] font-medium text-[#F2E9FF]/90 truncate">
                      {seg.label}
                    </span>
                  </div>
                  {seg.subLabel && (
                    <p className="text-[11px] text-[#D1B8FF]/55 pl-4 truncate">
                      {seg.subLabel}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono tabular-nums">
                  <span className="text-xs font-semibold text-[#F2E9FF] whitespace-nowrap">
                    {seg.valueText ?? seg.count}
                  </span>
                  <span className="text-[11px] text-[#D1B8FF]/65 w-7 text-right">
                    {seg.pct}%
                  </span>
                </div>
              </div>

              {/* Subtle 2px proportional bar track */}
              <div className="mt-1.5 h-[2px] w-full bg-[#0B0720]/70 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${seg.pct}%` }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: seg.color,
                    opacity: isSelected || isHovered ? 1 : 0.72,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface TrendBarSegment {
  key: string;
  label: string;
  value: number;
  gradientClass: string;
  swatchClass: string;
  glowColor?: string;
}

export interface TrendBarItem {
  id: string;
  axisLabel: string;
  headerTitle: string;
  headerSub?: string;
  totalValue: number;
  displayValueLabel?: string;
  isDimmed?: boolean;
  isSelected?: boolean;
  segments: TrendBarSegment[];
  footerNote?: string;
}

interface CosmicTrendBarChartProps {
  items: TrendBarItem[];
  maxValue: number;
  unitLabel?: string;
  emptyMessage: string;
  showAllAxisLabels?: boolean;
  onBarClick?: (id: string) => void;
  heightClass?: string;
}

export function CosmicTrendBarChart({
  items,
  maxValue,
  unitLabel = '',
  emptyMessage,
  showAllAxisLabels = false,
  onBarClick,
  heightClass = 'h-48',
}: CosmicTrendBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-[#D1B8FF]/65 py-12 text-center">
        {emptyMessage}
      </p>
    );
  }

  const activeItems = items.filter((item) => !item.isDimmed && item.totalValue > 0);
  const avgValue =
    activeItems.length > 0
      ? Math.round(
          (activeItems.reduce((sum, i) => sum + i.totalValue, 0) /
            activeItems.length) *
            10
        ) / 10
      : 0;
  const avgPct = maxValue > 0 ? Math.min(96, (avgValue / maxValue) * 100) : 0;
  const midScale = Math.round(maxValue / 2);

  const hoveredItem = hoveredIdx !== null ? items[hoveredIdx] ?? null : null;

  const getTooltipPositionClass = (idx: number, len: number) => {
    if (len <= 3) return 'left-1/2 -translate-x-1/2';
    const ratio = idx / Math.max(1, len - 1);
    if (ratio < 0.22) return 'left-0';
    if (ratio > 0.78) return 'right-0';
    return 'left-1/2 -translate-x-1/2';
  };

  return (
    <div className="mt-5 relative select-none">
      {/* Chart Plot Area with Left Y-Axis Scale */}
      <div className="flex gap-3">
        {/* Y-Axis Scale */}
        <div
          className={`${heightClass} flex flex-col justify-between items-end pr-1 text-[10px] font-mono tabular-nums text-[#D1B8FF]/50 shrink-0 py-0.5`}
          aria-hidden="true"
        >
          <span>{maxValue.toLocaleString()}</span>
          <span>{midScale.toLocaleString()}</span>
          <span>0</span>
        </div>

        {/* Plot Canvas */}
        <div className={`relative flex-1 min-w-0 ${heightClass} pt-3`}>
          {/* Horizontal Dashed Gridlines */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-3 bottom-0 flex flex-col justify-between pointer-events-none"
          >
            <div className="border-t border-dashed border-[#D1B8FF]/14 w-full" />
            <div className="border-t border-dashed border-[#D1B8FF]/12 w-full" />
            <div className="border-b border-[#D1B8FF]/22 w-full" />
          </div>

          {/* Average Benchmark Reference Line */}
          {avgValue > 0 && maxValue > 0 && (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 pointer-events-none z-10 flex items-center"
              style={{ bottom: `${avgPct}%` }}
            >
              <div className="w-full border-t border-dashed border-[#D1B8FF]/45" />
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-mono tabular-nums text-[#D1B8FF] bg-[#0B0720]/90 border border-[#D1B8FF]/25 rounded shrink-0 -translate-y-1/2">
                Avg {avgValue}
              </span>
            </div>
          )}

          {/* Bars Row */}
          <div className="relative z-20 h-full flex items-end gap-1 sm:gap-1.5">
            {items.map((item, idx) => {
              const totalH =
                maxValue > 0 ? (item.totalValue / maxValue) * 100 : 0;
              const isHovered = hoveredIdx === idx;
              const minHeightPct = item.isDimmed
                ? 2.5
                : item.totalValue > 0
                  ? 7
                  : 2.5;
              const barHeight = Math.max(minHeightPct, totalH);

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onBarClick?.(item.id)}
                  className={`relative flex-1 min-w-0 h-full flex flex-col justify-end items-center group ${
                    onBarClick ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {/* Floating Glass Tooltip on Hover */}
                  <AnimatePresence>
                    {isHovered && hoveredItem && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.14 }}
                        className={`absolute bottom-[calc(100%+6px)] ${getTooltipPositionClass(
                          idx,
                          items.length
                        )} z-40 pointer-events-none min-w-[175px] max-w-[230px] rounded-xl bg-[#0B0720]/92 backdrop-blur-xl border border-[#D1B8FF]/28 p-2.5 shadow-[0_14px_34px_-8px_rgba(11,7,32,0.95),0_0_20px_-6px_rgba(157,113,232,0.5)]`}
                      >
                        <div className="flex items-baseline justify-between gap-2 border-b border-[#D1B8FF]/14 pb-1.5 mb-1.5">
                          <span className="text-xs font-semibold text-[#F2E9FF] truncate">
                            {item.headerTitle}
                          </span>
                          <span className="text-xs font-bold font-mono tabular-nums text-[#D1B8FF] shrink-0">
                            {item.displayValueLabel ??
                              `${item.totalValue.toLocaleString()}${
                                unitLabel ? ` ${unitLabel}` : ''
                              }`}
                          </span>
                        </div>

                        {item.headerSub && (
                          <p className="text-[11px] text-[#D1B8FF]/65 mb-1.5">
                            {item.headerSub}
                          </p>
                        )}

                        <div className="space-y-1">
                          {item.segments.map((seg) => (
                            <div
                              key={seg.key}
                              className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums"
                            >
                              <span className="inline-flex items-center gap-1.5 text-[#D1B8FF]/80">
                                <span
                                  className={`w-2 h-2 rounded-full ${seg.swatchClass}`}
                                />
                                <span>{seg.label}</span>
                              </span>
                              <span className="font-semibold text-[#F2E9FF]">
                                {seg.value.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {item.footerNote && (
                          <p className="mt-1.5 pt-1 border-t border-[#D1B8FF]/12 text-[10px] font-mono text-[#D1B8FF]/70">
                            {item.footerNote}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Recessed Column Track + Capsule Bar */}
                  <div
                    className={`w-full max-w-[28px] h-full rounded-t-md flex flex-col justify-end overflow-hidden transition-colors duration-150 ${
                      item.isSelected
                        ? 'bg-[#6A2FC8]/25 ring-1 ring-[#D1B8FF]/55'
                        : isHovered
                          ? 'bg-[#6A2FC8]/18'
                          : 'bg-[#0B0720]/35 border-x border-t border-[#D1B8FF]/[0.05]'
                    }`}
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}%` }}
                      transition={{
                        duration: 0.42,
                        delay: Math.min(idx * 0.015, 0.22),
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`w-full rounded-t-md overflow-hidden flex flex-col justify-end relative transition-all duration-150 ${
                        isHovered ? 'brightness-115' : ''
                      }`}
                      style={{
                        boxShadow:
                          isHovered && item.segments[0]?.glowColor
                            ? `0 0 16px -2px ${item.segments[0].glowColor}`
                            : undefined,
                      }}
                    >
                      {/* Top 1px specular sheen on filled bar */}
                      {item.totalValue > 0 && (
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-0 top-0 h-px bg-white/45 z-10 pointer-events-none"
                        />
                      )}
                      {item.segments.map((seg) => {
                        if (seg.value <= 0 && !item.isDimmed) return null;
                        const segPct =
                          item.totalValue > 0
                            ? (seg.value / item.totalValue) * 100
                            : item.isDimmed
                              ? 100
                              : 0;
                        if (segPct <= 0) return null;
                        return (
                          <div
                            key={seg.key}
                            className={`w-full ${seg.gradientClass}`}
                            style={{ height: `${segPct}%` }}
                          />
                        );
                      })}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-Axis Tick Row */}
      {showAllAxisLabels ? (
        <div className="mt-2.5 flex items-center gap-1 sm:gap-1.5 pl-9">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onBarClick?.(item.id)}
              className={`flex-1 min-w-0 text-center text-[11px] font-mono truncate transition-colors ${
                item.isSelected || hoveredIdx === idx
                  ? 'text-[#F2E9FF] font-semibold'
                  : 'text-[#D1B8FF]/65'
              } ${onBarClick ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {item.axisLabel}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-2.5 pl-9 flex items-center justify-between text-[11px] font-mono text-[#D1B8FF]/65">
          <span>{items[0].axisLabel}</span>
          {items.length > 4 && (
            <span className="hidden sm:inline text-[#D1B8FF]/50">
              {items[Math.floor(items.length / 2)].axisLabel}
            </span>
          )}
          <span className="text-[#D1B8FF]/80">
            Peak: {Math.max(...items.map((i) => i.totalValue)).toLocaleString()}{' '}
            {unitLabel}
          </span>
          <span>{items[items.length - 1].axisLabel}</span>
        </div>
      )}
    </div>
  );
}

export interface WeeklyBarDatum {
  weekNo: string;
  roleLabel: 'Last Week' | 'Current Week' | 'Next Week';
  firstDate: string;
  lastDate: string;
  planQty: number;
  inputQty: number;
  tradeQty: number;
  plannedItems: number;
  finishedItems: number;
  totalNgQty: number;
  remainReworkQty: number;
}

interface CosmicWeeklyGroupedChartProps {
  weeks: WeeklyBarDatum[];
  maxWeekQty: number;
  activeWeekFilter: string;
  onSelectWeek: (weekNo: string) => void;
}

export function CosmicWeeklyGroupedChart({
  weeks,
  maxWeekQty,
  activeWeekFilter,
  onSelectWeek,
}: CosmicWeeklyGroupedChartProps) {
  const [hoveredWeek, setHoveredWeek] = useState<string | null>(null);

  if (weeks.length === 0) {
    return (
      <p className="text-sm text-[#D1B8FF]/65 py-12 text-center">
        No weekly data found for the current window.
      </p>
    );
  }

  const midScale = Math.round(maxWeekQty / 2);

  return (
    <div className="mt-5">
      {/* Grouped Vertical Columns Stage */}
      <div className="flex gap-3">
        {/* Y-Axis Scale */}
        <div
          className="h-44 flex flex-col justify-between items-end pr-1 text-[10px] font-mono tabular-nums text-[#D1B8FF]/50 shrink-0 py-0.5"
          aria-hidden="true"
        >
          <span>{maxWeekQty.toLocaleString()}</span>
          <span>{midScale.toLocaleString()}</span>
          <span>0</span>
        </div>

        {/* Columns Canvas */}
        <div className="relative flex-1 min-w-0 h-44 pt-4">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-4 bottom-0 flex flex-col justify-between pointer-events-none"
          >
            <div className="border-t border-dashed border-[#D1B8FF]/14 w-full" />
            <div className="border-t border-dashed border-[#D1B8FF]/12 w-full" />
            <div className="border-b border-[#D1B8FF]/22 w-full" />
          </div>

          <div className="relative z-10 h-full grid grid-cols-3 gap-3 sm:gap-5">
            {weeks.map((wk, idx) => {
              const planH = Math.max(
                wk.planQty > 0 ? 8 : 3,
                (wk.planQty / maxWeekQty) * 100
              );
              const inputH = Math.max(
                wk.inputQty > 0 ? 8 : 2,
                (wk.inputQty / maxWeekQty) * 100
              );
              const pct =
                wk.planQty > 0
                  ? Math.round((wk.inputQty / wk.planQty) * 100)
                  : 0;
              const isSelected = activeWeekFilter === wk.weekNo;
              const isHovered = hoveredWeek === wk.weekNo;
              const isCurrent = wk.roleLabel === 'Current Week';
              const isOverTarget = pct >= 100 && wk.planQty > 0;

              return (
                <button
                  key={wk.weekNo}
                  type="button"
                  onMouseEnter={() => setHoveredWeek(wk.weekNo)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  onClick={() =>
                    onSelectWeek(isSelected ? 'All' : wk.weekNo)
                  }
                  className={`relative h-full flex flex-col justify-end items-center rounded-t-xl px-2 transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#6A2FC8]/25 ring-1 ring-[#9D71E8]/60'
                      : isHovered
                        ? 'bg-[#6A2FC8]/15'
                        : isCurrent
                          ? 'bg-[#25134D]/25'
                          : ''
                  }`}
                >
                  {/* Floating Interactive Hover Card */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.14 }}
                        className={`absolute bottom-[calc(100%+6px)] ${
                          idx === 0
                            ? 'left-0'
                            : idx === weeks.length - 1
                              ? 'right-0'
                              : 'left-1/2 -translate-x-1/2'
                        } z-30 pointer-events-none w-52 rounded-xl bg-[#0B0720]/94 backdrop-blur-xl border border-[#D1B8FF]/28 p-3 text-left shadow-[0_14px_34px_-8px_rgba(11,7,32,0.95),0_0_20px_-6px_rgba(157,113,232,0.5)]`}
                      >
                        <div className="flex items-baseline justify-between gap-2 border-b border-[#D1B8FF]/14 pb-1.5 mb-1.5">
                          <span className="text-xs font-semibold text-[#F2E9FF] font-mono">
                            {wk.weekNo} · {wk.roleLabel}
                          </span>
                          <span
                            className={`text-xs font-bold font-mono tabular-nums ${
                              isOverTarget ? 'text-emerald-300' : 'text-[#D1B8FF]'
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] font-mono tabular-nums">
                          <div className="flex justify-between">
                            <span className="text-[#D1B8FF]/70">Plan Qty</span>
                            <span className="text-[#F2E9FF]">
                              {wk.planQty.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#D1B8FF]/70">Input Qty</span>
                            <span className="font-semibold text-[#D1B8FF]">
                              {wk.inputQty.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#D1B8FF]/70">Trade Qty</span>
                            <span className="text-[#F2E9FF]/90">
                              {wk.tradeQty.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-[#D1B8FF]/10">
                            <span className="text-[#D1B8FF]/70">Items / NG</span>
                            <span className="text-[#F2E9FF]/90">
                              {wk.finishedItems}/{wk.plannedItems} · {wk.totalNgQty} NG
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Grouped Bar Pair */}
                  <div className="w-full h-full flex items-end justify-center gap-2 sm:gap-3 pt-5">
                    {/* Plan Column */}
                    <div className="w-7 sm:w-9 h-full flex flex-col justify-end items-center">
                      <span className="text-[10px] font-mono tabular-nums text-[#D1B8FF]/65 mb-1 truncate max-w-full">
                        {wk.planQty > 0
                          ? wk.planQty >= 1000
                            ? `${(wk.planQty / 1000).toFixed(1)}k`
                            : wk.planQty
                          : '0'}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${planH}%` }}
                        transition={{
                          duration: 0.45,
                          delay: idx * 0.06,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="w-full rounded-t-md bg-gradient-to-t from-[#25134D]/80 via-[#D1B8FF]/22 to-[#D1B8FF]/45 border border-b-0 border-[#D1B8FF]/30 relative overflow-hidden"
                      >
                        <div className="absolute inset-x-0 top-0 h-px bg-[#F2E9FF]/45" />
                      </motion.div>
                    </div>

                    {/* Input Column */}
                    <div className="w-7 sm:w-9 h-full flex flex-col justify-end items-center">
                      <span
                        className={`text-[10px] font-mono tabular-nums font-semibold mb-1 truncate max-w-full ${
                          isOverTarget ? 'text-emerald-300' : 'text-[#F2E9FF]'
                        }`}
                      >
                        {pct}%
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${inputH}%` }}
                        transition={{
                          duration: 0.5,
                          delay: idx * 0.06 + 0.05,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className={`w-full rounded-t-md relative overflow-hidden ${
                          isOverTarget
                            ? 'bg-gradient-to-t from-emerald-600/80 via-emerald-400 to-emerald-200 shadow-[0_0_18px_-3px_rgba(52,211,153,0.75)]'
                            : 'bg-gradient-to-t from-[#6A2FC8] via-[#9D71E8] to-[#D1B8FF] shadow-[0_0_18px_-3px_rgba(157,113,232,0.8)]'
                        }`}
                      >
                        <div className="absolute inset-x-0 top-0 h-px bg-white/60" />
                      </motion.div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Clickable Week Metadata Footer Cards aligned to the 3 columns */}
      <div className="mt-3 pl-9 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {weeks.map((wk) => {
          const isSelected = activeWeekFilter === wk.weekNo;
          const isCurrent = wk.roleLabel === 'Current Week';
          return (
            <button
              key={wk.weekNo}
              type="button"
              onMouseEnter={() => setHoveredWeek(wk.weekNo)}
              onMouseLeave={() => setHoveredWeek(null)}
              onClick={() => onSelectWeek(isSelected ? 'All' : wk.weekNo)}
              className={`text-left px-3 py-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#6A2FC8]/30 border-[#9D71E8]/60 shadow-[0_0_16px_-6px_rgba(157,113,232,0.75)]'
                  : isCurrent
                    ? 'bg-[#25134D]/55 border-[#D1B8FF]/22 hover:bg-[#6A2FC8]/20'
                    : 'bg-[#0B0720]/45 border-[#D1B8FF]/10 hover:bg-[#6A2FC8]/15'
              }`}
            >
              <div className="flex items-baseline justify-between gap-1.5">
                <span className="font-mono text-xs font-semibold text-[#F2E9FF]">
                  {wk.weekNo}
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    isCurrent ? 'text-[#D1B8FF]' : 'text-[#D1B8FF]/60'
                  }`}
                >
                  {wk.roleLabel}
                </span>
              </div>
              <p className="text-[11px] text-[#D1B8FF]/55 mt-0.5 truncate">
                {wk.firstDate} – {wk.lastDate}
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono tabular-nums text-[#D1B8FF]/80">
                <span>
                  {wk.finishedItems}/{wk.plannedItems} items
                </span>
                <span
                  className={
                    wk.remainReworkQty < 0 ? 'text-rose-400 font-semibold' : ''
                  }
                >
                  {wk.totalNgQty} NG
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
