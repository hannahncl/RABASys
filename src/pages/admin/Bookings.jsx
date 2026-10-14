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
  X,
} from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'Pending Verification', label: 'Pending' },
  { key: 'Confirmed', label: 'Booked' },
  { key: 'Rescheduled', label: 'Rescheduled' }
];

const statusStyle = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'confirmed' || s === 'completed') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
  }
  if (s === 'cancelled') {
    return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
  }
  return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
};

const statusLabel = (status) => {
  if (status === 'Confirmed' || status === 'Completed') return 'Booked';
  if (status === 'Pending Verification' || status === 'Pending') return 'Pending';
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
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [bookingType, setBookingType] = useState('all');
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
    if (bookingType === 'all') return bookings;
    return bookings.filter(b => (b.type || 'Tour Packages') === bookingType);
  }, [bookings, bookingType]);

  const counts = useMemo(() => ({
    all: typeFilteredBookings.length,
    pending: typeFilteredBookings.filter(b => b.status === 'Pending Verification' || b.status === 'Pending').length,
    booked: typeFilteredBookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length,
    rescheduled: typeFilteredBookings.filter(b => b.status === 'Rescheduled').length
  }), [typeFilteredBookings]);

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();
    return typeFilteredBookings
      .filter(booking => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'Pending Verification') {
          return booking.status === 'Pending Verification' || booking.status === 'Pending';
        }
        if (activeFilter === 'Confirmed') {
          return booking.status === 'Confirmed' || booking.status === 'Completed';
        }
        return booking.status === activeFilter;
      })
      .filter(booking => {
        if (!term) return true;
        return [
          booking.id,
          booking.packageName,
          booking.customerName,
          booking.customerEmail,
          booking.customerPhone,
          booking.paymentRef,
          booking.plateNumber
        ].some(value => String(value || '').toLowerCase().includes(term));
      });
  }, [typeFilteredBookings, activeFilter, search]);

  const handleStatusUpdate = async (booking, status) => {
    const actionLabel = 'confirm this booking';
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
      showNotification('Booking confirmed as booked', 'success');
    } catch {
      showNotification('Failed to update booking status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      {/* Pop of Color Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total" value={counts.all} icon={ReceiptText} tone="text-yellow-700" bgTone="bg-yellow-50 border-yellow-200" />
        <SummaryCard label="Pending Review" value={counts.pending} icon={Clock3} tone="text-amber-700" bgTone="bg-amber-50 border-amber-200" />
        <SummaryCard label="Booked" value={counts.booked} icon={CheckCircle2} tone="text-emerald-700" bgTone="bg-emerald-50 border-emerald-200" />
        <SummaryCard label="Rescheduled" value={counts.rescheduled} icon={CalendarDays} tone="text-blue-700" bgTone="bg-blue-50 border-blue-200" />
      </div>

      {/* Sales-report-style filtering toolbar */}
      <div className="bg-white border border-[#e0dbd0] p-4 rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service</span>
              <select
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value)}
                className="bg-white border border-[#d6cfc2] hover:border-[#b0a68e] focus:border-[#1a1a1a] rounded-sm text-xs text-[#1a1a1a] px-2.5 py-1.5 outline-none transition-colors cursor-pointer"
              >
                <option value="all">All Services</option>
                <option value="Tour Packages">Tour Packages</option>
                <option value="Customization">Customization Bookings</option>
                <option value="Car Rental">Car Rentals</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="bg-white border border-[#d6cfc2] hover:border-[#b0a68e] focus:border-[#1a1a1a] rounded-sm text-xs text-[#1a1a1a] px-2.5 py-1.5 outline-none transition-colors cursor-pointer"
              >
                {FILTERS.map(filter => (
                  <option key={filter.key} value={filter.key}>{filter.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative w-full lg:w-64">
            <Search className="h-3.5 w-3.5 text-[#8a8275] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search booking, customer, ref..."
              className="w-full bg-white border border-[#d6cfc2] focus:border-[#1a1a1a] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#1a1a1a] placeholder:text-[#8a8275] outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Full-Width Bookings Table */}
      <div className="bg-white border border-[#e0dbd0] rounded-md overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#eae5db] bg-[#faf9f6] text-[10px] uppercase tracking-[0.15em] text-[#6b6255] font-bold">
                <th className="px-5 py-3.5">Booking ID</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Service / Package</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Schedule</th>
                <th className="px-5 py-3.5 text-right">Price</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eae5db] text-[#1a1a1a]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Loader className="h-6 w-6 text-yellow-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading bookings...</p>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-400">
                    <ReceiptText className="h-9 w-9 opacity-40 mx-auto mb-2 text-[#b0a68e]" />
                    <p className="text-sm font-semibold text-[#1a1a1a]">No bookings found.</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const isCar = booking.type === 'Car Rental';
                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-[#faf9f6]/80 transition-colors"
                    >
                      {/* Booking ID */}
                      <td className="px-5 py-4 font-mono font-bold text-yellow-700 whitespace-nowrap">
                        #{booking.id}
                      </td>

                      {/* Type Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isCar
                            ? 'bg-amber-100 text-amber-900 border border-amber-300/60'
                            : 'bg-yellow-100 text-yellow-900 border border-yellow-300/60'
                        }`}>
                          {isCar ? 'Car Rental' : 'Tour'}
                        </span>
                      </td>

                      {/* Package / Vehicle Name */}
                      <td className="px-5 py-4 font-semibold text-[#1a1a1a] max-w-[220px]">
                        <p className="truncate">{booking.packageName}</p>
                        {booking.paymentRef && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {booking.paymentRef}</p>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#1a1a1a]">{booking.customerName}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[170px]">{booking.customerEmail}</p>
                      </td>

                      {/* Schedule */}
                      <td className="px-5 py-4 text-[#4a453b] whitespace-nowrap">
                        {isCar ? (
                          <div>
                            <p className="font-medium text-xs">{formatDate(booking.tourDate)}</p>
                            {booking.returnDate && (
                              <p className="text-[10px] text-slate-400">to {formatDate(booking.returnDate)}</p>
                            )}
                          </div>
                        ) : (
                          <p className="font-medium text-xs">{formatDate(booking.tourDate)}</p>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 text-right font-bold text-[#1a1a1a] whitespace-nowrap">
                        PHP {Number(booking.totalPrice || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${statusStyle(booking.status)}`}>
                          {statusLabel(booking.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="px-2.5 py-1.5 rounded-md border border-[#e0dbd0] hover:border-yellow-400 hover:bg-yellow-50 text-slate-700 hover:text-yellow-800 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="View full booking details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </button>
                          {(booking.status === 'Pending Verification' || booking.status === 'Pending') && (
                            <button
                              onClick={() => handleStatusUpdate(booking, 'Confirmed')}
                              disabled={updatingId === booking.id}
                              className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                              title="Confirm as booked"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Confirm</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Review Modal (Opens when View is clicked) */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          updatingId={updatingId}
          onClose={() => setSelectedBooking(null)}
          onConfirm={(booking) => handleStatusUpdate(booking, 'Confirmed')}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmation && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[380px] rounded-2xl border border-[#e0dbd0] bg-white p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.14)]" role="dialog" aria-modal="true">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50 border border-yellow-200">
              <CheckCircle2 className="h-8 w-8 text-yellow-600" strokeWidth={1.7} />
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a]">Confirm Booking Update</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#4a453b]">
              Are you sure you want to {confirmation.actionLabel} for booking <span className="font-bold text-[#1a1a1a]">#{confirmation.booking.id}</span>?
            </p>
            <div className="mt-7 flex gap-3">
              <button 
                onClick={() => setConfirmation(null)} 
                className="flex-1 rounded-xl border border-[#d6cfc2] bg-white px-4 py-2.5 text-xs font-semibold text-[#4a453b] hover:bg-[#faf9f6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleStatusUpdate(confirmation.booking, confirmation.status)} 
                className="flex-1 rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#333333] transition-colors cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, icon: Icon, tone = 'text-yellow-700', bgTone = 'bg-yellow-50 border-yellow-200' }) => (
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

const BookingDetailModal = ({ booking, updatingId, onClose, onConfirm }) => {
  const isPending = booking.status === 'Pending Verification' || booking.status === 'Pending';
  const isCarRental = booking.type === 'Car Rental';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#e0dbd0] rounded-lg max-w-lg w-full overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.18)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#eae5db] bg-[#faf9f6] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-yellow-700 font-bold tracking-wider">#{booking.id}</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${statusStyle(booking.status)}`}>
                {statusLabel(booking.status)}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                {isCarRental ? 'Car Rental' : 'Tour Package'}
              </span>
            </div>
            <h2 className="text-base font-bold text-[#1a1a1a] leading-snug">{booking.packageName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Customer */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-[#eae5db] pb-1.5">
              Customer Information
            </h3>
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Name:</span>
                <span className="font-semibold text-[#1a1a1a]">{booking.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="font-semibold text-[#1a1a1a]">{booking.customerEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Contact Number:</span>
                <span className="font-semibold text-[#1a1a1a]">{booking.customerPhone || 'Not specified'}</span>
              </div>
              {!isCarRental && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Guests Count:</span>
                  <span className="font-semibold text-[#1a1a1a]">{booking.guestsCount} guest(s)</span>
                </div>
              )}
            </div>
          </section>

          {/* Schedule */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-[#eae5db] pb-1.5">
              {isCarRental ? "Rental Schedule" : "Tour Schedule"}
            </h3>
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">{isCarRental ? "Pickup Date:" : "Travel Date:"}</span>
                <span className="font-semibold text-[#1a1a1a]">{formatDate(booking.tourDate)}</span>
              </div>
              {isCarRental && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Return Date:</span>
                    <span className="font-semibold text-[#1a1a1a]">{formatDate(booking.returnDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Pickup Location:</span>
                    <span className="font-semibold text-[#1a1a1a]">{booking.pickupLocation || 'Not specified'}</span>
                  </div>
                  {booking.plateNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Plate Number:</span>
                      <span className="font-semibold font-mono text-[#1a1a1a]">{booking.plateNumber}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Booked On:</span>
                <span>{new Date(booking.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-[#eae5db] pb-1.5">
              Payment Information
            </h3>
            <div className="space-y-2 pt-1 text-xs bg-[#faf9f6] p-3.5 rounded-md border border-[#eae5db]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Payment Method:</span>
                <span className="font-semibold text-[#1a1a1a]">{booking.paymentMethod || 'GCash'}</span>
              </div>
              {booking.paymentRef && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Reference Code:</span>
                  <span className="font-mono font-bold text-yellow-700">{booking.paymentRef}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-[#eae5db] text-sm">
                <span className="font-bold text-[#1a1a1a]">Total Paid:</span>
                <span className="font-extrabold text-[#1a1a1a]">PHP {Number(booking.totalPrice || 0).toLocaleString()}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#eae5db] bg-[#faf9f6] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[#d6cfc2] hover:bg-white text-xs font-semibold text-[#4a453b] transition-colors cursor-pointer"
          >
            Close
          </button>
          {isPending && (
            <button
              onClick={() => {
                onClose();
                onConfirm(booking);
              }}
              disabled={updatingId === booking.id}
              className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm Booking</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookings;
