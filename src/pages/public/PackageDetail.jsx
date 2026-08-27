import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { packageService } from '../services/packageService';
import { bookingService } from '../services/bookingService';
=======
import { packageService } from '../../services/packageService';
import { bookingService } from '../../services/bookingService';
import { api } from '../../services/api';
<<<<<<< HEAD
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a
=======
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import WeatherWidget from '../../components/feedback/WeatherWidget';
import { Compass, MapPin, Star, Calendar, Clock, Award, ShieldCheck, ArrowLeft, CheckCircle2, User, Mail, Phone, Users } from 'lucide-react';

const PackageDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [tourDate, setTourDate] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Payment Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      const data = await packageService.getById(id);
      setPkg(data);
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
      }
      setLoading(false);

      // Load reviews for this package
      loadReviewsForPackage(id);
    };
    loadDetails();
  }, [id, user]);

  const loadReviewsForPackage = async (packageId) => {
    setLoadingReviews(true);
    try {
      // Fetch all reviews
      const allReviewsData = await api('/reviews').catch(() => []);

      // Fetch all bookings to match reviews with booking info
      const allBookings = await bookingService.getAll();

      // Filter reviews for this specific package
      const packageReviews = [];
      for (const review of allReviewsData) {
        // Find the booking for this review
        const booking = allBookings.find(b => b.id === String(review.booking_id));

        // Check if this review belongs to our package
        if (booking && booking.packageId === String(packageId)) {
          packageReviews.push({
            rating: review.rating,
            comment: review.comment,
            createdAt: review.created_at,
            customerName: booking.customerName || 'Anonymous',
            bookingId: booking.id
          });
        }
      }

      // Sort by most recent first
      packageReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(packageReviews);
      console.log(`[PackageDetail] Loaded ${packageReviews.length} reviews for package ${packageId}`);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const parseItinerary = (data) => {
    if (!data) return [];
    if (typeof data === 'string') {
      return data.split('\n').filter(line => line.trim()).map(line => typeof line === 'string' ? line : String(line));
    }
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item.title) return item.title;
        if (typeof item === 'object' && item.desc) return item.desc;
        return String(item);
      });
    }
    return [];
  };

  const parseInclusions = (data) => {
    if (!data) return [];
    if (typeof data === 'string') {
      return data.split('\n').filter(line => line.trim()).map(line => typeof line === 'string' ? line : String(line));
    }
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'string') return item;
        return String(item);
      });
    }
    return [];
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBookClick = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/packages/${id}` } } });
    } else {
      setShowForm(true);
    }
  };

  const totalPrice = pkg ? pkg.price * guestsCount : 0;

  const handleOpenPayment = (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !tourDate || !guestsCount) {
      showNotification('Please fill in all booking fields.', 'warning');
      return;
    }
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (referenceNumber) => {
    setPaymentModalOpen(false);
    setSubmitting(true);

    try {
      const bookingData = {
        packageId: pkg.id,
        packageName: pkg.title,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        tourDate,
        guestsCount: Number(guestsCount),
        totalPrice,
        paymentMethod: 'GCash',
        paymentRef: referenceNumber,
        gcashNumber: 'N/A'
      };

      await bookingService.create(bookingData);
      showNotification('Booking successfully submitted! A confirmation email has been dispatched.', 'success');
      navigate('/');
    } catch (error) {
      showNotification('Failed to save booking. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Shared style constants
  const colors = {
    bg: '#ffffff',
    textPrimary: '#1a1a1a',
    textSecondary: '#45403a',
    textMuted: '#4a453b',
    border: '#e0dbd0',
    borderLight: '#eae5db',
    accent: '#6b6255',
    accentDark: '#2d2a24',
    cardBg: '#ffffff',
    subtleBg: 'rgba(244, 241, 235, 0.4)',
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: colors.bg }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 animate-spin"
            style={{
              border: `1.5px solid ${colors.borderLight}`,
              borderTop: `1.5px solid ${colors.accentDark}`,
              borderRadius: '50%',
            }}
          />
          <p
            className="text-[13px] font-medium"
            style={{ color: colors.textMuted, letterSpacing: '0.06em' }}
          >
            Loading package details...
          </p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5 min-h-screen" style={{ background: colors.bg }}>
        <h2
          className="text-xl font-medium"
          style={{
            color: colors.textPrimary,
            fontFamily: "'Outfit', Georgia, serif",
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Package Not Found
        </h2>
        <p className="text-[13px]" style={{ color: colors.textMuted }}>
          We couldn't retrieve details for this specific package.
        </p>
        <Link
          to="/packages"
          className="inline-block px-6 py-2.5 text-[11px] font-semibold transition-all duration-300"
          style={{
            border: `1px solid ${colors.accentDark}`,
            borderRadius: '2px',
            color: colors.accentDark,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: 'transparent',
          }}
        >
          Back to Tour Packages
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: colors.bg, fontFamily: "'Inter', 'Georgia', serif" }}>
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2.5 text-[11px] font-medium transition-colors duration-300"
          style={{
            color: colors.textMuted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = colors.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
        >
          <ArrowLeft className="w-5.5 h-5.5" /> Back to Tour Packages
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Left Column (Content) */}
          <div className="lg:col-span-7 space-y-12">

            {/* Package Image */}
            <div
              className="w-full h-[340px] relative overflow-hidden"
              style={{ borderRadius: '4px' }}
            >
              <img
                src={pkg.image || '/CAGSAWA.jpg'}
                alt={pkg.title}
                className="min-h-full min-w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/CAGSAWA.jpg';
                }}
              />
              {/* Subtle gradient overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.06), transparent)' }}
              />
            </div>

            {/* Tabs Navigation - Minimalist */}
            <div
              className="flex gap-12 pb-6"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              {[
                { id: 'overview', label: 'Overview', active: true },
                { id: 'itinerary', label: 'Itinerary', active: false },
                { id: 'inclusions', label: 'Inclusions', active: false },
                { id: 'reviews', label: 'Reviews', active: false },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className="text-[11px] font-semibold transition-colors duration-300"
                  style={{
                    color: tab.active ? colors.textPrimary : colors.textMuted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    borderBottom: tab.active ? `1.5px solid ${colors.textPrimary}` : '1.5px solid transparent',
                    paddingBottom: '24px',
                    marginBottom: '-24px',
                  }}
                  onMouseEnter={(e) => {
                    if (!tab.active) e.target.style.color = colors.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    if (!tab.active) e.target.style.color = colors.textMuted;
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Section */}
            <div id="overview" className="space-y-10 scroll-mt-6">
              <p
                className="text-[14px] leading-[1.85]"
                style={{ color: colors.textSecondary }}
              >
                {pkg.description}
              </p>

              {/* Key Details - Clean Grid */}
              <div
                className="grid grid-cols-2 gap-0"
                style={{ border: `1px solid ${colors.borderLight}`, borderRadius: '4px' }}
              >
                {[
                  { label: 'Duration', value: pkg.duration },
                  { label: 'Group Size', value: `Up to ${pkg.maximumCapacity}` },
                  { label: 'Destination', value: pkg.destination },
                  { label: 'Meeting Point', value: pkg.meetingLocation || 'TBA' },
                ].map((detail, idx) => (
                  <div
                    key={detail.label}
                    className="px-5 py-4"
                    style={{
                      borderRight: idx % 2 === 0 ? `1px solid ${colors.borderLight}` : 'none',
                      borderBottom: idx < 2 ? `1px solid ${colors.borderLight}` : 'none',
                    }}
                  >
                    <p
                      className="text-[10px] font-medium mb-2"
                      style={{
                        color: colors.textMuted,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {detail.label}
                    </p>
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: colors.textPrimary }}
                    >
                      {detail.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary Section */}
            <div
              id="itinerary"
              className="space-y-6 scroll-mt-6 pt-12"
              style={{ borderTop: `1px solid ${colors.borderLight}` }}
            >
              <h2
                className="text-[13px] font-semibold"
                style={{
                  color: colors.textPrimary,
                  fontFamily: "'Outfit', Georgia, serif",
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Tour Itinerary
              </h2>

              <div className="space-y-0 mt-6">
                {parseItinerary(pkg.itinerary).map((line, index) => (
                  <div key={index} className="relative pl-10 pb-6 last:pb-0">
                    {/* Vertical line connecting steps */}
                    {index < parseItinerary(pkg.itinerary).length - 1 && (
                      <div
                        className="absolute left-[13px] top-[28px] bottom-0 w-px"
                        style={{ background: colors.border }}
                      />
                    )}
                    {/* Number marker — minimal square */}
                    <div
                      className="absolute left-0 top-0.5 flex h-[26px] w-[26px] items-center justify-center text-[10px] font-semibold"
                      style={{
                        background: colors.accentDark,
                        color: '#f7f4ef',
                        borderRadius: '2px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="pt-1">
                      <p
                        className="text-[13px] leading-relaxed"
                        style={{ color: colors.textSecondary }}
                      >
                        {line}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions Section */}
            <div
              id="inclusions"
              className="space-y-8 scroll-mt-6 pt-12"
              style={{ borderTop: `1px solid ${colors.borderLight}` }}
            >
              <h2
                className="text-[13px] font-semibold"
                style={{
                  color: colors.textPrimary,
                  fontFamily: "'Outfit', Georgia, serif",
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                What's Included
              </h2>

              <div className="space-y-3">
                {parseInclusions(pkg.inclusions).map((inclusion, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className="mt-[7px] flex-shrink-0"
                      style={{
                        width: '6px',
                        height: '1px',
                        background: colors.accent,
                      }}
                    />
                    <p
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      {inclusion}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div
              className="space-y-6 pt-12"
              style={{ borderTop: `1px solid ${colors.borderLight}` }}
            >
              <h2
                className="text-[13px] font-semibold"
                style={{
                  color: colors.textPrimary,
                  fontFamily: "'Outfit', Georgia, serif",
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Terms & Conditions
              </h2>
              <div className="space-y-5">
                <div>
                  <p
                    className="text-[12px] font-semibold mb-2"
                    style={{ color: colors.textPrimary, letterSpacing: '0.04em' }}
                  >
                    Confirmation
                  </p>
                  <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
                    You'll receive confirmation within minutes. If you don't see confirmation, contact our customer support.
                  </p>
                </div>
                <div>
                  <p
                    className="text-[12px] font-semibold mb-2"
                    style={{ color: colors.textPrimary, letterSpacing: '0.04em' }}
                  >
                    Cancellation & Rescheduling
                  </p>
                  <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
                    No cancellation policy - only rescheduling is allowed based on availability.
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div
              id="reviews"
              className="space-y-8 scroll-mt-6 pt-12"
              style={{ borderTop: `1px solid ${colors.borderLight}` }}
            >
              <div className="flex items-center justify-between">
                <h2
                  className="text-[13px] font-semibold"
                  style={{
                    color: colors.textPrimary,
                    fontFamily: "'Outfit', Georgia, serif",
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  Customer Reviews
                </h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5" style={{ fill: '#c4b99a', color: '#c4b99a' }} />
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: colors.textPrimary }}
                    >
                      {(reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)}
                    </span>
                    <span className="text-[11px]" style={{ color: colors.textMuted }}>
                      ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>

              {loadingReviews ? (
                <div className="flex items-center justify-center py-8">
                  <div
                    className="h-7 w-7 animate-spin"
                    style={{
                      border: `1.5px solid ${colors.borderLight}`,
                      borderTop: `1.5px solid ${colors.accentDark}`,
                      borderRadius: '50%',
                    }}
                  />
                </div>
              ) : reviews.length === 0 ? (
                <div
                  className="text-center py-14"
                  style={{
                    background: colors.subtleBg,
                    border: `1px solid ${colors.borderLight}`,
                    borderRadius: '4px',
                  }}
                >
                  <Star className="w-6 h-6 mx-auto mb-3" style={{ color: colors.border }} />
                  <p className="text-[12px]" style={{ color: colors.textMuted }}>
                    No reviews yet. Be the first to share your experience!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review, idx) => (
                    <div
                      key={idx}
                      className="p-5 transition-all duration-300"
                      style={{
                        border: `1px solid ${colors.borderLight}`,
                        borderRadius: '4px',
                        background: colors.cardBg,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.borderLight;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p
                            className="text-[13px] font-medium"
                            style={{ color: colors.textPrimary }}
                          >
                            {review.customerName || 'Anonymous'}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className="w-3.5 h-3.5"
                              style={{
                                fill: star <= (review.rating || 0) ? '#c4b99a' : colors.borderLight,
                                color: star <= (review.rating || 0) ? '#c4b99a' : colors.borderLight,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p
                          className="text-[13px] leading-relaxed"
                          style={{ color: colors.textSecondary }}
                        >
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (Sidebar) - Sticky & Compact */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 space-y-5">

              {/* Booking Card */}
              <div
                className="max-w-sm p-6"
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.cardBg,
                }}
              >
                <div className="space-y-4">
                  <div>
                    <p
                      className="text-[10px] font-medium mb-2"
                      style={{
                        color: colors.textMuted,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {pkg.destination || 'Tour Package'}
                    </p>
                    <h1
                      className="text-xl font-medium leading-tight"
                      style={{
                        color: colors.textPrimary,
                        fontFamily: "'Outfit', Georgia, serif",
                        letterSpacing: '0.02em',
                      }}
                    >
                      {pkg.title}
                    </h1>
                  </div>

                  <div>
                    <p
                      className="text-2xl font-semibold"
                      style={{
                        color: colors.textPrimary,
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      ₱{pkg.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[12px]" style={{ color: colors.textSecondary }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                    <span>{pkg.duration || 'Duration TBA'}</span>
                  </div>

                  <div
                    className="grid gap-2.5 pt-4 text-[12px]"
                    style={{
                      borderTop: `1px solid ${colors.borderLight}`,
                      color: colors.textSecondary,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                      <span>Max {pkg.maximumCapacity || 1} guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                      <span>{pkg.destination || 'Destination TBA'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/booking/${pkg.id}`)}
                    className="mt-4 w-full px-4 py-3 text-[11px] font-semibold transition-all duration-300"
                    style={{
                      background: colors.accentDark,
                      color: '#f7f4ef',
                      borderRadius: '2px',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#1a1715';
                      e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = colors.accentDark;
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    Book This Package
                  </button>
                </div>

                <div
                  className="mt-6 space-y-4 pt-5"
                  style={{ borderTop: `1px solid ${colors.borderLight}` }}
                >
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-3.5 h-3.5 mt-0.5" style={{ color: colors.accent }} />
                    <div>
                      <p
                        className="text-[12px] font-semibold"
                        style={{ color: colors.textPrimary, letterSpacing: '0.02em' }}
                      >
                        Secure Payment
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                        GCash payment with confirmation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5" style={{ color: colors.accent }} />
                    <div>
                      <p
                        className="text-[12px] font-semibold"
                        style={{ color: colors.textPrimary, letterSpacing: '0.02em' }}
                      >
                        Flexible Rescheduling
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                        Change your date if needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Meeting Info */}
              <div
                className="max-w-sm p-5"
                style={{
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: '4px',
                  background: colors.cardBg,
                }}
              >
                <p
                  className="text-[10px] font-medium mb-2"
                  style={{
                    color: colors.textMuted,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                  }}
                >
                  Meeting Point
                </p>
                <p
                  className="text-[14px] font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {pkg.meetingLocation || 'TBA'}
                </p>
                <p className="mt-2 text-[11px]" style={{ color: colors.textMuted }}>
                  Please arrive 15 minutes before departure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PackageDetail;
