import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { bookingService } from '../../services/bookingService';
import { useNotification } from '../../hooks/useNotification';
import { api } from '../../services/api';
import {
  User, Mail, Phone, MapPin, Calendar, CreditCard, CheckCircle2,
  AlertCircle, Clock, Edit2, Save, ShoppingBag, Eye, X,
  Loader2, ArrowRight, History, XCircle, RefreshCw, Star, Camera, Trash2, Heart, Pencil
} from 'lucide-react';
import { Link } from 'react-router-dom';
import mapGalleryService from '../services/mapGalleryService';

/* ────────────────────────────────
   Status badge helper
──────────────────────────────── */
const StatusBadge = ({ status }) => {
  if (status === 'Confirmed' || status === 'Completed' || status === 'Rescheduled') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
      {status === 'Rescheduled' ? <RefreshCw className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />} {status}
    </span>
  );
  if (status === 'Cancelled') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
      <XCircle className="h-3.5 w-3.5" /> Cancelled
    </span>
  );
  if (status === 'Quote Sent') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
      <Mail className="h-3.5 w-3.5" /> Quote Sent
    </span>
  );
  if (status === 'Quote Accepted') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
      <CheckCircle2 className="h-3.5 w-3.5" /> Quote Accepted
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
      <Clock className="h-3.5 w-3.5 animate-pulse" /> Pending Verification
    </span>
  );
};

const hasPricedCustomQuote = (booking) => Boolean(
  booking?.customizedDetails?.quoteItinerary?.trim()
  && Array.isArray(booking.customizedDetails.priceBreakdown)
  && booking.customizedDetails.priceBreakdown.length > 0
  && Number(booking.totalPrice) > 0
);

