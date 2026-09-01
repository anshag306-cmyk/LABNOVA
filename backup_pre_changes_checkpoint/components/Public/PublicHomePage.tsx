import React, { useState, useEffect } from 'react';
import { PublicNavbar } from './PublicNavbar';
import { PublicHero } from './PublicHero';
import { PublicServicesAndTests } from './PublicServicesAndTests';
import { PublicTechnologyAndQuality } from './PublicTechnologyAndQuality';
import { PublicDoctorsTeam } from './PublicDoctorsTeam';
import { PublicFAQsAndContact } from './PublicFAQsAndContact';
import { PublicFooter } from './PublicFooter';
import { PublicTestDetailModal } from './PublicTestDetailModal';
import { PublicHomeCollectionModal } from './PublicHomeCollectionModal';
import { TestTemplate } from '../../types';
import { DEFAULT_TEST_TEMPLATES } from '../../data/pathologyTemplates';
import { subscribeToTestTemplates } from '../../services/pathologyFirebase';

interface PublicHomePageProps {
  onOpenStaffLogin: () => void;
  onGoToDashboard: () => void;
}

export const PublicHomePage: React.FC<PublicHomePageProps> = ({
  onOpenStaffLogin,
  onGoToDashboard,
}) => {
  // Theme toggle state
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // Test catalog state - reuses existing test templates
  const [testTemplates, setTestTemplates] = useState<TestTemplate[]>(DEFAULT_TEST_TEMPLATES);

  // Modals state
  const [selectedTestForDetail, setSelectedTestForDetail] = useState<TestTemplate | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isHomeBookingOpen, setIsHomeBookingOpen] = useState(false);
  const [preSelectedTestForBooking, setPreSelectedTestForBooking] = useState<TestTemplate | null>(
    null
  );

  // Synchronize theme with html tag
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Subscribe to real-time test templates from Firebase (falls back to DEFAULT_TEST_TEMPLATES)
  useEffect(() => {
    const unsubscribe = subscribeToTestTemplates((templates) => {
      if (templates && templates.length > 0) {
        setTestTemplates(templates);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleExploreTests = () => {
    const el = document.getElementById('public-tests-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewTestDetails = (test: TestTemplate) => {
    setSelectedTestForDetail(test);
    setIsDetailModalOpen(true);
  };

  const handleBookTest = (test: TestTemplate) => {
    setPreSelectedTestForBooking(test);
    setIsHomeBookingOpen(true);
  };

  const handleOpenHomeBookingGeneric = () => {
    setPreSelectedTestForBooking(null);
    setIsHomeBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-teal-500 selection:text-white">
      {/* Sticky Top Public Header with Staff Login */}
      <PublicNavbar
        onOpenStaffLogin={onOpenStaffLogin}
        onGoToDashboard={onGoToDashboard}
        onOpenHomeBooking={handleOpenHomeBookingGeneric}
        themeMode={themeMode}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {/* Hero Section with Live Accession Tracker */}
        <PublicHero
          onExploreTests={handleExploreTests}
          onOpenHomeBooking={handleOpenHomeBookingGeneric}
          onOpenStaffLogin={onOpenStaffLogin}
        />

        {/* Public Services & Tests Section (Reusing Existing Test Data) */}
        <PublicServicesAndTests
          testTemplates={testTemplates}
          currency="₹"
          onViewTestDetails={handleViewTestDetails}
          onBookTest={handleBookTest}
        />

        {/* Quality Standards & Diagnostic Technology */}
        <PublicTechnologyAndQuality />

        {/* Pathologist-Supervised Clinical Leadership */}
        <PublicDoctorsTeam />

        {/* FAQs & Contact Information */}
        <PublicFAQsAndContact />
      </main>

      {/* Comprehensive Medical Footer */}
      <PublicFooter
        onOpenStaffLogin={onOpenStaffLogin}
        onOpenHomeBooking={handleOpenHomeBookingGeneric}
      />

      {/* Test Detail Parameter Modal */}
      <PublicTestDetailModal
        test={selectedTestForDetail}
        currency="₹"
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onBookTest={handleBookTest}
      />

      {/* Home Phlebotomy Booking Modal */}
      <PublicHomeCollectionModal
        isOpen={isHomeBookingOpen}
        onClose={() => setIsHomeBookingOpen(false)}
        availableTests={testTemplates}
        preSelectedTest={preSelectedTestForBooking}
        currency="₹"
      />
    </div>
  );
};
