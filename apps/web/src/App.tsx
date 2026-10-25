import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { ChatbotWidget } from './components/chatbot/ChatbotWidget.js';

import { HomePage } from './pages/HomePage.js';
import { SearchPage } from './pages/SearchPage.js';
import { PropertyDetailsPage } from './pages/PropertyDetailsPage.js';
import { AddPropertyPage } from './pages/AddPropertyPage.js';
import { FinancePage } from './pages/FinancePage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
              <Navbar />

              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/property/:id" element={<PropertyDetailsPage />} />
                  <Route path="/add-property" element={<AddPropertyPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  {/* Catch-all */}
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </main>

              <Footer />
              <AuthModal />
              <ChatbotWidget />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
