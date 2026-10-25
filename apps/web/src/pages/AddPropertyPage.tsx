import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Camera,
  Lock,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { apiFetch } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { convertToSqFt } from '@bhoomi/finance';

export function AddPropertyPage() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<'PLOT' | 'FLAT' | 'BUNGALOW' | 'VILLA'>('FLAT');
  const [listingType, setListingType] = useState<'SALE' | 'RENT'>('SALE');
  const [bhk, setBhk] = useState<string>('2');
  const [areaOriginal, setAreaOriginal] = useState<number>(1200);
  const [areaUnit, setAreaUnit] = useState<'SQFT' | 'GUNTHA' | 'ACRE' | 'SQM'>('SQFT');
  const [priceTotal, setPriceTotal] = useState<number>(6000000);
  const [city, setCity] = useState<'Nagpur' | 'Wardha'>('Nagpur');
  const [locality, setLocality] = useState('Ramdaspeth');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(21.1458);
  const [longitude, setLongitude] = useState(79.0882);
  const [contactPhone, setContactPhone] = useState(user?.mobile || '+919822011111');
  const [hidePhoneUntilLogin, setHidePhoneUntilLogin] = useState(true);
  const [hideSelectedImagesUntilLogin, setHideSelectedImagesUntilLogin] = useState(false);
  const [availability, setAvailability] = useState<'IMMEDIATE' | 'WITHIN_30_DAYS' | 'UNDER_CONSTRUCTION'>('IMMEDIATE');
  const [furnishing, setFurnishing] = useState<'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED'>('UNFURNISHED');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');

  // Media items
  const [mediaList, setMediaList] = useState<Array<{ url: string; isLocked: boolean }>>([
    { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80', isLocked: false },
    { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80', isLocked: false },
    { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80', isLocked: true },
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Amenities checklist
  const [amenities, setAmenities] = useState<string[]>([
    '24/7 Security',
    'Covered Parking',
    'Power Backup',
    'Water Connection',
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculated fields
  let computedAreaSqFt = areaOriginal;
  if (areaUnit === 'GUNTHA') computedAreaSqFt = Math.round(areaOriginal * 1089);
  else if (areaUnit === 'ACRE') computedAreaSqFt = Math.round(areaOriginal * 43560);
  else if (areaUnit === 'SQM') computedAreaSqFt = Math.round(areaOriginal * 10.7639);

  const computedPricePerSqFt = computedAreaSqFt > 0 ? Math.round(priceTotal / computedAreaSqFt) : 0;

  const toggleAmenity = (name: string) => {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleAddMedia = () => {
    if (!newImageUrl.trim()) return;
    setMediaList((prev) => [...prev, { url: newImageUrl.trim(), isLocked: false }]);
    setNewImageUrl('');
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleLock = (index: number) => {
    setMediaList((prev) =>
      prev.map((m, i) => (i === index ? { ...m, isLocked: !m.isLocked } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    if (!['SELLER', 'BROKER', 'BUILDER', 'ADMIN'].includes(user.role)) {
      setError('Your current account role does not permit posting listings. Please switch to Seller mode.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch<{ property: any }>('/properties', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          propertyType,
          listingType,
          bhk: propertyType === 'PLOT' ? null : parseFloat(bhk),
          areaOriginal: Number(areaOriginal),
          areaUnit,
          priceTotal: Number(priceTotal),
          city,
          locality,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          status,
          availability,
          furnishing,
          contactPhone,
          hidePhoneUntilLogin,
          hideSelectedImagesUntilLogin,
          amenities,
          media: mediaList.map((m, i) => ({
            url: m.url,
            mediaType: 'IMAGE',
            isLocked: m.isLocked,
            displayOrder: i,
          })),
        }),
      });

      navigate(`/property/${res.property.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to publish listing.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Authentication Required</h2>
        <p className="text-sm text-slate-500">Please sign in as a Seller, Broker, or Builder to list your property on Bhoomi.</p>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 rounded-xl bg-brand-700 text-white font-bold text-xs"
        >
          Login / Register
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold font-serif text-slate-900 dark:text-white">
          List a New Property on Bhoomi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Reach thousands of genuine home buyers across Nagpur, Wardha, and Vidarbha.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: BASIC INFORMATION */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            1. Property Type & Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Property Category
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              >
                <option value="FLAT">Flat / Apartment</option>
                <option value="PLOT">Plot / Land Layout</option>
                <option value="BUNGALOW">Bungalow / Row House</option>
                <option value="VILLA">Luxury Villa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Transaction Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setListingType('SALE')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition border ${
                    listingType === 'SALE'
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-700'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Outright Sale
                </button>
                <button
                  type="button"
                  onClick={() => setListingType('RENT')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition border ${
                    listingType === 'RENT'
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-700'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Rent / Lease
                </button>
              </div>
            </div>

            {propertyType !== 'PLOT' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  BHK Configuration
                </label>
                <select
                  value={bhk}
                  onChange={(e) => setBhk(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
                >
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="3.5">3.5 BHK</option>
                  <option value="4">4+ BHK</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Furnishing
              </label>
              <select
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              >
                <option value="UNFURNISHED">Unfurnished</option>
                <option value="SEMI_FURNISHED">Semi-Furnished</option>
                <option value="FULLY_FURNISHED">Fully-Furnished</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Listing Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spacious 3 BHK Lake View Residence in Ramdaspeth"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Detailed Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Highlight legal title, RERA/NMRDA sanctions, facing, nearby schools, hospital, metro access, etc."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
        </div>

        {/* SECTION 2: AREA UNIT AUTO-CONVERTER & PRICING */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            2. Area & Pricing (Auto-Converted)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Area Measurement
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={areaOriginal}
                  onChange={(e) => setAreaOriginal(Number(e.target.value))}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
                  required
                />
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value as any)}
                  className="w-32 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-brand-500"
                >
                  <option value="SQFT">Sq. Feet</option>
                  <option value="GUNTHA">Guntha (1,089 sq.ft)</option>
                  <option value="ACRE">Acre (43,560 sq.ft)</option>
                  <option value="SQM">Sq. Meter</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Total Price (₹)
              </label>
              <input
                type="number"
                value={priceTotal}
                onChange={(e) => setPriceTotal(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          {/* Auto Calculation Preview Pill */}
          <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="text-xs text-brand-700 dark:text-brand-300 block">Normalized Area:</span>
              <span className="font-extrabold text-base text-slate-900 dark:text-white font-mono">
                {computedAreaSqFt.toLocaleString('en-IN')} sq.ft.
              </span>
            </div>
            <div>
              <span className="text-xs text-brand-700 dark:text-brand-300 block">Calculated Price / Sq.Ft.:</span>
              <span className="font-extrabold text-base text-slate-900 dark:text-white font-mono">
                ₹{computedPricePerSqFt.toLocaleString('en-IN')} / sq.ft.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: LOCATION & GPS MAP PIN */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            3. Location & GPS Map Pin
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              >
                <option value="Nagpur">Nagpur</option>
                <option value="Wardha">Wardha</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Locality / Area Name
              </label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Besa Road, Sevagram..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Full Physical Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Plot No. 12, Near Metro Station, Central Bazar Road, Nagpur 440010"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                GPS Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                GPS Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: MEDIA GALLERY & PRIVACY GATING */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            4. Photos & Privacy Controls
          </h2>

          {/* Add Image by URL */}
          <div className="flex gap-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Paste public image link (Unsplash / Cloudinary / S3 URL)..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={handleAddMedia}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs"
            >
              Add Photo
            </button>
          </div>

          {/* Media Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mediaList.map((m, idx) => (
              <div key={idx} className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                <img src={m.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleLock(idx)}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                      m.isLocked ? 'bg-amber-500 text-white' : 'bg-white text-slate-900'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{m.isLocked ? 'Locked' : 'Public'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy Toggles */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hidePhoneUntilLogin}
                onChange={(e) => setHidePhoneUntilLogin(e.target.checked)}
                className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Hide direct phone number until buyer logs in
                </span>
                <span className="text-slate-500 block">
                  Prevents unsolicited telemarketing; only authenticated buyers can see and call your phone.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hideSelectedImagesUntilLogin}
                onChange={(e) => setHideSelectedImagesUntilLogin(e.target.checked)}
                className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Hide exclusive interior photos for guest visitors
                </span>
                <span className="text-slate-500 block">
                  Photos marked as "Locked" above will be blurred until a buyer signs in.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-8 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm shadow-xl shadow-brand-700/30 transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
