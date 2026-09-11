import React, { useState } from "react";
import { 
  Building2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Plus, 
  X, 
  Compass, 
  Landmark, 
  Zap, 
  GraduationCap, 
  Flame,
  Search
} from "lucide-react";
import { motion } from "motion/react";
import { StudentProfile } from "../types";

export interface TargetInstitutesConfig {
  mode: "all" | "targeted";
  targetInstitutes: string[];
}

interface TargetInstitutesStepProps {
  studentProfile: StudentProfile;
  config: TargetInstitutesConfig;
  onChangeConfig: (config: TargetInstitutesConfig) => void;
  onProceedToSearch: () => void;
  onBackToProfile: () => void;
}

interface InstituteGroup {
  category: string;
  badge: string;
  badgeClass: string;
  icon: React.ReactNode;
  description: string;
  institutes: string[];
}

const INSTITUTE_GROUPS: InstituteGroup[] = [
  {
    category: "Newer Generation IITs",
    badge: "High Conversion",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: <Zap className="w-3.5 h-3.5 text-emerald-600" />,
    description: "Rapidly expanding faculty, state-of-the-art funded labs, and high internship acceptance rates for motivated undergrads.",
    institutes: [
      "IIT Gandhinagar",
      "IIT Hyderabad",
      "IIT Jodhpur",
      "IIT Ropar",
      "IIT Mandi",
      "IIT Patna",
      "IIT Indore",
      "IIT Tirupati",
      "IIT Palakkad",
      "IIT Bhilai"
    ]
  },
  {
    category: "Specialized Research IIITs",
    badge: "High Research Output",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    icon: <Sparkles className="w-3.5 h-3.5 text-blue-600" />,
    description: "Centres of excellence in Computing, AI, Robotics, and Systems with regular rolling project assistant intakes.",
    institutes: [
      "IIIT Delhi",
      "IIIT Hyderabad",
      "IIIT Bangalore",
      "IIIT Allahabad",
      "IIIT Sri City",
      "IIIT Gwalior"
    ]
  },
  {
    category: "Established IITs & IISc",
    badge: "Top Tier",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
    icon: <GraduationCap className="w-3.5 h-3.5 text-gray-700" />,
    description: "Premier academic institutions with world-renowned research faculty and structured summer research fellowship programs.",
    institutes: [
      "IIT Bombay",
      "IIT Delhi",
      "IIT Madras",
      "IIT Kanpur",
      "IIT Kharagpur",
      "IIT Roorkee",
      "IIT Guwahati",
      "IISc Bangalore"
    ]
  },
  {
    category: "National Institutes of Technology (NITs)",
    badge: "Strong Engineering Labs",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    icon: <Landmark className="w-3.5 h-3.5 text-purple-600" />,
    description: "Large technical institutes actively engaging external undergraduate researchers in sponsored R&D initiatives.",
    institutes: [
      "NIT Trichy",
      "NIT Surathkal",
      "NIT Warangal",
      "NIT Calicut",
      "SVNIT Surat"
    ]
  }
];

