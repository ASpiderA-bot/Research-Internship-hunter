import React, { useState } from "react";
import { Sparkles, Code, Brain, Heart, Briefcase, Plus, X, RotateCcw, ArrowRight, Building2, Compass } from "lucide-react";
import { motion } from "motion/react";
import type { StudentProfile } from "../types";

interface ProfileViewerProps {
  profile: StudentProfile;
  onUpdateProfile: (profile: StudentProfile) => void;
  onProceedToInstitutes: () => void;
  onDirectSearchAll: () => void;
  onReset: () => void;
}

export default function ProfileViewer({ profile, onUpdateProfile, onProceedToInstitutes, onDirectSearchAll, onReset }: ProfileViewerProps) {
  const [newSkill, setNewSkill] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const handleAddTag = (category: "skills" | "domains" | "interests", value: string, setter: (val: string) => void) => {
    if (!value.trim()) return;
    const clean = value.trim();
    if (!profile[category].includes(clean)) {
      onUpdateProfile({ ...profile, [category]: [...profile[category], clean] });
    }
    setter("");
  };
  const handleRemoveTag = (category: "skills" | "domains" | "interests", tag: string) => {
    onUpdateProfile({ ...profile, [category]: profile[category].filter((t) => t !== tag) });
  };

  const TagSection = ({
    icon: Icon,
    label,
    items,
    category,
    value,
    setter,
    placeholder,
  }: {
    icon: any;
    label: string;
    items: string[];
    category: "skills" | "domains" | "interests";
    value: string;
    setter: (val: string) => void;
    placeholder: string;
  }) => (
    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-indigo-600" />
        <h4 className="text-xs font-bold text-slate-700">{label}</h4>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3 max-h-40 overflow-y-auto">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-xs text-slate-600">
            {item}
            <button onClick={() => handleRemoveTag(category, item)} className="text-slate-400 hover:text-rose-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => setter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTag(category, value, setter)}
          placeholder={placeholder}
          className="flex-1 text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={() => handleAddTag(category, value, setter)}
          className="p-1.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Your extracted profile
            </h3>
            <p className="text-xs text-slate-400 mt-1">Review and refine tags to improve matching accuracy.</p>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              onClick={onReset}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New resume
            </button>
            <button
              onClick={onProceedToInstitutes}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm"
            >
              <Building2 className="w-3.5 h-3.5" />
              Target institutes
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col gap-5">
            <TagSection
              icon={Code}
              label="Skills & tools"
              items={profile.skills}
              category="skills"
              value={newSkill}
              setter={setNewSkill}
              placeholder="Add skill..."
            />
            <TagSection
              icon={Brain}
              label="Broad domains"
              items={profile.domains}
              category="domains"
              value={newDomain}
              setter={setNewDomain}
              placeholder="Add domain..."
            />
            <TagSection
              icon={Heart}
              label="Research interests"
              items={profile.interests}
              category="interests"
              value={newInterest}
              setter={setNewInterest}
              placeholder="Add interest..."
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="border border-slate-100 rounded-xl p-5 bg-white">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-600" />
                Projects
              </h4>
              <div className="flex flex-col gap-4 max-h-80 overflow-y-auto pr-1">
                {profile.projects.map((proj, idx) => (
                  <div key={idx} className="p-3.5 border border-slate-100 rounded-lg">
                    <h5 className="text-xs font-bold text-slate-800">{proj.title}</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{proj.description}</p>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {proj.technologies.map((t) => (
                          <span key={t} className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {profile.experience && profile.experience.length > 0 && (
              <div className="border border-slate-100 rounded-xl p-5 bg-white">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Experience
                </h4>
                <div className="flex flex-col gap-4 max-h-60 overflow-y-auto pr-1">
                  {profile.experience.map((exp, idx) => (
                    <div key={idx} className="p-3.5 border border-slate-100 rounded-lg">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-bold text-slate-800">{exp.role}</h5>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{exp.organization}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/60">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Ready for discovery?
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Specify target institutes or search across all Indian universities.</p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onDirectSearchAll}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              Search all institutes
            </button>
            <button
              onClick={onProceedToInstitutes}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/15"
            >
              <Building2 className="w-3.5 h-3.5" />
              Specify targets
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
