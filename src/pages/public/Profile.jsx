import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { bookingService } from '../../services/bookingService';
import { api } from '../../services/api';
import {
  User, Mail, Phone, MapPin, Calendar, CreditCard, CheckCircle2,
  AlertCircle, Clock, Edit2, Save, ShoppingBag, Eye, X,
  Loader2, ArrowRight, History, XCircle, RefreshCw, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

/* ────────────────────────────────
   Status badge helper
──────────────────────────────── */
const StatusBadge = ({ status }) => {
  if (status === 'Confirmed' || status === 'Completed') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
      <CheckCircle2 className="h-3.5 w-3.5" /> {status}
    </span>
  );
  if (status === 'Cancelled') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
      <XCircle className="h-3.5 w-3.5" /> Cancelled
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
      <Clock className="h-3.5 w-3.5 animate-pulse" /> Pending Verification
    </span>
  );
};

/* ────────────────────────────────
   Main Profile Component
──────────────────────────────── */
const Profile = () => {
  const { user, updateUserSession } = useContext(AuthContext);

  // Bookings state
  const [allBookings, setAllBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [viewingBooking, setViewingBooking] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Profile state
  const [accountRecord, setAccountRecord] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);

  // Edit fields  — match Register.jsx fields exactly
  const [firstName, setFirstName]         = useState('');
  const [lastName, setLastName]           = useState('');
  const [email, setEmail]                 = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress]             = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  // ── Load account & bookings on mount ──
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const { user: match } = await api('/auth/me');
        if (match) {
          const account = {
            id: String(match.id), name: match.name, email: match.email,
            phone: match.contactNumber, contactNumber: match.contactNumber,
          };
          setAccountRecord({
            ...account,
            twoFactorEnabled: Boolean(match.twoFactorEnabled),
          });
          const parts = (match.name || user.name || '').split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
          setEmail(match.email || user.email || '');
          setContactNumber(match.contactNumber || user.contactNumber || '');
          setAddress(match.address || user.address || '');
          setSelectedAvatar(match.avatar || AVATARS[0]);
        } else {
          // Fall back to session
          const parts = (user.name || '').split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
          setEmail(user.email || '');
          setContactNumber(user.contactNumber || '');
          setAddress(user.address || '');
        }
      } catch (e) {
        console.error(e);
      }
    };

    const loadBookings = async () => {
      setLoadingBookings(true);
      try {
        const all = await bookingService.getAll();
        const mine = all.filter(
          b => b.customerEmail?.toLowerCase() === user.email.toLowerCase()
        );
        setAllBookings(mine);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingBookings(false);
      }
    };

    loadProfile();
    loadBookings();
  }, [user]);

  // ── Filter bookings by tab ──
  const tabs = ['All', 'Pending Verification', 'Confirmed', 'To Review', 'Cancelled'];

  const filteredBookings = activeTab === 'All'
    ? allBookings
    : activeTab === 'To Review'
      ? allBookings.filter(b => b.status === 'Confirmed' && !b.hasReviewed)
      : allBookings.filter(b => b.status === activeTab);

  // ── Reset to page 1 when tab changes ──
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // ── Pagination calculations ──
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // ── Save profile edits ──
  const handleSave = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    setSaving(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      if (accountRecord) {
        const { user: updated } = await api('/auth/me', {
          method: 'PATCH',
          body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), contactNumber: contactNumber.trim() }),
        });
        setAccountRecord(prev => ({
          ...(prev || {}),
          id: String(updated.id),
          name: updated.name,
          email: updated.email,
          phone: updated.contactNumber,
          contactNumber: updated.contactNumber,
          twoFactorEnabled: Boolean(prev?.twoFactorEnabled ?? updated.twoFactorEnabled),
        }));
      }
      updateUserSession({
        name: fullName,
        email: email.trim(),
        contactNumber: contactNumber.trim(),
      });
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    const parts = (accountRecord?.name || user?.name || '').split(' ');
    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' ') || '');
    setEmail(accountRecord?.email || user?.email || '');
    setContactNumber(accountRecord?.phone || user?.contactNumber || '');
    setSelectedAvatar(accountRecord?.avatar || AVATARS[0]);
    setEditing(false);
  };

  const handleTwoFactorToggle = async () => {
    if (!accountRecord) return;
    setTwoFactorSaving(true);
    try {
      const { user: updated } = await api('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ twoFactorEnabled: !accountRecord.twoFactorEnabled }),
      });
      const refreshed = {
        ...accountRecord,
        twoFactorEnabled: Boolean(updated.twoFactorEnabled),
      };
      setAccountRecord(refreshed);
      updateUserSession({ twoFactorEnabled: Boolean(updated.twoFactorEnabled) });
    } catch (e) {
      console.error(e);
    } finally {
      setTwoFactorSaving(false);
    }
  };

  // ── Counts for tab badges ──
  const countFor = (tab) => tab === 'All'
    ? allBookings.length
    : tab === 'To Review'
      ? allBookings.filter(b => b.status === 'Confirmed' && !b.hasReviewed).length
      : allBookings.filter(b => b.status === tab).length;

  return (
    <div className="bg-white min-h-screen pb-24 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-10 border-b border-slate-100 pb-8">
          <h1 className="text-2xl text-slate-400 tracking-widest uppercase mb-1">My Account</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════════════════════════════════
              LEFT — Profile Card
          ════════════════════════════════ */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">

            <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-yellow-200 ring-offset-2">
                <img
                  src={selectedAvatar}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mt-3 leading-tight">
                {user?.name}
              </h2>
              <span className="inline-block text-[10px] text-yellow-700 bg-yellow-50 border border-yellow-100 px-2.5 py-0.5 rounded-full mt-1.5 tracking-wide">
                {user?.role}
              </span>
            </div>

            {/* ── VIEW MODE ── */}
            {!editing ? (
              <div className="space-y-4 pt-5">

                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={email || user?.email} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Contact" value={contactNumber || '—'} />

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Two-factor authentication</p>
                      <p className="text-xs text-slate-500">Receive a 6-digit code by email when you sign in.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTwoFactorToggle}
                      disabled={twoFactorSaving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${accountRecord?.twoFactorEnabled ? 'bg-yellow-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all ${accountRecord?.twoFactorEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setEditing(true)}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs font-medium py-2.5 rounded-xl transition-all cursor-pointer mt-2"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit Profile
                </button>
              </div>
            ) : (
              /* ── EDIT MODE — matches Register.jsx fields ── */
              <form onSubmit={handleSave} className="space-y-4 pt-5">

                {/* Avatar Picker */}
                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    Choose Avatar
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATARS.map((av, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setSelectedAvatar(av)}
                        className={`aspect-square rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                          selectedAvatar === av
                            ? 'border-yellow-400 scale-105'
                            : 'border-transparent opacity-40 hover:opacity-80'
                        }`}
                      >
                        <img src={av} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* First & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="First Name"
                    value={firstName}
                    onChange={setFirstName}
                    capitalize
                    required
                  />
                  <FormField
                    label="Last Name"
                    value={lastName}
                    onChange={setLastName}
                    capitalize
                  />
                </div>

                {/* Email */}
                <FormField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  required
                />

                {/* Contact Number */}
                <FormField
                  label="Contact Number"
                  placeholder="e.g. 09171234567"
                  value={contactNumber}
                  onChange={setContactNumber}
                />


                {/* Save / Cancel */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 text-slate-500 text-xs py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-xs font-medium py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Save className="h-3.5 w-3.5" />Save changes</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ════════════════════════════════
              RIGHT — Booking History / Logs
          ════════════════════════════════ */}
          <div className="lg:col-span-8 space-y-5">

            {/* Card */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">

              {/* Header row */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                  <History className="h-4 w-4 text-yellow-500" />
                  Trip History
                </h3>
                <Link
                  to="/packages"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-yellow-600 transition-colors"
                >
                  Book a trip <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`flex items-center gap-1.5 whitespace-nowrap text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab === 'Pending Verification' ? 'Pending' : tab}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeTab === tab ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {countFor(tab)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Booking list */}
              <div className="px-6 py-4">
                {loadingBookings ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mb-2" />
                    <p className="text-xs font-medium">Loading your trip history...</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-slate-300 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                    <ShoppingBag className="h-10 w-10 mb-3 stroke-1" />
                    <p className="text-sm text-slate-400">No trips found</p>
                    <p className="text-xs text-slate-300 mt-1 text-center max-w-[240px]">
                      {activeTab === 'All'
                        ? "You haven't made any bookings yet."
                        : activeTab === 'To Review'
                        ? "All caught up! You've reviewed all your trips."
                        : `No ${activeTab.toLowerCase()} trips.`}
                    </p>
                    {activeTab === 'All' && (
                      <Link
                        to="/packages"
                        className="mt-5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-medium px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        Browse Packages
                      </Link>
                    )}
                  </div>
                ) : activeTab === 'To Review' ? (
                  /* Pending Reviews Card View */
                  <div>
                    <div className="space-y-3">
                      {paginatedBookings.map(booking => (
                        <Link
                          key={booking.id}
                          to={`/review/${booking.id}`}
                          className="block p-4 rounded-lg border border-yellow-100 bg-yellow-50/40 hover:bg-yellow-50 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-700 group-hover:text-yellow-700 truncate">
                                {booking.packageName}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Completed on {new Date(booking.tourDate).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-yellow-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Pagination for To Review */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          ← Previous
                        </button>
                        
                        <div className="flex items-center gap-2">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                currentPage === page
                                  ? 'bg-yellow-400 text-slate-900'
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Timeline-style log */
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-4 top-3 bottom-3 w-px bg-slate-100" />

                    <div className="space-y-0">
                      {paginatedBookings.map((booking, idx) => (
                        <div key={booking.id} className="relative flex gap-5 items-start py-5">

                          {/* Timeline dot */}
                          <div className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                            (booking.status === 'Confirmed' || booking.status === 'Completed')
                              ? 'bg-green-50 ring-1 ring-green-200'
                              : booking.status === 'Cancelled'
                                ? 'bg-red-50 ring-1 ring-red-200'
                                : 'bg-yellow-50 ring-1 ring-yellow-200'
                          }`}>
                            {(booking.status === 'Confirmed' || booking.status === 'Completed')
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              : booking.status === 'Cancelled'
                                ? <XCircle className="h-3.5 w-3.5 text-red-400" />
                                : <RefreshCw className="h-3.5 w-3.5 text-yellow-500 animate-spin" />
                            }
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 hover:bg-yellow-50/40 border border-slate-100 hover:border-yellow-100 rounded-xl p-4 transition-all group">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-1.5 min-w-0">

                                {/* Booking ID + status */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                                    {booking.id}
                                  </span>
                                  <StatusBadge status={booking.status} />
                                </div>

                                {/* Package name */}
                                <h4 className="text-sm font-medium text-slate-700 leading-snug group-hover:text-yellow-700 transition-colors truncate">
                                  {booking.packageName}
                                </h4>

                                {/* Meta row */}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(booking.tourDate).toLocaleDateString('en-US', {
                                      month: 'long', day: 'numeric', year: 'numeric'
                                    })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" />
                                    {booking.guestsCount} {booking.guestsCount > 1 ? 'guests' : 'guest'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <CreditCard className="h-3.5 w-3.5" />
                                    ₱{booking.totalPrice?.toLocaleString()}
                                  </span>
                                </div>

                                {/* Booked on */}
                                <p className="text-[10px] text-slate-400">
                                  Booked on {new Date(booking.createdAt).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric'
                                  })}
                                </p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => setViewingBooking(booking)}
                                  className="flex items-center justify-center gap-1.5 shrink-0 text-slate-400 hover:text-yellow-700 text-xs px-3 py-1.5 rounded-lg border border-slate-100 hover:border-yellow-200 hover:bg-yellow-50 transition-all cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Invoice
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          ← Previous
                        </button>
                        
                        <div className="flex items-center gap-2">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                currentPage === page
                                  ? 'bg-yellow-400 text-slate-900'
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          BOOKING INVOICE MODAL
      ════════════════════════════════ */}
      {viewingBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewingBooking(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-5 border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded font-mono">
                  {viewingBooking.id}
                </span>
                <h3 className="text-lg font-black text-slate-800 mt-1">Booking Invoice</h3>
              </div>
              <button
                onClick={() => setViewingBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Package */}
            <div className="p-4 bg-yellow-50/50 rounded-xl border border-yellow-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tour Package</p>
              <h4 className="text-base font-extrabold text-slate-800 mt-0.5">{viewingBooking.packageName}</h4>
            </div>

            {/* Status + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status</p>
                <StatusBadge status={viewingBooking.status} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tour Date</p>
                <p className="text-sm font-bold text-slate-750">
                  {new Date(viewingBooking.tourDate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Guest info */}
            <div className="border-t border-b border-slate-100 py-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lead Guest</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">{viewingBooking.customerName}</p>
                <p className="text-[10px] text-slate-500">{viewingBooking.customerPhone}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Guests Count</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">{viewingBooking.guestsCount} pax</p>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-xl space-y-2">
              <Row label="Payment Mode" value={viewingBooking.paymentMethod} />
              {viewingBooking.gcashNumber && (
                <Row label="GCash Mobile" value={viewingBooking.gcashNumber} />
              )}
              {viewingBooking.paymentRef && (
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Reference ID:</span>
                  <strong className="font-mono text-[11px] bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    {viewingBooking.paymentRef}
                  </strong>
                </div>
              )}
              <div className="border-t border-slate-200/50 my-2 pt-2 flex justify-between items-center text-sm font-black text-slate-800">
                <span>Grand Total Paid:</span>
                <span className="text-yellow-600 text-base">₱{viewingBooking.totalPrice?.toLocaleString()}</span>
              </div>
            </div>

            {/* Review Section */}
            {viewingBooking.hasReviewed && viewingBooking.review && (
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Review</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= viewingBooking.review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {viewingBooking.review.rating}/5
                    </span>
                  </div>
                  {viewingBooking.review.comment && (
                    <p className="text-xs text-slate-700 italic border-l-2 border-blue-200 pl-3">
                      "{viewingBooking.review.comment}"
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Reviewed on {new Date(viewingBooking.review.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setViewingBooking(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs py-3 rounded-xl cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Small reusable sub-components ── */
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-slate-50 text-slate-400 shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-slate-400 tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 truncate">{value}</p>
    </div>
  </div>
);

const FormField = ({ label, value, onChange, type = 'text', placeholder = '', required = false, capitalize = false }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-600 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={`w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all ${capitalize ? 'capitalize' : ''}`}
    />
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between items-center text-xs text-slate-500">
    <span>{label}:</span>
    <strong className="text-slate-800">{value}</strong>
  </div>
);

export default Profile;
