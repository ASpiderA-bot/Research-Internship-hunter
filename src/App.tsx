import React, { useState } from "react";
import { 
  Compass, 
  Sparkles, 
  SlidersHorizontal, 
  RotateCcw, 
  HelpCircle, 
  BookOpen, 
  Network, 
  Filter, 
  Flame,
  Search,
  CheckCircle2,
  ListRestart,
  Building2,
  Target,
  ArrowRight
} from "lucide-react";
import ResumeUploader from "./components/ResumeUploader";
import ProfileViewer from "./components/ProfileViewer";
import TargetInstitutesStep, { TargetInstitutesConfig } from "./components/TargetInstitutesStep";
import SearchProgress from "./components/SearchProgress";
import ProfessorCard from "./components/ProfessorCard";
import { StudentProfile, MatchResult } from "./types";
import { matchInstitute, matchesAnyTarget } from "./utils/instituteMatcher";
import { motion, AnimatePresence } from "motion/react";

type WorkflowStep = "profile" | "target_institutes" | "results";

export default function App() {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>("profile");
  const [targetConfig, setTargetConfig] = useState<TargetInstitutesConfig>({
    mode: "all",
    targetInstitutes: ["IIT Gandhinagar", "IIT Hyderabad", "IIIT Delhi"]
  });

  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState("");
  const [stageIndex, setStageIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<MatchResult[]>([]);
  const [searchQueries, setSearchQueries] = useState<Array<{ query: string; focusArea: string }>>([]);
  const [scrapedCount, setScrapedCount] = useState(0);
  const [searchedTargetInstitutes, setSearchedTargetInstitutes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [filterInstituteType, setFilterInstituteType] = useState<string>("All");
  const [filterDepartment, setFilterDepartment] = useState<string>("All");
  const [minMatchScore, setMinMatchScore] = useState<number>(55);
  const [searchKeyword, setSearchKeyword] = useState<string>("All");
  const [onlyHighConversion, setOnlyHighConversion] = useState<boolean>(false);
  const [selectedTargetInstFilter, setSelectedTargetInstFilter] = useState<string>("All");

  const handleProfileParsed = (profile: StudentProfile) => {
    setStudentProfile(profile);
    setWorkflowStep("profile");
    setError(null);
  };

  const handleLoadingState = (isLoading: boolean, stage: string) => {
    setLoading(isLoading);
    setCurrentStage(stage);
    if (isLoading) {
      setStageIndex(0);
    }
  };

  const handleSearchAndMatch = async (customConfig?: TargetInstitutesConfig) => {
    if (!studentProfile) return;
    const activeConfig = customConfig || targetConfig;
    const isTargeted = activeConfig.mode === "targeted" && activeConfig.targetInstitutes.length > 0;
    const institutesToQuery = isTargeted ? activeConfig.targetInstitutes : [];

    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      // Step 1: Query generation
      if (isTargeted) {
        setCurrentStage(`Generating targeted academic search queries for ${institutesToQuery.slice(0, 2).join(", ")}...`);
      } else {
        setCurrentStage("Generating academic search queries across Newer IITs, IIITs & Universities...");
      }
      setStageIndex(0);
      
      // Artificial short delays to let the user visually process the animated progress steps
      await new Promise(r => setTimeout(r, 1200));
      
      // Step 2: Search public indexing
      setCurrentStage(isTargeted 
        ? `Crawling search indexes for faculty pages at ${institutesToQuery[0]} & target institutes...`
        : "Crawling DuckDuckGo search indexes across faculty portals..."
      );
      setStageIndex(1);
      await new Promise(r => setTimeout(r, 1200));

      // Step 3: Scraping selected faculty pages
      setCurrentStage("Visiting target faculty portals & extracting active research labs...");
      setStageIndex(2);

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentProfile,
          targetInstitutes: institutesToQuery
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to search and rank faculty.");
      }

      // Step 4: AI Matching & evaluation
      setCurrentStage("Evaluating weighted match & conversion opportunity scores...");
      setStageIndex(3);
      await new Promise(r => setTimeout(r, 1000));

      const data = await res.json();
      setSearchQueries(data.searchQueries || []);
      setScrapedCount(data.scrapedCount || 0);
      setSearchedTargetInstitutes(data.targetInstitutes || []);
      setSearchResults(data.results || []);
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
    setSearchResults([]);
    setSearchQueries([]);
    setSearchedTargetInstitutes([]);
    setSelectedTargetInstFilter("All");
    setScrapedCount(0);
    setError(null);
    setFilterInstituteType("All");
    setFilterDepartment("All");
    setMinMatchScore(55);
    setSearchKeyword("All");
    setOnlyHighConversion(false);
  };

  // High conversion count
  const highConversionCount = searchResults.filter(
    (r) => r.professor.instituteCategory === "Newer IIT" || r.professor.instituteCategory === "IIIT" || r.professor.conversionPotential === "Very High"
  ).length;

  // Apply filters to results
  const filteredResults = searchResults.filter((result) => {
    const prof = result.professor;
    
    // 0. Strict Targeted Institutes filter if targeted search was selected
    if (searchedTargetInstitutes && searchedTargetInstitutes.length > 0) {
      if (selectedTargetInstFilter !== "All") {
        if (!matchInstitute(prof.institute, selectedTargetInstFilter)) return false;
      } else {
        if (!matchesAnyTarget(prof.institute, searchedTargetInstitutes)) return false;
      }
    }

    // 1. Minimum Match Score Filter
    if (result.matchScore < minMatchScore) return false;

    // 2. High Conversion Only toggle
    if (onlyHighConversion) {
      const isHighConv = prof.instituteCategory === "Newer IIT" || prof.instituteCategory === "IIIT" || prof.conversionPotential === "Very High" || prof.conversionPotential === "High";
      if (!isHighConv) return false;
    }

    // 3. Institute Type Filter
    if (filterInstituteType !== "All") {
      if (filterInstituteType === "HIGH_CONVERSION") {
        const isHigh = prof.instituteCategory === "Newer IIT" || prof.instituteCategory === "IIIT";
        if (!isHigh) return false;
      } else if (filterInstituteType === "NEWER_IIT") {
        if (prof.instituteCategory !== "Newer IIT") return false;
      } else if (filterInstituteType === "IIIT") {
        if (prof.instituteCategory !== "IIIT") return false;
      } else if (filterInstituteType === "ESTABLISHED_IIT") {
        if (prof.instituteCategory !== "Established IIT") return false;
      } else if (filterInstituteType === "NIT") {
        if (prof.instituteCategory !== "NIT") return false;
      } else if (filterInstituteType === "PREMIER") {
        if (prof.instituteCategory !== "Premier Research Inst") return false;
      }
    }

    // 4. Department Filter
    if (filterDepartment !== "All") {
      const dept = prof.department.toLowerCase();
      if (filterDepartment === "Computer Science" && !dept.includes("computer science") && !dept.includes("csa") && !dept.includes("cmit")) return false;
      if (filterDepartment === "Electrical / Electronics" && !dept.includes("electrical") && !dept.includes("ee") && !dept.includes("ece")) return false;
      if (filterDepartment === "Other Departments" && (dept.includes("computer science") || dept.includes("csa") || dept.includes("electrical") || dept.includes("ee") || dept.includes("ece"))) return false;
    }

    // 5. Keyword text search filter
    if (searchKeyword !== "All") {
      const keyLower = searchKeyword.toLowerCase();
      const nameMatch = prof.name.toLowerCase().includes(keyLower);
      const interestMatch = prof.researchInterests.some((ri) => ri.toLowerCase().includes(keyLower));
      const instMatch = prof.institute.toLowerCase().includes(keyLower);
      if (!nameMatch && !interestMatch && !instMatch) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-800 font-sans">
      {/* Navigation Banner */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleReset}>
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/10">
                <Compass className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-gray-900 tracking-tight">ResearchMatch</h1>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Lite Edition</p>
              </div>
            </div>
            {studentProfile && !loading && (
              <button
                id="btn-nav-reset"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 cursor-pointer transition-all"
              >
                <ListRestart className="w-3.5 h-3.5" />
                Reset Search
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {/* Stage 1: Resume Upload */}
          {!studentProfile && !loading && (
            <motion.div
              key="uploader-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <ResumeUploader 
                onProfileParsed={handleProfileParsed} 
                onLoadingStateChange={handleLoadingState} 
              />
            </motion.div>
          )}

          {/* Stage 2: Loading State */}
          {loading && (
            <motion.div
              key="loading-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="py-12"
            >
              <SearchProgress currentStage={currentStage} stageIndex={stageIndex} />
            </motion.div>
          )}

          {/* Stage 3: Student Profile View */}
          {studentProfile && workflowStep === "profile" && searchResults.length === 0 && !loading && (
            <motion.div
              key="profile-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {error && (
                <div className="max-w-4xl mx-auto mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
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

          {/* Stage 4: Target Institutes Configuration Step */}
          {studentProfile && workflowStep === "target_institutes" && searchResults.length === 0 && !loading && (
            <motion.div
              key="target-institutes-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {error && (
                <div className="max-w-4xl mx-auto mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              <TargetInstitutesStep
                studentProfile={studentProfile}
                config={targetConfig}
                onChangeConfig={setTargetConfig}
                onProceedToSearch={() => handleSearchAndMatch(targetConfig)}
                onBackToProfile={() => setWorkflowStep("profile")}
              />
            </motion.div>
          )}

          {/* Stage 5: Ranked Matches Dashboard */}
          {studentProfile && searchResults.length > 0 && !loading && (
            <motion.div
              key="results-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* Back to Profile Info Strip */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <span>Faculty Discovery Complete!</span>
                      {searchedTargetInstitutes.length > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-full">
                          Targeted Search ({searchedTargetInstitutes.length} Institutes)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-600 text-white rounded-full">
                          Pan-India Broad Search
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Evaluated profiles against <strong className="text-emerald-700">{searchResults.length}</strong> faculty recommendations.
                      {searchedTargetInstitutes.length > 0 ? (
                        <span> Targeted at: <strong className="text-gray-700">{searchedTargetInstitutes.join(", ")}</strong>.</span>
                      ) : (
                        highConversionCount > 0 && (
                          <span> Discovered <strong className="text-emerald-700">{highConversionCount} high-conversion opportunities</strong> at Newer IITs & IIITs.</span>
                        )
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button
                    id="btn-modify-target-institutes"
                    onClick={() => {
                      setSearchResults([]);
                      setWorkflowStep("target_institutes");
                    }}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-emerald-300 bg-white hover:bg-emerald-50 text-xs font-bold text-emerald-800 rounded-xl cursor-pointer transition-all shadow-2xs"
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Target Institutes
                  </button>
                  <button
                    id="btn-edit-profile"
                    onClick={() => {
                      setSearchResults([]);
                      setWorkflowStep("profile");
                    }}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-gray-200 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 rounded-xl cursor-pointer transition-all"
                  >
                    Edit Profile
                  </button>
                  <button
                    id="btn-start-over"
                    onClick={handleReset}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-transparent text-xs font-bold text-white bg-gray-900 hover:bg-black rounded-xl cursor-pointer transition-all shadow-sm"
                  >
                    New Resume
                  </button>
                </div>
              </div>

              {/* Conversion Strategy Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-200/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">High Conversion Strategy Activated</h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Newer IITs (Gandhinagar, Jodhpur, Ropar, Mandi, Patna, Indore, Hyderabad, etc.) and IIITs (Delhi, Hyderabad, Bangalore, etc.) have rapidly expanding research grants and higher internship acceptance rates.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFilterInstituteType(filterInstituteType === "HIGH_CONVERSION" ? "All" : "HIGH_CONVERSION");
                  }}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
                    filterInstituteType === "HIGH_CONVERSION"
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "bg-white text-amber-900 border border-amber-300 hover:bg-amber-50"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  {filterInstituteType === "HIGH_CONVERSION" ? "Showing High Conversion Only" : "Filter: Newer IITs & IIITs"}
                </button>
              </div>

              {/* Crawler Diagnostics (Transparency) */}
              <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Network className="w-4.5 h-4.5 text-emerald-600" />
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Search queries automatically formulated across institute tiers:</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {searchQueries.map((q, idx) => (
                    <div key={idx} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex flex-col justify-between">
                      <p className="text-xs font-semibold text-gray-700 font-mono">"{q.query}"</p>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-2 self-start border border-emerald-100">
                        Focus: {q.focusArea}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters & Results Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Side: Filter Sidebar */}
                <div className="lg:col-span-1 flex flex-col gap-5">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                        Discovery Filters
                      </h4>
                      <button
                        onClick={() => {
                          setFilterInstituteType("All");
                          setFilterDepartment("All");
                          setMinMatchScore(55);
                          setSearchKeyword("All");
                          setOnlyHighConversion(false);
                        }}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>

                    {/* Filter: Keyword Query */}
                    <div className="mb-4.5">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Quick Search</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchKeyword === "All" ? "" : searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value || "All")}
                          placeholder="Search name, topic, institute..."
                          className="w-full text-xs border border-gray-200 rounded-lg pl-9 pr-3 py-2 bg-gray-50/30 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Filter: Institute Category */}
                    <div className="mb-4.5">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Institute Category</label>
                      <div className="flex flex-col gap-1.5">
                        {[
                          { id: "All", label: "All Institutes" },
                          { id: "HIGH_CONVERSION", label: "🔥 High Conversion (Newer IIT & IIIT)" },
                          { id: "NEWER_IIT", label: "Newer IITs (Gen 2 & 3)" },
                          { id: "IIIT", label: "IIITs (Delhi, Hyd, Blr, etc.)" },
                          { id: "ESTABLISHED_IIT", label: "Established IITs" },
                          { id: "NIT", label: "NITs" },
                          { id: "PREMIER", label: "Premier Research Centers" },
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setFilterInstituteType(item.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                              filterInstituteType === item.id
                                ? "bg-emerald-50 border-l-4 border-emerald-600 text-emerald-700 font-bold"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filter: Department Clusters */}
                    <div className="mb-5">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Department</label>
                      <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50/50 text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="All">All Departments</option>
                        <option value="Computer Science">Computer Science & AI</option>
                        <option value="Electrical / Electronics">Electrical & Electronics</option>
                        <option value="Other Departments">Other / Allied Disciplines</option>
                      </select>
                    </div>

                    {/* Filter: Minimum Match Score */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase">Min Match Score</label>
                        <span className="text-xs font-mono font-bold text-emerald-600">{minMatchScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="35"
                        max="95"
                        step="5"
                        value={minMatchScore}
                        onChange={(e) => setMinMatchScore(Number(e.target.value))}
                        className="w-full accent-emerald-600 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>Wide (35%)</span>
                        <span>Strict (95%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Faculty List */}
                <div className="lg:col-span-3">
                  {/* Targeted Institutes Tab Bar */}
                  {searchedTargetInstitutes && searchedTargetInstitutes.length > 0 && (
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-1.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-emerald-900 mr-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Target View:</span>
                      </div>
                      <button
                        id="target-tab-all"
                        onClick={() => setSelectedTargetInstFilter("All")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                          selectedTargetInstFilter === "All"
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100/60"
                        }`}
                      >
                        All Selected ({searchResults.length})
                      </button>
                      {searchedTargetInstitutes.map((inst) => {
                        const count = searchResults.filter((r) => matchInstitute(r.professor.institute, inst)).length;
                        const isSelected = selectedTargetInstFilter === inst;
                        return (
                          <button
                            key={inst}
                            id={`target-tab-${inst.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                            onClick={() => setSelectedTargetInstFilter(isSelected ? "All" : inst)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-emerald-700 text-white shadow-xs"
                                : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100/60"
                            }`}
                          >
                            <span>{inst}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                isSelected ? "bg-white text-emerald-800" : "bg-emerald-100 text-emerald-900"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Showing <strong className="text-gray-700">{filteredResults.length}</strong> of {searchResults.length} recommendations
                    </p>
                    {filteredResults.length === 0 && (
                      <span className="text-xs text-rose-500 font-medium">Try loosening your filters or match score!</span>
                    )}
                  </div>

                  {filteredResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredResults.map((match, idx) => (
                        <ProfessorCard 
                          key={`${match.professor.name}-${idx}`} 
                          match={match} 
                          studentProfile={studentProfile} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                      <SlidersHorizontal className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-gray-800">No professors match current filters.</h4>
                      <p className="text-xs text-gray-400 mt-1">Try resetting the institute filter or lowering the minimum match score.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
