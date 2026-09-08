import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  MapPin,
  Globe,
  ShieldCheck,
  Briefcase,
  Code2,
  Pencil,
  X,
  Plus,
  CheckCircle2,
  Save,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CompanyProfileViewProps {
  companyName?: string;
  onUpdateName?: (name: string) => void;
}

export const CompanyProfileView: React.FC<CompanyProfileViewProps> = ({
  onUpdateName,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [industry, setIndustry] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formHeadquarters, setFormHeadquarters] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formTechStack, setFormTechStack] = useState<string[]>([]);
  const [newTechInput, setNewTechInput] = useState('');

  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setErrorMsg('Not logged in.');
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('companies')
      .select('company_name, description, website, headquarters, industry, tech_stack')
      .eq('id', userData.user.id)
      .single();

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
      return;
    }

    setCompanyName(data?.company_name || 'Company');
    setDescription(data?.description || '');
    setWebsite(data?.website || '');
    setHeadquarters(data?.headquarters || '');
    setIndustry(data?.industry || '');
    setTechStack(data?.tech_stack || []);
    setIsLoading(false);
  };

  const handleStartEdit = () => {
    setFormName(companyName);
    setFormDescription(description);
    setFormWebsite(website);
    setFormHeadquarters(headquarters);
    setFormIndustry(industry);
    setFormTechStack([...techStack]);
    setNewTechInput('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => setIsEditing(false);

  const handleAddTech = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTechInput.trim();
    if (trimmed && !formTechStack.includes(trimmed)) {
      setFormTechStack([...formTechStack, trimmed]);
      setNewTechInput('');
    }
  };

  const handleRemoveTech = (techToRemove: string) => {
    setFormTechStack(formTechStack.filter((t) => t !== techToRemove));
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setErrorMsg('Not logged in.');
      return;
    }

    const trimmedName = formName.trim() || 'Company';
    const trimmedDesc = formDescription.trim();
    const trimmedWeb = formWebsite.trim();
    const trimmedHQ = formHeadquarters.trim();
    const trimmedIndustry = formIndustry.trim();

    const { error: companyError } = await supabase
      .from('companies')
      .update({
        company_name: trimmedName,
        description: trimmedDesc,
        website: trimmedWeb,
        headquarters: trimmedHQ,
        industry: trimmedIndustry,
        tech_stack: formTechStack,
      })
      .eq('id', userData.user.id);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: trimmedName })
      .eq('id', userData.user.id);

    if (companyError || profileError) {
      setErrorMsg((companyError || profileError)?.message || 'Failed to save.');
      return;
    }

    setCompanyName(trimmedName);
    setDescription(trimmedDesc);
    setWebsite(trimmedWeb);
    setHeadquarters(trimmedHQ);
    setIndustry(trimmedIndustry);
    setTechStack(formTechStack);

    if (onUpdateName) onUpdateName(trimmedName);

    setIsEditing(false);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 4000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading company profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="company-profile-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Company Profile
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your employer profile, tech stack requirements, and institutional partnerships.
          </p>
        </div>

        <div>
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              id="edit-company-profile-btn"
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
              <span>Company profile updated successfully! All changes have been saved.</span>
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
              <h2 className="text-lg font-bold text-white">Edit Company Information</h2>
              <p className="text-xs text-slate-400">
                Update employer details visible to students and partner placement cells.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveChanges} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. TechCorp Labs"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Website URL</label>
                <input
                  type="text"
                  value={formWebsite}
                  onChange={(e) => setFormWebsite(e.target.value)}
                  placeholder="e.g. techcorplabs.io"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Headquarters</label>
                <input
                  type="text"
                  value={formHeadquarters}
                  onChange={(e) => setFormHeadquarters(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Industry</label>
                <input
                  type="text"
                  value={formIndustry}
                  onChange={(e) => setFormIndustry(e.target.value)}
                  placeholder="e.g. Cloud & AI Systems"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Description</label>
              <textarea
                rows={4}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe your organization, mission, and internship culture..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tech Stack Tags</label>
              <p className="text-xs text-slate-400 mb-3">
                Add or remove technologies your engineering teams and internship roles use.
              </p>

              <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                {formTechStack.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No tech stack tags added yet.</span>
                ) : (
                  formTechStack.map((tech) => (
                    <span key={tech} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      <span>{tech}</span>
                      <button type="button" onClick={() => handleRemoveTech(tech)} className="hover:text-rose-400 cursor-pointer transition-colors p-0.5" title={`Remove ${tech}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={newTechInput}
                  onChange={(e) => setNewTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTech();
                    }
                  }}
                  placeholder="e.g. GraphQL, Go, Kubernetes..."
                  className="flex-1 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
                <button type="button" onClick={() => handleAddTech()} className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-all flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.06] flex items-center justify-end gap-3">
              <button type="button" onClick={handleCancelEdit} className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer">
                Cancel
              </button>
              <button type="submit" id="save-company-profile-btn" className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer">
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
                {companyName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CO'}
              </div>
            </div>

            <h2 className="text-lg font-bold text-white">{companyName}</h2>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Employer Account</span>
            </div>

            <div className="w-full mt-6 pt-5 border-t border-white/[0.06] text-left space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Headquarters:
                </span>
                <span className="font-semibold text-slate-200">{headquarters || 'Not set'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  Website:
                </span>
                <span className="font-semibold text-cyan-400">{website || 'Not set'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  Industry:
                </span>
                <span className="font-semibold text-slate-200">{industry || 'Not set'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">About Organization</h3>
                </div>
              </div>

              <p className="text-sm text-slate-300 mt-4 leading-relaxed whitespace-pre-line">
                {description || 'No description added yet.'}
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B0F1E]/80 backdrop-blur-xl border border-white/[0.08] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Primary Tech Stack</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">{techStack.length} tools</span>
              </div>

              <div className="flex flex-wrap gap-2.5 mt-5">
                {techStack.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No tech stack added yet.</span>
                ) : (
                  techStack.map((tech, index) => (
                    <span key={index} className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-white/[0.04] text-slate-200 border border-white/[0.08] hover:border-cyan-500/30 hover:bg-white/[0.06] transition-all shadow-sm">
                      {tech}
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
