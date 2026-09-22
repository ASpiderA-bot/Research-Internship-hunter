import React from "react";
import { Search, Globe, FileText, Cpu, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface SearchProgressProps {
  currentStage: string;
  stageIndex: number;
  verificationProgress?: { done: number; total: number };
}

export default function SearchProgress({ currentStage, stageIndex, verificationProgress }: SearchProgressProps) {
  const steps = [
    { title: "Query generation", description: "Gemini formulates optimal academic search terms", icon: Sparkles },
    { title: "Web discovery", description: "Query public indices for faculty portals", icon: Search },
    { title: "Profile extraction", description: "Visit pages and extract candidate details", icon: Globe },
    { title: "Verification", description: "Secondary search confirms identity and research domain", icon: ShieldCheck },
    { title: "AI matching", description: "Score and rank verified professors", icon: Cpu },
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center">
      <div className="flex flex-col items-center mb-6">
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute w-20 h-20 bg-indigo-500/10 rounded-full animate-ping" />
          <div className="relative z-10 p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/25">
            <Cpu className="w-8 h-8 animate-spin" />
          </div>
        </div>
        <h4 className="text-lg font-bold text-slate-900">Searching academic portals...</h4>
        <p className="text-xs text-slate-400 mt-1.5 font-mono max-w-sm mx-auto">{currentStage}</p>
        {verificationProgress && verificationProgress.total > 0 && (
          <p className="text-[11px] text-indigo-600 mt-2 font-medium">
            Verified {verificationProgress.done} / {verificationProgress.total} candidates
          </p>
        )}
      </div>

      <div className="relative flex flex-col gap-6 text-left max-w-md mx-auto mt-8">
        <div className="absolute left-[21px] top-4 bottom-4 w-[2px] bg-slate-100" />
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === stageIndex;
          const isDone = idx < stageIndex;
          return (
            <div key={idx} className="relative flex gap-4 items-start">
              <div
                className={`relative z-10 flex items-center justify-center w-11 h-11 rounded-xl border transition-all duration-300 ${
                  isActive ? "bg-indigo-600 border-indigo-600 text-white scale-105" : isDone ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-white border-slate-200 text-slate-400"
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
              <div className="flex-1 pt-1">
                <h5 className={`text-sm font-bold transition-colors ${isActive ? "text-indigo-700" : isDone ? "text-slate-800" : "text-slate-400"}`}>
                  {step.title}
                </h5>
                <p className={`text-xs mt-0.5 leading-relaxed ${isActive ? "text-slate-500" : "text-slate-400"}`}>{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
