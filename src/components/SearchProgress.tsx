import React from "react";
import { Search, Globe, FileText, Cpu, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface SearchProgressProps {
  currentStage: string;
  stageIndex: number; // 0: Query Generation, 1: DDG Search, 2: Crawling Pages, 3: AI Match & Ranking
}

export default function SearchProgress({ currentStage, stageIndex }: SearchProgressProps) {
  const steps = [
    {
      title: "Query Generation",
      description: "Gemini formulates optimal Academic search terms",
      icon: Sparkles,
      color: "text-amber-500 bg-amber-50 border-amber-100",
    },
    {
      title: "DuckDuckGo Search",
      description: "Querying public search indices for academic portals",
      icon: Search,
      color: "text-blue-500 bg-blue-50 border-blue-100",
    },
    {
      title: "Faculty Scraper",
      description: "Visiting faculty portals and extracting raw curriculum vitae text",
      icon: Globe,
      color: "text-indigo-500 bg-indigo-50 border-indigo-100",
    },
    {
      title: "AI Matching & Ranking",
      description: "Evaluating against the 40-25-20-15 matching formula",
      icon: Cpu,
      color: "text-emerald-500 bg-emerald-50 border-emerald-100",
    }
  ];

  return (
    <div id="search-progress-container" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto text-center">
      <div className="flex flex-col items-center mb-6">
        <div className="relative flex items-center justify-center mb-4">
          {/* Animated concentric ripples */}
          <div className="absolute w-20 h-20 bg-emerald-500/10 rounded-full animate-ping duration-1000" />
          <div className="absolute w-16 h-16 bg-emerald-500/20 rounded-full animate-pulse" />
          <div className="relative z-10 p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/25">
            <Cpu className="w-8 h-8 animate-spin duration-3000" />
          </div>
        </div>
        <h4 className="text-lg font-bold text-gray-900 tracking-tight">Searching Academic Portals...</h4>
        <p className="text-xs text-gray-400 mt-1.5 animate-pulse font-mono max-w-sm mx-auto">{currentStage}</p>
      </div>

      {/* Progress Line and Nodes */}
      <div className="relative flex flex-col gap-6 text-left max-w-md mx-auto mt-8">
        {/* Visual Line connector */}
        <div className="absolute left-[21px] top-4 bottom-4 w-[2px] bg-gray-100" />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === stageIndex;
          const isDone = idx < stageIndex;

          return (
            <div key={idx} className="relative flex gap-4 items-start">
              {/* Dot Icon Indicator */}
              <div
                className={`relative z-10 flex items-center justify-center w-11 h-11 rounded-xl border transition-all duration-300 ${
                  isActive
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/15 scale-105"
                    : isDone
                    ? "bg-emerald-50 border-emerald-150 text-emerald-600"
                    : "bg-white border-gray-250 text-gray-400"
                }`}
              >
                {isDone ? (
                  <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Step Details */}
              <div className="flex-1 pt-1">
                <h5
                  className={`text-sm font-bold transition-colors ${
                    isActive ? "text-emerald-700" : isDone ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {step.title}
                </h5>
                <p className={`text-xs mt-0.5 leading-relaxed ${isActive ? "text-gray-500 font-medium" : "text-gray-400"}`}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
