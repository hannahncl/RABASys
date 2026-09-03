import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { serviceService } from '../../services/serviceService';
import { ChevronLeft, ChevronRight, Users, MapPin, CalendarDays, X, Clock, Sparkles, UserCheck, ArrowRight, Filter } from 'lucide-react';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PublicCalendarModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'joiners' | 'exclusive' | 'rentals'

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [bookingsData, packagesData] = await Promise.all([
          bookingService.getAll().catch(() => []),
          serviceService.getAll().catch(() => []),
        ]);
        setBookings(bookingsData || []);
        setPackages(packagesData || []);
      } catch (err) {
        console.error('Failed to load schedule data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Map package capacity by package ID
  const packageMap = {};
  packages.forEach((p) => {
    packageMap[p.id] = p;
  });

  // Group items by date
  const itemsByDate = {};
  let totalJoinerOpenings = 0;
  let totalExclusiveBooked = 0;
  let totalCarRentals = 0;

  const tourBookingsByDatePkg = {};
  bookings.forEach((b) => {
    const dateKey = b.tourDate;
    if (!dateKey) return;

    if (b.type === 'Car Rental') {
      if (!itemsByDate[dateKey]) itemsByDate[dateKey] = [];
      itemsByDate[dateKey].push({
        ...b,
        itemType: 'rental',
        title: b.packageName || 'Car Rental',
      });
      totalCarRentals++;
      return;
    }

    const pkgId = b.packageId;
    const comboKey = `${pkgId}_${dateKey}`;
    if (!tourBookingsByDatePkg[comboKey]) {
      tourBookingsByDatePkg[comboKey] = {
        packageId: pkgId,
        packageName: b.packageName,
        tourDate: dateKey,
        bookedGuests: 0,
        bookingsList: [],
      };
    }
    tourBookingsByDatePkg[comboKey].bookedGuests += Number(b.guestsCount || 1);
    tourBookingsByDatePkg[comboKey].bookingsList.push(b);
  });

  Object.values(tourBookingsByDatePkg).forEach((group) => {
    const dateKey = group.tourDate;
    const pkg = packageMap[group.packageId] || {};
    const maxCapacity = Number(pkg.maximumCapacity || pkg.max_capacity || 10);
    const bookedGuests = group.bookedGuests;
    const slotsLeft = Math.max(0, maxCapacity - bookedGuests);
    const isJoinerOpen = slotsLeft > 0;

    if (isJoinerOpen) totalJoinerOpenings++;
    else totalExclusiveBooked++;

    if (!itemsByDate[dateKey]) itemsByDate[dateKey] = [];
    itemsByDate[dateKey].push({
      id: `tour-${group.packageId}-${dateKey}`,
      packageId: group.packageId,
      packageName: group.packageName || pkg.title || 'Tour Package',
      destination: pkg.destination || 'Bicol Region',
      price: pkg.price || 0,
      image: pkg.image || '/CAGSAWA.jpg',
      tourDate: dateKey,
      bookedGuests,
      maxCapacity,
      slotsLeft,
      isJoinerOpen,
      itemType: isJoinerOpen ? 'joiner' : 'exclusive',
      bookingsList: group.bookingsList,
    });
  });

  // Calendar cells
  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateItems = itemsByDate[dateStr] || [];

    const filteredItems = dateItems.filter((item) => {
      if (activeFilter === 'joiners') return item.itemType === 'joiner';
      if (activeFilter === 'exclusive') return item.itemType === 'exclusive';
      if (activeFilter === 'rentals') return item.itemType === 'rental';
      return true;
    });

    calendarCells.push({
      day,
      dateStr,
      items: filteredItems,
      rawItems: dateItems,
      isToday: today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day,
    });
  }

  const selectedCellItems = selectedDate
    ? (itemsByDate[selectedDate] || []).filter((item) => {
      if (activeFilter === 'joiners') return item.itemType === 'joiner';
      if (activeFilter === 'exclusive') return item.itemType === 'exclusive';
      if (activeFilter === 'rentals') return item.itemType === 'rental';
      return true;
    })
    : [];

  const handleJoinTour = (packageId, tourDate) => {
    onClose();
    navigate(`/booking/${packageId}`, {
      state: { tourDate }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card — Warm Luxury Aesthetic */}
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-200"
        style={{ fontFamily: "'Inter', 'Georgia', serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-amber-50 text-stone-800 shrink-0 border-b border-amber-200/60">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-stone-900 flex items-center gap-2 font-display">
                Tour & Rental Schedule
                <span className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300">
                  Live Calendar
                </span>
              </h2>
              <p className="text-xs text-stone-600">View upcoming tour dates, open joiner slots, and car rental schedules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-500 hover:text-stone-900 hover:bg-amber-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Navigation Bar */}
        <div className="px-6 py-3 bg-stone-100/70 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mr-2 flex items-center gap-1">
              <Filter className="h-3 w-3 text-amber-600" /> Filter:
            </span>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${activeFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
            >
              All Tours
            </button>
            <button
              onClick={() => setActiveFilter('joiners')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${activeFilter === 'joiners'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
            >
              <UserCheck className="h-3 w-3" />
              Joiners Open ({totalJoinerOpenings})
            </button>
          </div>

          <div className="text-[11px] text-stone-500 font-medium">
            Click any date cell to view open slots & join!
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Left 2 Cols: Main Calendar Grid */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              {/* Month Header / Controls */}
              <div className="flex items-center justify-between px-5 py-4 bg-stone-50 border-b border-stone-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={prevMonth}
                    className="p-2 rounded-xl bg-white border border-stone-200 hover:border-amber-500 hover:bg-amber-50 text-stone-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h3 className="text-base font-bold text-stone-800 font-display min-w-[160px]">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h3>
                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-xl bg-white border border-stone-200 hover:border-amber-500 hover:bg-amber-50 text-stone-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={goToToday}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-stone-200 hover:border-amber-500 hover:bg-amber-50 text-stone-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Today
                </button>
              </div>

              {/* Day Labels Header */}
              <div className="grid grid-cols-7 bg-stone-100/70 border-b border-stone-200">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wider text-stone-600">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                </div>
              ) : (
                <div className="grid grid-cols-7 border-b border-stone-200">
                  {calendarCells.map((cell, idx) => {
                    if (!cell) {
                      return <div key={`empty-${idx}`} className="min-h-[72px] border-b border-r border-stone-100 bg-stone-50/50" />;
                    }

                    const hasItems = cell.items.length > 0;
                    const isSelected = selectedDate === cell.dateStr;

                    return (
                      <div
                        key={cell.dateStr}
                        onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
                        className={`min-h-[72px] p-1.5 border-b border-r border-stone-200 cursor-pointer transition-all relative group ${isSelected
                          ? 'bg-amber-50/80 ring-2 ring-amber-400 ring-inset'
                          : hasItems
                            ? 'bg-amber-50/20 hover:bg-amber-50/50'
                            : 'hover:bg-stone-50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold inline-flex items-center justify-center h-5 w-5 rounded-full ${cell.isToday
                            ? 'bg-amber-400 text-stone-900 font-extrabold'
                            : isSelected
                              ? 'text-amber-700 font-extrabold'
                              : 'text-stone-700'
                            }`}>
                            {cell.day}
                          </span>
                          {hasItems && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                          )}
                        </div>

                        {/* Item Badges */}
                        {hasItems && (
                          <div className="mt-1 space-y-0.5">
                            {cell.items.slice(0, 2).map((item) => (
                              <div
                                key={item.id}
                                className={`text-[8px] leading-tight font-semibold px-1 py-0.5 rounded truncate border ${item.itemType === 'joiner'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                                  : item.itemType === 'rental'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                              >
                                {item.itemType === 'joiner' ? `${item.slotsLeft} slots left` : item.packageName || item.title}
                              </div>
                            ))}
                            {cell.items.length > 2 && (
                              <span className="text-[8px] text-stone-500 font-bold block px-0.5">
                                +{cell.items.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Col: Selected Date Details Sidebar */}
            <div className="space-y-4">
              {/* Stat Counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-center">
                  <span className="text-xl font-extrabold text-emerald-700 block">{totalJoinerOpenings}</span>
                  <span className="text-[9px] text-stone-500 uppercase font-bold tracking-wider">Joiner Tours Open</span>
                </div>
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/60 text-center">
                  <span className="text-xl font-extrabold text-amber-800 block">{totalExclusiveBooked}</span>
                  <span className="text-[9px] text-amber-900 uppercase font-bold tracking-wider">Exclusive Tours</span>
                </div>
              </div>

              {/* Selected Day Panel */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <h4 className="font-bold text-stone-800 text-xs uppercase tracking-wider font-display">
                    {selectedDate
                      ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Select a Date'}
                  </h4>
                </div>

                <div className="p-4">
                  {!selectedDate ? (
                    <div className="text-center py-8 px-2 space-y-2">
                      <Sparkles className="h-6 w-6 text-amber-500 mx-auto opacity-70" />
                      <p className="text-stone-500 text-xs leading-relaxed">
                        Click on any date in the calendar to view available joiner slots, tour details, and book your spot.
                      </p>
                    </div>
                  ) : selectedCellItems.length === 0 ? (
                    <p className="text-stone-400 text-xs text-center py-8">
                      No matching tours or rentals scheduled for this date.
                    </p>
                  ) : (
                    <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                      {selectedCellItems.map((item) => (
                        <div key={item.id} className="bg-stone-50 border border-stone-200/80 rounded-xl p-3.5 space-y-2.5 hover:border-amber-300 transition-colors">

                          {/* Type & Status Tag */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.itemType === 'joiner'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 font-extrabold'
                              : item.itemType === 'rental'
                                ? 'bg-blue-100 text-blue-700 border-blue-200 font-bold'
                                : 'bg-stone-200 text-stone-700 border-stone-300'
                              }`}>
                              {item.itemType === 'joiner' ? 'Joiner Tour' : item.itemType === 'rental' ? 'Car Rental' : 'Exclusive / Private'}
                            </span>

                            {item.itemType === 'joiner' ? (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                {item.slotsLeft} Slots Left
                              </span>
                            ) : item.itemType === 'exclusive' ? (
                              <span className="text-[10px] font-bold text-stone-600">
                                Full ({item.bookedGuests}/{item.maxCapacity})
                              </span>
                            ) : null}
                          </div>

                          {/* Tour Title */}
                          <h5 className="font-bold text-xs text-stone-900 font-display leading-snug">{item.packageName}</h5>

                          {/* Details */}
                          {item.itemType !== 'rental' && (
                            <div className="space-y-1 text-[11px] text-stone-600">
                              <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <span>{item.bookedGuests} booked out of {item.maxCapacity} max capacity</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <span>{item.destination}</span>
                              </div>
                            </div>
                          )}

                          {/* Action Button */}
                          {item.itemType === 'joiner' && (
                            <button
                              onClick={() => handleJoinTour(item.packageId, item.tourDate)}
                              className="w-full mt-2 py-2 px-3 bg-[#2d2a24] hover:bg-[#1a1715] text-[#f7f4ef] rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                            >
                              <span>Join This Tour</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span className="font-medium text-stone-600">Joiner Open tours allow solo travelers to join and fill remaining slots</span>
          <button
            onClick={onClose}
            className="px-5 py-2 font-bold text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-100 transition-all cursor-pointer shadow-2xs"
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicCalendarModal;
