import React, { useState } from "react";
import { Compass, SlidersHorizontal, RotateCcw, Filter, Search, CheckCircle2, ListRestart, Building2, Target, ArrowRight, GraduationCap, Zap, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ResumeUploader from "./components/ResumeUploader";
import ProfileViewer from "./components/ProfileViewer";
import TargetInstitutesStep, { TargetInstitutesConfig } from "./components/TargetInstitutesStep";
import SearchProgress from "./components/SearchProgress";
import ProfessorCard from "./components/ProfessorCard";
import HackathonFinder from "./components/HackathonFinder";
import type { StudentProfile, MatchResult, SearchResponse } from "./types";
import { matchInstitute, matchesAnyTarget } from "../shared/utils/instituteMatcher";

type WorkflowStep = "profile" | "target_institutes" | "results";
type ActiveTab = "professors" | "hackathons";

export default function App() {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>("profile");
  const [targetConfig, setTargetConfig] = useState<TargetInstitutesConfig>({ mode: "all", targetInstitutes: [] });
  const [activeTab, setActiveTab] = useState<ActiveTab>("professors");

  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState("");
  const [stageIndex, setStageIndex] = useState(0);
  const [verificationProgress, setVerificationProgress] = useState<{ done: number; total: number } | undefined>();
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filterInstituteType, setFilterInstituteType] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [minMatchScore, setMinMatchScore] = useState(55);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTargetInstFilter, setSelectedTargetInstFilter] = useState("All");

  const handleProfileParsed = (profile: StudentProfile) => {
    setStudentProfile(profile);
    setWorkflowStep("profile");
    setError(null);
  };

  const handleLoadingState = (isLoading: boolean, stage: string) => {
    setLoading(isLoading);
    setCurrentStage(stage);
    if (isLoading) setStageIndex(0);
  };

  const handleSearchAndMatch = async (customConfig?: TargetInstitutesConfig) => {
    if (!studentProfile) return;
    const activeConfig = customConfig || targetConfig;
    const isTargeted = activeConfig.mode === "targeted" && activeConfig.targetInstitutes.length > 0;
    const institutesToQuery = isTargeted ? activeConfig.targetInstitutes : [];

    setLoading(true);
    setError(null);
    setSearchResponse(null);
    setStageIndex(0);
    setCurrentStage("Generating academic search queries...");

    // SSE-style progress is not wired here; simulate coarse stages.
    await new Promise((r) => setTimeout(r, 600));
    setStageIndex(1);
    setCurrentStage("Discovering faculty pages across the web...");
    await new Promise((r) => setTimeout(r, 600));
    setStageIndex(2);
    setCurrentStage("Extracting candidate professor profiles...");
    await new Promise((r) => setTimeout(r, 600));
    setStageIndex(3);
    setCurrentStage("Running secondary verification search for each candidate...");

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentProfile, targetInstitutes: institutesToQuery }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to search and rank faculty.");
      }

      const data: SearchResponse = await res.json();
      setSearchResponse(data);
      setStageIndex(4);
      setCurrentStage("Finalizing match rankings...");
      await new Promise((r) => setTimeout(r, 400));
      setWorkflowStep("results");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during professor lookup.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStudentProfile(null);
    setWorkflowStep("profile");
    setSearchResponse(null);
    setTargetConfig({ mode: "all", targetInstitutes: [] });
    setSelectedTargetInstFilter("All");
    setError(null);
    setFilterInstituteType("All");
    setFilterDepartment("All");
    setMinMatchScore(55);
    setSearchKeyword("");
    setActiveTab("professors");
  };

  const searchResults = searchResponse?.results || [];
  const searchedTargetInstitutes = searchResponse?.targetInstitutes || [];
  const highConversionCount = searchResults.filter(
    (r) => r.professor.instituteCategory === "Newer IIT" || r.professor.instituteCategory === "IIIT" || r.professor.conversionPotential === "Very High"
  ).length;

  const filteredResults = searchResults.filter((result) => {
    const prof = result.professor;
    if (searchedTargetInstitutes.length > 0) {
      if (selectedTargetInstFilter !== "All") {
        if (!matchInstitute(prof.institute, selectedTargetInstFilter)) return false;
      } else {
        if (!matchesAnyTarget(prof.institute, searchedTargetInstitutes)) return false;
      }
    }
    if (result.matchScore < minMatchScore) return false;
    if (filterInstituteType !== "All") {
      if (filterInstituteType === "HIGH_CONVERSION") {
        if (prof.instituteCategory !== "Newer IIT" && prof.instituteCategory !== "IIIT") return false;
      } else if (prof.instituteCategory !== filterInstituteType) return false;
    }
    if (filterDepartment !== "All") {
      const dept = prof.department.toLowerCase();
      if (filterDepartment === "Computer Science" && !dept.includes("computer") && !dept.includes("cse") && !dept.includes("cmit") && !dept.includes("artificial intelligence")) return false;
      if (filterDepartment === "Electrical / Electronics" && !dept.includes("electrical") && !dept.includes("electronics") && !dept.includes("ee") && !dept.includes("ece")) return false;
      if (filterDepartment === "Other" && (dept.includes("computer") || dept.includes("electrical"))) return false;
    }
    if (searchKeyword.trim()) {
      const key = searchKeyword.toLowerCase();
      const match =
        prof.name.toLowerCase().includes(key) ||
        prof.researchInterests.some((ri) => ri.toLowerCase().includes(key)) ||
        prof.institute.toLowerCase().includes(key);
      if (!match) return false;
    }
    return true;
  });

  const renderNav = () => (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleReset}>
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/10">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">ResearchMatch</h1>
              <p className="text-[10px] font-bold text-indigo-600 leading-none">v2</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {studentProfile && (
              <>
                <button
                  onClick={() => setActiveTab("professors")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "professors" ? "bg-indigo-100 text-indigo-800" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <GraduationCap className="w-3.5 h-3.5 inline mr-1" />
                  Professors
                </button>
                <button
                  onClick={() => setActiveTab("hackathons")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "hackathons" ? "bg-amber-100 text-amber-800" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <Trophy className="w-3.5 h-3.5 inline mr-1" />
                  Hackathons
                </button>
              </>
            )}
            {studentProfile && !loading && (
              <button
                onClick={handleReset}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all"
              >
                <ListRestart className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 font-sans">
      {renderNav()}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {!studentProfile && !loading && (
            <motion.div key="uploader" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
              <ResumeUploader onProfileParsed={handleProfileParsed} onLoadingStateChange={handleLoadingState} />
            </motion.div>
          )}

          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12">
              <SearchProgress currentStage={currentStage} stageIndex={stageIndex} verificationProgress={verificationProgress} />
            </motion.div>
          )}

          {studentProfile && workflowStep === "profile" && !loading && activeTab === "professors" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
              {error && <div className="max-w-4xl mx-auto mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}
              <ProfileViewer
                profile={studentProfile}
                onUpdateProfile={setStudentProfile}
                onProceedToInstitutes={() => setWorkflowStep("target_institutes")}
                onDirectSearchAll={() => {
                  const cfg: TargetInstitutesConfig = { mode: "all", targetInstitutes: [] };
                  setTargetConfig(cfg);
                  handleSearchAndMatch(cfg);
                }}
                onReset={handleReset}
              />
            </motion.div>
          )}

          {studentProfile && workflowStep === "target_institutes" && !loading && activeTab === "professors" && (
            <motion.div key="target" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
              {error && <div className="max-w-4xl mx-auto mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}
              <TargetInstitutesStep
                studentProfile={studentProfile}
                config={targetConfig}
                onChangeConfig={setTargetConfig}
                onProceedToSearch={() => handleSearchAndMatch(targetConfig)}
                onBackToProfile={() => setWorkflowStep("profile")}
              />
            </motion.div>
          )}

          {studentProfile && workflowStep === "results" && !loading && activeTab === "professors" && searchResponse && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
              <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span>Discovery complete</span>
                      {searchedTargetInstitutes.length > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full">Targeted ({searchedTargetInstitutes.length})</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-700 text-white rounded-full">Pan-India</span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evaluated {searchResults.length} verified recommendations.
                      {searchResponse.rejectedCount > 0 && (
                        <span className="text-slate-600"> {searchResponse.rejectedCount} low-confidence candidates were filtered out.</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setSearchResponse(null);
                      setWorkflowStep("target_institutes");
                    }}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-indigo-300 bg-white hover:bg-indigo-50 text-xs font-bold text-indigo-800 rounded-xl transition-all"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Targets
                  </button>
                  <button
                    onClick={() => {
                      setSearchResponse(null);
                      setWorkflowStep("profile");
                    }}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Edit profile
                  </button>
                  <button onClick={handleReset} className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition-all">
                    New resume
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-200/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">High conversion strategy</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Newer IITs and IIITs often have expanding grants and higher intern acceptance.</p>
                  </div>
                </div>
                <button
                  onClick={() => setFilterInstituteType(filterInstituteType === "HIGH_CONVERSION" ? "All" : "HIGH_CONVERSION")}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    filterInstituteType === "HIGH_CONVERSION" ? "bg-amber-600 text-white" : "bg-white text-amber-900 border border-amber-300 hover:bg-amber-50"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {filterInstituteType === "HIGH_CONVERSION" ? "Showing high conversion" : "Filter: Newer IITs & IIITs"}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 flex flex-col gap-5">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-20">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                        Filters
                      </h4>
                      <button
                        onClick={() => {
                          setFilterInstituteType("All");
                          setFilterDepartment("All");
                          setMinMatchScore(55);
                          setSearchKeyword("");
                          setSelectedTargetInstFilter("All");
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Quick search</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          placeholder="Name, topic, institute..."
                          className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-slate-50/30 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Institute category</label>
                      <div className="flex flex-col gap-1">
                        {[
                          { id: "All", label: "All institutes" },
                          { id: "HIGH_CONVERSION", label: "High conversion" },
                          { id: "Newer IIT", label: "Newer IITs" },
                          { id: "IIIT", label: "IIITs" },
                          { id: "Established IIT", label: "Established IITs" },
                          { id: "NIT", label: "NITs" },
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setFilterInstituteType(item.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              filterInstituteType === item.id ? "bg-indigo-50 border-l-4 border-indigo-600 text-indigo-700 font-bold" : "text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Department</label>
                      <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50/50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="All">All departments</option>
                        <option value="Computer Science">Computer Science & AI</option>
                        <option value="Electrical / Electronics">Electrical & Electronics</option>
                        <option value="Other">Other / Allied</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase">Min match score</label>
                        <span className="text-xs font-mono font-bold text-indigo-600">{minMatchScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="35"
                        max="95"
                        step="5"
                        value={minMatchScore}
                        onChange={(e) => setMinMatchScore(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Wide (35%)</span>
                        <span>Strict (95%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  {searchedTargetInstitutes.length > 0 && (
                    <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-1.5">
                      <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-indigo-900 mr-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Target view:</span>
                      </div>
                      <button
                        onClick={() => setSelectedTargetInstFilter("All")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedTargetInstFilter === "All" ? "bg-indigo-700 text-white" : "bg-white text-indigo-800 border border-indigo-200"}`}
                      >
                        All selected ({searchResults.length})
                      </button>
                      {searchedTargetInstitutes.map((inst) => {
                        const count = searchResults.filter((r) => matchInstitute(r.professor.institute, inst)).length;
                        const selected = selectedTargetInstFilter === inst;
                        return (
                          <button
                            key={inst}
                            onClick={() => setSelectedTargetInstFilter(selected ? "All" : inst)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                              selected ? "bg-indigo-700 text-white" : "bg-white text-indigo-800 border border-indigo-200 hover:bg-indigo-100/60"
                            }`}
                          >
                            {inst}
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${selected ? "bg-white text-indigo-800" : "bg-indigo-100 text-indigo-900"}`}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Showing <strong className="text-slate-700">{filteredResults.length}</strong> of {searchResults.length} recommendations
                    </p>
                    {filteredResults.length === 0 && <span className="text-xs text-rose-500 font-medium">Try loosening your filters.</span>}
                  </div>

                  {filteredResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredResults.map((match, idx) => (
                        <ProfessorCard key={`${match.professor.name}-${idx}`} match={match} studentProfile={studentProfile} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                      <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-800">No professors match current filters.</h4>
                      <p className="text-xs text-slate-400 mt-1">Try resetting filters or lowering the minimum match score.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {studentProfile && activeTab === "hackathons" && (
            <motion.div key="hackathons" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <HackathonFinder studentProfile={studentProfile} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
