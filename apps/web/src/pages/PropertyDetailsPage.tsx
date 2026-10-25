import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Mail,
  Lock,
  Calculator,
  Compass,
  ArrowRight,
  Maximize2,
  Share2,
  Heart,
  Bot,
  Send,
  UserCheck,
} from 'lucide-react';
import { apiFetch } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { formatIndianCurrency } from '../components/property/PropertyCard.js';
import { calculateLoan, calculateStampDutyAndTaxes } from '@bhoomi/finance';

export function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, openAuthModal } = useAuth();

  // Inquiry form states
  const [inquiryName, setInquiryName] = useState(user?.name || '');
  const [inquiryPhone, setInquiryPhone] = useState(user?.mobile || '');
  const [inquiryEmail, setInquiryEmail] = useState(user?.email || '');
  const [inquiryMessage, setInquiryMessage] = useState('I would like to schedule a site visit and discuss terms.');
  const [inquiryConsent, setInquiryConsent] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  // Gallery active index
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  // Fetch full property details
  const { data, isLoading, error } = useQuery({
    queryKey: ['property', id, user?.id],
    queryFn: () => apiFetch<{ property: any; isGuest: boolean }>(`/properties/${id}`),
    enabled: !!id,
  });

  const property = data?.property;
  const isGuest = data?.isGuest ?? true;

  // Compute live loan metrics and statutory taxes for this specific listing
  const loanEstimate = property
    ? calculateLoan({
        propertyPrice: property.priceTotal,
        downPaymentPercent: 20,
        annualInterestRate: 8.5,
        tenureYears: 20,
      })
    : null;

  const taxEstimate = property
    ? calculateStampDutyAndTaxes(property.priceTotal, {
        isMunicipalCorporation: property.city?.toLowerCase() === 'nagpur',
      })
    : null;

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryConsent) {
      setInquiryError('You must provide consent under DPDP Act to submit your inquiry.');
      return;
    }

    setInquiryError(null);
    setInquirySubmitting(true);

    try {
      await apiFetch('/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: id,
          name: inquiryName,
          mobile: inquiryPhone,
          email: inquiryEmail,
          message: inquiryMessage,
          consentToDpdp: true,
        }),
      });

      setInquirySuccess(true);
    } catch (err: any) {
      setInquiryError(err.message || 'Failed to submit callback request.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Property Not Found</h2>
        <p className="text-sm text-slate-500">The listing may have been sold or removed by the seller.</p>
        <Link to="/search" className="inline-block px-5 py-2.5 rounded-xl bg-brand-700 text-white font-bold text-xs">
          Return to Properties
        </Link>
      </div>
    );
  }

  const mediaList = property.media || [];
  const currentMedia = mediaList[activeMediaIdx] || {
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link to={`/search?city=${property.city}`} className="hover:underline">{property.city}</Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">{property.locality}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-serif text-slate-900 dark:text-white leading-tight">
            {property.title}
          </h1>

          <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span>{property.address}</span>
          </div>
        </div>

        {/* Price & Action Badge */}
        <div className="md:text-right">
          <div className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900 dark:text-white">
            {formatIndianCurrency(property.priceTotal)}
            {property.listingType === 'RENT' && <span className="text-sm font-normal text-slate-500"> / mo</span>}
          </div>
          {property.pricePerSqFt > 0 && property.listingType === 'SALE' && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ₹{property.pricePerSqFt.toLocaleString('en-IN')} per sq.ft.
            </div>
          )}
        </div>
      </div>

      {/* MEDIA GALLERY */}
      <div className="space-y-3">
        {/* Main Display Image */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
          <img
            src={currentMedia.url}
            alt={property.title}
            className={`w-full h-full object-cover ${currentMedia.isMasked ? 'blur-md' : ''}`}
          />

          {/* Gated locked media warning for guests */}
          {currentMedia.isMasked && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 text-white space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="font-bold text-lg">Exclusive Photos Gated</h4>
              <p className="text-xs text-slate-300 max-w-md">
                The seller has set privacy protection on these interior photos. Log in with your mobile OTP to view all photos.
              </p>
              <button
                onClick={openAuthModal}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-xs shadow-lg"
              >
                Login as Buyer to Unlock
              </button>
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-brand-800 text-white shadow">
              {property.listingType === 'SALE' ? 'Outright Sale' : 'Rental'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-white shadow">
              {property.ownerRole === 'SELLER' && 'Direct Owner Listing'}
              {property.ownerRole === 'BROKER' && 'Verified RERA Broker'}
              {property.ownerRole === 'BUILDER' && 'Registered Builder'}
            </span>
          </div>
        </div>

        {/* Thumbnails row */}
        {mediaList.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto pb-2">
            {mediaList.map((m: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveMediaIdx(idx)}
                className={`relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${
                  activeMediaIdx === idx ? 'border-brand-600 ring-2 ring-brand-500/30' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={m.url} alt="" className="w-full h-full object-cover" />
                {m.isMasked && (
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MAIN CONTENT GRID (Specs + Inquiry Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Cols: Details, Specs, Taxes, Map */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Specifications Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Property Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block mb-1">Configuration</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {property.bhk ? `${property.bhk} BHK` : 'Plot Layout'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block mb-1">Total Area</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {property.areaSqFt.toLocaleString('en-IN')} sq.ft.
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({property.areaOriginal} {property.areaUnit})
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block mb-1">Furnishing</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {property.furnishing.replace('_', ' ')}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block mb-1">Availability</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {property.availability.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              About This Property
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities Checklist */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                Amenities & Infrastructure
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maharashtra Stamp Duty & Acquisition Breakdown */}
          {taxEstimate && property.listingType === 'SALE' && (
            <div className="p-6 rounded-3xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-brand-700 dark:text-brand-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Estimated Government Fees & Stamp Duty
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-200 dark:bg-brand-900 text-brand-800 dark:text-brand-300">
                  Maharashtra Jurisdiction
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Stamp Duty ({taxEstimate.stampDutyPercent}%)</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    ₹{taxEstimate.stampDutyAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Registration Fee (Cap ₹30k)</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    ₹{taxEstimate.registrationAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Total Est. Acquisition</span>
                  <span className="font-mono font-bold text-sm text-brand-700 dark:text-brand-400">
                    ₹{taxEstimate.totalAcquisitionCost.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                {taxEstimate.disclaimer}
              </p>
            </div>
          )}

          {/* Interactive EMI Preview for this property */}
          {loanEstimate && property.listingType === 'SALE' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase text-brand-700 dark:text-brand-400">
                  Estimated Monthly EMI
                </span>
                <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                  ₹{loanEstimate.monthlyEmi.toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-slate-500"> / month</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Based on 20% down payment (₹{(loanEstimate.downPaymentAmount / 100000).toFixed(1)} Lakhs) at 8.5% for 20 years.
                </p>
              </div>

              <Link
                to={`/finance?price=${property.priceTotal}`}
                className="px-5 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs flex items-center gap-2 whitespace-nowrap shadow-md transition"
              >
                <span>Customize EMI & Compare Banks</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Map Pin Coordinates Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Location Coordinates
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Latitude: {property.latitude.toFixed(4)}, Longitude: {property.longitude.toFixed(4)} ({property.locality}, {property.city})
            </p>
            <div className="aspect-[21/9] rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
              <div className="text-center space-y-1">
                <MapPin className="w-8 h-8 text-rose-500 mx-auto animate-bounce" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {property.locality}, {property.city}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Contact Gating & Callback Form */}
        <div className="space-y-6">
          {/* Listed By / Contact Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 flex items-center justify-center font-bold text-base">
                {property.owner?.name?.[0] || 'U'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {property.owner?.name || 'Listing Representative'}
                </h4>
                <span className="text-xs font-semibold text-brand-700 dark:text-brand-400">
                  {property.ownerRole}
                </span>
              </div>
            </div>

            {/* Gated Phone Number */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Direct Contact Number
              </span>

              {isGuest && property.isPhoneGated ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-2">
                  <Lock className="w-5 h-5 text-amber-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Contact Details Gated
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Direct phone numbers are reserved for registered buyers to protect owner privacy.
                  </p>
                  <button
                    onClick={openAuthModal}
                    className="w-full py-2 px-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md transition"
                  >
                    Login to View Phone
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brand-700 dark:text-brand-400" />
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {property.contactPhone}
                    </span>
                  </div>
                  <a
                    href={`tel:${property.contactPhone}`}
                    className="px-3 py-1.5 rounded-xl bg-brand-700 text-white font-semibold text-xs shadow hover:bg-brand-800 transition"
                  >
                    Call Now
                  </a>
                </div>
              )}
            </div>

            {/* Request Callback / Inquiry Form */}
            <div className="pt-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                Request a Callback or Site Visit
              </h4>

              {inquirySuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <h5 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                    Request Dispatched!
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    The listing representative has received your inquiry and will contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-3 text-xs">
                  {inquiryError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-[11px]">
                      {inquiryError}
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="e.g. Anand Joshi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="+91 98220 12345"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Message / Questions</label>
                    <textarea
                      rows={3}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Consent Checkbox */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inquiryConsent}
                        onChange={(e) => setInquiryConsent(e.target.checked)}
                        className="mt-0.5 text-brand-600 rounded"
                        required
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        I authorize Bhoomi and the listing representative to contact me regarding this property (DPDP Act compliant).
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {inquirySubmitting ? 'Dispatching...' : 'Request Callback'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
