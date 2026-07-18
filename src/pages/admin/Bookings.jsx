import React, { useEffect, useMemo, useState } from 'react';
import { bookingService } from '../services/bookingService';
import { useNotification } from '../../hooks/useNotification';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Loader,
  Mail,
  Phone,
  ReceiptText,
  Search,
  UserRound,
  Users,
  XCircle
} from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'Pending Verification', label: 'Pending' },
  { key: 'Confirmed', label: 'Booked' },
  { key: 'Cancelled', label: 'Cancelled' }
];

const statusStyle = (status) => {
  if (status === 'Confirmed') return 'bg-emerald-100 border-emerald-200 text-emerald-700';
  if (status === 'Cancelled') return 'bg-rose-950/60 border-rose-800/40 text-rose-400';
  return 'bg-amber-100 border-amber-200 text-amber-700';
};

const statusLabel = (status) => {
  if (status === 'Confirmed') return 'Booked';
  if (status === 'Pending Verification') return 'Pending';
  return status;
};

const formatDate = (value) => {
  if (!value) return 'Not set';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Pending Verification');
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [bookingType, setBookingType] = useState('Tour Packages');
  const { showNotification } = useNotification();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getAll();
      setBookings(data);
      setSelectedBooking(current => current ? data.find(b => b.id === current.id) || null : null);
    } catch {
      showNotification('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const typeFilteredBookings = useMemo(() => {
    return bookings.filter(b => (b.type || 'Tour Packages') === bookingType);
  }, [bookings, bookingType]);

  const counts = useMemo(() => ({
    all: typeFilteredBookings.length,
    pending: typeFilteredBookings.filter(b => b.status === 'Pending Verification').length,
    booked: typeFilteredBookings.filter(b => b.status === 'Confirmed').length,
    cancelled: typeFilteredBookings.filter(b => b.status === 'Cancelled').length
  }), [typeFilteredBookings]);

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();
    return typeFilteredBookings
      .filter(booking => activeFilter === 'all' || booking.status === activeFilter)
      .filter(booking => {
        if (!term) return true;
        return [
          booking.id,
          booking.packageName,
          booking.customerName,
          booking.customerEmail,
          booking.customerPhone,
          booking.paymentRef
        ].some(value => String(value || '').toLowerCase().includes(term));
      });
  }, [bookings, activeFilter, search]);

  const handleStatusUpdate = async (booking, status) => {
    const actionLabel = status === 'Confirmed' ? 'confirm this booking' : 'cancel this booking';
    if (!window.confirm(`Are you sure you want to ${actionLabel}?`)) return;

    setUpdatingId(booking.id);
    try {
      const updated = await bookingService.updateStatus(booking.id, status);
      setBookings(prev => prev.map(item => item.id === booking.id ? updated : item));
      setSelectedBooking(current => current?.id === booking.id ? updated : current);
      showNotification(status === 'Confirmed' ? 'Booking confirmed as booked' : 'Booking cancelled', 'success');
    } catch {
      showNotification('Failed to update booking status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="w-full lg:w-auto">
          <div className="flex flex-wrap gap-2">
            {['Tour Packages', 'TukTrip', 'Car Rental'].map(type => (
              <button
                key={type}
                onClick={() => setBookingType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                  bookingType === type 
                    ? 'bg-cyan-500 text-slate-950' 
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking, customer, ref..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total" value={counts.all} icon={ReceiptText} />
        <SummaryCard label="Pending Review" value={counts.pending} icon={Clock3} tone="text-amber-400" />
        <SummaryCard label="Booked" value={counts.booked} icon={CheckCircle2} tone="text-emerald-400" />
        <SummaryCard label="Cancelled" value={counts.cancelled} icon={XCircle} tone="text-rose-400" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === filter.key
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden">
          <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 px-5 py-3 border-b border-slate-900 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            <span>Booking</span>
            <span>Customer</span>
            <span>Tour Date</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-60">
              <Loader className="h-8 w-8 text-cyan-400 animate-spin" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center text-slate-500">
              <ReceiptText className="h-10 w-10 opacity-30 mb-3" />
              <p className="text-sm">No bookings found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-900">
              {filteredBookings.map(booking => (
                <div key={booking.id} className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 px-5 py-4 items-center hover:bg-slate-900/30 transition-colors">
                  <div>
                    <p className="font-mono text-[10px] text-cyan-400 font-bold">{booking.id}</p>
                    <h3 className="text-sm font-bold text-slate-100 leading-snug mt-1">{booking.packageName}</h3>
                    <p className="text-xs text-slate-500 mt-1">PHP {Number(booking.totalPrice || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{booking.customerName}</p>
                    <p className="text-xs text-slate-500 truncate">{booking.customerEmail}</p>
                  </div>
                  <div className="text-sm text-slate-300">{formatDate(booking.tourDate)}</div>
                  <div>
                    <span className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-extrabold uppercase ${statusStyle(booking.status)}`}>
                      {statusLabel(booking.status)}
                    </span>
                  </div>
                  <div className="flex md:justify-end gap-2">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 cursor-pointer"
                      title="Review booking"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {booking.status === 'Pending Verification' && (
                      <button
                        onClick={() => handleStatusUpdate(booking, 'Confirmed')}
                        disabled={updatingId === booking.id}
                        className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer disabled:opacity-50"
                        title="Confirm as booked"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <BookingReview
          booking={selectedBooking}
          updatingId={updatingId}
          onConfirm={(booking) => handleStatusUpdate(booking, 'Confirmed')}
          onCancel={(booking) => handleStatusUpdate(booking, 'Cancelled')}
        />
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon: Icon, tone = 'text-cyan-400' }) => (
  <div className="glass-panel rounded-2xl border-slate-800 p-4">
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</span>
      <Icon className={`h-4 w-4 ${tone}`} />
    </div>
    <p className="text-3xl font-extrabold font-display text-slate-100 mt-3">{value}</p>
  </div>
);

const BookingReview = ({ booking, updatingId, onConfirm, onCancel }) => {
  if (!booking) {
    return (
      <aside className="glass-panel rounded-2xl border-slate-800 p-8 text-center xl:sticky xl:top-24">
        <ReceiptText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-300">Select a booking</h3>
        <p className="text-xs text-slate-500 mt-2">Open a booking to review customer, payment, and trip details.</p>
      </aside>
    );
  }

  const isPending = booking.status === 'Pending Verification';

  return (
    <aside className="glass-panel rounded-2xl border-slate-800 overflow-hidden xl:sticky xl:top-24">
      <div className="p-5 border-b border-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] text-cyan-400 font-bold">{booking.id}</p>
            <h2 className="text-lg font-bold text-slate-100 mt-1 leading-snug">{booking.packageName}</h2>
          </div>
          <span className={`shrink-0 inline-flex px-2 py-1 rounded-full border text-[10px] font-extrabold uppercase ${statusStyle(booking.status)}`}>
            {statusLabel(booking.status)}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <InfoGroup title="Customer">
          <InfoRow icon={UserRound} label="Name" value={booking.customerName} />
          <InfoRow icon={Mail} label="Email" value={booking.customerEmail} />
          <InfoRow icon={Phone} label="Phone" value={booking.customerPhone} />
          <InfoRow icon={Users} label="Guests" value={`${booking.guestsCount} guest(s)`} />
        </InfoGroup>

        <InfoGroup title="Trip">
          <InfoRow icon={CalendarDays} label="Tour Date" value={formatDate(booking.tourDate)} />
          <InfoRow icon={ReceiptText} label="Created" value={new Date(booking.createdAt).toLocaleString()} />
        </InfoGroup>

        <InfoGroup title="Payment">
          <DetailLine label="Method" value={booking.paymentMethod || 'Not set'} />
          <DetailLine label="GCash Number" value={booking.gcashNumber || 'Not set'} />
          <DetailLine label="Payment Ref" value={booking.paymentRef || 'Not set'} mono />
          <DetailLine label="Total Paid" value={`PHP ${Number(booking.totalPrice || 0).toLocaleString()}`} strong />
        </InfoGroup>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => onConfirm(booking)}
            disabled={!isPending || updatingId === booking.id}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-4 w-4" /> Confirm
          </button>
          <button
            onClick={() => onCancel(booking)}
            disabled={booking.status === 'Cancelled' || updatingId === booking.id}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XCircle className="h-4 w-4" /> Cancel
          </button>
        </div>
      </div>
    </aside>
  );
};

const InfoGroup = ({ title, children }) => (
  <section className="space-y-2">
    <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{title}</h3>
    <div className="space-y-2">{children}</div>
  </section>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 text-sm">
    <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] uppercase text-slate-500 font-bold">{label}</p>
      <p className="text-slate-200 truncate">{value}</p>
    </div>
  </div>
);

const DetailLine = ({ label, value, mono, strong }) => (
  <div className="flex items-center justify-between gap-4 text-sm bg-slate-950/60 border border-slate-900 rounded-lg px-3 py-2">
    <span className="text-slate-500">{label}</span>
    <span className={`${mono ? 'font-mono text-cyan-400' : 'text-slate-200'} ${strong ? 'font-extrabold text-cyan-400' : 'font-semibold'} text-right`}>
      {value}
    </span>
  </div>
);

export default Bookings;
