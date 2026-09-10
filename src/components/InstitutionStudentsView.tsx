import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface RealStudent {
  id: string;
  name: string;
  email: string;
  major: string;
  graduationYear: string;
  skills: string[];
  status: string;
}

export const InstitutionStudentsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<RealStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from('student_profiles')
      .select('id, major, graduation_year, skills, profiles(full_name)');

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
      return;
    }

    const studentIds = (data || []).map((s: any) => s.id);
    let statusByStudent: Record<string, string> = {};

    if (studentIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select('student_id, status')
        .in('student_id', studentIds);

      (apps || []).forEach((a: any) => {
        // Prioritize the "best" status if a student has multiple applications
        const rank: Record<string, number> = { selected: 3, shortlisted: 2, applied: 1, rejected: 0 };
        const current = statusByStudent[a.student_id];
        if (!current || (rank[a.status] ?? 0) > (rank[current] ?? -1)) {
          statusByStudent[a.student_id] = a.status;
        }
      });
    }

    const statusLabel = (raw?: string) => {
      switch (raw) {
        case 'selected':
          return 'Placed (Internship)';
        case 'shortlisted':
          return 'Interviewing';
        case 'applied':
          return 'Applied — In Review';
        default:
          return 'Actively Looking';
      }
    };

    // Note: profiles(full_name) may come back as null if the auth email hasn't been used to fetch email directly;
    // we don't have direct email access here without a join to auth.users, so we omit displaying raw email.
    const mapped: RealStudent[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.profiles?.full_name || 'Unnamed Student',
      email: '',
      major: row.major || 'Not specified',
      graduationYear: row.graduation_year ? String(row.graduation_year) : 'Not specified',
      skills: row.skills || [],
      status: statusLabel(statusByStudent[row.id]),
    }));

    setStudents(mapped);
    setIsLoading(false);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.skills.some((sk) => sk.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6" id="institution-students-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Registered Students Directory
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View student skill portfolios, academic details, and placement progress.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student, skill, major..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
          />
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
          <span className="text-sm">Loading students...</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No students found.</div>
      ) : (
        <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] shadow-xl overflow-hidden divide-y divide-white/[0.06]">
          {filteredStudents.map((stu) => (
            <div
              key={stu.id}
              className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 flex items-center justify-center font-bold text-xs text-slate-950 shrink-0">
                  {stu.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{stu.name}</h3>
                    <span className="text-xs text-slate-400">• Class of {stu.graduationYear}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{stu.major}</p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {stu.skills.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">No skills listed yet</span>
                    ) : (
                      stu.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-slate-200 border border-white/[0.06]"
                        >
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    stu.status.includes('Placed')
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : stu.status === 'Interviewing'
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  }`}
                >
                  {stu.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
