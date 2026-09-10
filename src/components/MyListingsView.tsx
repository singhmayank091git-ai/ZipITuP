import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Users, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface RealListing {
  id: string;
  role: string;
  type: string;
  location: string;
  workMode: string;
  skills: string[];
  status: 'pending' | 'approved' | 'rejected';
  applicantCount: number;
  postedDate: string;
}

interface MyListingsViewProps {
  onNavigateToPost: () => void;
}

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export const MyListingsView: React.FC<MyListingsViewProps> = ({ onNavigateToPost }) => {
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [listings, setListings] = useState<RealListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
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
      .select('id, title, work_mode, location, required_skills, status, created_at')
      .eq('company_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
      return;
    }

    const listingIds = (data || []).map((l: any) => l.id);
    let applicantCounts: Record<string, number> = {};

    if (listingIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select('listing_id')
        .in('listing_id', listingIds);

      (apps || []).forEach((a: any) => {
        applicantCounts[a.listing_id] = (applicantCounts[a.listing_id] || 0) + 1;
      });
    }

    const mapped: RealListing[] = (data || []).map((row: any) => ({
      id: row.id,
      role: row.title,
      type: row.work_mode || 'Not specified',
      location: row.location || 'Not specified',
      workMode: row.work_mode || '',
      skills: row.required_skills || [],
      status: row.status,
      applicantCount: applicantCounts[row.id] || 0,
      postedDate: timeAgo(row.created_at),
    }));

    setListings(mapped);
    setIsLoading(false);
  };

  const filteredListings = listings.filter((l) => filter === 'all' || l.status === filter);

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

  return (
    <div className="space-y-6" id="my-listings-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Company Job & Internship Listings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your company's active roles, review status, and student applicant pools.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToPost}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-md shadow-emerald-950/40 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Listing</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center gap-2 pb-1">
        {(['all', 'approved', 'pending', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize ${
              filter === tab
                ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 text-white border border-cyan-500/30'
                : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
            }`}
          >
            {tab === 'all' ? 'All Listings' : tab === 'approved' ? 'Live' : tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading your listings...</span>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No listings found. Click "Post New Listing" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((item) => {
            const badge = statusBadge(item.status);
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 p-5 shadow-xl flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {item.type}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5 group-hover:text-cyan-300 transition-colors">
                        {item.role}
                      </h3>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 my-2.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {item.location}
                    </span>
                    {item.workMode && (
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                        {item.workMode}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Required Skills:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.skills.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>{item.applicantCount} Applicants</span>
                  </div>

                  <div className="text-xs text-slate-400">{item.postedDate}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
