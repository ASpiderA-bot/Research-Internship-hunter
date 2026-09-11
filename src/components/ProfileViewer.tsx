import React, { useState } from "react";
import { Sparkles, Code, Brain, Heart, Briefcase, Plus, X, Search, RotateCcw, ArrowRight, Building2, Compass } from "lucide-react";
import { StudentProfile } from "../types";
import { motion } from "motion/react";

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
    const cleanValue = value.trim();
    if (!profile[category].includes(cleanValue)) {
      onUpdateProfile({
        ...profile,
        [category]: [...profile[category], cleanValue],
      });
    }
    setter("");
  };

  const handleRemoveTag = (category: "skills" | "domains" | "interests", tag: string) => {
    onUpdateProfile({
      ...profile,
      [category]: profile[category].filter((t) => t !== tag),
    });
  };

  return (
    <div id="profile-viewer-container" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Workflow Step Breadcrumb */}
      <div className="bg-gray-50/70 border border-gray-150 rounded-xl p-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-700">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
            <span>Review Profile</span>
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-1.5 font-medium text-gray-400">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px]">2</span>
            <span>Target Institutes (Optional)</span>
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-1.5 font-medium text-gray-400">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px]">3</span>
            <span>Faculty Matches</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-5 mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Your Extracted Student Profile
          </h3>
          <p className="text-xs text-gray-400 mt-1">Review and refine your profile. Add or remove tags to customize matching queries.</p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <button
            id="btn-reset-profile"
            onClick={onReset}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-gray-200 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Upload New
          </button>
          <button
            id="btn-trigger-institutes-step"
            onClick={onProceedToInstitutes}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer transition-all shadow-sm shadow-emerald-600/15"
          >
            <Building2 className="w-3.5 h-3.5" />
            Next: Specify Institutes
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Editable Tags */}
        <div className="md:col-span-1 flex flex-col gap-5">
          {/* Skills */}
          <div className="bg-gray-50/50 p-4.5 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Skills & Tools</h4>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3 max-h-40 overflow-y-auto">
              {profile.skills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-gray-150 text-xs text-gray-600">
                  {skill}
                  <button onClick={() => handleRemoveTag("skills", skill)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag("skills", newSkill, setNewSkill)}
                placeholder="Add skill..."
                className="flex-1 text-xs border border-gray-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={() => handleAddTag("skills", newSkill, setNewSkill)}
                className="p-1.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Broad Domains */}
          <div className="bg-gray-50/50 p-4.5 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Broad Domains</h4>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3 max-h-40 overflow-y-auto">
              {profile.domains.map((domain) => (
                <span key={domain} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-gray-150 text-xs text-gray-600">
                  {domain}
                  <button onClick={() => handleRemoveTag("domains", domain)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag("domains", newDomain, setNewDomain)}
                placeholder="Add domain..."
                className="flex-1 text-xs border border-gray-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={() => handleAddTag("domains", newDomain, setNewDomain)}
                className="p-1.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Research Interests */}
          <div className="bg-gray-50/50 p-4.5 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Research Interests</h4>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3 max-h-40 overflow-y-auto">
              {profile.interests.map((interest) => (
                <span key={interest} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-gray-150 text-xs text-gray-600">
                  {interest}
                  <button onClick={() => handleRemoveTag("interests", interest)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag("interests", newInterest, setNewInterest)}
                placeholder="Add research..."
                className="flex-1 text-xs border border-gray-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={() => handleAddTag("interests", newInterest, setNewInterest)}
                className="p-1.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Projects & Experiences */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Projects */}
          <div className="border border-gray-100 rounded-xl p-5 bg-white">
            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Code className="w-4.5 h-4.5 text-emerald-600" />
              Projects
            </h4>
            <div className="flex flex-col gap-4 max-h-80 overflow-y-auto pr-1">
              {profile.projects.map((proj, idx) => (
                <div key={idx} className="p-3.5 border border-gray-100 hover:border-gray-150 bg-gray-50/10 rounded-lg transition-all">
                  <h5 className="text-xs font-bold text-gray-800">{proj.title}</h5>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{proj.description}</p>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {proj.technologies.map((t) => (
                        <span key={t} className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Experience if present */}
          {profile.experience && profile.experience.length > 0 && (
            <div className="border border-gray-100 rounded-xl p-5 bg-white">
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Briefcase className="w-4.5 h-4.5 text-emerald-600" />
                Work / Research Experience
              </h4>
              <div className="flex flex-col gap-4 max-h-60 overflow-y-auto pr-1">
                {profile.experience.map((exp, idx) => (
                  <div key={idx} className="p-3.5 border border-gray-100 bg-gray-50/10 rounded-lg">
                    <div className="flex justify-between items-start">
                      <h5 className="text-xs font-bold text-gray-800">{exp.role}</h5>
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{exp.organization}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Next Step Progression Banner */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100/60">
        <div>
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Ready for Faculty Discovery?
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            You can specify target institutions (Newer IITs, IIITs, specific colleges) or search across all Indian universities.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            id="btn-direct-search-all"
            onClick={onDirectSearchAll}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-xl cursor-pointer transition-all shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-gray-500" />
            Search All Institutes
          </button>
          <button
            id="btn-proceed-to-institutes"
            onClick={onProceedToInstitutes}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-emerald-600/15"
          >
            <Building2 className="w-3.5 h-3.5" />
            Specify Target Institutes
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
