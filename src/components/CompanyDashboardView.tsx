import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  Plus,
  CheckCircle2,
  Building2,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { DashboardTab } from '../types';
import { supabase } from '../lib/supabaseClient';

interface RealListing {
  id: string;
  role: string;
  type: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  applicantCount: number;
}

interface CompanyDashboardViewProps {
  companyName?: string;
  onNavigateTab: (tab: DashboardTab) => void;
}

export const CompanyDashboardView: React.FC<CompanyDashboardViewProps> = ({
  companyName = 'Company',
  onNavigateTab,
}) => {
  const [listings, setListings] = useState<RealListing[]>([]);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setErrorMsg('Not logged in.');
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('listings')
      .select('id, title, work_mode, location, status')
      .eq('company_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
      return;
    }

    const listingIds = (data || []).map((l: any) => l.id);
    let applicantCounts: Record<string, number> = {};
    let totalCount = 0;

    if (listingIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select('listing_id')
        .in('listing_id', listingIds);

      (apps || []).forEach((a: any) => {
        applicantCounts[a.listing_id] = (applicantCounts[a.listing_id] || 0) + 1;
        totalCount += 1;
      });
    }

    const mapped: RealListing[] = (data || []).map((row: any) => ({
      id: row.id,
      role: row.title,
      type: row.work_mode || 'Not specified',
      location: row.location || 'Not specified',
      status: row.status,
      applicantCount: applicantCounts[row.id] || 0,
    }));

    setListings(mapped);
    setTotalApplicants(totalCount);
    setIsLoading(false);
  };

  const pendingCount = listings.filter((l) => l.status === 'pending').length;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Live', className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
      case 'rejected':
        return { label: 'Rejected', className: 'bg-rose-500/10 text-rose-300 border-rose-500/20' };
      default:
        return { label: 'Pending Review', className: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
    }
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
    <div className="space-y-6 sm:space-y-8" id="company-dashboard-content">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Company Portal — {companyName}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Verified Employer
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Publish internship listings, review matched candidates, and manage your talent pipeline.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('post-listing')}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all duration-200 shadow-md shadow-emerald-950/40 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post a Listing</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-xs text-cyan-300 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-md">
              {pendingCount} Pending Review
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white">{listings.length}</div>
          <div className="text-xs text-slate-400 mt-1">Total Created Listings</div>
        </div>

        <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Active Pipeline
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white">{totalApplicants}</div>
          <div className="text-xs text-slate-400 mt-1">Matched Student Applicants</div>
        </div>

        <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Approved
            </span>
          </div>
          <div className="text-base font-bold text-white">Institution Review</div>
          <div className="text-xs text-slate-400 mt-1">All postings reviewed by your partner institution before going live.</div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-bold text-white">Current Listings Overview</h2>
          <button
            type="button"
            onClick={() => onNavigateTab('my-listings')}
            className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {listings.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No listings posted yet. Click "Post a Listing" to create your first one.
          </p>
        ) : (
          <div className="divide-y divide-white/[0.06] mt-1">
            {listings.slice(0, 3).map((l) => {
              const badge = statusBadge(l.status);
              return (
                <div key={l.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{l.role}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>{l.type}</span>
                      <span>•</span>
                      <span>{l.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{l.applicantCount} Applicants</span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('my-listings')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] text-slate-200 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
