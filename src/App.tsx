/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowLeft, LogIn, Sparkles, Building2 } from 'lucide-react';
import { AuthMode, UserRole, FormData, DashboardTab, InternshipListing } from './types';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BrowseInternshipsView } from './components/BrowseInternshipsView';
import { ApplicationsView } from './components/ApplicationsView';
import { ProfileView } from './components/ProfileView';
import { PostListingView } from './components/PostListingView';
import { MyListingsView } from './components/MyListingsView';
import { CompanyApplicantsView } from './components/CompanyApplicantsView';
import { CompanyDashboardView } from './components/CompanyDashboardView';
import { InstitutionDashboardView } from './components/InstitutionDashboardView';
import { InstitutionPendingApprovalsView } from './components/InstitutionPendingApprovalsView';
import { InstitutionAllListingsView } from './components/InstitutionAllListingsView';
import { InstitutionStudentsView } from './components/InstitutionStudentsView';
import { InstitutionProfileView } from './components/InstitutionProfileView';
import { FormPanel } from './components/FormPanel';
import { DecorativePanel } from './components/DecorativePanel';
import { AuthSuccessModal } from './components/AuthSuccessModal';
import { STUDENT_PROFILE_DATA, RECOMMENDED_INTERNSHIPS } from './data/dashboardData';

