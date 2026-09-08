import React, { useState, useEffect } from 'react';
import { Search, MapPin, Sparkles, Clock, CheckCircle2, ArrowUpRight, Loader2 } from 'lucide-react';
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
  'from-blue-600 to-cyan-600',
];

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} week(s) ago`;
}

export const BrowseInternshipsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [internships, setInternships] = useState<RealListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();

    // Fetch the logged-in student's own skills for real matching
    let mySkills: string[] = [];
    if (userData.user) {
      const { data: profileData } = await supabase
        .from('student_profiles')
        .select('skills')
        .eq('id', userData.user.id)
        .single();
      mySkills = (profileData?.skills || []).map((s: string) => s.toLowerCase());
    }

    const { data, error } = await supabase
      .from('listings')
      .select('id, title, required_skills, location, created_at, companies(company_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
      return;
    }

    let appliedListingIds = new Set<string>();
    if (userData.user) {
      const { data: existingApps } = await supabase
        .from('applications')
        .select('listing_id')
        .eq('student_id', userData.user.id);

      appliedListingIds = new Set((existingApps || []).map((a: any) => a.listing_id));
    }

    const mapped: RealListing[] = (data || []).map((row: any, idx: number) => {
      const companyName = row.companies?.company_name || 'Unknown Company';
      const initials = companyName
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const requiredSkills: string[] = row.required_skills || [];
      const matchedCount = requiredSkills.filter((skill) =>
        mySkills.includes(skill.toLowerCase())
      ).length;

      return {
        id: row.id,
        company: companyName,
        companyLogoText: initials,
        companyLogoBg: LOGO_COLORS[idx % LOGO_COLORS.length],
        role: row.title,
        location: row.location || 'Not specified',
        skills: requiredSkills,
        postedDate: timeAgo(row.created_at),
        applied: appliedListingIds.has(row.id),
        matchedCount,
        totalRequired: requiredSkills.length,
      };
    });

    // Sort by best skill match first
    mapped.sort((a, b) => b.matchedCount - a.matchedCount);

    setInternships(mapped);
    setIsLoading(false);
  };

  const allSkills = ['All', 'React', 'TypeScript', 'Python', 'SQL', 'Node.js', 'Go', 'Docker'];

  const filtered = internships.filter((item) => {
    const matchesSearch =
      item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSkill = selectedSkill === 'All' || item.skills.includes(selectedSkill);
    return matchesSearch && matchesSkill;
  });

  const handleApply = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setErrorMsg('You must be logged in to apply.');
      return;
    }

    const { error } = await supabase.from('applications').insert({
      student_id: userData.user.id,
      listing_id: id,
      status: 'applied',
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setInternships((prev) =>
      prev.map((item) => (item.id === id ? { ...item, applied: true } : item))
    );
  };

  return (
    <div className="space-y-6" id="browse-internships-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Browse Verified Internships
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Explore verified opportunities matched directly to your demonstrated capabilities.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="p-4 rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by role, company, or skill..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {allSkills.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => setSelectedSkill(skill)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedSkill === skill
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-sm'
                  : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading listings...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No listings found. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 p-5 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.companyLogoBg} flex items-center justify-center font-bold text-sm text-white`}
                    >
                      {item.companyLogoText}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {item.company}
                      </h4>
                      <h3 className="text-sm font-bold text-white leading-snug">{item.role}</h3>
                    </div>
                  </div>
                </div>

                {item.totalRequired > 0 && (
                  <div className="flex flex-wrap items-center gap-2 my-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        item.matchedCount === item.totalRequired
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                          : item.matchedCount > 0
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25'
                          : 'bg-white/[0.03] text-slate-400 border-white/[0.08]'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {item.matchedCount} of {item.totalRequired} skills match
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {item.location}
                    </span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <div className="text-[11px] text-slate-400 mb-1.5">Required Skills:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.06]"
                      >
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
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span>Apply Now</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
