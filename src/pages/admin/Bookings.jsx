import React, { useEffect, useMemo, useState } from 'react';
import { bookingService } from '../../services/bookingService';
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
  if (status === 'Confirmed') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold';
  if (status === 'Cancelled') return 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold';
  return 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold';
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
  const [confirmation, setConfirmation] = useState(null);
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

  const tabCounts = useMemo(() => ({
    'Tour Packages': bookings.filter(b => (b.type || 'Tour Packages') === 'Tour Packages').length,
    'Car Rental': bookings.filter(b => b.type === 'Car Rental').length,
  }), [bookings]);

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
  }, [typeFilteredBookings, activeFilter, search]);

  const handleStatusUpdate = async (booking, status) => {
    const actionLabel = status === 'Confirmed' ? 'confirm this booking' : 'cancel this booking';
    if (!confirmation) {
      setConfirmation({ booking, status, actionLabel });
      return;
    }
    setConfirmation(null);

    setUpdatingId(booking.id);
    try {
      const updated = await bookingService.updateStatus(booking.id, status, booking.type);
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
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      {/* Header controls: Type selector & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="w-full lg:w-auto">
          <div className="flex flex-wrap gap-2">
            {['Tour Packages', 'Car Rental'].map(type => (
              <button
                key={type}
                onClick={() => setBookingType(type)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                  bookingType === type
                    ? 'bg-yellow-400 text-slate-900'
                    : 'bg-white border border-[#d6cfc2] text-[#4a453b] hover:bg-[#f7f4ef]'
                }`}
              >
                {type}
                {tabCounts[type] > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    bookingType === type ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {tabCounts[type]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="h-4 w-4 text-[#4a453b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking, customer, ref..."
            className="w-full bg-white border border-[#d6cfc2] focus:border-[#b0a68e] rounded-sm pl-9 pr-3 py-2 text-xs text-[#1a1a1a] placeholder:text-[#6b6255] outline-none transition-all"
          />
        </div>
      </div>

      {/* Pop of Color Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total" value={counts.all} icon={ReceiptText} tone="text-cyan-400" bgTone="bg-cyan-500/10 border-cyan-500/20" />
        <SummaryCard label="Pending Review" value={counts.pending} icon={Clock3} tone="text-amber-400" bgTone="bg-amber-500/10 border-amber-500/20" />
        <SummaryCard label="Booked" value={counts.booked} icon={CheckCircle2} tone="text-emerald-400" bgTone="bg-emerald-500/10 border-emerald-500/20" />
        <SummaryCard label="Cancelled" value={counts.cancelled} icon={XCircle} tone="text-rose-400" bgTone="bg-rose-500/10 border-rose-500/20" />
      </div>

      {/* Status Filter Chips with Pops of Color */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              activeFilter === filter.key
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-sm'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Main Grid: List + Detail Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Table Container */}
        <div className="bg-white border border-[#e0dbd0] rounded-md overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 px-5 py-3.5 border-b border-[#eae5db] bg-[#faf9f6] text-[10px] uppercase tracking-[0.15em] text-[#6b6255] font-bold">
            <span>Booking</span>
            <span>Customer</span>
            <span>Tour Date</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-60">
              <Loader className="h-6 w-6 text-slate-400 animate-spin" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center text-slate-500">
              <ReceiptText className="h-9 w-9 opacity-30 mb-2" />
              <p className="text-sm">No bookings found.</p>
            </div>
          ) : (
          <div className="divide-y divide-[#eae5db]">
              {filteredBookings.map(booking => (
                <div
                  key={booking.id}
                  className={`grid grid-cols-1 md:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 px-5 py-3.5 items-center transition-all ${
                    selectedBooking?.id === booking.id ? 'bg-yellow-50 border-l-2 border-yellow-400' : 'hover:bg-[#faf9f6]'
                  }`}
                >
                  <div>
                    <p className="font-mono text-[10px] text-yellow-600 font-bold">{booking.id}</p>
                    <h3 className="text-sm font-semibold text-[#4a453b] leading-snug mt-0.5">{booking.packageName}</h3>
                    <p className="text-xs text-emerald-400 mt-0.5 font-bold">PHP {Number(booking.totalPrice || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#4a453b]">{booking.customerName}</p>
                    <p className="text-xs text-[#6b6255] truncate">{booking.customerEmail}</p>
                  </div>
                  <div className="text-xs text-[#4a453b] font-medium">{formatDate(booking.tourDate)}</div>
                  <div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusStyle(booking.status)}`}>
                      {statusLabel(booking.status)}
                    </span>
                  </div>
                  <div className="flex md:justify-end gap-2">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 cursor-pointer transition-all"
                      title="Review booking"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {booking.status === 'Pending Verification' && (
                      <button
                        onClick={() => handleStatusUpdate(booking, 'Confirmed')}
                        disabled={updatingId === booking.id}
                        className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 cursor-pointer disabled:opacity-50 transition-all"
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

        {/* Sidebar Review Panel with Vibrant Accent Elements */}
        <BookingReview
          booking={selectedBooking}
          updatingId={updatingId}
          onConfirm={(booking) => handleStatusUpdate(booking, 'Confirmed')}
          onCancel={(booking) => handleStatusUpdate(booking, 'Cancelled')}
        />
      </div>
      {confirmation && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[380px] rounded-2xl border border-[#e0dbd0] bg-white p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.14)]" role="dialog" aria-modal="true">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50 border border-yellow-100"><CheckCircle2 className="h-8 w-8 text-yellow-600" strokeWidth={1.7} /></div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Confirm booking update</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#4a453b]">Are you sure you want to {confirmation.actionLabel}?</p>
            <div className="mt-7 flex gap-3">
              <button onClick={() => setConfirmation(null)} className="flex-1 rounded-xl border border-[#d6cfc2] bg-white px-4 py-2.5 text-sm font-semibold text-[#4a453b] hover:bg-[#faf9f6]">Cancel</button>
              <button onClick={() => handleStatusUpdate(confirmation.booking, confirmation.status)} className="flex-1 rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]">Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, icon: Icon, tone = 'text-cyan-400', bgTone = 'bg-cyan-500/10 border-cyan-500/20' }) => (
  <div className="bg-white border border-[#e0dbd0] rounded-md p-4 transition-all hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">{label}</span>
      <div className={`p-2 rounded-xl border ${bgTone}`}>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
    </div>
    <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{value}</p>
  </div>
);

const BookingReview = ({ booking, updatingId, onConfirm, onCancel }) => {
  if (!booking) {
    return (
    <aside className="bg-white border border-[#e0dbd0] rounded-md p-8 text-center xl:sticky xl:top-24 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <ReceiptText className="h-9 w-9 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-300">Select a booking</h3>
        <p className="text-xs text-slate-400 mt-1.5">Open a booking to review customer, payment, and trip details.</p>
      </aside>
    );
  }

  const isPending = booking.status === 'Pending Verification';
  const isCarRental = booking.type === 'Car Rental';

  return (
    <aside className="bg-white border border-[#e0dbd0] rounded-md overflow-hidden xl:sticky xl:top-24 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="p-5 border-b border-[#eae5db] bg-[#faf9f6]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] text-cyan-400 font-bold tracking-wider">{booking.id}</p>
            <h2 className="text-base font-bold text-slate-100 mt-0.5 leading-snug">{booking.packageName}</h2>
          </div>
          <span className={`shrink-0 inline-flex px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusStyle(booking.status)}`}>
            {statusLabel(booking.status)}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <InfoGroup title="Customer">
          <InfoRow icon={UserRound} iconTone="text-cyan-400" label="Name" value={booking.customerName} />
          <InfoRow icon={Mail} iconTone="text-sky-400" label="Email" value={booking.customerEmail} />
          <InfoRow icon={Phone} iconTone="text-teal-400" label="Phone" value={booking.customerPhone} />
          {!isCarRental && <InfoRow icon={Users} iconTone="text-indigo-400" label="Guests" value={`${booking.guestsCount} guest(s)`} />}
        </InfoGroup>

        <InfoGroup title={isCarRental ? "Rental Details" : "Trip"}>
          <InfoRow icon={CalendarDays} iconTone="text-blue-400" label={isCarRental ? "Pickup Date" : "Tour Date"} value={formatDate(booking.tourDate)} />
          {isCarRental && (
            <>
              <InfoRow icon={CalendarDays} iconTone="text-indigo-400" label="Return Date" value={formatDate(booking.returnDate)} />
              <InfoRow icon={UserRound} iconTone="text-teal-400" label="Location" value={booking.pickupLocation || 'Not specified'} />
            </>
          )}
          <InfoRow icon={ReceiptText} iconTone="text-slate-400" label="Created" value={new Date(booking.createdAt).toLocaleString()} />
        </InfoGroup>

        <InfoGroup title="Payment">
          <DetailLine label="Method" value={booking.paymentMethod || 'Not set'} />
          <DetailLine label="GCash Number" value={booking.gcashNumber || 'Not set'} />
          <DetailLine label="Payment Ref" value={booking.paymentRef || 'Not set'} mono />
          <DetailLine label="Total Paid" value={`PHP ${Number(booking.totalPrice || 0).toLocaleString()}`} valueTone="text-emerald-400 font-bold text-sm" />
        </InfoGroup>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => onConfirm(booking)}
            disabled={!isPending || updatingId === booking.id}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-500/20"
          >
            <CheckCircle2 className="h-4 w-4" /> Confirm
          </button>
          <button
            onClick={() => onCancel(booking)}
            disabled={booking.status === 'Cancelled' || updatingId === booking.id}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-bold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
    <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-850/40 pb-1.5">{title}</h3>
    <div className="space-y-2.5 pt-1">{children}</div>
  </section>
);

const InfoRow = ({ icon: Icon, iconTone = 'text-cyan-400', label, value }) => (
  <div className="flex items-center gap-3 text-xs">
    <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
      <Icon className={`h-3.5 w-3.5 ${iconTone} shrink-0`} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
      <p className="text-slate-200 font-semibold truncate mt-0.5">{value}</p>
    </div>
  </div>
);

const DetailLine = ({ label, value, mono, valueTone }) => (
  <div className="flex items-center justify-between gap-4 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2.5">
    <span className="text-slate-400 font-medium">{label}</span>
    <span className={`${valueTone ? valueTone : mono ? 'font-mono text-cyan-400 font-bold' : 'text-slate-200 font-semibold'} text-right`}>
      {value}
    </span>
  </div>
);

export default Bookings;




