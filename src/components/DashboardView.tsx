import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  ArrowUpRight,
  Send,
  Sparkles,
  Clock,
  MapPin,
  ChevronRight,
  Search,
  Loader2,
} from 'lucide-react';
import { DashboardTab } from '../types';
import { supabase } from '../lib/supabaseClient';

interface RealListing {
  id: string;
  company: string;
  companyLogoText: string;
  companyLogoBg: string;
  role: string;
  location: string;
  skills: string[];
  postedDate: string;
  applied: boolean;
  matchedCount: number;
  totalRequired: number;
}

const LOGO_COLORS = [
  'from-emerald-600 to-teal-600',
  'from-cyan-600 to-blue-600',
  'from-teal-600 to-emerald-600',
];

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

interface DashboardViewProps {
  studentName?: string;
  onNavigateTab: (tab: DashboardTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  studentName = 'Student',
  onNavigateTab,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [applicationCounts, setApplicationCounts] = useState({ total: 0, inReview: 0, interviews: 0, viewed: 0 });
  const [recommended, setRecommended] = useState<RealListing[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setErrorMsg('Not logged in.');
      setIsLoading(false);
      return;
    }

    // Profile completion check
    const { data: profileData } = await supabase
      .from('student_profiles')
      .select('major, university, graduation_year, skills, resume_url')
      .eq('id', userData.user.id)
      .single();

    const fields = [
      { label: 'Add your academic major', filled: !!profileData?.major },
      { label: 'Add your university', filled: !!profileData?.university },
      { label: 'Add your graduation year', filled: !!profileData?.graduation_year },
      { label: 'Add at least one skill', filled: (profileData?.skills || []).length > 0 },
      { label: 'Add a portfolio/resume link', filled: !!profileData?.resume_url },
    ];
    const filledCount = fields.filter((f) => f.filled).length;
    setProfileCompletion(Math.round((filledCount / fields.length) * 100));
    setMissingItems(fields.filter((f) => !f.filled).map((f) => f.label));

    // Applications summary
    const { data: apps } = await supabase
      .from('applications')
      .select('status')
      .eq('student_id', userData.user.id);

    const total = apps?.length || 0;
    const inReview = (apps || []).filter((a: any) => a.status === 'applied').length;
    const interviews = (apps || []).filter((a: any) => a.status === 'shortlisted').length;
    const viewed = (apps || []).filter((a: any) => a.status === 'selected' || a.status === 'rejected').length;
    setApplicationCounts({ total, inReview, interviews, viewed });

    // Recommended listings, real skill match, top 3
    const mySkills = (profileData?.skills || []).map((s: string) => s.toLowerCase());

    const { data: listingsData } = await supabase
      .from('listings')
      .select('id, title, required_skills, location, created_at, companies(company_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    const { data: existingApps } = await supabase
      .from('applications')
      .select('listing_id')
      .eq('student_id', userData.user.id);
    const appliedIds = new Set((existingApps || []).map((a: any) => a.listing_id));

    const mapped: RealListing[] = (listingsData || []).map((row: any, idx: number) => {
      const companyName = row.companies?.company_name || 'Unknown Company';
      const requiredSkills: string[] = row.required_skills || [];
      const matchedCount = requiredSkills.filter((s) => mySkills.includes(s.toLowerCase())).length;

      return {
        id: row.id,
        company: companyName,
        companyLogoText: companyName.slice(0, 2).toUpperCase(),
        companyLogoBg: LOGO_COLORS[idx % LOGO_COLORS.length],
        role: row.title,
        location: row.location || 'Not specified',
        skills: requiredSkills,
        postedDate: timeAgo(row.created_at),
        applied: appliedIds.has(row.id),
        matchedCount,
        totalRequired: requiredSkills.length,
      };
    });

    mapped.sort((a, b) => b.matchedCount - a.matchedCount);
    setRecommended(mapped.slice(0, 3));

    setIsLoading(false);
  };

  const handleApply = async (listingId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from('applications').insert({
      student_id: userData.user.id,
      listing_id: listingId,
      status: 'applied',
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setRecommended((prev) => prev.map((item) => (item.id === listingId ? { ...item, applied: true } : item)));
    setApplicationCounts((prev) => ({ ...prev, total: prev.total + 1, inReview: prev.inReview + 1 }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8" id="main-dashboard-content">
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {studentName}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Candidate
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Track your skills, internship applications, and role recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab('browse')}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all duration-200 shadow-md shadow-emerald-950/40 flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Find Internships</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
        <motion.div
          whileHover={{ y: -2 }}
          className="md:col-span-7 rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Profile Completion</h3>
                  <p className="text-xs text-slate-400">Real profile fields filled in</p>
                </div>
              </div>
              <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                {profileCompletion}%
              </span>
            </div>

            <div className="my-3">
              <div className="w-full h-3 rounded-full bg-slate-800/80 border border-white/[0.06] overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompletion}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.5)]"
                />
              </div>
            </div>

            {missingItems.length > 0 && (
              <div className="space-y-1.5 text-xs text-slate-400 mt-3 pt-3 border-t border-white/[0.06]">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Recommended next steps:
                </div>
                {missingItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">{5 - missingItems.length} of 5 profile fields complete</span>
            <button
              type="button"
              onClick={() => onNavigateTab('profile')}
              className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer group"
            >
              <span>Complete your profile</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="md:col-span-5 rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Applications Sent</h3>
                  <p className="text-xs text-slate-400">Real submissions overview</p>
                </div>
              </div>
              <span className="text-3xl font-extrabold text-white">{applicationCounts.total}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-3">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-xs text-slate-400">In Review</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">{applicationCounts.inReview}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-xs text-slate-400">Interviews</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{applicationCounts.interviews}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-xs text-slate-400">Resolved</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">{applicationCounts.viewed}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/[0.06]">
            <span className="text-xs text-slate-400">Live application tracking</span>
            <button
              type="button"
              onClick={() => onNavigateTab('applications')}
              className="text-xs sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer group"
            >
              <span>View applications</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
  <span>{recommended.some(r => r.matchedCount > 0) ? 'Recommended For You' : 'Latest Opportunities'}</span>
  <span className="text-xs font-normal text-slate-400 hidden sm:inline">
    {recommended.some(r => r.matchedCount > 0)
      ? '(Ranked by your real skill match)'
      : '(Add skills to your profile to see personalized matches)'}
  </span>
</h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('browse')}
            className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>See all listings</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recommended.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No approved listings yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {recommended.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -3 }}
                className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 p-5 shadow-xl flex flex-col justify-between transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.companyLogoBg} flex items-center justify-center font-bold text-sm text-white shadow-md`}>
                        {item.companyLogoText}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.company}</h4>
                        <h3 className="text-sm font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                          {item.role}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {item.totalRequired > 0 && (
                    <div className="flex flex-wrap items-center gap-2 my-2.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        {item.matchedCount} of {item.totalRequired} skills match
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {item.location}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Required Skills:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.skills.map((skill, sIdx) => (
                        <span key={sIdx} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/[0.06]">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {item.postedDate}
                  </span>

                  {item.applied ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Applied</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApply(item.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all duration-150 shadow-sm cursor-pointer flex items-center gap-1"
                    >
                      <span>Apply</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
