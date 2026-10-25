import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldCheck, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

export function Footer() {
  const { t } = useTheme();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white">
                <Home className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white font-serif">
                {t.brandName}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Vidarbha's dedicated real-estate marketplace connecting buyers directly with genuine owners, verified brokers, and reputed builders across Nagpur, Wardha, and the Samruddhi Expressway corridor.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-brand-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Compliant with DPDP Act 2023 & Maharashtra RERA standards</span>
            </div>
          </div>

          {/* Nagpur Localities */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-4">
              Nagpur Real Estate
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/search?city=Nagpur&locality=Ramdaspeth" className="hover:text-white transition">
                  Ramdaspeth Apartments
                </Link>
              </li>
              <li>
                <Link to="/search?city=Nagpur&locality=Civil+Lines" className="hover:text-white transition">
                  Civil Lines Penthouses
                </Link>
              </li>
              <li>
                <Link to="/search?city=Nagpur&locality=MIHAN" className="hover:text-white transition">
                  MIHAN Wardha Road Plots
                </Link>
              </li>
              <li>
                <Link to="/search?city=Nagpur&locality=Besa" className="hover:text-white transition">
                  Besa-Pipla Road Flats
                </Link>
              </li>
              <li>
                <Link to="/search?city=Nagpur&locality=Hingna" className="hover:text-white transition">
                  Hingna Gated Villas
                </Link>
              </li>
            </ul>
          </div>

          {/* Wardha Localities */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-4">
              Wardha Real Estate
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/search?city=Wardha&locality=Sevagram" className="hover:text-white transition">
                  Sevagram Road Bungalows
                </Link>
              </li>
              <li>
                <Link to="/search?city=Wardha&locality=Bachelor+Road" className="hover:text-white transition">
                  Bachelor Road Properties
                </Link>
              </li>
              <li>
                <Link to="/search?city=Wardha&locality=Nalwadi" className="hover:text-white transition">
                  Nalwadi NA Layout Plots
                </Link>
              </li>
              <li>
                <Link to="/search?city=Wardha&locality=Kelzar" className="hover:text-white transition">
                  Samruddhi Interchange Farms
                </Link>
              </li>
              <li>
                <Link to="/search?city=Wardha&locality=Borgaon+Meghe" className="hover:text-white transition">
                  Borgaon Meghe Row Villas
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Tools & Compliance */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-4">
              Tools & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/finance" className="hover:text-white transition">
                  Home Loan EMI Calculator
                </Link>
              </li>
              <li>
                <Link to="/finance" className="hover:text-white transition">
                  Maharashtra Stamp Duty Guide
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition">
                  Privacy Policy (DPDP Act)
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition">
                  Data Subject Rights / Erasure
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & disclaimers */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Bhoomi Marketplace Technologies Pvt Ltd. All rights reserved.</p>
          <p className="text-center sm:text-right max-w-md">
            Information provided is for reference. Stamp duty and registration charges are subject to official Maharashtra Revenue Department valuation.
          </p>
        </div>
      </div>
    </footer>
  );
}
