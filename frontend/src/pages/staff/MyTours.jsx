import React, { useEffect, useState } from 'react';
import { bookingService } from '../../services/bookingService';
import { useNotification } from '../../hooks/useNotification';
import { CalendarCheck, Eye, Search, X } from 'lucide-react';

const statusPillClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'confirmed') return 'bg-yellow-400/20 text-yellow-800 border-yellow-400/40 font-bold';
  if (s === 'completed') return 'bg-yellow-50 border-yellow-300 text-yellow-800 font-bold';
  if (s === 'cancelled') return 'bg-stone-100 text-stone-600 border-stone-200 font-medium';
  return 'bg-yellow-50 text-yellow-700 border-yellow-200 font-semibold';
};

const statusLabel = (status) => {
  if (status === 'Confirmed') return 'Booked';
  if (status === 'Completed') return 'Completed';
  if (status === 'Pending Verification') return 'Pending';
  return status || 'Confirmed';
};

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? 'Not set'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const MyTours = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Confirmed');
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { showNotification } = useNotification();

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getAll();
      setBookings(data || []);
    } catch (e) {
      showNotification('Failed to fetch bookings list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = filter === 'All' || b.status === filter;
    const matchesSearch = (b.customerName || '').toLowerCase().includes(search.toLowerCase()) || 
                          (b.id || '').toLowerCase().includes(search.toLowerCase()) ||
                          (b.packageName || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['All', 'Confirmed', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition-all cursor-pointer ${
                filter === status
                  ? 'bg-yellow-400 text-slate-900 border-yellow-400 shadow-sm'
                  : 'bg-white border-[#d6cfc2] text-[#4a453b] hover:bg-[#f7f4ef]'
              }`}
            >
              {status === 'Confirmed' ? 'Booked' : status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6b6255]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client or ref ID..."
            className="w-full bg-white border border-[#d6cfc2] focus:border-[#b0a68e] rounded-sm py-2 pl-9 pr-4 text-xs text-[#1a1a1a] placeholder:text-[#6b6255] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="overflow-x-auto rounded-md border border-[#e0dbd0] bg-white">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-10 gap-4 border-b border-[#eae5db] bg-[#fcfbf9] px-5 py-4">
              {[...Array(10)].map((_, i) => <div key={i} className="h-3 rounded bg-stone-200 animate-pulse" />)}
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="grid grid-cols-10 gap-4 border-b border-[#eae5db] px-5 py-6">
                {[...Array(10)].map((__, j) => <div key={j} className="h-4 rounded bg-stone-100 animate-pulse" />)}
              </div>
            ))}
          </div>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-[#e0dbd0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead className="bg-[#fcfbf9]">
              <tr className="border-b border-[#eae5db]">
                {['Booking ID', 'Reference Number', 'Type', 'Service / Package', 'Customer', 'Schedule', 'Guests', 'Contact', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6255] whitespace-nowrap">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b.id} className="border-b border-[#eae5db] last:border-b-0 hover:bg-[#fcfbf9] transition-colors">
                  <td className="px-5 py-5 align-middle">
                    <p className="text-xs font-bold font-mono text-yellow-700">#{b.id}</p>
                  </td>
                  <td className="px-5 py-5 align-middle text-xs font-mono text-[#4a453b]">
                    {b.paymentRef || 'Not available'}
                  </td>
                  <td className="px-5 py-5 align-middle">
                    <span className="inline-flex rounded-full border border-yellow-300 bg-yellow-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-800">
                      {b.type === 'Car Rental' ? 'Rental' : 'Tour'}
                    </span>
                  </td>
                  <td className="max-w-[240px] px-5 py-5 align-middle">
                    <p className="truncate text-sm font-semibold text-[#1a1a1a]" title={b.packageName}>{b.packageName || 'Tour booking'}</p>
                  </td>
                  <td className="px-5 py-5 align-middle">
                    <p className="whitespace-nowrap text-sm font-semibold text-[#1a1a1a]">{b.customerName || 'Not provided'}</p>
                  </td>
                  <td className="px-5 py-5 align-middle text-sm text-[#1a1a1a] whitespace-nowrap">{formatDate(b.tourDate)}</td>
                  <td className="px-5 py-5 align-middle text-sm text-[#1a1a1a] whitespace-nowrap">{b.guestsCount || 1}</td>
                  <td className="px-5 py-5 align-middle text-sm text-[#1a1a1a] whitespace-nowrap">{b.customerPhone || 'Not provided'}</td>
                  <td className="px-5 py-5 align-middle">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusPillClass(b.status)}`}>
                        {statusLabel(b.status)}
                      </span>
                      {b.status === 'Confirmed' && <span className="text-[10px] font-semibold text-[#6b6255]">Ready for Tour</span>}
                      {b.status === 'Pending Verification' && <span className="text-[10px] font-semibold text-[#6b6255]">Awaiting Payment</span>}
                    </div>
                  </td>
                  <td className="px-5 py-5 align-middle">
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(b)}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-[#d6cfc2] bg-white px-3 py-2 text-xs font-semibold text-[#4a453b] hover:bg-[#f7f4ef] transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-md border border-[#e0dbd0] space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 inline-flex items-center justify-center mx-auto mb-2">
            <CalendarCheck className="h-6 w-6 text-yellow-700" />
          </div>
          <h4 className="font-bold text-[#1a1a1a] font-display">No Bookings Found</h4>
          <p className="text-[#6b6255] text-xs max-w-xs mx-auto">There are no bookings matching the selected status filter.</p>
        </div>
      )}

      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedBooking(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-booking-details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-[#e0dbd0] bg-white shadow-xl"
          >
            <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-[#eae5db] bg-white p-5">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold text-yellow-700">
                  Booking #{selectedBooking.id} · Ref: {selectedBooking.paymentRef || 'Not available'}
                </p>
                <h2 id="tour-booking-details-title" className="mt-1 text-lg font-bold text-[#1a1a1a]">
                  {selectedBooking.packageName || 'Tour booking'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                aria-label="Close booking details"
                className="rounded-sm p-1.5 text-[#6b6255] hover:bg-[#f7f4ef]"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-5 p-5 text-sm">
              <section>
                <h3 className="mb-2 border-b border-[#eae5db] pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6b6255]">Customer</h3>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  <div><dt className="text-xs text-[#6b6255]">Name</dt><dd className="font-semibold text-[#1a1a1a]">{selectedBooking.customerName || 'Not provided'}</dd></div>
                  <div><dt className="text-xs text-[#6b6255]">Contact</dt><dd className="font-semibold text-[#1a1a1a]">{selectedBooking.customerPhone || 'Not provided'}</dd></div>
                  <div><dt className="text-xs text-[#6b6255]">Email</dt><dd className="break-all font-semibold text-[#1a1a1a]">{selectedBooking.customerEmail || 'Not provided'}</dd></div>
                  <div><dt className="text-xs text-[#6b6255]">Guests</dt><dd className="font-semibold text-[#1a1a1a]">{selectedBooking.guestsCount || 1}</dd></div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 border-b border-[#eae5db] pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6b6255]">Booking and schedule</h3>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  <div><dt className="text-xs text-[#6b6255]">Type</dt><dd className="font-semibold text-[#1a1a1a]">{selectedBooking.type === 'Car Rental' ? 'Car Rental' : selectedBooking.type === 'Customization' ? 'Customized Trip' : 'Tour Package'}</dd></div>
                  <div><dt className="text-xs text-[#6b6255]">{selectedBooking.type === 'Car Rental' ? 'Pickup date' : 'Tour date'}</dt><dd className="font-semibold text-[#1a1a1a]">{formatDate(selectedBooking.tourDate)}</dd></div>
                  <div><dt className="text-xs text-[#6b6255]">Status</dt><dd className="font-semibold text-[#1a1a1a]">{statusLabel(selectedBooking.status)}</dd></div>
                  {selectedBooking.returnDate && <div><dt className="text-xs text-[#6b6255]">Return date</dt><dd className="font-semibold text-[#1a1a1a]">{formatDate(selectedBooking.returnDate)}</dd></div>}
                  {selectedBooking.pickupLocation && <div><dt className="text-xs text-[#6b6255]">Pickup location</dt><dd className="font-semibold text-[#1a1a1a]">{selectedBooking.pickupLocation}</dd></div>}
                </dl>
              </section>

              {selectedBooking.customizedDetails && (
                <section>
                  <h3 className="mb-2 border-b border-[#eae5db] pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6b6255]">Customized trip details</h3>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                    <div><dt className="text-xs text-[#6b6255]">Destination</dt><dd className="font-semibold text-[#1a1a1a]">{selectedBooking.customizedDetails.destination || 'Not set'}</dd></div>
                    <div><dt className="text-xs text-[#6b6255]">Accommodation</dt><dd className="font-semibold text-[#1a1a1a]">{selectedBooking.customizedDetails.hotel || 'None'}</dd></div>
                    <div><dt className="text-xs text-[#6b6255]">Duration</dt><dd className="font-semibold text-[#1a1a1a]">{selectedBooking.customizedDetails.duration || 'Not set'}</dd></div>
                    <div><dt className="text-xs text-[#6b6255]">Preferred guide</dt><dd className="font-semibold text-[#1a1a1a]">{selectedBooking.customizedDetails.preferredGuideName || 'No preference'}</dd></div>
                    {selectedBooking.customizedDetails.otherAccommodationPreference && (
                      <div className="sm:col-span-2"><dt className="text-xs text-[#6b6255]">Other accommodation preference</dt><dd className="font-semibold text-[#1a1a1a]">{selectedBooking.customizedDetails.otherAccommodationPreference}</dd></div>
                    )}
                    {Array.isArray(selectedBooking.customizedDetails.activities) && selectedBooking.customizedDetails.activities.length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-[#6b6255]">Selected activities</dt>
                        <dd className="mt-1 space-y-1 font-semibold text-[#1a1a1a]">
                          {selectedBooking.customizedDetails.activities.map((activity, index) => <p key={`${activity}-${index}`}>{activity}</p>)}
                        </dd>
                      </div>
                    )}
                    {selectedBooking.customizedDetails.quoteItinerary && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-[#6b6255]">Proposed itinerary</dt>
                        <dd className="mt-1 whitespace-pre-line font-semibold text-[#1a1a1a]">{selectedBooking.customizedDetails.quoteItinerary}</dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default MyTours;
