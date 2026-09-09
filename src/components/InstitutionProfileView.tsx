import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Landmark,
  MapPin,
  Globe,
  ShieldCheck,
  Award,
  BookOpen,
  Phone,
  Pencil,
  X,
  CheckCircle2,
  Save,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface InstitutionProfileViewProps {
  institutionName?: string;
  onUpdateName?: (name: string) => void;
}

export const InstitutionProfileView: React.FC<InstitutionProfileViewProps> = ({
  onUpdateName,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState('');
  const [campus, setCampus] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  const [companyPartnerCount, setCompanyPartnerCount] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCampus, setFormCampus] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchInstitution();
  }, []);

  const fetchInstitution = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setErrorMsg('Not logged in.');
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('colleges')
      .select('id, name, campus, contact_email, office_phone')
      .eq('admin_id', userData.user.id)
      .single();

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
      return;
    }

    setCollegeId(data.id);
    setInstitutionName(data.name || 'Institution');
    setCampus(data.campus || '');
    setContactEmail(data.contact_email || '');
    setOfficePhone(data.office_phone || '');

    // Real count of distinct companies with at least one listing reviewed by this institution's students pool
    const { count } = await supabase
      .from('companies')
      .select('id', { count: 'exact', head: true });
    setCompanyPartnerCount(count || 0);

    setIsLoading(false);
  };

  const handleStartEdit = () => {
    setFormName(institutionName);
    setFormCampus(campus);
    setFormEmail(contactEmail);
    setFormPhone(officePhone);
    setIsEditing(true);
  };

  const handleCancelEdit = () => setIsEditing(false);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!collegeId) {
      setErrorMsg('Institution record not found.');
      return;
    }

    const trimmedName = formName.trim() || 'Institution';
    const trimmedCampus = formCampus.trim();
    const trimmedEmail = formEmail.trim();
    const trimmedPhone = formPhone.trim();

    const { error } = await supabase
      .from('colleges')
      .update({
        name: trimmedName,
        campus: trimmedCampus,
        contact_email: trimmedEmail,
        office_phone: trimmedPhone,
      })
      .eq('id', collegeId);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setInstitutionName(trimmedName);
    setCampus(trimmedCampus);
    setContactEmail(trimmedEmail);
    setOfficePhone(trimmedPhone);

    if (onUpdateName) onUpdateName(trimmedName);

    setIsEditing(false);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 4000);
  };

  const portalDomain = contactEmail.includes('@') ? contactEmail.split('@')[1] : 'yourschool.edu';

  const verifiedStats = [
    { label: 'Active Company Partners', value: `${companyPartnerCount} Partner${companyPartnerCount === 1 ? '' : 's'}` },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading institution profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="institution-profile-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Institution & TPO Profile
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage university credentials, placement criteria, and employer partnerships.
          </p>
        </div>

        <div>
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              id="edit-institution-profile-btn"
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
              <span>Institution profile updated successfully! All changes have been saved.</span>
            </div>
            <button type="button" onClick={() => setShowSavedNotification(false)} className="text-slate-400 hover:text-white p-1">
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
              <h2 className="text-lg font-bold text-white">Edit Institution & TPO Details</h2>
              <p className="text-xs text-slate-400">
                Update university placement credentials and administrative contact channels.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveChanges} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Institution & Placement Cell Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Riverside Institute of Technology — Placement Cell"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus Location</label>
                <input
                  type="text"
                  value={formCampus}
                  onChange={(e) => setFormCampus(e.target.value)}
                  placeholder="e.g. Main Campus, Riverside"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. placements@riverside.edu"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Office Phone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +1 (951) 555-0190"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.06] flex items-center justify-end gap-3">
              <button type="button" onClick={handleCancelEdit} className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer">
                Cancel
              </button>
              <button type="submit" id="save-institution-profile-btn" className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer">
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
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center font-bold text-2xl text-cyan-300">
                <Landmark className="w-9 h-9" />
              </div>
            </div>

            <h2 className="text-lg font-bold text-white">{institutionName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{contactEmail || 'No email set'}</p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Placement Cell</span>
            </div>

            <div className="w-full mt-6 pt-5 border-t border-white/[0.06] text-left space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Campus:
                </span>
                <span className="font-semibold text-slate-200">{campus || 'Not set'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  Portal:
                </span>
                <span className="font-semibold text-cyan-400">placements.{portalDomain}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Office:
                </span>
                <span className="font-semibold text-slate-200">{officePhone || 'Not set'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Placement Guidelines & Verification</h3>
                </div>
              </div>

              <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                All company-submitted internship and full-time postings must undergo Placement Cell review before going live on the student portal.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                {verifiedStats.map((stat, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-xs text-slate-400">{stat.label}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
