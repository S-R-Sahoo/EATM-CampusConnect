import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { EATM_EMBLEM } from '../../constants/assets';

export const StudentLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const location = useLocation();
  const isMessages = location.pathname.includes('/messages');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf9]">
        <div className="flex flex-col items-center gap-3">
          <img src={EATM_EMBLEM} alt="EATM" className="w-12 h-12 object-contain animate-pulse" />
          <p className="text-xs font-semibold text-[#0b4627] tracking-wider">Loading EATM CampusConnect...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] dark:bg-[#0a120d] text-gray-800 dark:text-gray-100 flex flex-col font-sans transition-colors duration-150">
      <Navbar
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 lg:pb-0">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0 sticky top-[65px] h-[calc(100vh-65px)]">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#111d15] z-50 shadow-2xl animate-in slide-in-from-left duration-200">
              <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Central Content View */}
        <main className={`flex-1 min-w-0 ${isMessages ? 'p-0 sm:p-6 lg:p-8' : 'p-4 sm:p-6 lg:p-8 overflow-x-hidden'}`}>
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </div>
  );
};
