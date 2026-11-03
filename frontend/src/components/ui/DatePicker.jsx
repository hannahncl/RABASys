import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';

const dateFromValue = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateToValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const DatePicker = ({ value, onChange, placeholder = 'Select a date', label = 'Choose date' }) => {
  const selectedDate = dateFromValue(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value || '');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const initialDate = selectedDate || today;
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const openCalendar = () => {
    const currentSelection = dateFromValue(value) || today;
    setDraftValue(value || '');
    setCalendarMonth(new Date(currentSelection.getFullYear(), currentSelection.getMonth(), 1));
    setIsOpen(true);
  };

  const firstWeekday = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const draftDate = dateFromValue(draftValue);
  const previousMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
  const canGoPrevious = previousMonth >= new Date(today.getFullYear(), today.getMonth(), 1);
  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={openCalendar}
        aria-label={displayValue ? `${label}: ${displayValue}` : label}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="mt-1 flex w-full items-center justify-between gap-2 bg-transparent text-left text-sm outline-none"
        style={{ color: displayValue ? '#3f3933' : '#aaa093' }}
      >
        <span className="truncate">{displayValue || placeholder}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-[#8b4a32]" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 top-full z-50 mt-3 w-[min(320px,calc(100vw-3rem))] rounded-[6px] border border-[#e0dbd0] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
        >
          <div className="mb-4 flex items-center justify-between px-2">
            <button
              type="button"
              onClick={() => setCalendarMonth(previousMonth)}
              disabled={!canGoPrevious}
              aria-label="Previous month"
              className="px-2 py-1 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: canGoPrevious ? '#2d2a24' : '#c8c3b8' }}
            >
              &lt;
            </button>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2d2a24]">
              {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              aria-label="Next month"
              className="px-2 py-1 font-semibold text-[#2d2a24] transition-colors"
            >
              &gt;
            </button>
          </div>

          <div className="mb-6 grid grid-cols-7 justify-items-center gap-y-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day} className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8f8576]">{day}</span>
            ))}
            {Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
              const dateValue = dateToValue(date);
              const isPast = date < today;
              const isSelected = draftDate && dateValue === dateToValue(draftDate);
              const isToday = dateValue === dateToValue(today);
              return (
                <button
                  key={dateValue}
                  type="button"
                  disabled={isPast}
                  aria-label={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  aria-pressed={Boolean(isSelected)}
                  onClick={() => setDraftValue(dateValue)}
                  className="h-9 w-9 rounded border text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:text-[#c8c3b8] disabled:opacity-50"
                  style={{
                    borderColor: isSelected ? '#b0a68e' : isToday ? '#d6cfc2' : 'transparent',
                    background: isSelected ? '#e8dfce' : 'transparent',
                    color: isPast ? '#c8c3b8' : '#2d2a24',
                    fontWeight: isSelected || isToday ? 700 : 500,
                  }}
                  onMouseEnter={(event) => { if (!isPast && !isSelected) event.currentTarget.style.background = 'rgba(176,166,142,0.12)'; }}
                  onMouseLeave={(event) => { if (!isPast && !isSelected) event.currentTarget.style.background = 'transparent'; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="border px-5 py-1.5 text-[10px] font-semibold uppercase transition-all duration-300"
              style={{ borderColor: '#e0dbd0', borderRadius: '2px', color: '#45403a', letterSpacing: '0.1em', background: 'transparent' }}
              onMouseEnter={(event) => { event.currentTarget.style.borderColor = '#2d2a24'; event.currentTarget.style.color = '#1a1a1a'; }}
              onMouseLeave={(event) => { event.currentTarget.style.borderColor = '#e0dbd0'; event.currentTarget.style.color = '#45403a'; }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!draftValue}
              onClick={() => { onChange(draftValue); setIsOpen(false); }}
              className="cursor-pointer border-0 px-5 py-1.5 text-[10px] font-semibold uppercase transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: '#2d2a24', borderRadius: '2px', color: '#f7f4ef', letterSpacing: '0.1em' }}
              onMouseEnter={(event) => { event.currentTarget.style.background = '#1a1715'; }}
              onMouseLeave={(event) => { event.currentTarget.style.background = '#2d2a24'; }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
