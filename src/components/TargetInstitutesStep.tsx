import React, { useState } from "react";
import { Building2, Compass, ArrowRight, ArrowLeft, Check, Plus, X, Zap, GraduationCap, Flame, Search, Landmark, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import type { StudentProfile } from "../types";

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

const INSTITUTE_GROUPS = [
  {
    category: "Newer Generation IITs",
    badge: "High conversion",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: <Zap className="w-3.5 h-3.5 text-emerald-600" />,
    institutes: ["IIT Gandhinagar", "IIT Hyderabad", "IIT Jodhpur", "IIT Ropar", "IIT Mandi", "IIT Patna", "IIT Indore", "IIT Tirupati", "IIT Palakkad", "IIT Bhilai"],
  },
  {
    category: "Specialized IIITs",
    badge: "Research focused",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    icon: <Sparkles className="w-3.5 h-3.5 text-blue-600" />,
    institutes: ["IIIT Delhi", "IIIT Hyderabad", "IIIT Bangalore", "IIIT Allahabad", "IIIT Sri City", "IIIT Gwalior"],
  },
  {
    category: "Established IITs & IISc",
    badge: "Top tier",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
    icon: <GraduationCap className="w-3.5 h-3.5 text-slate-700" />,
    institutes: ["IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur", "IIT Kharagpur", "IIT Roorkee", "IIT Guwahati", "IISc Bangalore"],
  },
  {
    category: "NITs",
    badge: "Strong labs",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    icon: <Landmark className="w-3.5 h-3.5 text-purple-600" />,
    institutes: ["NIT Trichy", "NIT Surathkal", "NIT Warangal", "NIT Calicut", "SVNIT Surat"],
  },
];

export default function TargetInstitutesStep({ config, onChangeConfig, onProceedToSearch, onBackToProfile }: TargetInstitutesStepProps) {
  const [customInput, setCustomInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const isTargeted = config.mode === "targeted";
  const selectedCount = config.targetInstitutes.length;

  const handleToggleMode = (mode: "all" | "targeted") => {
    onChangeConfig({
      ...config,
      mode,
      targetInstitutes: mode === "targeted" && config.targetInstitutes.length === 0 ? ["IIT Gandhinagar", "IIIT Delhi"] : config.targetInstitutes,
    });
  };

  const handleToggleInstitute = (inst: string) => {
    const exists = config.targetInstitutes.includes(inst);
    const updated = exists ? config.targetInstitutes.filter((i) => i !== inst) : [...config.targetInstitutes, inst];
    onChangeConfig({ ...config, mode: "targeted", targetInstitutes: updated });
  };

  const handleSelectGroup = (institutes: string[]) => {
    const allSelected = institutes.every((i) => config.targetInstitutes.includes(i));
    const updated = allSelected
      ? config.targetInstitutes.filter((i) => !institutes.includes(i))
      : [...new Set([...config.targetInstitutes, ...institutes])];
    onChangeConfig({ ...config, mode: "targeted", targetInstitutes: updated });
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = customInput.trim();
    if (!clean) return;
    if (!config.targetInstitutes.includes(clean)) {
      onChangeConfig({ ...config, mode: "targeted", targetInstitutes: [...config.targetInstitutes, clean] });
    }
    setCustomInput("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Specify target institutes
          </h3>
          <p className="text-xs text-slate-500 mt-1">Choose pan-India discovery or focus on specific institutions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div
            onClick={() => handleToggleMode("all")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
              !isTargeted ? "border-indigo-600 bg-indigo-50/20" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${!isTargeted ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Compass className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Pan-India broad search</h4>
              </div>
              {!isTargeted && <Check className="w-5 h-5 text-indigo-600" />}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">Evaluate matches across Newer IITs, IIITs, Established IITs, NITs, and premier labs.</p>
          </div>

          <div
            onClick={() => handleToggleMode("targeted")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
              isTargeted ? "border-indigo-600 bg-indigo-50/20" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isTargeted ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Target specific institutes</h4>
              </div>
              {isTargeted && <Check className="w-5 h-5 text-indigo-600" />}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">Focus on selected institutions with high conversion potential.</p>
          </div>
        </div>

        {isTargeted && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-6 pt-2 border-t border-slate-100">
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                <h4 className="text-xs font-bold text-indigo-900">Targeted institutes ({selectedCount})</h4>
                {selectedCount > 0 && (
                  <button onClick={() => onChangeConfig({ ...config, targetInstitutes: [] })} className="text-[11px] font-bold text-slate-400 hover:text-rose-600">
                    Clear all
                  </button>
                )}
              </div>
              {selectedCount > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {config.targetInstitutes.map((inst) => (
                    <span key={inst} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-300 text-indigo-900 rounded-xl text-xs font-bold">
                      <Landmark className="w-3 h-3 text-indigo-600" />
                      {inst}
                      <button onClick={() => onChangeConfig({ ...config, targetInstitutes: config.targetInstitutes.filter((i) => i !== inst) })} className="text-slate-400 hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No institutes selected.</p>
              )}
            </div>

            <form onSubmit={handleAddCustom} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Add a university (e.g. BITS Pilani, IIT KGP...)"
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button type="submit" className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h4 className="text-xs font-bold text-slate-700">Quick select by tier</h4>
                <div className="flex gap-1 overflow-x-auto">
                  {["All", "Newer IITs", "IIITs", "Established", "NITs"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                        activeFilter === cat ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {INSTITUTE_GROUPS.filter((g) => {
                  if (activeFilter === "All") return true;
                  if (activeFilter === "Newer IITs") return g.category.includes("Newer");
                  if (activeFilter === "IIITs") return g.category.includes("IIIT");
                  if (activeFilter === "Established") return g.category.includes("Established");
                  if (activeFilter === "NITs") return g.category.includes("NIT");
                  return true;
                }).map((group) => {
                  const allSelected = group.institutes.every((i) => config.targetInstitutes.includes(i));
                  return (
                    <div key={group.category} className="border border-slate-150 rounded-2xl p-4.5 bg-white">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${group.badgeClass}`}>
                            {group.icon}
                            {group.badge}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900">{group.category}</h5>
                        </div>
                        <button
                          onClick={() => handleSelectGroup(group.institutes)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                            allSelected ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-indigo-50 text-indigo-800 border-indigo-200"
                          }`}
                        >
                          {allSelected ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.institutes.map((inst) => {
                          const isSelected = config.targetInstitutes.includes(inst);
                          return (
                            <button
                              key={inst}
                              onClick={() => handleToggleInstitute(inst)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                isSelected ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
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

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button onClick={onBackToProfile} className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to profile
          </button>
          <button
            onClick={onProceedToSearch}
            disabled={isTargeted && selectedCount === 0}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-xl shadow-md transition-all ${
              isTargeted && selectedCount === 0
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
            }`}
          >
            {!isTargeted ? (
              <>
                <Compass className="w-4 h-4" />
                Launch broad search
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Launch targeted search ({selectedCount})
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