export default function App() {
  // App view state: 'dashboard' or 'auth'
 const [currentView, setCurrentView] = useState<'dashboard' | 'auth'>('auth');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('company'); // Defaulting or toggling between student and company
  const [activeTab, setActiveTab] = useState<DashboardTab>('post-listing');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Company listings state
  const [companyListings, setCompanyListings] = useState<InternshipListing[]>([
    {
      id: 'listing-1',
      company: 'TechCorp Labs',
      companyLogoText: 'TC',
      companyLogoBg: 'from-emerald-500 to-teal-600',
      role: 'Frontend Engineering Intern',
      location: 'San Francisco, CA / Remote',
      type: 'Summer Internship 2026',
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
      matchScore: 94,
      postedDate: '3 days ago',
      workMode: 'Remote',
      status: 'Live',
      applicantCount: 8,
      description: 'Design and build next-generation web applications and collaborative developer tooling.',
    },
    {
      id: 'listing-2',
      company: 'TechCorp Labs',
      companyLogoText: 'TC',
      companyLogoBg: 'from-emerald-500 to-teal-600',
      role: 'Data Science & ML Intern',
      location: 'New York, NY / Hybrid',
      type: 'Summer Internship 2026',
      skills: ['Python', 'SQL', 'Pandas', 'PyTorch'],
      matchScore: 89,
      postedDate: '1 week ago',
      workMode: 'Hybrid',
      status: 'Live',
      applicantCount: 5,
      description: 'Analyze telemetry logs, model user interaction graphs, and improve student match scoring.',
    },
    {
      id: 'listing-3',
      company: 'TechCorp Labs',
      companyLogoText: 'TC',
      companyLogoBg: 'from-emerald-500 to-teal-600',
      role: 'Cloud Infrastructure Intern',
      location: 'Seattle, WA',
      type: 'Fall Internship 2026',
      skills: ['Docker', 'Kubernetes', 'Go', 'AWS'],
      matchScore: 87,
      postedDate: 'Yesterday',
      workMode: 'On-site',
      status: 'Pending Review',
      applicantCount: 0,
      description: 'Support cloud orchestration and scale microservices for educational institution integrations.',
    },
  ]);

  // Auth state
  const [studentName, setStudentName] = useState<string>(STUDENT_PROFILE_DATA.name);
  const [companyName, setCompanyName] = useState<string>('TechCorp Labs');
  const [institutionName, setInstitutionName] = useState<string>('Riverside Institute of Technology — Placement Cell');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('institution');
  const [successData, setSuccessData] = useState<FormData | null>(null);

  const handleRoleSwitch = (role: UserRole) => {
    setCurrentUserRole(role);
    if (role === 'institution') {
      setActiveTab('dashboard');
    } else if (role === 'company') {
      setActiveTab('post-listing');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleListingCreated = (newListing: InternshipListing) => {
    setCompanyListings((prev) => [newListing, ...prev]);
  };

  const handleApproveListing = (id: string) => {
    setCompanyListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'Live' as const } : l))
    );
  };

  const handleRejectListing = (id: string) => {
    setCompanyListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'Draft' as const } : l))
    );
  };

  const handleAuthSuccess = (data: FormData) => {
    if (data.role === 'institution') {
      setCurrentUserRole('institution');
      setActiveTab('dashboard');
      if (data.fullName) setInstitutionName(data.fullName);
    } else if (data.role === 'company') {
      setCurrentUserRole('company');
      setActiveTab('post-listing');
      if (data.fullName) setCompanyName(data.fullName);
    } else {
      setCurrentUserRole('student');
      setActiveTab('dashboard');
      if (data.fullName) {
        setStudentName(data.fullName);
      } else if (data.email) {
        const derived = data.email.split('@')[0];
        setStudentName(derived.charAt(0).toUpperCase() + derived.slice(1));
      }
    }
    setSuccessData(data);
  };

  const handleAuthModalContinue = () => {
    setSuccessData(null);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentView('auth');
    setAuthMode('login');
  };

  const handleReturnToDashboard = () => {
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0E1A] text-slate-100 relative selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Ambient Mesh Light for entire application */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-teal-500/5 rounded-full blur-[180px]" />
      </div>

      {currentView === 'dashboard' ? (
        /* ================= DASHBOARD VIEW ================= */
        <div className="relative z-10 flex min-h-screen w-full">
          {/* Left Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onLogout={handleLogout}
            userRole={currentUserRole}
            userName={
              currentUserRole === 'institution'
                ? institutionName
                : currentUserRole === 'company'
                ? companyName
                : studentName
            }
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar for Mobile Menu & Quick Actions */}
            <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0B0F1E]/90 backdrop-blur-xl border-b border-white/[0.08]">
              <button
                type="button"
                id="mobile-sidebar-toggle"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>
                  SkillBridge{' '}
                  {currentUserRole === 'institution'
                    ? 'TPO'
                    : currentUserRole === 'company'
                    ? 'Company'
                    : 'Student'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </header>

            {/* Main Content View with Smooth Transition */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto" id="dashboard-main-area">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentUserRole}-${activeTab}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {/* Institution / TPO Views */}
                  {currentUserRole === 'institution' && (
                    <>
                      {activeTab === 'dashboard' && (
                        <InstitutionDashboardView
                          institutionName={institutionName}
                          onNavigateTab={setActiveTab}
                        />
                      )}
                                          {activeTab === 'pending-approvals' && (
                        <InstitutionPendingApprovalsView
                          onNavigateTab={setActiveTab}
                        />
                      )}
                                      {activeTab === 'all-listings' && (
                        <InstitutionAllListingsView />
                      )}
                      {activeTab === 'students' && <InstitutionStudentsView />}
                      {activeTab === 'profile' && (
                        <InstitutionProfileView
                          institutionName={institutionName}
                          onUpdateName={(name) => setInstitutionName(name)}
                        />
                      )}
                    </>
                  )}

                  {/* Company Views */}
                  {currentUserRole === 'company' && (
                    <>
                      {activeTab === 'post-listing' && (
                        <PostListingView
                          companyName={companyName}
                          onListingCreated={handleListingCreated}
                          onNavigateToMyListings={() => setActiveTab('my-listings')}
                        />
                      )}
                      {activeTab === 'my-listings' && (
                        <MyListingsView
                          listings={companyListings}
                          onNavigateToPost={() => setActiveTab('post-listing')}
                        />
                      )}
                      {activeTab === 'applicants' && <CompanyApplicantsView />}
                      {activeTab === 'profile' && (
                        <ProfileView
                          userRole="company"
                          companyName={companyName}
                          onUpdateName={(name) => setCompanyName(name)}
                        />
                      )}
                                       {activeTab === 'dashboard' && (
                        <CompanyDashboardView
                          companyName={companyName}
                          onNavigateTab={setActiveTab}
                        />
                      )}
                    </>
                  )}

                  {/* Student Views */}
                  {currentUserRole === 'student' && (
                    <>
                      {activeTab === 'dashboard' && (
                        <DashboardView
                          studentName={studentName}
                          onNavigateTab={setActiveTab}
                        />
                      )}
                      {activeTab === 'browse' && <BrowseInternshipsView />}
                      {activeTab === 'applications' && <ApplicationsView />}
                      {activeTab === 'profile' && (
                        <ProfileView
                          studentName={studentName}
                          userRole="student"
                          onUpdateName={(name) => setStudentName(name)}
                        />
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      ) : (
        /* ================= AUTHENTICATION VIEW ================= */
        <main
          className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 lg:p-8 relative z-10"
          id="skillbridge-auth-app"
        >
          {/* Back to Dashboard Banner */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
            <button
              type="button"
              id="back-to-dashboard-btn"
              onClick={handleReturnToDashboard}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* Main Auth Split Container */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-7xl rounded-3xl bg-[#0B0F1E]/90 border border-white/[0.08] shadow-[0_20px_70px_rgba(0,0,0,0.65)] backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 overflow-hidden"
            id="split-screen-auth-card"
          >
            {/* Left Half: Form Panel */}
            <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/[0.06]">
              <FormPanel
                mode={authMode}
                onModeChange={setAuthMode}
                selectedRole={selectedRole}
                onRoleChange={setSelectedRole}
                onSuccess={handleAuthSuccess}
              />
            </div>

            {/* Right Half: Decorative Panel */}
            <div className="hidden lg:block lg:col-span-6 xl:col-span-7 p-3 sm:p-4 lg:p-5">
              <DecorativePanel selectedRole={selectedRole} />
            </div>
          </motion.div>

          {/* Interactive Authentication Feedback Modal */}
       {successData && (
  <AuthSuccessModal
    isOpen={!!successData}
    mode={authMode}
    role={selectedRole}
    formData={successData}
    onReset={handleAuthModalContinue}
  />
)}
        </main>
      )}
    </div>
  );
}

