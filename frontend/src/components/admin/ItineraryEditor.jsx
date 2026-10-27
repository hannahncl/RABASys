import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const fieldClassName = 'w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3.5 py-2.5 text-sm text-slate-200 focus:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-700/20';

const ItineraryEditor = ({ entries, onChange }) => {
  const updateEntry = (index, field, value) => {
    onChange(entries.map((entry, entryIndex) => entryIndex === index
      ? { ...entry, [field]: value }
      : entry));
  };
  const nextDay = Math.max(1, ...entries.map((entry) => Number(entry.day) || 1)) + 1;

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <div key={index} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800/80 bg-slate-900/20 p-3 sm:grid-cols-[80px_130px_130px_minmax(0,1fr)_40px] sm:items-center">
          <div>
            <label htmlFor={`itinerary-day-${index}`} className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Day
            </label>
            <input
              id={`itinerary-day-${index}`}
              type="number"
              min="1"
              step="1"
              value={entry.day}
              onChange={(event) => updateEntry(index, 'day', event.target.value)}
              className={fieldClassName}
              aria-label={`Day for itinerary item ${index + 1}`}
            />
          </div>
          <div>
            <label htmlFor={`itinerary-start-time-${index}`} className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Start time
            </label>
            <input
              id={`itinerary-start-time-${index}`}
              type="time"
              value={entry.startTime}
              onChange={(event) => updateEntry(index, 'startTime', event.target.value)}
              className={fieldClassName}
              aria-label={`Start time for itinerary item ${index + 1}`}
            />
          </div>
          <div>
            <label htmlFor={`itinerary-end-time-${index}`} className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
              End time
            </label>
            <input
              id={`itinerary-end-time-${index}`}
              type="time"
              value={entry.endTime}
              onChange={(event) => updateEntry(index, 'endTime', event.target.value)}
              className={fieldClassName}
              aria-label={`End time for itinerary item ${index + 1}`}
            />
          </div>
          <div>
            <label htmlFor={`itinerary-activity-${index}`} className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Activity
            </label>
            <input
              id={`itinerary-activity-${index}`}
              type="text"
              value={entry.activity}
              onChange={(event) => updateEntry(index, 'activity', event.target.value)}
              placeholder="e.g. Meet at the visitor center"
              className={fieldClassName}
              aria-label={`Activity for itinerary item ${index + 1}`}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(entries.filter((_, entryIndex) => entryIndex !== index))}
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition hover:border-rose-900 hover:text-rose-300 sm:mt-5"
            aria-label={`Remove itinerary item ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...entries, { day: entries.at(-1)?.day || 1, startTime: '', endTime: '', activity: '' }])}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
      >
        <Plus className="h-4 w-4" /> Add itinerary time slot
      </button>
      <button
        type="button"
        onClick={() => onChange([...entries, { day: nextDay, startTime: '', endTime: '', activity: '' }])}
        className="ml-2 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
      >
        <Plus className="h-4 w-4" /> Add Day {nextDay}
      </button>
      <p className="text-[10px] text-slate-500">Add activities in the order they happen. Start and end times are optional.</p>
    </div>
  );
};

export default ItineraryEditor;
