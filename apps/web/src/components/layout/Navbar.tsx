import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Home,
  PlusCircle,
  BarChart3,
  Moon,
  Sun,
  Globe,
  User as UserIcon,
  LogOut,
  ArrowLeftRight,
  ShieldAlert,
  Calculator,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Language } from '../../lib/i18n.js';

export function Navbar() {
  const { user, openAuthModal, logout, switchRole, canSwitchRole } = useAuth();
  const { isDarkMode, toggleDarkMode, lang, setLang, t } = useTheme();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const navigate = useNavigate();

  const handleRoleToggle = async () => {
    if (!user || !canSwitchRole) return;
    const target = user.role === 'BUYER' ? 'SELLER' : 'BUYER';
    setIsSwitching(true);
    try {
      await switchRole(target);
    } catch (err: any) {
      alert(err.message || 'Failed to switch role');
    } finally {
      setIsSwitching(false);
    }
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    BROKER: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    BUILDER: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    SELLER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    BUYER: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 glass-panel transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-800 to-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-700/20 group-hover:scale-105 transition-transform">
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-brand-900 dark:text-white font-serif">
                {t.brandName}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
              {t.regionTag}
            </p>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Link to="/search" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
            {t.explore}
          </Link>
          <Link to="/search?propertyType=PLOT" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
            {t.plots}
          </Link>
          <Link to="/search?propertyType=FLAT" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
            {t.flats}
          </Link>
          <Link to="/search?propertyType=VILLA" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
            {t.villas}
          </Link>
          <Link
            to="/finance"
            className="flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400 transition text-brand-700 dark:text-brand-400"
          >
            <Calculator className="w-4 h-4" />
            <span>{t.finance}</span>
          </Link>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Role Indicator & Role Switcher for Buyer <-> Seller */}
          {user && (
            <div className="hidden sm:flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  roleColors[user.role] || 'bg-slate-100'
                }`}
              >
                {user.role} MODE
              </span>

              {canSwitchRole && (
                <button
                  onClick={handleRoleToggle}
                  disabled={isSwitching}
                  title="Switch between Buyer and Seller"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 transition"
                >
                  <ArrowLeftRight className={`w-3.5 h-3.5 ${isSwitching ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">
                    {user.role === 'BUYER' ? t.switchRoleToSeller : t.switchRoleToBuyer}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Add Property Button (Sellers, Brokers, Builders, Admins) */}
          {user && ['SELLER', 'BROKER', 'BUILDER', 'ADMIN'].includes(user.role) && (
            <Link
              to="/add-property"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t.postProperty}</span>
            </Link>
          )}

          {/* Admin / Broker Dashboard Button */}
          {user && ['ADMIN', 'BROKER'].includes(user.role) && (
            <Link
              to="/dashboard"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 transition"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">{t.dashboard}</span>
            </Link>
          )}

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 text-xs font-bold"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{lang}</span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 animate-fade-in text-xs font-medium">
                <button
                  onClick={() => {
                    setLang('en');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    lang === 'en' ? 'font-bold text-brand-600' : ''
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    setLang('hi');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    lang === 'hi' ? 'font-bold text-brand-600' : ''
                  }`}
                >
                  हिंदी (Hindi)
                </button>
                <button
                  onClick={() => {
                    setLang('mr');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    lang === 'mr' ? 'font-bold text-brand-600' : ''
                  }`}
                >
                  मराठी (Marathi)
                </button>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Auth Button or User Menu */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="py-2 px-3 sm:px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-700/20 transition flex items-center gap-1.5"
            >
              <UserIcon className="w-4 h-4" />
              <span>{t.login}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
