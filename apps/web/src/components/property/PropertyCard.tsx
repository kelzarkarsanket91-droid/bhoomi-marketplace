import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Maximize2,
  Phone,
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiFetch } from '../../lib/api.js';

export interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    propertyType: string;
    listingType: string;
    bhk?: number | null;
    areaSqFt: number;
    priceTotal: number;
    pricePerSqFt: number;
    city: string;
    locality: string;
    ownerRole: string;
    contactPhone: string;
    media: Array<{ url: string; isLocked?: boolean; isMasked?: boolean }>;
    amenities?: Array<{ name: string }>;
  };
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
  isFavorited?: boolean;
}

export function formatIndianCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function PropertyCard({ property, onFavoriteToggle, isFavorited = false }: PropertyCardProps) {
  const { user, openAuthModal } = useAuth();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [fav, setFav] = useState(isFavorited);

  const images = property.media?.length
    ? property.media.map((m) => m.url)
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80'];

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }

    try {
      const res = await apiFetch<{ favorited: boolean }>(`/properties/${property.id}/favorite`, {
        method: 'POST',
      });
      setFav(res.favorited);
      if (onFavoriteToggle) onFavoriteToggle(property.id, res.favorited);
    } catch {
      setFav(!fav);
    }
  };

  const isGuest = !user;
  const isPhoneLocked = property.contactPhone.includes('Login');

  return (
    <div className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-brand-500/30 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Media Gallery Preview */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={images[currentImageIdx]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Carousel arrows if multiple */}
        {images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handlePrevImage}
              className="p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-brand-800/90 backdrop-blur-md text-white shadow-sm">
            {property.listingType === 'SALE' ? 'For Sale' : 'For Rent'}
          </span>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-sm ${
              property.ownerRole === 'SELLER'
                ? 'bg-emerald-600/90 text-white'
                : property.ownerRole === 'BUILDER'
                ? 'bg-amber-600/90 text-white'
                : 'bg-blue-600/90 text-white'
            }`}
          >
            {property.ownerRole === 'SELLER' && 'Direct Owner'}
            {property.ownerRole === 'BROKER' && 'Verified Broker'}
            {property.ownerRole === 'BUILDER' && 'Builder'}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-500 shadow-md transition"
          title="Save to favorites"
        >
          <Heart className={`w-4 h-4 ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Bottom Property Specs Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-xl">
          <span className="font-semibold">
            {property.bhk ? `${property.bhk} BHK ${property.propertyType}` : property.propertyType}
          </span>
          <span>{property.areaSqFt.toLocaleString('en-IN')} sq.ft.</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Price & Rate */}
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white font-serif">
                {formatIndianCurrency(property.priceTotal)}
              </span>
              {property.listingType === 'RENT' && (
                <span className="text-xs text-slate-500 font-normal"> / month</span>
              )}
            </div>
            {property.pricePerSqFt > 0 && property.listingType === 'SALE' && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                ₹{property.pricePerSqFt.toLocaleString('en-IN')}/sq.ft.
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/property/${property.id}`} className="block">
            <h3 className="font-semibold text-slate-900 dark:text-white text-base line-clamp-1 hover:text-brand-600 dark:hover:text-brand-400 transition mb-1">
              {property.title}
            </h3>
          </Link>

          {/* Locality & City */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
            <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
            <span className="line-clamp-1">
              {property.locality}, {property.city}
            </span>
          </div>
        </div>

        {/* Footer Actions & Contact Gating Status */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          {isPhoneLocked ? (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium hover:underline"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login to unlock contact</span>
            </button>
          ) : (
            <a
              href={`tel:${property.contactPhone}`}
              className="flex items-center gap-1.5 text-brand-700 dark:text-brand-400 font-semibold hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{property.contactPhone}</span>
            </a>
          )}

          <Link
            to={`/property/${property.id}`}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/60 dark:hover:text-brand-300 font-semibold transition"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
