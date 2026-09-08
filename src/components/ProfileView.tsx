import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Code2,
  Pencil,
  X,
  Plus,
  CheckCircle2,
  Save,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { UserRole } from '../types';
import { CompanyProfileView } from './CompanyProfileView';
import { supabase } from '../lib/supabaseClient';

interface ProfileViewProps {
  studentName?: string;
  userRole?: UserRole;
  companyName?: string;
  onUpdateName?: (name: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userRole = 'student',
  companyName = 'TechCorp Labs',
  onUpdateName,
}) => {
  if (userRole === 'company') {
    return <CompanyProfileView companyName={companyName} onUpdateName={onUpdateName} />;
  }

  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formMajor, setFormMajor] = useState('');
  const [formUniversity, setFormUniversity] = useState('');
  const [formGraduationYear, setFormGraduationYear] = useState('');
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setErrorMsg('Not logged in.');
      setIsLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userData.user.id)
      .single();

    const { data: studentData, error } = await supabase
      .from('student_profiles')
      .select('major, university, graduation_year, skills')
      .eq('id', userData.user.id)
      .single();

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
      return;
    }

    setName(profileData?.full_name || 'Student');
    setMajor(studentData?.major || '');
    setUniversity(studentData?.university || '');
    setGraduationYear(studentData?.graduation_year ? String(studentData.graduation_year) : '');
    setSkills(studentData?.skills || []);
    setIsLoading(false);
  };

  const handleStartEdit = () => {
    setFormName(name);
    setFormMajor(major);
    setFormUniversity(university);
    setFormGraduationYear(graduationYear);
    setFormSkills([...skills]);
    setNewSkillInput('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !formSkills.includes(trimmed)) {
      setFormSkills([...formSkills, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormSkills(formSkills.filter((s) => s !== skillToRemove));
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setErrorMsg('Not logged in.');
      return;
    }

    const trimmedName = formName.trim() || 'Student';
    const trimmedMajor = formMajor.trim();
    const trimmedUniversity = formUniversity.trim();
    const trimmedYear = formGraduationYear.trim();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: trimmedName })
      .eq('id', userData.user.id);

    const { error: studentError } = await supabase
      .from('student_profiles')
      .update({
        major: trimmedMajor,
        university: trimmedUniversity,
        graduation_year: trimmedYear ? parseInt(trimmedYear, 10) : null,
        skills: formSkills,
      })
      .eq('id', userData.user.id);

    if (profileError || studentError) {
      setErrorMsg((profileError || studentError)?.message || 'Failed to save.');
      return;
    }

    setName(trimmedName);
    setMajor(trimmedMajor);
    setUniversity(trimmedUniversity);
    setGraduationYear(trimmedYear);
    setSkills(formSkills);

    if (onUpdateName) {
      onUpdateName(trimmedName);
    }

    setIsEditing(false);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 4000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading your profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="profile-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Student Profile
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your skills, academic background, and profile information.
          </p>
        </div>

        <div>
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              id="edit-student-profile-btn"
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/30 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-2"
            >
              <Pencil className="w-4 h-4 text-cyan-400" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel Editing</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <AnimatePresence>
        {showSavedNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xl"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Student profile updated successfully! All changes have been saved.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSavedNotification(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isEditing ? (
        <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2.5 pb-5 mb-6 border-b border-white/[0.06]">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Edit Student Profile</h2>
              <p className="text-xs text-slate-400">
                Update your academic credentials, university background, and core technical skills.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveChanges} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Academic Major / Branch
                </label>
                <input
                  type="text"
                  value={formMajor}
                  onChange={(e) => setFormMajor(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  University / College
                </label>
                <input
                  type="text"
                  value={formUniversity}
                  onChange={(e) => setFormUniversity(e.target.value)}
                  placeholder="e.g. Riverside Institute of Technology"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Graduation Year
                </label>
                <input
                  type="text"
                  value={formGraduationYear}
                  onChange={(e) => setFormGraduationYear(e.target.value)}
                  placeholder="e.g. 2027"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Technical Skills (Add / Remove Tags)
              </label>
              <p className="text-xs text-slate-400 mb-3">
                List the languages, frameworks, and core technical proficiencies you want employers to see.
              </p>

              <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                {formSkills.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No skills added yet.</span>
                ) : (
                  formSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-rose-400 cursor-pointer transition-colors p-0.5"
                        title={`Remove ${skill}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="e.g. Next.js, Express, Docker..."
                  className="flex-1 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.06] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-student-profile-btn"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-6 shadow-xl text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 mb-4 shadow-lg shadow-cyan-950/50">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center font-bold text-2xl text-white">
                {name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'ST'}
              </div>
            </div>

            <h2 className="text-lg font-bold text-white">{name}</h2>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-3">
              <User className="w-3.5 h-3.5" />
              <span>Student Account</span>
            </div>

            <div className="w-full mt-6 pt-5 border-t border-white/[0.06] text-left space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Major:</span>
                <span className="text-slate-200 font-semibold">{major || 'Not set'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">University:</span>
                <span className="text-slate-200 font-semibold">{university || 'Not set'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Graduation:</span>
                <span className="text-slate-200 font-semibold">{graduationYear || 'Not set'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Skills</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {skills.length} skills listed
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5 mt-5">
                {skills.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    No skills added yet. Click "Edit Profile" to add some.
                  </span>
                ) : (
                  skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-white/[0.04] text-slate-200 border border-white/[0.08] hover:border-cyan-500/30 hover:bg-white/[0.06] transition-all shadow-sm"
                    >
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
