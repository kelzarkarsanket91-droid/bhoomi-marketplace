import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Building2,
  Home,
  Compass,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Percent,
  CheckCircle,
  Calculator,
  Sparkles,
  Layers,
} from 'lucide-react';
import { apiFetch } from '../lib/api.js';
import { PropertyCard } from '../components/property/PropertyCard.js';
import { useTheme } from '../context/ThemeContext.js';
import { useAuth } from '../context/AuthContext.js';
import { calculateLoan } from '@bhoomi/finance';

export function HomePage() {
  const { t } = useTheme();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [listingType, setListingType] = useState<'SALE' | 'RENT'>('SALE');
  const [propertyType, setPropertyType] = useState<string>('');
  const [bhk, setBhk] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Interactive quick calculator teaser state
  const [teaserPrice, setTeaserPrice] = useState<number>(5000000); // 50 Lakhs
  const [teaserTenure, setTeaserTenure] = useState<number>(20); // 20 years

  const teaserLoan = calculateLoan({
    propertyPrice: teaserPrice,
    downPaymentPercent: 20,
    annualInterestRate: 8.5,
    tenureYears: teaserTenure,
  });

  // Fetch featured properties
  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['featured-properties', listingType],
    queryFn: () => apiFetch<{ data: any[] }>(`/properties?listingType=${listingType}&limit=6`),
  });

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (listingType) params.set('listingType', listingType);
    if (propertyType) params.set('propertyType', propertyType);
    if (bhk) params.set('bhk', bhk);
    if (city) params.set('city', city);
    if (searchTerm) params.set('search', searchTerm);

    navigate(`/search?${params.toString()}`);
  };

  const propertyTypes = [
    { id: 'PLOT', name: t.plots, desc: 'NIT / NMRDA & NA Layouts', count: '14+ Available', icon: Layers },
    { id: 'FLAT', name: t.flats, desc: '1, 2, 3, 4 BHK Apartments', count: '18+ Available', icon: Building2 },
    { id: 'BUNGALOW', name: t.bungalows, desc: 'Independent Duplex Homes', count: '8+ Available', icon: Home },
    { id: 'VILLA', name: t.villas, desc: 'Gated Luxury Living', count: '6+ Available', icon: Sparkles },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-brand-950 via-slate-900 to-slate-950 text-white">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-900/80 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-6 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Vidarbha's Most Trusted Real Estate Marketplace</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-serif tracking-tight leading-tight sm:leading-none text-white mb-6">
              {t.heroTitle}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              {t.heroSubtitle}
            </p>
          </div>

          {/* SEARCH BAR WIDGET */}
          <div className="max-w-4xl mx-auto rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 sm:p-6 shadow-2xl border border-white/20 dark:border-slate-800 text-slate-900 dark:text-white">
            {/* Buy / Rent Switch */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setListingType('SALE')}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition ${
                    listingType === 'SALE'
                      ? 'bg-brand-700 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Buy / Outright Sale
                </button>
                <button
                  type="button"
                  onClick={() => setListingType('RENT')}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition ${
                    listingType === 'RENT'
                      ? 'bg-brand-700 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Rental Properties
                </button>
              </div>

              <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
                Verified Titles & Direct Contacts
              </span>
            </div>

            <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Keyword / Locality search */}
              <div className="relative">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Locality / Landmark
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-brand-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="e.g. Ramdaspeth, Sevagram..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Property Type Dropdown */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Types (Plots, Flats...)</option>
                  <option value="PLOT">Plots / Land</option>
                  <option value="FLAT">Flats / Apartments</option>
                  <option value="BUNGALOW">Bungalows / Row Houses</option>
                  <option value="VILLA">Luxury Villas</option>
                </select>
              </div>

              {/* BHK Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  BHK Configuration
                </label>
                <select
                  value={bhk}
                  onChange={(e) => setBhk(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Any BHK</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="3.5">3.5 BHK</option>
                  <option value="4">4+ BHK</option>
                </select>
              </div>

              {/* City & Submit Button */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All Cities</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Wardha">Wardha</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-700/30 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* PROPERTY TYPES TILES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
              Explore by Property Type
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Carefully catalogued categories with clear sanction orders & legal documentation
            </p>
          </div>
          <Link
            to="/search"
            className="text-xs font-bold text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {propertyTypes.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.id}
                to={`/search?propertyType=${t.id}`}
                className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition">
                  {t.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.desc}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-brand-700 dark:text-brand-400 flex items-center justify-between">
                  <span>{t.count}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED PROPERTIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Direct Sellers & Verified Partners</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
              Featured Listings in Nagpur & Wardha
            </h2>
          </div>

          <Link
            to="/search"
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
          >
            Explore 30+ Listings
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {propertiesData?.data?.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* REGIONAL GROWTH CORRIDORS (Samruddhi & MIHAN) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-brand-950 text-white p-8 sm:p-12 border border-slate-800 overflow-hidden relative shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4 inline-block">
              Vidarbha Megaprojects
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold font-serif mb-4 leading-snug">
              Invest in the Samruddhi Mahamarg & MIHAN Tech Belt
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              With high-speed connectivity via the Hindu Hrudaysamrat Balasaheb Thackeray Maharashtra Samruddhi Expressway connecting Nagpur and Wardha to Mumbai in 7 hours, prime agricultural and residential parcels near Kelzar, Butibori, and MIHAN are experiencing record value appreciation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/search?search=Samruddhi"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm shadow-md transition"
              >
                Explore Expressway Plots
              </Link>
              <Link
                to="/search?search=MIHAN"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition"
              >
                MIHAN Wardha Road Listings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINANCE CALCULATOR TEASER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 text-xs font-bold">
                <Calculator className="w-3.5 h-3.5" />
                <span>Transparent Finance Engine</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900 dark:text-white">
                Calculate Exact Home Loan EMI
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Powered by our isolated finance module. Review bank quotes from SBI, HDFC, and Bank of Maharashtra, along with Maharashtra stamp duty and registration estimates.
              </p>
              <Link
                to="/finance"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-700 dark:text-brand-400 hover:underline pt-2"
              >
                <span>Open Full Amortization Chart & LTV Checker</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Interactive Sliders Teaser Box */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-5">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300">Property Price:</span>
                  <span className="text-brand-700 dark:text-brand-400 font-mono font-bold text-sm">
                    ₹{(teaserPrice / 100000).toFixed(1)} Lakhs
                  </span>
                </div>
                <input
                  type="range"
                  min={1000000}
                  max={25000000}
                  step={500000}
                  value={teaserPrice}
                  onChange={(e) => setTeaserPrice(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300">Loan Tenure:</span>
                  <span className="text-brand-700 dark:text-brand-400 font-mono font-bold text-sm">
                    {teaserTenure} Years ({teaserTenure * 12} Months)
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={teaserTenure}
                  onChange={(e) => setTeaserTenure(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              {/* Instant Output Pill */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-center">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Down Payment (20%)</div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-mono mt-0.5">
                    ₹{(teaserLoan.downPaymentAmount / 100000).toFixed(1)} L
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800">
                  <div className="text-[10px] text-brand-700 dark:text-brand-400 uppercase font-semibold">
                    Monthly EMI
                  </div>
                  <div className="font-extrabold text-sm sm:text-base text-brand-800 dark:text-brand-300 font-mono mt-0.5">
                    ₹{teaserLoan.monthlyEmi.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Payable</div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-mono mt-0.5">
                    ₹{(teaserLoan.totalPayment / 100000).toFixed(1)} L
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW BHOOMI WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white mb-3">
          {t.howItWorks}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-12">
          A seamless, transparent marketplace designed for genuine buyers, sellers, brokers, and builders in Vidarbha.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-400 flex items-center justify-center font-bold text-lg mx-auto mb-4">
              1
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Explore Verified Inventory
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Browse plots, flats, bungalows, and villas with NMRDA/NIT sanctions, transparent carpet areas, and accurate GPS map coordinates.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-400 flex items-center justify-center font-bold text-lg mx-auto mb-4">
              2
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Grounded AI & Finance Calculations
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ask our grounded chatbot for exact per sq.ft. rates, Maharashtra stamp duty and registration estimates, and instant EMI schedules.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-400 flex items-center justify-center font-bold text-lg mx-auto mb-4">
              3
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Connect & Secure Deals
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct contact with owners and brokers. Once deal terms are agreed, KYC documents are encrypted at rest with AES-256-GCM.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