export default function TargetInstitutesStep({
  studentProfile,
  config,
  onChangeConfig,
  onProceedToSearch,
  onBackToProfile
}: TargetInstitutesStepProps) {
  const [customInput, setCustomInput] = useState("");
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>("All");

  const isTargeted = config.mode === "targeted";
  const selectedCount = config.targetInstitutes.length;

  const handleToggleMode = (mode: "all" | "targeted") => {
    onChangeConfig({
      ...config,
      mode,
      // If switching to targeted and currently empty, pre-select popular newer IITs/IIITs
      targetInstitutes:
        mode === "targeted" && config.targetInstitutes.length === 0
          ? ["IIT Gandhinagar", "IIT Hyderabad", "IIIT Delhi"]
          : config.targetInstitutes
    });
  };

  const handleToggleInstitute = (inst: string) => {
    const exists = config.targetInstitutes.includes(inst);
    const updated = exists
      ? config.targetInstitutes.filter((i) => i !== inst)
      : [...config.targetInstitutes, inst];

    onChangeConfig({
      ...config,
      mode: "targeted",
      targetInstitutes: updated
    });
  };

  const handleSelectGroup = (groupInstitutes: string[]) => {
    // Check if all are currently selected
    const allSelected = groupInstitutes.every((inst) => config.targetInstitutes.includes(inst));
    let updated: string[];
    if (allSelected) {
      // Deselect them
      updated = config.targetInstitutes.filter((inst) => !groupInstitutes.includes(inst));
    } else {
      // Add all missing
      const toAdd = groupInstitutes.filter((inst) => !config.targetInstitutes.includes(inst));
      updated = [...config.targetInstitutes, ...toAdd];
    }

    onChangeConfig({
      ...config,
      mode: "targeted",
      targetInstitutes: updated
    });
  };

  const handleAddCustomInstitute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customInput.trim();
    if (!clean) return;

    if (!config.targetInstitutes.includes(clean)) {
      onChangeConfig({
        ...config,
        mode: "targeted",
        targetInstitutes: [...config.targetInstitutes, clean]
      });
    }
    setCustomInput("");
  };

  const handleRemoveInstitute = (inst: string) => {
    onChangeConfig({
      ...config,
      targetInstitutes: config.targetInstitutes.filter((i) => i !== inst)
    });
  };

  const handleClearAll = () => {
    onChangeConfig({
      ...config,
      targetInstitutes: []
    });
  };

  return (
    <div id="target-institutes-step-container" className="max-w-4xl mx-auto space-y-6">
      {/* Workflow Step Breadcrumb */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <button
            onClick={onBackToProfile}
            className="flex items-center gap-1.5 font-bold text-gray-500 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</span>
            <span>1. Profile</span>
          </button>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-1.5 font-bold text-emerald-700">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
            <span>Target Institutes</span>
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-1.5 font-medium text-gray-400">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px]">3</span>
            <span>Faculty Matches</span>
          </div>
        </div>
        <button
          id="btn-back-to-profile"
          onClick={onBackToProfile}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Edit Profile
        </button>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="border-b border-gray-100 pb-5 mb-6">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Specify Target Institutes & Search Scope
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Choose whether to discover matching research faculty across all universities in India, or specify individual institutes and high-conversion labs.
          </p>
        </div>

        {/* Search Mode Selector: Pan-India vs Targeted */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Mode 1: Pan-India Search */}
          <div
            id="opt-mode-all"
            onClick={() => handleToggleMode("all")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              !isTargeted
                ? "border-emerald-600 bg-emerald-50/20 shadow-xs"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${!isTargeted ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    <Compass className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Pan-India Broad Search</h4>
                </div>
                {!isTargeted && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mt-2">
                Evaluates candidates across all Indian universities (Newer IITs, IIITs, Established IITs, NITs, and Premier Labs) for maximum domain and project alignment.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended for maximum match score opportunities</span>
            </div>
          </div>

          {/* Mode 2: Targeted Institutes Search */}
          <div
            id="opt-mode-targeted"
            onClick={() => handleToggleMode("targeted")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              isTargeted
                ? "border-emerald-600 bg-emerald-50/20 shadow-xs"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${isTargeted ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Target Specific Institutes</h4>
                </div>
                {isTargeted && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mt-2">
                Focus your search on selected institutions (e.g. Newer IITs with high grant activity, specialized IIITs, or specific universities of your choice).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-[11px] font-semibold text-amber-700">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{selectedCount > 0 ? `${selectedCount} institute${selectedCount > 1 ? "s" : ""} selected` : "Select institutes below"}</span>
            </div>
          </div>
        </div>

        {/* Targeted Institutes Configuration Panel (Visible if Targeted Mode) */}
        {isTargeted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
            className="space-y-6 pt-2 border-t border-gray-100"
          >
            {/* Active Selected Institutes Bar */}
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Targeted Institutes ({selectedCount})
                  </h4>
                  {selectedCount === 0 && (
                    <span className="text-xs text-amber-600 font-semibold">(Please select at least one institute below)</span>
                  )}
                </div>
                {selectedCount > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] font-bold text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {selectedCount > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {config.targetInstitutes.map((inst) => (
                    <span
                      key={inst}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold shadow-2xs"
                    >
                      <Landmark className="w-3 h-3 text-emerald-600" />
                      {inst}
                      <button
                        onClick={() => handleRemoveInstitute(inst)}
                        className="text-gray-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer ml-1"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  No institutes selected yet. Choose from the quick categories below or enter custom universities.
                </p>
              )}
            </div>

            {/* Custom Institute Input Form */}
            <form onSubmit={handleAddCustomInstitute} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-custom-institute"
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Type any university name (e.g. BITS Pilani, IIT Gandhinagar, IIIT Delhi, DTU...)"
                  className="w-full text-xs border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <button
                id="btn-add-custom-institute"
                type="submit"
                className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Target
              </button>
            </form>

            {/* Category Tier Selector Cards */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Quick Select by Institution Tier
                </h4>
                <div className="flex gap-1 overflow-x-auto">
                  {["All", "Newer IITs", "IIITs", "Established IITs", "NITs"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveFilterCategory(cat)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                        activeFilterCategory === cat
                          ? "bg-gray-900 text-white"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {INSTITUTE_GROUPS.filter((g) => {
                  if (activeFilterCategory === "All") return true;
                  if (activeFilterCategory === "Newer IITs") return g.category.includes("Newer");
                  if (activeFilterCategory === "IIITs") return g.category.includes("IIIT");
                  if (activeFilterCategory === "Established IITs") return g.category.includes("Established");
                  if (activeFilterCategory === "NITs") return g.category.includes("NIT");
                  return true;
                }).map((group) => {
                  const groupAllSelected = group.institutes.every((inst) => config.targetInstitutes.includes(inst));
                  const groupSomeSelected = group.institutes.some((inst) => config.targetInstitutes.includes(inst));

                  return (
                    <div key={group.category} className="border border-gray-150 rounded-2xl p-4.5 bg-white shadow-2xs">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${group.badgeClass}`}>
                            {group.icon}
                            {group.badge}
                          </span>
                          <h5 className="text-xs font-bold text-gray-900">{group.category}</h5>
                        </div>
                        <button
                          onClick={() => handleSelectGroup(group.institutes)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            groupAllSelected
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {groupAllSelected ? "Deselect All in Tier" : "Select All in Tier"}
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-500 mb-3">{group.description}</p>

                      {/* Institute Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {group.institutes.map((inst) => {
                          const isSelected = config.targetInstitutes.includes(inst);
                          return (
                            <button
                              key={inst}
                              onClick={() => handleToggleInstitute(inst)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                  : "bg-gray-50/80 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-gray-400" />}
                              {inst}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Controls Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            id="btn-back-profile-bottom"
            onClick={onBackToProfile}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl cursor-pointer transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Edit Profile
          </button>

          <button
            id="btn-launch-search"
            onClick={onProceedToSearch}
            disabled={isTargeted && selectedCount === 0}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer ${
              isTargeted && selectedCount === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
            }`}
          >
            {!isTargeted ? (
              <>
                <Compass className="w-4 h-4" />
                Launch Pan-India Broad Search
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Launch Targeted Search ({selectedCount} Institute{selectedCount > 1 ? "s" : ""})
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
