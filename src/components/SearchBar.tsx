import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, PlaneTakeoff, PlaneLanding, Hotel } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Autocomplete from './Autocomplete';
import { SearchParams } from '../types';

interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
  isSticky: boolean;
}

const holidayEmojis = ["🏖️", "🍹", "🌴", "🗺️", "🧳", "☀️", "😎", "🏄", "📸", "🏛️"];
const holidayDestinations = ["Rome", "Barcelona", "Prague", "Tokyo", "Paris", "London", "Berlin", "Lisbon", "New York", "Sydney"];
const GHOST_TRANSITION = { type: "tween", ease: "easeOut", duration: 0.6 };

const toDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const fromDateStr = (str: string) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function EmojiCrossfader({
  animOffset,
  layoverDays,
  ghostIndex,
  animDir,
  isFirstStep,
  showDestination
}: {
  animOffset: number;
  layoverDays: number;
  ghostIndex: number;
  animDir: number;
  isFirstStep: boolean;
  showDestination?: boolean;
}) {
  const [showNew, setShowNew] = useState(isFirstStep);

  useEffect(() => {
    if (isFirstStep) {
      setShowNew(true);
      return;
    }
    setShowNew(false);
    const t = setTimeout(() => setShowNew(true), 300);
    return () => clearTimeout(t);
  }, [isFirstStep, animOffset]);

  const activeOffset = showNew ? animOffset : animOffset - Math.sign(animDir);
  const seed = activeOffset * layoverDays + ghostIndex + 17;

  const startOpacity = isFirstStep ? 0.7 : (showNew ? 0 : 0.7);
  const endOpacity = isFirstStep ? 0.7 : (showNew ? 0.7 : 0);

  if (showDestination) {
    return (
      <motion.div
        key={`dest-${seed}-${showNew}`}
        initial={{ opacity: startOpacity }}
        animate={{ opacity: endOpacity }}
        transition={{ duration: 0.3, ease: 'linear' }}
        className="absolute top-[32px] left-1/2 -translate-x-1/2 z-[20] pointer-events-none whitespace-nowrap"
      >
        <div className="bg-orange-500 text-[9px] text-white px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-md flex items-center justify-center">
          {holidayDestinations[Math.abs(seed) % holidayDestinations.length]}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.span
      key={`emoji-${seed}-${showNew}`}
      initial={{ opacity: startOpacity }}
      animate={{ opacity: endOpacity }}
      transition={{ duration: 0.3, ease: 'linear' }}
      className="text-xl absolute top-[27px] left-1/2 -translate-x-1/2 z-[15] drop-shadow-sm pointer-events-none"
    >
      {holidayEmojis[Math.abs(seed) % holidayEmojis.length]}
    </motion.span>
  );
}

export default function SearchBar({ onSearch, isSticky }: SearchBarProps) {
  const [params, setParams] = useState<SearchParams>({
    origin: '',
    destination: '',
    homeCity: '',
    earliestDate: '',
    mustBeDate: '',
  });
  const [isHomeCityDirty, setIsHomeCityDirty] = useState(false);
  const [showHomeCityPrompt, setShowHomeCityPrompt] = useState(true);
  const [flexDays, setFlexDays] = useState(0);
  const [layoverDays, setLayoverDays] = useState(0);
  const [animOffset, setAnimOffset] = useState(0);
  const [slideDir, setSlideDir] = useState(1);
  const [isFirstStep, setIsFirstStep] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [dragTarget, setDragTarget] = useState<'must' | 'earliest' | null>(null);
  const [monthDirection, setMonthDirection] = useState(0);
  const calendarGridRef = useRef<HTMLDivElement>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animDirRef = useRef<1 | -1>(1);

  // Fetch cities for autocomplete
  useEffect(() => {
    fetch('/cities.json')
      .then(res => res.json())
      .then(data => setCities(data))
      .catch(err => console.error('Failed to fetch cities:', err));
  }, []);

  // Update dates based on flexDays and mustBeDate
  useEffect(() => {
    if (params.mustBeDate) {
      const mustDate = fromDateStr(params.mustBeDate);
      const earliest = new Date(mustDate);
      earliest.setDate(mustDate.getDate() - flexDays);
      const earliestStr = toDateStr(earliest);
      setParams(prev => ({ ...prev, earliestDate: earliestStr }));
    }
  }, [flexDays, params.mustBeDate]);

  // Update Home City automatically if not dirty
  useEffect(() => {
    if (!isHomeCityDirty) {
      setParams(prev => ({ ...prev, homeCity: prev.origin }));
    }
  }, [params.origin, isHomeCityDirty]);

  // Calendar logic
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleMonthChange = (offset: number) => {
    setMonthDirection(offset);
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateInteraction = (dateStr: string) => {
    const todayStr = toDateStr(new Date());
    if (dateStr < todayStr) return;

    if (params.mustBeDate && dateStr < params.mustBeDate) {
      const selectedDate = fromDateStr(dateStr);
      const mustDate = fromDateStr(params.mustBeDate);
      const diffDays = Math.round(Math.abs(mustDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
      setFlexDays(diffDays);
    } else {
      setParams(prev => ({ ...prev, mustBeDate: dateStr, earliestDate: dateStr }));
      setFlexDays(0);
    }
  };

  // --- Drag handlers (document-level listeners) ---
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const flexDaysRef = useRef(flexDays);
  flexDaysRef.current = flexDays;

  const handleDragStart = useCallback((target: 'must' | 'earliest', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTarget(target);
  }, []);

  useEffect(() => {
    if (!dragTarget) return;

    const resolveDate = (clientX: number, clientY: number): string | null => {
      const els = document.elementsFromPoint(clientX, clientY);
      for (const el of els) {
        const dateAttr = (el as HTMLElement).dataset?.date;
        if (dateAttr) return dateAttr;
      }
      return null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const dateStr = resolveDate(e.clientX, e.clientY);
      if (!dateStr) return;

      const todayStr = toDateStr(new Date());
      if (dateStr < todayStr) return;

      const p = paramsRef.current;
      const fd = flexDaysRef.current;

      if (dragTarget === 'must') {
        // Green circle: cannot go earlier than earliest (when flex > 0)
        if (p.earliestDate && fd > 0 && dateStr < p.earliestDate) return;
        // Recalculate flexDays to keep earliestDate pinned
        if (fd > 0 && p.earliestDate) {
          const mustD = fromDateStr(dateStr);
          const earlyD = fromDateStr(p.earliestDate);
          const diff = Math.round((mustD.getTime() - earlyD.getTime()) / (1000 * 60 * 60 * 24));
          setFlexDays(Math.max(0, diff));
        }
        setParams(prev => ({ ...prev, mustBeDate: dateStr }));
      } else {
        // Blue circle: cannot go later than must date
        if (p.mustBeDate && dateStr > p.mustBeDate) return;
        if (p.mustBeDate) {
          const mustD = fromDateStr(p.mustBeDate);
          const earlyD = fromDateStr(dateStr);
          const diff = Math.round((mustD.getTime() - earlyD.getTime()) / (1000 * 60 * 60 * 24));
          setFlexDays(Math.max(0, diff));
        }
        setParams(prev => ({ ...prev, earliestDate: dateStr }));
      }
    };

    const onPointerUp = () => {
      setDragTarget(null);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragTarget]);

  // Keep layoverDays synced: default to flexDays, clamp if flexDays shrinks
  useEffect(() => {
    setLayoverDays(prev => {
      if (flexDays === 0) return 0;
      if (prev === 0) return flexDays; // first time a range is set
      return Math.min(prev, flexDays);
    });
  }, [flexDays]);

  // Ghost circle ping-pong animation
  useEffect(() => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    const numPositions = flexDays - layoverDays + 1;
    if (numPositions <= 1 || !params.earliestDate || !params.mustBeDate || layoverDays === 0) {
      setAnimOffset(0);
      setIsFirstStep(true);
      return;
    }
    animDirRef.current = 1;
    setAnimOffset(0);
    setIsFirstStep(true);
    let currentOffset = 0;
    let localFirst = true;
    const step = () => {
      const holdDuration = localFirst ? 800 : 1800;
      localFirst = false;
      animTimerRef.current = setTimeout(() => {
        setIsFirstStep(false);
        const thisSlideDir = animDirRef.current;
        setSlideDir(thisSlideDir);

        currentOffset += thisSlideDir;
        if (currentOffset >= numPositions - 1) animDirRef.current = -1;
        else if (currentOffset <= 0) animDirRef.current = 1;

        setAnimOffset(currentOffset);
        step();
      }, holdDuration);
    };
    step();
    return () => { if (animTimerRef.current) clearTimeout(animTimerRef.current); };
  }, [flexDays, layoverDays, params.earliestDate, params.mustBeDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(params);
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const year = currentMonth.getFullYear();

    // Pre-month padding days
    const prevMonth = new Date(year, currentMonth.getMonth() - 1);
    const prevMonthTotalDays = daysInMonth(prevMonth);
    for (let i = 0; i < startDay; i++) {
      const d = prevMonthTotalDays - startDay + i + 1;
      days.push(
        <button
          key={`prev-${i}`}
          type="button"
          onClick={() => handleMonthChange(-1)}
          className="p-2 h-14 w-full text-sm font-bold text-slate-300 hover:bg-slate-50 transition-colors opacity-40"
        >
          {d}
        </button>
      );
    }

    const todayStr = toDateStr(new Date());

    // Compute ghost window dates for overlay animation
    const ghostStart = (params.earliestDate && layoverDays > 0)
      ? (() => {
        const d = fromDateStr(params.earliestDate);
        d.setDate(d.getDate() + animOffset);
        return toDateStr(d);
      })()
      : null;
    const ghostEnd = (ghostStart && layoverDays > 0)
      ? (() => {
        const d = fromDateStr(ghostStart);
        d.setDate(d.getDate() + layoverDays);
        return toDateStr(d);
      })()
      : null;

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, currentMonth.getMonth(), d);
      const dateStr = toDateStr(date);
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isMust = params.mustBeDate === dateStr;
      const isEarliest = params.earliestDate === dateStr;
      const isInRange = params.earliestDate && params.mustBeDate &&
        dateStr >= params.earliestDate && dateStr <= params.mustBeDate;
      const isSameDate = params.earliestDate === params.mustBeDate;
      const isAdjacentDays = params.earliestDate && params.mustBeDate &&
        !isSameDate &&
        fromDateStr(params.mustBeDate).getTime() - fromDateStr(params.earliestDate).getTime() === 86400000;

      // Ghost window flags
      const isGhostDep = ghostStart !== null && dateStr === ghostStart;
      const isGhostArr = ghostEnd !== null && dateStr === ghostEnd;
      const isGhostMid = ghostStart !== null && ghostEnd !== null &&
        dateStr > ghostStart && dateStr < ghostEnd;

      let ghostIndex = -1;
      if (ghostStart && dateStr >= ghostStart && dateStr <= (ghostEnd || ghostStart)) {
        ghostIndex = Math.round((new Date(dateStr).getTime() - new Date(ghostStart).getTime()) / 86400000);
      }

      days.push(
        <div
          key={d}
          className={`relative h-14 flex items-center justify-center w-full
            ${isInRange && !isEarliest && !isMust ? 'bg-orange-100' : ''}
            ${!isInRange && !isWeekend ? 'bg-slate-50/50' : ''}
            ${isWeekend && !isInRange ? 'bg-slate-100' : ''}
            ${isPast ? 'opacity-30 pointer-events-none' : ''}
            ${isToday ? 'after:absolute after:inset-1 after:border-2 after:border-emerald-500/20 after:rounded-full after:pointer-events-none' : ''}
          `}
        >
          {/* Real range bars */}
          {isInRange && isEarliest && !isMust && (
            <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-orange-100 rounded-l-full pointer-events-none" />
          )}
          {isInRange && isMust && !isEarliest && (
            <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-orange-100 rounded-r-full pointer-events-none" />
          )}
          {isInRange && !isEarliest && !isMust && (
            <div className="absolute inset-y-0 -inset-x-0.5 bg-orange-100 pointer-events-none" />
          )}

          {/* Ghost mid-range emojis (no background) */}
          {isGhostMid && (
            <motion.div
              layout="position"
              key={`ghost-mid-${ghostIndex}`}
              layoutId={`ghost-mid-${ghostIndex}`}
              transition={GHOST_TRANSITION}
              className="absolute inset-y-1 inset-x-0 pointer-events-none z-[6] flex items-center justify-center"
            >
              <EmojiCrossfader
                animOffset={animOffset}
                layoverDays={layoverDays}
                ghostIndex={ghostIndex}
                animDir={slideDir}
                isFirstStep={isFirstStep}
                showDestination={ghostIndex === Math.floor(layoverDays / 2)}
              />
            </motion.div>
          )}

          {/* Ghost departure circle (semi-transparent blue, behind full circle) */}
          {isGhostDep && (
            <motion.div
              layout="position"
              key="ghost-dep-circle"
              layoutId="ghost-dep-circle"
              transition={GHOST_TRANSITION}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-[8]"
            >
              {/* Origin label and plane above moved to top offset for stability */}
              <div className="absolute top-[-26px] -left-1.5 flex flex-row items-center gap-1.5 whitespace-nowrap z-[25] pointer-events-none">
                <PlaneTakeoff className="w-5 h-5 text-slate-700 drop-shadow-[0_0_2px_rgba(255,255,255,1)] opacity-80" />
                {!isSameDate && params.origin && (
                  <div className="bg-blue-500/80 text-[8px] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm">
                    {params.origin}
                  </div>
                )}
              </div>
              {/* Ghost blue circle (z-8, behind full blue at z-10) */}
              <div className="absolute w-12 h-12 bg-blue-500/35 rounded-full pointer-events-none" />
            </motion.div>
          )}

          {/* Ghost arrival circle (semi-transparent green, behind full circle) */}
          {isGhostArr && (
            <motion.div
              layout="position"
              key="ghost-arr-circle"
              layoutId="ghost-arr-circle"
              transition={GHOST_TRANSITION}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-[8]"
            >
              {/* Emoji junction for 1-day layover (where there is no middle cell) */}
              {layoverDays === 1 && (
                <div className="absolute left-0 inset-y-1 w-0 flex items-center justify-center">
                  <EmojiCrossfader
                    animOffset={animOffset}
                    layoverDays={layoverDays}
                    ghostIndex={0}
                    animDir={slideDir}
                    isFirstStep={isFirstStep}
                    showDestination={false}
                  />
                </div>
              )}
              {/* Ghost green circle (z-8) */}
              <div className="absolute w-12 h-12 bg-emerald-500/35 rounded-full pointer-events-none" />
              {/* Destination label and plane below */}
              <div className="absolute top-[105%] -right-1.5 mt-0.5 flex flex-row items-center gap-1.5 whitespace-nowrap z-[25] pointer-events-none">
                {!isSameDate && params.destination && (
                  <div className="bg-emerald-500/80 text-[8px] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm">
                    {params.destination}
                  </div>
                )}
                <PlaneLanding className="w-5 h-5 text-slate-700 drop-shadow-[0_0_2px_rgba(255,255,255,1)] opacity-80" />
              </div>
            </motion.div>
          )}

          {/* Main interactive button — no planes/labels (moved to ghost layer) */}
          <button
            type="button"
            data-date={dateStr}
            onClick={() => { if (!dragTarget) handleDateInteraction(dateStr); }}
            onPointerDown={(e) => {
              if (isMust) handleDragStart('must', e);
              else if (isEarliest) handleDragStart('earliest', e);
            }}
            className={`w-12 h-12 text-sm font-bold transition-all relative flex flex-col items-center justify-center z-10 touch-none
              ${isMust ? 'bg-emerald-600 text-white shadow-lg scale-110 active:scale-95 cursor-grab' : ''}
              ${isEarliest && !isMust ? 'bg-blue-600 text-white shadow-lg scale-110 active:scale-95 cursor-grab' : ''}
              ${!isMust && !isEarliest ? 'hover:bg-slate-100 text-slate-700 rounded-full' : ''}
              ${isMust || isEarliest ? 'rounded-full' : ''}
              ${dragTarget && (isMust || isEarliest) ? 'cursor-grabbing' : ''}
              ${(dragTarget === 'must' && isMust) || (dragTarget === 'earliest' && isEarliest) ? 'scale-125 ring-4 ring-white/50' : ''}
            `}
          >
            <span className="relative z-10">{d}</span>
            {/* Real range in-between emojis (no ghost) */}
            {isInRange && !isMust && !isEarliest && layoverDays === 0 && (
              <span className="text-xl absolute top-[41px] left-1/2 -translate-x-1/2 opacity-100 z-20 drop-shadow-sm pointer-events-none">
                {holidayEmojis[d % holidayEmojis.length]}
              </span>
            )}
          </button>

          {/* Emoji between adjacent circles (no ghost overlap) */}
          {isMust && !isSameDate && isAdjacentDays && layoverDays === 0 && (
            <span className="text-xl absolute left-0 top-[41px] -translate-x-1/2 z-20 drop-shadow-sm pointer-events-none">
              {holidayEmojis[d % holidayEmojis.length]}
            </span>
          )}
        </div>
      );
    }

    // Post-month padding days
    const nextMonth = new Date(year, currentMonth.getMonth() + 1);
    const currentCount = days.length;
    const remainingDays = (7 - (currentCount % 7)) % 7;
    for (let i = 0; i < remainingDays; i++) {
      const d = i + 1;
      days.push(
        <button
          key={`next-${i}`}
          type="button"
          onClick={() => handleMonthChange(1)}
          className="p-2 h-14 w-full text-sm font-bold text-slate-300 hover:bg-slate-50 transition-colors opacity-40"
        >
          {d}
        </button>
      );
    }

    // Ghost segments at grid level (for smooth sliding across whole calendar)
    const ghostSegments = [];
    if (ghostStart && ghostEnd && layoverDays > 0) {
      const startPadding = firstDayOfMonth(currentMonth);
      const getGridIdx = (dateStr: string) => {
        const d = fromDateStr(dateStr);
        if (d.getMonth() !== currentMonth.getMonth() || d.getFullYear() !== year) return -1;
        return startPadding + d.getDate() - 1;
      };

      const startIdx = getGridIdx(ghostStart);
      const endIdx = getGridIdx(ghostEnd);

      // Only render segments for weeks potentially containing the range
      const startWeek = startIdx === -1 ? 0 : Math.floor(startIdx / 7);
      const endWeek = endIdx === -1 ? 5 : Math.floor(endIdx / 7);

      for (let w = startWeek; w <= endWeek; w++) {
        const weekStartIdx = w * 7;
        const weekEndIdx = weekStartIdx + 6;
        const segStartIdx = (startIdx === -1) ? weekStartIdx : Math.max(startIdx, weekStartIdx);
        const segEndIdx = (endIdx === -1) ? weekEndIdx : Math.min(endIdx, weekEndIdx);

        // Within current month's physical bounds
        const monthStartIdx = startPadding;
        const monthEndIdx = startPadding + totalDays - 1;
        const clipStartIdx = Math.max(segStartIdx, monthStartIdx);
        const clipEndIdx = Math.min(segEndIdx, monthEndIdx);

        if (clipStartIdx <= clipEndIdx) {
          const row = w + 1;
          const colStart = (clipStartIdx % 7) + 1;
          const colEnd = (clipEndIdx % 7) + 1;
          const numCols = colEnd - colStart + 1;

          const isRangeStart = clipStartIdx === startIdx;
          const isRangeEnd = clipEndIdx === endIdx;

          const leftOffset = isRangeStart ? (0.5 / numCols) * 100 : 0;
          const widthPercent = (numCols - (isRangeStart ? 0.5 : 0) - (isRangeEnd ? 0.5 : 0)) / numCols * 100;

          ghostSegments.push(
            <motion.div
              layout
              key={`ghost-seg-week-${w}`}
              layoutId={`ghost-seg-week-${w}`}
              transition={GHOST_TRANSITION}
              className={`absolute h-12 top-1 bg-orange-300/40 pointer-events-none z-[5]
                ${isRangeStart ? 'rounded-l-full' : ''}
                ${isRangeEnd ? 'rounded-r-full' : ''}
              `}
              style={{
                gridRow: row,
                gridColumn: `${colStart} / ${colEnd + 1}`,
                left: `${leftOffset}%`,
                width: `${widthPercent}%`
              }}
            />
          );
        }
      }
    }

    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 relative overflow-visible select-none transition-all">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-sm font-black uppercase tracking-widest text-slate-900">{monthName} {year}</div>
          <button type="button" onClick={() => handleMonthChange(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0 mb-3">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-[10px] font-black text-slate-400 text-center uppercase tracking-tighter">{d}</div>
          ))}
        </div>
        <div className="relative overflow-hidden">
          <AnimatePresence mode="popLayout" custom={monthDirection}>
            <motion.div
              key={currentMonth.toISOString()}
              custom={monthDirection}
              variants={{
                enter: (direction: number) => ({
                  x: direction > 0 ? 100 : direction < 0 ? -100 : 0,
                  opacity: 0,
                }),
                center: {
                  zIndex: 1,
                  x: 0,
                  opacity: 1,
                },
                exit: (direction: number) => ({
                  zIndex: 0,
                  x: direction > 0 ? -100 : direction < 0 ? 100 : 0,
                  opacity: 0,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              ref={calendarGridRef}
              className={`grid grid-cols-7 gap-0 relative ${dragTarget ? 'cursor-grabbing select-none' : ''}`}
            >
              {days}
              {ghostSegments}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full max-w-6xl mx-auto z-50 ${isSticky ? 'fixed top-0 left-0 right-0 p-4' : 'relative px-4'}`}>
      <AnimatePresence>
        {params.origin && showHomeCityPrompt && !isSticky && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="absolute left-12 top-[-70px] z-0"
          >
            <div className="bg-slate-900 text-white px-6 py-4 rounded-t-[2rem] shadow-2xl flex items-center gap-4 border-x border-t border-white/10 w-fit">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/80">Where do you live?</span>
                  <div className="w-1 h-1 bg-emerald-500/20 rounded-full" />
                </div>
                <input
                  type="text"
                  placeholder="Home city..."
                  value={params.homeCity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setParams(prev => ({ ...prev, homeCity: val }));
                    setIsHomeCityDirty(true);
                  }}
                  className="bg-transparent border-none outline-none text-base font-bold text-white p-0 placeholder:text-white/20 focus:ring-0 w-48"
                />
              </div>
              <div className="h-8 w-px bg-white/10" />
              <button
                type="button"
                onClick={() => setShowHomeCityPrompt(false)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-bold transition-all border border-white/5 active:scale-95 whitespace-nowrap"
              >
                I'll sort my own transport
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        className={`${isSticky ? 'bg-white/80 backdrop-blur-md shadow-sm rounded-[2.5rem]' : ''
          }`}
      >
        <form
          onSubmit={handleSubmit}
          className={`bg-white rounded-[3rem] shadow-2xl border border-black/5 overflow-visible transition-all duration-500 relative z-10 ${isSticky ? 'flex items-center gap-4 p-4' : 'p-10'
            }`}
        >
          <div className={isSticky ? 'flex flex-1 items-center gap-4' : 'space-y-10'}>
            {/* Top Row: Locations & Search */}
            <div className={`grid gap-8 ${isSticky ? 'grid-cols-3 flex-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {/* Origin */}
              <Autocomplete
                label="Flying From"
                placeholder="e.g. London"
                value={params.origin}
                onChange={(val) => {
                  setParams(prev => ({ ...prev, origin: val }));
                  setShowHomeCityPrompt(true);
                }}
                cities={cities}
                required
              />

              {/* Destination */}
              <Autocomplete
                label="Going To"
                placeholder="e.g. Sofia"
                value={params.destination}
                onChange={(val) => {
                  setParams(prev => ({ ...prev, destination: val }));
                }}
                cities={cities}
                required
              />

              {!isSticky && (
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    className="group relative bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl px-12 py-5 hover:bg-black transition-all overflow-hidden flex items-center gap-3 w-full lg:w-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                    <Search className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Find Bonus Vacations</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Row: Calendar & Flexibility */}
            {!isSticky && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-slate-50">
                {/* Calendar Side */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2 h-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Arrival Date</h3>
                    <AnimatePresence mode="wait">
                      {params.mustBeDate && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-center gap-2 text-slate-900 font-bold text-sm bg-slate-50 px-3 py-1 rounded-lg"
                        >
                          <CalendarIcon className="w-4 h-4 text-emerald-500" />
                          {params.mustBeDate}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {renderCalendar()}
                </div>

                {/* Flexibility Side */}
                <div className="flex flex-col justify-start space-y-8 bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-lg font-black text-slate-900">I can travel earlier</h3>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                      Slide to pick how many days before your deadline you're willing to start your adventure.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
                        {flexDays}
                        <span className="text-sm text-slate-400 uppercase tracking-widest">Days</span>
                      </span>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Travel Starts On</p>
                        <p className="text-sm font-bold text-emerald-600">
                          {params.earliestDate || 'Pick a date first'}
                        </p>
                      </div>
                    </div>

                    <div className="relative pt-6">
                      <input
                        type="range"
                        min="0"
                        max="14"
                        step="1"
                        value={flexDays}
                        onChange={(e) => setFlexDays(parseInt(e.target.value))}
                        disabled={!params.mustBeDate}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                      <div className="flex justify-between mt-2 px-1">
                        {[0, 2, 4, 7, 10, 14].map(n => (
                          <div key={n} className="flex flex-col items-center">
                            <div className={`w-0.5 h-1 ${flexDays >= n ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className={`text-[8px] font-bold mt-1 ${flexDays === n ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {n === 14 ? '14d+' : n === 7 ? '7d+' : `${n}d`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative h-48">
                    <AnimatePresence mode="wait">
                      {!params.mustBeDate ? (
                        <motion.div
                          key="alert"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute inset-0"
                        >
                          <div className="bg-amber-50 text-amber-700 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2 border border-amber-100 animate-pulse">
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                            Pick an arrival date on the calendar to enable flexibility.
                          </div>
                        </motion.div>
                      ) : flexDays > 0 ? (
                        <motion.div
                          key="layover"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute inset-0 border-t border-slate-100 pt-6 space-y-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Hotel className="w-5 h-5 text-blue-500" />
                              <h3 className="text-lg font-black text-slate-900">Layover vacation</h3>
                            </div>
                            <p className="text-sm text-slate-500 font-medium line-clamp-2">
                              How many days do you want to spend at your layover destination?
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
                              {layoverDays}
                              <span className="text-sm text-slate-400 uppercase tracking-widest">Days</span>
                            </span>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Positions Available</p>
                              <p className="text-sm font-bold text-blue-600">
                                {flexDays - layoverDays + 1} slot{flexDays - layoverDays + 1 !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={flexDays}
                            step="1"
                            value={layoverDays}
                            onChange={(e) => setLayoverDays(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {isSticky && (
              <button
                type="submit"
                className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>

  );
}

