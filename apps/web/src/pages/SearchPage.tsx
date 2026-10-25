import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Building2,
  Home,
  Layers,
  ArrowUpDown,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../lib/api.js';
import { PropertyCard } from '../components/property/PropertyCard.js';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced filter states
  const search = searchParams.get('search') || '';
  const propertyType = searchParams.get('propertyType') || '';
  const listingType = (searchParams.get('listingType') as 'SALE' | 'RENT') || 'SALE';
  const bhk = searchParams.get('bhk') || '';
  const city = searchParams.get('city') || '';
  const locality = searchParams.get('locality') || '';
  const listedBy = searchParams.get('listedBy') || '';
  const sortBy = searchParams.get('sortBy') || 'date_desc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Helper to update query params
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams({ listingType: 'SALE' }));
  };

  // Build query string for API
  const queryUrl = `/properties?${searchParams.toString()}`;

  const { data, isLoading } = useQuery({
    queryKey: ['properties', searchParams.toString()],
    queryFn: () =>
      apiFetch<{
        data: any[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(queryUrl),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Search & Filter Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
              Search Properties in Nagpur & Wardha
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Showing {data?.pagination.total || 0} verified listings
            </p>
          </div>

          {/* Buy vs Rent Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 self-start sm:self-auto">
            <button
              onClick={() => updateFilter('listingType', 'SALE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                listingType === 'SALE'
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Buy / Sale
            </button>
            <button
              onClick={() => updateFilter('listingType', 'RENT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                listingType === 'RENT'
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Rental
            </button>
          </div>
        </div>

        {/* Global Search Input + Mobile Filter Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search by locality, project name, or address..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="lg:hidden p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            title="Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Horizontal Category Quick Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {[
            { id: '', label: 'All Categories', icon: Building2 },
            { id: 'PLOT', label: '🌾 Plots & Land', icon: Layers },
            { id: 'FLAT', label: '🏢 Flats & Apartments', icon: Building2 },
            { id: 'BUNGALOW', label: '🏡 Bungalows & Houses', icon: Home },
            { id: 'VILLA', label: '🏰 Luxury Villas', icon: Sparkles },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = propertyType === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilter('propertyType', cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-700 text-white shadow-md shadow-brand-700/20 ring-2 ring-brand-700/50'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT FILTERS SIDEBAR */}
        <aside
          className={`lg:block ${
            isMobileFilterOpen ? 'block' : 'hidden'
          } p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 h-fit`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <SlidersHorizontal className="w-4 h-4 text-brand-600" />
              <span>Filters</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Property Type Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Property Type
            </label>
            <div className="space-y-1.5 text-xs">
              {[
                { id: '', label: 'All Property Types' },
                { id: 'PLOT', label: 'Plots / Land Layouts' },
                { id: 'FLAT', label: 'Flats / Apartments' },
                { id: 'BUNGALOW', label: 'Bungalows / Row Houses' },
                { id: 'VILLA', label: 'Luxury Villas' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateFilter('propertyType', item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition ${
                    propertyType === item.id
                      ? 'bg-brand-50 dark:bg-brand-950 font-bold text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* BHK Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              BHK Configuration
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[
                { val: '', label: 'Any' },
                { val: '1', label: '1 BHK' },
                { val: '2', label: '2 BHK' },
                { val: '3', label: '3 BHK' },
                { val: '3.5', label: '3.5 BHK' },
                { val: '4', label: '4+ BHK' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => updateFilter('bhk', item.val)}
                  className={`p-2 rounded-xl border text-center font-medium transition ${
                    bhk === item.val
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* City Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              City
            </label>
            <select
              value={city}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All (Nagpur & Wardha)</option>
              <option value="Nagpur">Nagpur Only</option>
              <option value="Wardha">Wardha Only</option>
            </select>
          </div>

          {/* Listed By (Broker vs Direct Seller) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Listed By
            </label>
            <div className="space-y-1.5 text-xs">
              {[
                { id: '', label: 'All Listings' },
                { id: 'SELLER', label: 'Direct Owner / Seller' },
                { id: 'BROKER', label: 'Verified Broker' },
                { id: 'BUILDER', label: 'Developer / Builder' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateFilter('listedBy', item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition ${
                    listedBy === item.id
                      ? 'bg-brand-50 dark:bg-brand-950 font-bold text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="date_desc">Newest Listings First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_desc">Area: Largest First</option>
              <option value="views_desc">Most Viewed</option>
            </select>
          </div>
        </aside>

        {/* RIGHT PROPERTY LISTING RESULTS */}
        <main className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {data.data.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {/* Pagination Controls */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateFilter('page', (page - 1).toString())}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 flex items-center gap-1 text-xs font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-medium text-slate-500">
                    Page {page} of {data.pagination.totalPages}
                  </span>

                  <button
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => updateFilter('page', (page + 1).toString())}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 flex items-center gap-1 text-xs font-semibold"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No properties match your filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try widening your search terms or clearing specific BHK or locality filters to discover more listings.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-brand-700 text-white font-bold text-xs"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
