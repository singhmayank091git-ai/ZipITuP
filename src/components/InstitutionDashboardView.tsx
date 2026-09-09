import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Briefcase,
  MapPin,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { DashboardTab } from '../types';
import { supabase } from '../lib/supabaseClient';

interface RealPendingListing {
  id: string;
  role: string;
  company: string;
  companyLogoText: string;
  location: string;
  workMode: string;
  description: string;
  skills: string[];
  postedDate: string;
}

interface InstitutionDashboardViewProps {
  institutionName?: string;
  onNavigateTab: (tab: DashboardTab) => void;
}

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export const InstitutionDashboardView: React.FC<InstitutionDashboardViewProps> = ({
  institutionName = 'Institution',
  onNavigateTab,
}) => {
  const [pendingListings, setPendingListings] = useState<RealPendingListing[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reviewNotification, setReviewNotification] = useState<{ message: string; type: 'approved' | 'rejected' } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const { data: pendingData, error: pendingError } = await supabase
      .from('listings')
      .select('id, title, required_skills, location, work_mode, description, created_at, companies(company_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (pendingError) {
      setErrorMsg(pendingError.message);
      setIsLoading(false);
      return;
    }

    const mapped: RealPendingListing[] = (pendingData || []).map((row: any) => {
      const companyName = row.companies?.company_name || 'Unknown Company';
      return {
        id: row.id,
        role: row.title,
        company: companyName,
        companyLogoText: companyName.slice(0, 2).toUpperCase(),
        location: row.location || 'Not specified',
        workMode: row.work_mode || '',
        description: row.description || '',
        skills: row.required_skills || [],
        postedDate: timeAgo(row.created_at),
      };
    });

    setPendingListings(mapped);

    const { count: liveCount } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');
    setActiveCount(liveCount || 0);

    const { count: students } = await supabase
      .from('student_profiles')
      .select('id', { count: 'exact', head: true });
    setStudentCount(students || 0);

    setIsLoading(false);
  };

  const handleApprove = async (listing: RealPendingListing) => {
    const { error } = await supabase.from('listings').update({ status: 'approved' }).eq('id', listing.id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setPendingListings((prev) => prev.filter((l) => l.id !== listing.id));
    setActiveCount((prev) => prev + 1);
    setReviewNotification({
      message: `Approved "${listing.role}" from ${listing.company}. Listing is now live for students!`,
      type: 'approved',
    });
    setTimeout(() => setReviewNotification(null), 4000);
  };

  const handleReject = async (listing: RealPendingListing) => {
    const { error } = await supabase.from('listings').update({ status: 'rejected' }).eq('id', listing.id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setPendingListings((prev) => prev.filter((l) => l.id !== listing.id));
    setReviewNotification({
      message: `Rejected "${listing.role}" from ${listing.company}.`,
      type: 'rejected',
    });
    setTimeout(() => setReviewNotification(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8" id="institution-dashboard-content">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              TPO / Placement Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">Institutional Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1.5">
            Institution & Placement Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Verify employer listings, track student applications, and oversee placement drives.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigateTab('all-listings')}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <span>All Listings</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <AnimatePresence>
        {reviewNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xl ${
              reviewNotification.type === 'approved'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {reviewNotification.type === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{reviewNotification.message}</span>
            </div>
            <button type="button" onClick={() => setReviewNotification(null)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-amber-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md">
              Action Required
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white">{pendingListings.length}</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Pending Approvals</div>
        </div>

        <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-xs text-cyan-300 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-md">
              Live Opportunities
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white">{activeCount}</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Active Listings</div>
        </div>

        <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{studentCount}</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Registered Students</div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pending Approvals</h2>
              <p className="text-xs text-slate-400">
                Review company submissions before making them visible to students.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {pendingListings.length} awaiting review
          </span>
        </div>

        {pendingListings.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h3 className="text-base font-bold text-white">All caught up!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are no pending employer listings to review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingListings.map((listing) => (
              <div
                key={listing.id}
                className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-cyan-500/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center font-bold text-xs text-white">
                      {listing.companyLogoText}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">{listing.role}</h3>
                      <span className="text-xs text-cyan-300 font-medium">{listing.company}</span>
                    </div>
                    <span className="ml-auto lg:ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Pending Approval
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {listing.location}
                    </span>
                    {listing.workMode && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                          {listing.workMode}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-slate-400">Submitted {listing.postedDate}</span>
                  </div>

                  {listing.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 bg-black/20 p-2.5 rounded-xl border border-white/[0.04]">
                      {listing.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 mr-1">Skills:</span>
                    {listing.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-slate-200 border border-white/[0.06]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/[0.06] w-full lg:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => handleReject(listing)}
                    className="flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprove(listing)}
                    className="flex-1 lg:flex-none px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Listing</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
