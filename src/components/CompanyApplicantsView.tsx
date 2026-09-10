import React, { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface RealApplicant {
  id: string;
  candidateName: string;
  role: string;
  major: string;
  appliedDate: string;
  matchedCount: number;
  totalRequired: number;
  skills: string[];
  status: string;
  statusColor: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusInfo(status: string) {
  switch (status) {
    case 'shortlisted':
      return { label: 'Interview Scheduled', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    case 'selected':
      return { label: 'Selected', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
    case 'rejected':
      return { label: 'Rejected', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    default:
      return { label: 'New Applicant', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  }
}

export const CompanyApplicantsView: React.FC = () => {
  const [applicants, setApplicants] = useState<RealApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setErrorMsg('Not logged in.');
      setIsLoading(false);
      return;
    }

    // Get this company's own listing IDs first
    const { data: myListings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, required_skills')
      .eq('company_id', userData.user.id);

    if (listingsError) {
      setErrorMsg(listingsError.message);
      setIsLoading(false);
      return;
    }

    const listingMap: Record<string, { title: string; required_skills: string[] }> = {};
    (myListings || []).forEach((l: any) => {
      listingMap[l.id] = { title: l.title, required_skills: l.required_skills || [] };
    });

    const listingIds = Object.keys(listingMap);
    if (listingIds.length === 0) {
      setApplicants([]);
      setIsLoading(false);
      return;
    }

    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('id, status, applied_at, listing_id, student_profiles(id, major, skills, profiles(full_name))')
      .in('listing_id', listingIds)
      .order('applied_at', { ascending: false });

    if (appsError) {
      setErrorMsg(appsError.message);
      setIsLoading(false);
      return;
    }

    const mapped: RealApplicant[] = (apps || []).map((row: any) => {
      const listing = listingMap[row.listing_id];
      const studentSkills: string[] = row.student_profiles?.skills || [];
      const requiredSkills: string[] = listing?.required_skills || [];
      const matchedCount = requiredSkills.filter((s) =>
        studentSkills.map((ss) => ss.toLowerCase()).includes(s.toLowerCase())
      ).length;

      const info = statusInfo(row.status);

      return {
        id: row.id,
        candidateName: row.student_profiles?.profiles?.full_name || 'Unnamed Student',
        role: listing?.title || 'Unknown Role',
        major: row.student_profiles?.major || 'Not specified',
        appliedDate: formatDate(row.applied_at),
        matchedCount,
        totalRequired: requiredSkills.length,
        skills: studentSkills,
        status: info.label,
        statusColor: info.color,
      };
    });

    setApplicants(mapped);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6" id="company-applicants-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Student Applicants
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Review student candidates matched directly by their technical skills and coursework.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading applicants...</span>
        </div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No applicants yet. Once students apply to your listings, they'll appear here.
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] shadow-xl overflow-hidden">
          <div className="divide-y divide-white/[0.06]">
            {applicants.map((cand) => (
              <div
                key={cand.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-sm text-cyan-300 shrink-0">
                    {cand.candidateName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{cand.candidateName}</h3>
                      {cand.totalRequired > 0 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {cand.matchedCount} of {cand.totalRequired} skills match
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>Applied for: <strong className="text-slate-200">{cand.role}</strong></span>
                      <span>•</span>
                      <span>{cand.major}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {cand.skills.length === 0 ? (
                        <span className="text-[11px] text-slate-500 italic">No skills listed</span>
                      ) : (
                        cand.skills.map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                            {skill}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cand.statusColor}`}>
                    {cand.status}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {cand.appliedDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
