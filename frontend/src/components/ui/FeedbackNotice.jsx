import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const stylesByType = {
  success: { icon: '#32664d', bg: '#edf5ef', border: '#d6e6d9', title: 'Success', Icon: CheckCircle },
  error: { icon: '#6D2932', bg: '#f8eeee', border: '#ead2d4', title: 'Error', Icon: AlertCircle },
  warning: { icon: '#805d28', bg: '#faf4e8', border: '#eadfc7', title: 'Notice', Icon: AlertTriangle },
  info: { icon: '#5a5149', bg: '#f2eee9', border: '#e5ddd3', title: 'Information', Icon: Info },
};

const FeedbackNotice = ({ message, type = 'error', onDismiss, className = '' }) => {
  if (!message) return null;
  const style = stylesByType[type] || stylesByType.info;
  const Icon = style.Icon;

  return (
    <div className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center bg-black/20 p-4 backdrop-blur-[1px]">
      <div
        className={`pointer-events-auto flex w-full max-w-xl items-start gap-5 rounded-2xl border bg-white px-6 py-5 shadow-[0_20px_60px_rgba(25,18,15,0.3)] sm:px-8 sm:py-6 ${className}`}
        style={{ borderColor: style.border, fontFamily: "'Inter', system-ui, sans-serif" }}
        role={type === 'error' ? 'alert' : 'status'}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
      >
        <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: style.bg }}>
          <Icon className="h-6 w-6" style={{ color: style.icon }} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="block text-base font-semibold text-[#561C24]">{style.title}</span>
          <span className="mt-1 block break-words text-lg leading-7 text-[#5f4c48]">{message}</span>
        </span>
        <button
          type="button"
          onClick={onDismiss || (() => {})}
          className="-mr-2 -mt-2 rounded-full p-2 text-[#8a8275] transition hover:bg-[#f4eee7] hover:text-[#561C24]"
          aria-label="Dismiss message"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default FeedbackNotice;