/* ────────────────────────────────
   Main Profile Component
──────────────────────────────── */
const Profile = () => {
  const { user, updateUserSession } = useContext(AuthContext);
  const { confirm } = useConfirmation();
  const { showNotification } = useNotification();

  // Bookings state
  const [allBookings, setAllBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [viewingBooking, setViewingBooking] = useState(null);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState(null);
  const [samplePaymentBooking, setSamplePaymentBooking] = useState(null);
  const [samplePaymentMethod, setSamplePaymentMethod] = useState('GCash');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Profile state
  const [accountRecord, setAccountRecord] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit fields  — match Register.jsx fields exactly
  const [firstName, setFirstName]         = useState('');
  const [lastName, setLastName]           = useState('');
  const [email, setEmail]                 = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress]             = useState('');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [myPhotos, setMyPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [photoCaptionDraft, setPhotoCaptionDraft] = useState('');
  const [savingCaptionId, setSavingCaptionId] = useState(null);
  const [profileView, setProfileView] = useState('overview');

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
            profilePicture: match.profilePicture || '',
          };
          setAccountRecord(account);
          const parts = (match.name || user.name || '').split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
          setEmail(match.email || user.email || '');
          setContactNumber(match.contactNumber || user.contactNumber || '');
          setAddress(match.address || user.address || '');
          setProfilePicture(match.profilePicture || user.profilePicture || '');
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
        const [all, reviews] = await Promise.all([
          bookingService.getAll(),
          api('/reviews').catch(() => [])
        ]);
        const mine = all.filter(
          b => b.customerEmail?.toLowerCase() === user.email?.toLowerCase()
        ).map(b => {
          const userRev = reviews.find(r => 
            (b.type === 'Car Rental' && String(r.rental_booking_id) === String(b.id)) ||
            (b.type !== 'Car Rental' && String(r.booking_id) === String(b.id))
          );
          return {
            ...b,
            hasReviewed: b.hasReviewed || Boolean(userRev),
            review: userRev ? {
              rating: userRev.rating,
              comment: userRev.comment,
              imageUrl: userRev.image_url,
              createdAt: userRev.created_at,
            } : null
          };
        });
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

  useEffect(() => {
    if (!profilePictureFile) {
      setProfilePicturePreview('');
      return undefined;
    }
    const previewUrl = URL.createObjectURL(profilePictureFile);
    setProfilePicturePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [profilePictureFile]);

  const handleProfilePictureChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      showNotification('Choose a JPEG, PNG, WebP, or GIF image.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Profile pictures must be 5 MB or smaller.', 'error');
      return;
    }
    setProfilePictureFile(file);
  };

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setLoadingPhotos(true);
    mapGalleryService.getMyUploads(user)
      .then(photos => { if (isMounted) setMyPhotos(photos); })
      .catch(error => console.error('Could not load your shared photos:', error))
      .finally(() => { if (isMounted) setLoadingPhotos(false); });
    return () => { isMounted = false; };
  }, [user]);

  const handleDeletePhoto = async (photo) => {
    if (!(await confirm('Delete this photo from Explore Map? This cannot be undone.'))) return;
    setDeletingPhotoId(photo.id);
    try {
      const deleted = await mapGalleryService.deleteMyUpload(photo.id, user);
      if (!deleted) throw new Error('This photo could not be deleted from your account.');
      setMyPhotos(photos => photos.filter(item => item.id !== photo.id));
      showNotification('Photo deleted from Explore Map.', 'success');
    } catch (error) {
      showNotification(error.message || 'Could not delete this photo.', 'error');
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleSavePhotoCaption = async (photo) => {
    setSavingCaptionId(photo.id);
    try {
      const updated = await mapGalleryService.updateMyUploadCaption(photo.id, photoCaptionDraft, user);
      if (!updated) throw new Error('This photo could not be updated from your account.');
      setMyPhotos(photos => photos.map(item => item.id === photo.id ? { ...item, caption: updated.caption } : item));
      setEditingPhotoId(null);
      showNotification('Photo caption updated.', 'success');
    } catch (error) {
      showNotification(error.message || 'Could not update this caption.', 'error');
    } finally {
      setSavingCaptionId(null);
    }
  };

  const handleLikePhoto = async (photo) => {
    try {
      const updated = await mapGalleryService.likeUpload(photo.id);
      if (updated) {
        setMyPhotos(photos => photos.map(item => item.id === photo.id
          ? { ...item, isLiked: updated.isLiked, likesCount: updated.likesCount }
          : item));
      }
    } catch (error) {
      showNotification(error.message || 'Could not update your like.', 'error');
    }
  };

  // ── Filter bookings by tab ──
  const tabs = ['All', 'Pending Verification', 'Quote Sent', 'Confirmed', 'Rescheduled', 'To Review'];

  const isEligibleToReview = (b) => {
    const s = String(b.status || '').toLowerCase();
    return (s === 'confirmed' || s === 'completed') && !b.hasReviewed;
  };

  const filteredBookings = activeTab === 'All'
    ? allBookings
    : activeTab === 'To Review'
      ? allBookings.filter(isEligibleToReview)
      : activeTab === 'Quote Sent'
        ? allBookings.filter(b => ['Quote Sent', 'Quote Accepted'].includes(b.status))
      : allBookings.filter(b => b.status === activeTab);

  // ── Reset to page 1 when tab changes ──
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSamplePayment = async () => {
    if (!samplePaymentBooking) return;
    setAcceptingQuoteId(samplePaymentBooking.id);
    try {
      const updated = await bookingService.payCustomQuoteSample(samplePaymentBooking.id, samplePaymentMethod);
      setAllBookings(prev => prev.map(item => item.id === samplePaymentBooking.id ? updated : item));
      setViewingBooking(updated);
      setSamplePaymentBooking(null);
      showNotification(`Sample ${samplePaymentMethod} payment recorded. No real money was charged.`, 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to record the sample payment.', 'error');
    } finally {
      setAcceptingQuoteId(null);
    }
  };


  // ── Pagination calculations ──
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // ── Save profile edits ──
  const handleSave = async (e) => {
    e.preventDefault();
    if (!(await confirm('Are you sure you want to save your profile changes?'))) return;
    if (!firstName.trim()) return;
    if (!/^[A-Za-z\s]+$/.test(firstName.trim())) return;
    if (lastName.trim() && !/^[A-Za-z\s]+$/.test(lastName.trim())) return;
    if (contactNumber.trim() && !/^\d{11}$/.test(contactNumber.trim())) return;
    setSaving(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      let savedProfilePicture = profilePicture;
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append('profilePicture', profilePictureFile);
        const pictureResult = await api('/auth/me/profile-picture', { method: 'POST', body: formData });
        savedProfilePicture = pictureResult.user.profilePicture;
        setProfilePicture(savedProfilePicture);
        setProfilePictureFile(null);
      }
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
          profilePicture: updated.profilePicture || savedProfilePicture,
        }));
      }
      updateUserSession({
        name: fullName,
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        profilePicture: savedProfilePicture,
      });
      setEditing(false);
    } catch (e) {
      console.error(e);
      showNotification(e.message || 'Could not save your profile changes.', 'error');
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
    setProfilePicture(accountRecord?.profilePicture || user?.profilePicture || '');
    setProfilePictureFile(null);
    setEditing(false);
  };

  // ── Counts for tab badges ──
  const countFor = (tab) => tab === 'All'
    ? allBookings.length
    : tab === 'To Review'
      ? allBookings.filter(isEligibleToReview).length
      : allBookings.filter(b => b.status === tab).length;

  return (
    <div className="bg-white min-h-screen pb-24 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-10 border-b border-slate-100 pb-8">
          <h1 className="text-2xl text-slate-400 tracking-widest uppercase mb-1">My Account</h1>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-100">
          <button type="button" onClick={() => setProfileView('overview')} className={`border-b-2 px-4 py-3 text-xs font-semibold transition ${profileView === 'overview' ? 'border-yellow-400 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            Account &amp; Trips
          </button>
          <button type="button" onClick={() => setProfileView('photos')} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${profileView === 'photos' ? 'border-yellow-400 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <Camera className="h-3.5 w-3.5" /> My Shared Photos <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] text-yellow-700">{myPhotos.length}</span>
          </button>
        </div>

        {profileView === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════════════════════════════════
              LEFT — Profile Card
          ════════════════════════════════ */}
          <div className="lg:col-span-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">

            <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-yellow-50 ring-2 ring-yellow-200 ring-offset-2">
                {(profilePicturePreview || profilePicture || user?.profilePicture) ? (
                  <img src={profilePicturePreview || profilePicture || user?.profilePicture} alt={user?.name || 'Profile'} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-9 w-9 text-yellow-600" />
                )}
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

                <div>
                  <label htmlFor="profile-picture-upload" className="mb-2 block text-xs text-slate-500">Profile photo</label>
                  <label htmlFor="profile-picture-upload" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-yellow-300 bg-yellow-50 px-4 py-3 text-xs font-medium text-yellow-800 transition hover:bg-yellow-100">
                    <Camera className="h-4 w-4" />
                    {profilePictureFile ? 'Choose a different photo' : 'Choose photo from device'}
                  </label>
                  <input id="profile-picture-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleProfilePictureChange} className="sr-only" />
                  <p className="mt-1.5 text-[10px] text-slate-400">JPEG, PNG, WebP, or GIF. Maximum 5 MB.</p>
                </div>

                {/* First & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="First Name"
                    value={firstName}
                    onChange={setFirstName}
                    sanitize={v => v.replace(/[^a-zA-Z\s]/g, '')}
                    capitalize
                    required
                  />
                  <FormField
                    label="Last Name"
                    value={lastName}
                    onChange={setLastName}
                    sanitize={v => v.replace(/[^a-zA-Z\s]/g, '')}
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
                  sanitize={v => v.replace(/\D/g, '').slice(0, 11)}
                  maxLength={11}
                  inputMode="numeric"
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
                          className="block p-4 rounded-lg border border-yellow-200/70 bg-yellow-50/50 hover:bg-yellow-50 hover:border-yellow-300 transition-all group shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  booking.type === 'Car Rental'
                                    ? 'bg-amber-100/80 text-amber-900 border border-amber-300/60'
                                    : 'bg-yellow-100 text-yellow-900 border border-yellow-300/60'
                                }`}>
                                  {booking.type === 'Car Rental' ? 'Car Rental' : 'Tour Package'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">#{booking.id}</span>
                              </div>
                              <p className="text-sm font-semibold text-slate-800 group-hover:text-yellow-800 truncate">
                                {booking.packageName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {booking.type === 'Car Rental' ? (
                                  <>Rental Date: {booking.tourDate} {booking.returnDate ? `— ${booking.returnDate}` : ''}</>
                                ) : (
                                  <>Trip Date: {booking.tourDate && new Date(booking.tourDate).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric'
                                  })}</>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/20 text-yellow-800 text-xs font-semibold group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors shrink-0">
                              <span>Write Review</span>
                              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
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
                                    {booking.customizedDetails && booking.status === 'Pending Verification'
                                      ? 'Pricing under review'
                                      : `₱${booking.totalPrice?.toLocaleString()}`}
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
                                {booking.status !== 'Completed' && String(booking.package_type || booking.packageType || '').toLowerCase() !== 'joiner' && (
                                  <Link
                                    to={`/reschedule/${booking.id}`}
                                    className="flex items-center justify-center gap-1.5 shrink-0 text-yellow-700 hover:text-yellow-800 text-xs px-3 py-1.5 rounded-lg border border-yellow-200 hover:bg-yellow-50 transition-all cursor-pointer"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Reschedule
                                  </Link>
                                )}
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
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-700"><Camera className="h-4 w-4 text-yellow-500" /> My Shared Photos</h2>
                <p className="mt-1 text-xs text-slate-400">Review, edit, or remove photos you posted to Explore Map.</p>
              </div>
              <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">{myPhotos.length} photo{myPhotos.length === 1 ? '' : 's'}</span>
            </div>
            <div className="p-5 sm:p-6">
              {loadingPhotos ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin text-yellow-500" />Loading your photos...</div>
              ) : myPhotos.length === 0 ? (
                <div className="py-16 text-center"><Camera className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="text-sm text-slate-500">You haven’t shared any photos yet.</p><p className="mt-1 text-xs text-slate-400">Your Explore Map posts will appear here.</p></div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {myPhotos.map(photo => (
                    <article key={photo.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md">
                      <img src={photo.imageUrl} alt={photo.caption || 'Your shared Explore Map photo'} className="aspect-[4/3] w-full object-cover" />
                      <div className="p-4">
                        {editingPhotoId === photo.id ? (
                          <div>
                            <textarea value={photoCaptionDraft} onChange={event => setPhotoCaptionDraft(event.target.value)} maxLength={500} rows={4} aria-label="Edit photo caption" className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm leading-5 text-slate-700 outline-none focus:border-yellow-400" />
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">{photoCaptionDraft.length}/500</span>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => setEditingPhotoId(null)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50"><X className="h-3.5 w-3.5" />Cancel</button>
                                <button type="button" onClick={() => handleSavePhotoCaption(photo)} disabled={savingCaptionId === photo.id || !photoCaptionDraft.trim()} className="inline-flex items-center gap-1 rounded-lg bg-yellow-400 px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-yellow-500 disabled:opacity-40">{savingCaptionId === photo.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Save</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex min-h-14 items-start justify-between gap-2">
                            <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-700">{photo.caption}</p>
                            <button type="button" onClick={() => { setEditingPhotoId(photo.id); setPhotoCaptionDraft(photo.caption || ''); }} aria-label="Edit photo caption" title="Edit caption" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-yellow-50 hover:text-yellow-700"><Pencil className="h-4 w-4" /></button>
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="text-xs text-slate-400">{photo.date ? new Date(photo.date).toLocaleDateString() : ''}</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => handleLikePhoto(photo)} aria-label={`${photo.isLiked ? 'Unlike' : 'Like'} photo, ${photo.likesCount || 0} likes`} title="Like photo" className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs transition hover:bg-rose-50 ${photo.isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}><Heart className={`h-4 w-4 ${photo.isLiked ? 'fill-current' : ''}`} />{photo.likesCount || 0}</button>
                            <button type="button" onClick={() => handleDeletePhoto(photo)} disabled={deletingPhotoId === photo.id} aria-label="Delete shared photo" title="Delete photo" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">{deletingPhotoId === photo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ════════════════════════════════
          BOOKING INVOICE MODAL
      ════════════════════════════════ */}


      {viewingBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={() => setViewingBooking(null)}
        >
          <div
            className="w-full max-w-sm space-y-4 rounded-md border border-[#e0dbd0] bg-white p-5 shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#eae5db] pb-3">
              <div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f8576]">
                  {viewingBooking.id}
                </span>
                <h3 className="mt-1 text-base font-bold tracking-[0.02em] text-[#1a1a1a]">Booking Invoice</h3>
              </div>
              <button
                onClick={() => setViewingBooking(null)}
                className="cursor-pointer rounded border border-[#e0dbd0] bg-white p-1.5 text-[#6b6255] transition-colors hover:bg-[#fcfbf9] hover:text-[#2d2a24]"
                title="Close invoice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Package */}
            <div className="rounded border border-[#e0dbd0] bg-[#fcfbf9] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6255]">Tour Package</p>
              <h4 className="mt-1 text-sm font-semibold leading-snug text-[#1a1a1a]">{viewingBooking.packageName}</h4>
            </div>

            {/* Status + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6255]">Status</p>
                <StatusBadge status={viewingBooking.status} />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6255]">Tour Date</p>
                <p className="text-xs font-semibold text-[#1a1a1a]">
                  {new Date(viewingBooking.tourDate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Guest info */}
            <div className="grid grid-cols-2 gap-3 border-y border-[#eae5db] py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6255]">Lead Guest</p>
                <p className="mt-1 text-xs font-semibold text-[#1a1a1a]">{viewingBooking.customerName}</p>
                <p className="text-[10px] text-[#8f8576]">{viewingBooking.customerPhone}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6255]">Guests</p>
                <p className="mt-1 text-xs font-semibold text-[#1a1a1a]">{viewingBooking.guestsCount} pax</p>
              </div>
            </div>

            {/* Payment or quote status */}
            {viewingBooking.customizedDetails ? (
              <div className="space-y-2 rounded border border-[#e0dbd0] bg-[#fcfbf9] p-3">
                <Row
                  label="Quote status"
                  value={!hasPricedCustomQuote(viewingBooking)
                    ? 'Pricing under review'
                    : viewingBooking.paymentStatus === 'Sample'
                      ? 'Sample payment recorded'
                      : viewingBooking.status === 'Quote Accepted'
                        ? 'Quote accepted, payment pending'
                        : 'Quote ready for acceptance'}
                />
                {hasPricedCustomQuote(viewingBooking) && (
                  <>
                    {viewingBooking.customizedDetails.quoteItinerary && (
                      <div className="border-t border-[#e0dbd0] pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b6255]">Proposed itinerary</p>
                        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-[#1a1a1a]">{viewingBooking.customizedDetails.quoteItinerary}</p>
                      </div>
                    )}
                    {Array.isArray(viewingBooking.customizedDetails.priceBreakdown) && viewingBooking.customizedDetails.priceBreakdown.length > 0 && (
                      <div className="space-y-1 border-t border-[#e0dbd0] pt-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#6b6255]">Price breakdown</p>
                        {viewingBooking.customizedDetails.priceBreakdown.map((line, index) => (
                          <div key={`${line.description}-${index}`} className="flex justify-between gap-3 text-xs text-[#4a453b]">
                            <span>{line.description}</span>
                            <span className="shrink-0">PHP {Number(line.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="my-2 flex items-center justify-between border-t border-[#e0dbd0] pt-2 text-xs font-semibold text-[#1a1a1a]">
                      <span>Final quote:</span>
                      <span className="text-sm text-[#2d2a24]">PHP {viewingBooking.totalPrice?.toLocaleString()}</span>
                    </div>
                    {viewingBooking.paymentStatus === 'Sample' && (
                      <div className="space-y-1 rounded border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                        <p className="font-bold">Sample payment recorded. No real money was charged.</p>
                        <Row label="Payment reference" value={viewingBooking.paymentTransactionReference || 'Unavailable'} />
                        {viewingBooking.paymentDate && <Row label="Recorded" value={new Date(viewingBooking.paymentDate).toLocaleString()} />}
                      </div>
                    )}
                    {!viewingBooking.paymentStatus && viewingBooking.status === 'Confirmed' && (
                      <p className="rounded border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                        This quote was accepted before sample checkout was available. No payment is recorded here.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2 rounded border border-[#e0dbd0] bg-[#fcfbf9] p-3">
                <Row label="Payment Mode" value={viewingBooking.paymentMethod} />
                {viewingBooking.gcashNumber && <Row label="GCash Mobile" value={viewingBooking.gcashNumber} />}
                {viewingBooking.paymentRef && (
                  <div className="flex items-center justify-between gap-3 text-xs text-[#6b6255]">
                    <span>Reference ID:</span>
                    <strong className="rounded border border-[#e0dbd0] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#2d2a24]">
                      {viewingBooking.paymentRef}
                    </strong>
                  </div>
                )}
                <div className="my-2 flex items-center justify-between border-t border-[#e0dbd0] pt-2 text-xs font-semibold text-[#1a1a1a]">
                  <span>Grand Total Paid:</span>
                  <span className="text-sm text-[#2d2a24]">₱{viewingBooking.totalPrice?.toLocaleString()}</span>
                </div>
              </div>
            )}

            {viewingBooking.customizedDetails && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setSamplePaymentMethod('GCash');
                    setSamplePaymentBooking(viewingBooking);
                  }}
                  disabled={!hasPricedCustomQuote(viewingBooking) || viewingBooking.paymentStatus === 'Sample' || acceptingQuoteId === viewingBooking.id}
                  className="w-full rounded bg-[#2d2a24] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {acceptingQuoteId === viewingBooking.id
                    ? 'Recording sample payment...'
                    : viewingBooking.paymentStatus === 'Sample'
                      ? 'Sample payment recorded'
                      : hasPricedCustomQuote(viewingBooking)
                        ? 'Accept & simulate sample payment'
                        : 'Waiting for admin quote'}
                </button>
                {hasPricedCustomQuote(viewingBooking) && viewingBooking.paymentStatus !== 'Sample' && (
                  <p className="text-center text-[10px] text-[#8f8576]">Demo only. No real payment will be charged.</p>
                )}
              </div>
            )}

            {/* Review Section */}
            {viewingBooking.hasReviewed && viewingBooking.review && (
              <div className="space-y-3 rounded border border-[#e0dbd0] bg-white p-3">
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 fill-[#c4b99a] text-[#c4b99a]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6255]">Your Review</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= viewingBooking.review.rating
                            ? 'fill-[#c4b99a] text-[#c4b99a]'
                            : 'fill-[#f5f2ee] text-[#d6cfc2]'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-xs font-semibold text-[#4a453b]">
                      {viewingBooking.review.rating}/5
                    </span>
                  </div>
                  {viewingBooking.review.comment && (
                    <p className="border-l-2 border-[#d6cfc2] pl-3 text-xs italic text-[#4a453b]">
                      "{viewingBooking.review.comment}"
                    </p>
                  )}
                  {viewingBooking.review.imageUrl && (
                    <img src={viewingBooking.review.imageUrl} alt="Your review" className="h-32 w-32 rounded object-cover" />
                  )}
                  <p className="text-[10px] text-[#8f8576]">
                    Reviewed on {new Date(viewingBooking.review.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setViewingBooking(null)}
              className="w-full cursor-pointer rounded border border-[#e0dbd0] bg-white py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4a453b] transition-colors hover:bg-[#fcfbf9]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {samplePaymentBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="sample-payment-title">
          <div className="w-full max-w-sm space-y-5 rounded-md border border-[#e0dbd0] bg-white p-5 shadow-xl">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8f8576]">Payment</p>
              <h3 id="sample-payment-title" className="mt-1 text-lg font-bold text-[#1a1a1a]">Complete Payment</h3>
            </div>
            <div className="space-y-3">
              {['GCash', 'Credit Card'].map((method) => (
                <label key={method} className={`flex cursor-pointer items-center gap-3 rounded border p-3 text-sm ${samplePaymentMethod === method ? 'border-[#2d2a24] bg-[#fcfbf9]' : 'border-[#e0dbd0]'}`}>
                  <input type="radio" name="sample-payment-method" value={method} checked={samplePaymentMethod === method} onChange={() => setSamplePaymentMethod(method)} />
                  <span className="font-semibold text-[#1a1a1a]">{method === 'Credit Card' ? 'Credit / Debit Card' : method}</span>
                </label>
              ))}
              <div className="space-y-2 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                <p>{samplePaymentMethod} is selected. This demo does not connect to {samplePaymentMethod} or process a real transaction.</p>
                <p className="flex justify-between border-t border-amber-200 pt-2 font-bold">
                  <span>Quote total</span>
                  <span>PHP {Number(samplePaymentBooking.totalPrice || 0).toLocaleString()}</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-[#6b6255]">Continue to record a sample receipt and confirm this customized trip. No card or GCash account details are requested.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSamplePaymentBooking(null)} disabled={acceptingQuoteId === samplePaymentBooking.id} className="flex-1 rounded border border-[#e0dbd0] px-3 py-2.5 text-xs font-semibold text-[#4a453b] disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleSamplePayment} disabled={acceptingQuoteId === samplePaymentBooking.id} className="flex-1 rounded bg-[#2d2a24] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
                {acceptingQuoteId === samplePaymentBooking.id ? 'Processing...' : `Pay PHP ${Number(samplePaymentBooking.totalPrice || 0).toLocaleString()} (Demo)`}
              </button>
            </div>
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

const FormField = ({ label, value, onChange, type = 'text', placeholder = '', required = false, capitalize = false, sanitize, maxLength, inputMode }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-600 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(sanitize ? sanitize(e.target.value) : e.target.value)}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      inputMode={inputMode}
      className={`w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all ${capitalize ? 'capitalize' : ''}`}
    />
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 text-xs text-[#6b6255]">
    <span>{label}:</span>
    <strong className="text-right font-semibold text-[#1a1a1a]">{value}</strong>
  </div>
);

export default Profile;
